import type { Express, Request } from "express";
import { generateAgentReply } from "./aiProvider";
import {
  appendConversationMessage,
  createConversation,
  findOpenInstagramConversation,
  getInstagramChannelByBusinessAccountId,
  getPilotConversationContext,
  updateConversation,
  updateInstagramChannel,
} from "./db";
import { isWebhookSignatureValid } from "./whatsappCloud";

export const INSTAGRAM_WEBHOOK_PATH = "/api/webhooks/meta/instagram";

export type InboundInstagramMessage = {
  messageId: string;
  instagramBusinessAccountId: string;
  senderId: string;
  text: string;
};

export function normalizeInstagramPayload(payload: unknown): InboundInstagramMessage[] {
  const body = payload as any;
  return (Array.isArray(body?.entry) ? body.entry : []).flatMap((entry: any) => (entry?.messaging ?? []).map((event: any) => ({
    messageId: String(event?.message?.mid ?? ""),
    instagramBusinessAccountId: String(event?.recipient?.id ?? entry?.id ?? ""),
    senderId: String(event?.sender?.id ?? ""),
    text: String(event?.message?.text ?? ""),
  })).filter((message: InboundInstagramMessage) => Boolean(message.messageId && message.instagramBusinessAccountId && message.senderId && message.text.trim())));
}

export function buildInstagramTextPayload(recipientId: string, text: string) {
  return { recipient: { id: recipientId }, message: { text } };
}

async function sendInstagramText(instagramBusinessAccountId: string, recipientId: string, text: string) {
  const token = process.env.META_INSTAGRAM_ACCESS_TOKEN;
  if (!token) throw new Error("Canal Instagram ainda não ativado. Configure o token Meta da conta comercial antes do envio real.");
  const response = await fetch(`https://graph.facebook.com/v26.0/${instagramBusinessAccountId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(buildInstagramTextPayload(recipientId, text)),
  });
  if (!response.ok) throw new Error(`Instagram Graph API respondeu com ${response.status}`);
  return response.json();
}

async function processInboundInstagram(message: InboundInstagramMessage) {
  const channel = await getInstagramChannelByBusinessAccountId(message.instagramBusinessAccountId);
  if (!channel || channel.status !== "connected") return;
  const existing = await findOpenInstagramConversation(channel.agentId, message.senderId);
  const conversationId = existing?.id ?? await createConversation(channel.agentId, "Contato do Instagram", "instagram", message.senderId);
  await appendConversationMessage({ conversationId, role: "lead", body: message.text, metadata: { externalMessageId: message.messageId, provider: "instagram_direct" } });
  if (existing?.status === "human" || existing?.automationPaused) return;
  const context = await getPilotConversationContext(conversationId);
  const reply = await generateAgentReply({ agent: context.agent, history: context.history, incomingText: message.text, qualification: context.conversation.qualification ?? {}, instructionText: context.instructionText });
  await appendConversationMessage({ conversationId, role: "agent", body: reply.reply, mediaIntent: reply.mediaIntent, metadata: { source: reply.source, provider: "instagram_direct" } });
  await updateConversation(conversationId, { qualification: reply.qualification, status: reply.transferToHuman ? "human" : "bot", leadStatus: reply.qualified ? "qualified" : context.conversation.leadStatus });
  await sendInstagramText(channel.instagramBusinessAccountId!, message.senderId, reply.reply);
}

type RawBodyRequest = Request & { rawBody?: Buffer };

export function registerInstagramWebhookRoutes(app: Express) {
  app.get(INSTAGRAM_WEBHOOK_PATH, (req, res) => {
    const token = process.env.META_INSTAGRAM_WEBHOOK_VERIFY_TOKEN;
    if (req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"] === token) return res.status(200).send(req.query["hub.challenge"]);
    return res.sendStatus(403);
  });

  app.post(INSTAGRAM_WEBHOOK_PATH, async (req: RawBodyRequest, res) => {
    if (!isWebhookSignatureValid(req.rawBody, req.header("x-hub-signature-256"), process.env.META_APP_SECRET)) return res.sendStatus(401);
    try {
      await Promise.all(normalizeInstagramPayload(req.body).map(processInboundInstagram));
      return res.sendStatus(200);
    } catch (error) {
      await updateInstagramChannel({ status: "error", lastError: error instanceof Error ? error.message : "Falha no processamento do Direct" }).catch(() => undefined);
      return res.sendStatus(200);
    }
  });
}
