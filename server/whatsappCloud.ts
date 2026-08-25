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
  getVoiceProfile,
  updateConversation,
  updateWhatsAppChannel,
} from "./db";
import { storagePut } from "./storage";
import { transcribeAudio } from "./_core/voiceTranscription";
import { shouldReplyWithAudio, synthesizeVoice } from "./voiceSynthesis";

export const WHATSAPP_WEBHOOK_PATH = "/api/webhooks/meta/whatsapp";

export type InboundWhatsAppMessage = {
  messageId: string;
  phoneNumberId: string;
  from: string;
  contactName: string;
  text: string;
  type: string;
  mediaId?: string;
};

export type BusinessAppEcho = {
  messageId: string;
  phoneNumberId: string;
  to: string;
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
      ...(message.audio?.id ? { mediaId: String(message.audio.id) } : {}),
    })).filter((message: InboundWhatsAppMessage) => Boolean(message.messageId && message.from));
  }));
}

export function normalizeBusinessAppEchoes(payload: unknown): BusinessAppEcho[] {
  const body = payload as any;
  const entries = Array.isArray(body?.entry) ? body.entry : [];
  return entries.flatMap((entry: any) => (entry?.changes ?? []).flatMap((change: any) => {
    if (change?.field !== "smb_message_echoes") return [];
    const value = change?.value;
    const phoneNumberId = value?.metadata?.phone_number_id;
    if (!phoneNumberId) return [];
    return (value?.message_echoes ?? []).map((echo: any) => ({
      messageId: String(echo.id ?? ""),
      phoneNumberId: String(phoneNumberId),
      to: String(echo.to ?? ""),
      text: String(echo.text?.body ?? ""),
      type: String(echo.type ?? "unknown"),
    })).filter((echo: BusinessAppEcho) => Boolean(echo.messageId && echo.to));
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
  values: { phoneNumberId: string; to: string; agentId: number; reply: ChannelReply; inboundType?: string },
  dependencies: {
    resolveMedia?: typeof getMediaAssetForIntent;
    getVoiceProfile?: typeof getVoiceProfile;
    sendTextPayload?: (phoneNumberId: string, payload: Record<string, unknown>) => Promise<unknown>;
    sendMediaAsset?: (phoneNumberId: string, to: string, asset: { kind: string; url: string }) => Promise<unknown>;
  } = {},
) {
  const resolveMedia = dependencies.resolveMedia ?? getMediaAssetForIntent;
  const sendTextPayload = dependencies.sendTextPayload ?? sendCloudRequest;
  const sendMediaAsset = dependencies.sendMediaAsset ?? sendMedia;
  const voiceProfile = dependencies.getVoiceProfile ? await dependencies.getVoiceProfile(values.agentId) : await getVoiceProfile(values.agentId);
  const useAudio = voiceProfile?.provider !== "disabled" && shouldReplyWithAudio(voiceProfile?.replyMode ?? "text_only", values.inboundType ?? "text");
  if (useAudio && voiceProfile) {
    const synthesized = await synthesizeVoice({ text: values.reply.reply.slice(0, voiceProfile.maxAudioCharacters), provider: voiceProfile.provider, googleVoice: voiceProfile.googleVoice, elevenLabsVoiceId: voiceProfile.elevenLabsVoiceId, speechRatePercent: voiceProfile.speechRatePercent });
    const saved = await storagePut(`agents/${values.agentId}/voice/${Date.now()}.mp3`, synthesized.audio, synthesized.contentType);
    await sendMediaAsset(values.phoneNumberId, values.to, { kind: "audio", url: saved.url });
  } else {
    await sendTextPayload(values.phoneNumberId, buildTextPayload(values.to, values.reply.reply));
  }
  if (!values.reply.mediaIntent) return null;
  const asset = await resolveMedia(values.agentId, values.reply.mediaIntent);
  if (!asset) return null;
  await sendMediaAsset(values.phoneNumberId, values.to, asset);
  return asset;
}

async function transcribeInboundMetaAudio(mediaId: string) {
  const token = process.env.META_WHATSAPP_ACCESS_TOKEN;
  if (!token) throw new Error("Token Meta ausente para baixar o áudio recebido.");
  const metadata = await fetch(`https://graph.facebook.com/v26.0/${encodeURIComponent(mediaId)}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!metadata.ok) throw new Error(`Meta não liberou o áudio (${metadata.status}).`);
  const { url } = await metadata.json() as { url?: string };
  if (!url) throw new Error("Meta não retornou a URL do áudio.");
  const audio = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!audio.ok) throw new Error(`Falha ao baixar áudio da Meta (${audio.status}).`);
  const mime = audio.headers.get("content-type") || "audio/ogg";
  const encoded = Buffer.from(await audio.arrayBuffer()).toString("base64");
  const result = await transcribeAudio({ audioUrl: `data:${mime};base64,${encoded}`, language: "pt", prompt: "Transcreva com precisão uma mensagem de voz de atendimento em português brasileiro." });
  if ("error" in result) throw new Error(result.error);
  return result.text.trim();
}

export async function processInboundWhatsAppMessage(message: InboundWhatsAppMessage, dependencies: any = {}) {
  let incomingText = message.text.trim();
  if (message.type === "audio" && message.mediaId) incomingText = dependencies.transcribeAudio ? await dependencies.transcribeAudio(message.mediaId) : await transcribeInboundMetaAudio(message.mediaId);
  if (!incomingText || !["text", "audio"].includes(message.type)) return;
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
  await appendMessage({ conversationId, role: "lead", body: incomingText, metadata: { externalMessageId: message.messageId, provider: "meta_cloud", inboundType: message.type } });
  if (existing?.status === "human" || existing?.automationPaused) return;
  const context = await getContext(conversationId);
  const reply = await generateReply({ agent: context.agent, history: context.history, incomingText, qualification: context.conversation.qualification ?? {}, instructionText: context.instructionText });
  await appendMessage({ conversationId, role: "agent", body: reply.reply, mediaIntent: reply.mediaIntent, metadata: { source: reply.source, provider: "meta_cloud" } });
  await update(conversationId, { qualification: reply.qualification, status: reply.transferToHuman ? "human" : "bot", leadStatus: reply.qualified ? "qualified" : context.conversation.leadStatus });
  await dispatch({ phoneNumberId: channel.phoneNumberId!, to: message.from, agentId: channel.agentId, reply, inboundType: message.type });
}

export async function processBusinessAppEcho(echo: BusinessAppEcho, dependencies: any = {}) {
  if (echo.type !== "text" || echo.text.trim().toLowerCase() !== "#assumir") return false;
  const getChannel = dependencies.getChannel ?? getWhatsAppChannelByPhoneNumberId;
  const findConversation = dependencies.findConversation ?? findOpenWhatsAppConversation;
  const appendMessage = dependencies.appendMessage ?? appendConversationMessage;
  const update = dependencies.update ?? updateConversation;
  const channel = await getChannel(echo.phoneNumberId);
  if (!channel || channel.status !== "connected") return false;
  const conversation = await findConversation(channel.agentId, echo.to);
  if (!conversation) return false;
  await update(conversation.id, { status: "human" });
  await appendMessage({
    conversationId: conversation.id,
    role: "system",
    body: "Atendimento assumido pelo proprietário via WhatsApp Business.",
    metadata: { externalMessageId: echo.messageId, provider: "meta_cloud", source: "smb_message_echoes" },
  });
  return true;
}

export async function processWhatsAppWebhookPayload(payload: unknown, dependencies: any = {}) {
  const inbound = normalizeWhatsAppPayload(payload);
  const echoes = normalizeBusinessAppEchoes(payload);
  await Promise.all(inbound.map(message => processInboundWhatsAppMessage(message, dependencies)));
  await Promise.all(echoes.map(echo => processBusinessAppEcho(echo, dependencies)));
  return inbound.length + echoes.length;
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
