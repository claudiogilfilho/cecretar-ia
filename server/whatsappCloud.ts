import crypto from "crypto";
import type { Express, Request } from "express";
import { generateAgentReply } from "./aiProvider";
import {
  appendConversationMessage,
  createConversation,
  findOpenWhatsAppConversation,
  getMediaAssetForIntent,
  getPilotConversationContext,
  getWhatsAppChannelByPhoneNumberId,
  updateConversation,
  updateWhatsAppChannel,
} from "./db";

export const WHATSAPP_WEBHOOK_PATH = "/api/webhooks/meta/whatsapp";

export type InboundWhatsAppMessage = {
  messageId: string;
  phoneNumberId: string;
  from: string;
  contactName: string;
  text: string;
  type: string;
};

export function normalizeWhatsAppPayload(payload: unknown): InboundWhatsAppMessage[] {
  const body = payload as any;
  const entries = Array.isArray(body?.entry) ? body.entry : [];
  return entries.flatMap((entry: any) => (entry?.changes ?? []).flatMap((change: any) => {
    const value = change?.value;
    const phoneNumberId = value?.metadata?.phone_number_id;
    const contact = value?.contacts?.[0];
    if (!phoneNumberId || !contact) return [];
    return (value?.messages ?? []).map((message: any) => ({
      messageId: String(message.id ?? ""),
      phoneNumberId: String(phoneNumberId),
      from: String(message.from ?? ""),
      contactName: String(contact.profile?.name ?? "Contato do WhatsApp"),
      text: String(message.text?.body ?? ""),
      type: String(message.type ?? "unknown"),
    })).filter((message: InboundWhatsAppMessage) => Boolean(message.messageId && message.from));
  }));
}

export function buildTextPayload(to: string, body: string) {
  return { messaging_product: "whatsapp", recipient_type: "individual", to, type: "text", text: { preview_url: false, body } };
}

export function buildMediaPayload(to: string, asset: { kind: string; url: string }) {
  const kind = asset.kind === "document" ? "document" : asset.kind;
  return { messaging_product: "whatsapp", recipient_type: "individual", to, type: kind, [kind]: { link: asset.url } };
}

export function isWebhookSignatureValid(rawBody: Buffer | undefined, signature: string | undefined, appSecret: string | undefined) {
  if (!appSecret || !rawBody || !signature?.startsWith("sha256=")) return false;
  const expected = `sha256=${crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

async function sendCloudRequest(phoneNumberId: string, payload: Record<string, unknown>) {
  const token = process.env.META_WHATSAPP_ACCESS_TOKEN;
  if (!token) throw new Error("Canal Meta ainda não ativado. Configure o token de teste antes do envio real.");
  const response = await fetch(`https://graph.facebook.com/v26.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Meta Cloud API respondeu com ${response.status}`);
  return response.json();
}

async function sendMedia(phoneNumberId: string, to: string, asset: { kind: string; url: string }) {
  return sendCloudRequest(phoneNumberId, buildMediaPayload(to, asset));
}

type ChannelReply = { reply: string; mediaIntent?: string | null };

export async function dispatchAgentReplyToWhatsApp(
  values: { phoneNumberId: string; to: string; agentId: number; reply: ChannelReply },
  dependencies: {
    resolveMedia?: typeof getMediaAssetForIntent;
    sendTextPayload?: (phoneNumberId: string, payload: Record<string, unknown>) => Promise<unknown>;
    sendMediaAsset?: (phoneNumberId: string, to: string, asset: { kind: string; url: string }) => Promise<unknown>;
  } = {},
) {
  const resolveMedia = dependencies.resolveMedia ?? getMediaAssetForIntent;
  const sendTextPayload = dependencies.sendTextPayload ?? sendCloudRequest;
  const sendMediaAsset = dependencies.sendMediaAsset ?? sendMedia;
  await sendTextPayload(values.phoneNumberId, buildTextPayload(values.to, values.reply.reply));
  if (!values.reply.mediaIntent) return null;
  const asset = await resolveMedia(values.agentId, values.reply.mediaIntent);
  if (!asset) return null;
  await sendMediaAsset(values.phoneNumberId, values.to, asset);
  return asset;
}

export async function processInboundWhatsAppMessage(message: InboundWhatsAppMessage, dependencies: any = {}) {
  if (message.type !== "text" || !message.text.trim()) return;
  const getChannel = dependencies.getChannel ?? getWhatsAppChannelByPhoneNumberId;
  const findConversation = dependencies.findConversation ?? findOpenWhatsAppConversation;
  const createNewConversation = dependencies.createConversation ?? createConversation;
  const appendMessage = dependencies.appendMessage ?? appendConversationMessage;
  const getContext = dependencies.getContext ?? getPilotConversationContext;
  const generateReply = dependencies.generateReply ?? generateAgentReply;
  const update = dependencies.update ?? updateConversation;
  const dispatch = dependencies.dispatch ?? dispatchAgentReplyToWhatsApp;
  const channel = await getChannel(message.phoneNumberId);
  if (!channel || channel.status !== "connected") return;
  const existing = await findConversation(channel.agentId, message.from);
  const conversationId = existing?.id ?? await createNewConversation(channel.agentId, message.contactName, "whatsapp", message.from);
  await appendMessage({ conversationId, role: "lead", body: message.text, metadata: { externalMessageId: message.messageId, provider: "meta_cloud" } });
  if (existing?.status === "human") return;
  const context = await getContext(conversationId);
  const reply = await generateReply({ agent: context.agent, history: context.history, incomingText: message.text, qualification: context.conversation.qualification ?? {} });
  await appendMessage({ conversationId, role: "agent", body: reply.reply, mediaIntent: reply.mediaIntent, metadata: { source: reply.source, provider: "meta_cloud" } });
  await update(conversationId, { qualification: reply.qualification, status: reply.transferToHuman ? "human" : "bot", leadStatus: reply.qualified ? "qualified" : context.conversation.leadStatus });
  await dispatch({ phoneNumberId: channel.phoneNumberId!, to: message.from, agentId: channel.agentId, reply });
}

export async function processWhatsAppWebhookPayload(payload: unknown, dependencies: any = {}) {
  const inbound = normalizeWhatsAppPayload(payload);
  await Promise.all(inbound.map(message => processInboundWhatsAppMessage(message, dependencies)));
  return inbound.length;
}

type RawBodyRequest = Request & { rawBody?: Buffer };

export function registerWhatsAppWebhookRoutes(app: Express) {
  app.get(WHATSAPP_WEBHOOK_PATH, (req, res) => {
    const token = process.env.META_WEBHOOK_VERIFY_TOKEN;
    if (req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"] === token) return res.status(200).send(req.query["hub.challenge"]);
    return res.sendStatus(403);
  });

  app.post(WHATSAPP_WEBHOOK_PATH, async (req: RawBodyRequest, res) => {
    const signature = req.header("x-hub-signature-256");
    if (!isWebhookSignatureValid(req.rawBody, signature, process.env.META_APP_SECRET)) return res.sendStatus(401);
    try {
      await processWhatsAppWebhookPayload(req.body);
      return res.sendStatus(200);
    } catch (error) {
      await updateWhatsAppChannel({ status: "error", lastError: error instanceof Error ? error.message : "Falha no processamento de mensagem" }).catch(() => undefined);
      return res.sendStatus(200);
    }
  });
}
