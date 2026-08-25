import { z } from "zod";
import { storagePut } from "./storage";
import { generateAgentReply } from "./aiProvider";
import {
  appendConversationMessage,
  createAppointment,
  createConversation,
  createMediaAsset,
  getConversationMessages,
  getDashboardOverview,
  getAgentConfig,
  getInstagramChannel,
  getPilotAgentConfig,
  getPilotConversationContext,
  listAppointments,
  listConversations,
  updateAgentConfig,
  updateAppointment,
  updateConversation,
  updateQualificationFields,
  getWhatsAppChannel,
  createAgentFromTemplate,
  listAgentTemplates,
  listConfiguredAgents,
  updateWhatsAppChannel,
  updateInstagramChannel,
  listAgentAvailability,
  listConversationsForAgent,
  replaceAgentAvailability,
  setConversationAutomation,
  getVoiceProfile,
  updateVoiceProfile,
} from "./db";
import { extractPdfInstructionText, isInstructionPdf } from "./pdfInstructions";
import { WHATSAPP_WEBHOOK_PATH } from "./whatsappCloud";
import { prepareCancellation, prepareHumanTakeover, prepareManualAppointment, prepareReschedule } from "./operationalFlows";
import { buildInboxHistory, buildInboxList } from "./inboxFlows";
import { isOwnerTakeoverCommand } from "./conversationControl";
import { createBusinessConfigurationSuggestion } from "./configurationSuggestion";
import { validateAvailabilitySlots } from "./availabilityFlows";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getVoiceProviderReadiness, synthesizeVoice } from "./voiceSynthesis";

const agentConfigSchema = z.object({
  agentId: z.number(),
  name: z.string().min(2).max(120),
  persona: z.string().min(20),
  companyInfo: z.string().min(20),
  services: z.string().min(10),
  pricing: z.string().min(5),
  businessHours: z.string().min(5),
  transferKeyword: z.string().min(2).max(80),
  ownerTakeoverCommand: z.string().min(2).max(80),
  websiteUrl: z.string().max(512).optional(),
  instagramHandle: z.string().max(120).optional(),
  templateKey: z.string().max(80).optional(),
  behaviorMode: z.enum(["objective", "balanced", "consultative"]),
  provider: z.enum(["embedded", "openai"]),
  modelPreference: z.string().min(2).max(120),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  dashboard: router({
    getOverview: publicProcedure.query(() => getDashboardOverview()),
  }),
  agent: router({
    getConfig: publicProcedure.input(z.object({ agentId: z.number().optional() }).optional()).query(({ input }) => getAgentConfig(input?.agentId)),
    list: publicProcedure.query(() => listConfiguredAgents()),
    templates: publicProcedure.query(() => listAgentTemplates()),
    createFromTemplate: publicProcedure.input(z.object({ templateKey: z.string().min(3).max(80) })).mutation(async ({ input }) => ({ id: await createAgentFromTemplate(input.templateKey) })),
    suggestConfiguration: publicProcedure.input(z.object({ agentId: z.number(), websiteUrl: z.string().max(512).optional(), instagramHandle: z.string().max(160).optional() })).mutation(async ({ input }) => {
      const config = await getAgentConfig(input.agentId);
      if (!config) throw new Error("Especialista não encontrado");
      return createBusinessConfigurationSuggestion({
        current: {
          name: config.agent.name,
          persona: config.agent.persona,
          companyInfo: config.agent.companyInfo,
          services: config.agent.services,
          pricing: config.agent.pricing,
          businessHours: config.agent.businessHours,
          websiteUrl: config.agent.websiteUrl ?? undefined,
          instagramHandle: config.agent.instagramHandle ?? undefined,
          note: "",
        },
        websiteUrl: input.websiteUrl,
        instagramHandle: input.instagramHandle,
      });
    }),
    updateConfig: publicProcedure.input(agentConfigSchema).mutation(({ input }) => {
      const { agentId, ...values } = input;
      return updateAgentConfig(agentId, values);
    }),
    updateQualification: publicProcedure.input(z.object({
      agentId: z.number(),
      fields: z.array(z.object({
        key: z.string().min(2).max(60),
        label: z.string().min(2).max(120),
        prompt: z.string().min(2).max(260),
        required: z.boolean(),
      })).min(1),
    })).mutation(({ input }) => updateQualificationFields(input.agentId, input.fields)),
  }),
  media: router({
    upload: publicProcedure.input(z.object({
      agentId: z.number(),
      filename: z.string().min(1).max(255),
      kind: z.enum(["image", "audio", "video", "document"]),
      usage: z.enum(["outbound", "instruction"]).default("outbound"),
      intent: z.string().min(2).max(120),
      flowStage: z.string().min(2).max(120),
      description: z.string().max(500).optional(),
      dataUrl: z.string().min(10).max(25_000_000),
    })).mutation(async ({ input }) => {
      const match = input.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) throw new Error("Arquivo inválido");
      const contentType = match[1];
      const buffer = Buffer.from(match[2], "base64");
      if (buffer.byteLength > 16 * 1024 * 1024) throw new Error("O arquivo deve ter no máximo 16 MB.");
      if (input.usage === "instruction" && !isInstructionPdf(input.filename, contentType, input.usage)) throw new Error("Instruções internas devem ser enviadas em PDF.");
      let extractedText: string | null = null;
      if (isInstructionPdf(input.filename, contentType, input.usage)) {
        try { extractedText = await extractPdfInstructionText(buffer); } catch { throw new Error("Não foi possível ler o texto desse PDF. Use um PDF com texto selecionável."); }
        if (!extractedText) throw new Error("O PDF não possui texto legível para instrução do robô.");
      }
      const saved = await storagePut(`agents/${input.agentId}/media/${Date.now()}-${input.filename}`, buffer, contentType);
      const id = await createMediaAsset({
        agentId: input.agentId,
        filename: input.filename,
        kind: input.kind,
        url: saved.url,
        storageKey: saved.key,
        intent: input.intent,
        flowStage: input.flowStage,
        description: input.description ?? null,
        usage: input.usage,
        extractedText,
      });
      return { id, url: saved.url };
    }),
  }),
  conversations: router({
    list: publicProcedure.input(z.object({ agentId: z.number().optional() }).optional()).query(async ({ input }) => buildInboxList(input?.agentId ? await listConversationsForAgent(input.agentId) : await listConversations())),
    messages: publicProcedure.input(z.object({ conversationId: z.number() })).query(async ({ input }) => buildInboxHistory(await getConversationMessages(input.conversationId))),
    send: publicProcedure.input(z.object({
      conversationId: z.number().optional(),
      agentId: z.number().optional(),
      text: z.string().min(1).max(3000),
      contactName: z.string().min(2).max(160).default("Contato de teste"),
    })).mutation(async ({ input }) => {
      const config = await getAgentConfig(input.agentId);
      if (!config) throw new Error("Configure o agente piloto antes de iniciar o teste");
      const conversationId = input.conversationId ?? await createConversation(config.agent.id, input.contactName);
      await appendConversationMessage({ conversationId, role: "lead", body: input.text, metadata: {} });
      const context = await getPilotConversationContext(conversationId);
      const reply = await generateAgentReply({
        agent: context.agent,
        history: context.history,
        incomingText: input.text,
        qualification: context.conversation.qualification ?? {},
        instructionText: context.instructionText,
      });
      await appendConversationMessage({
        conversationId,
        role: "agent",
        body: reply.reply,
        mediaIntent: reply.mediaIntent,
        metadata: { source: reply.source },
      });
      await updateConversation(conversationId, {
        qualification: reply.qualification,
        status: reply.transferToHuman ? "human" : "bot",
        leadStatus: reply.qualified ? "qualified" : context.conversation.leadStatus,
      });
      return { conversationId, reply: reply.reply, mediaIntent: reply.mediaIntent, transferToHuman: reply.transferToHuman };
    }),
    takeOver: protectedProcedure.input(z.object({ conversationId: z.number() })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Somente o proprietário pode assumir esta conversa");
      const takeover = prepareHumanTakeover();
      await updateConversation(input.conversationId, takeover.conversationUpdate);
      await appendConversationMessage({ conversationId: input.conversationId, role: "system", body: takeover.systemMessage, metadata: { ownerId: ctx.user.id } });
      return { success: true };
    }),
    ownerCommand: protectedProcedure.input(z.object({ conversationId: z.number(), text: z.string().max(80) })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Somente o proprietário pode assumir esta conversa");
      if (!isOwnerTakeoverCommand(input.text)) throw new Error("Comando de proprietário inválido");
      const takeover = prepareHumanTakeover();
      await updateConversation(input.conversationId, takeover.conversationUpdate);
      await appendConversationMessage({ conversationId: input.conversationId, role: "system", body: takeover.systemMessage, metadata: { command: "#assumir", ownerId: ctx.user.id } });
      return { success: true };
    }),
    setAutomation: protectedProcedure.input(z.object({ conversationId: z.number(), paused: z.boolean() })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Somente o proprietário pode pausar ou retomar este robô");
      const state = await setConversationAutomation(input.conversationId, input.paused, { ownerId: ctx.user.id, source: "dashboard" });
      return { success: true, paused: state.automationPaused };
    }),
  }),
  appointments: router({
    list: publicProcedure.query(() => listAppointments()),
    create: publicProcedure.input(z.object({
      agentId: z.number(),
      visitorName: z.string().min(2).max(160),
      visitorPhone: z.string().max(40).optional(),
      scheduledFor: z.number(),
      notes: z.string().max(500).optional(),
    })).mutation(async ({ input }) => {
      const id = await createAppointment(prepareManualAppointment(input));
      return { id };
    }),
    reschedule: publicProcedure.input(z.object({ appointmentId: z.number(), scheduledFor: z.number() })).mutation(async ({ input }) => {
      await updateAppointment(input.appointmentId, prepareReschedule(input.scheduledFor));
      return { success: true };
    }),
    cancel: publicProcedure.input(z.object({ appointmentId: z.number() })).mutation(async ({ input }) => {
      await updateAppointment(input.appointmentId, prepareCancellation());
      return { success: true };
    }),
  }),
  whatsapp: router({
    getConfig: publicProcedure.input(z.object({ agentId: z.number().optional() }).optional()).query(async ({ input }) => ({
      channel: await getWhatsAppChannel(input?.agentId),
      webhookPath: WHATSAPP_WEBHOOK_PATH,
      hasToken: Boolean(process.env.META_WHATSAPP_ACCESS_TOKEN),
      hasVerifyToken: Boolean(process.env.META_WEBHOOK_VERIFY_TOKEN),
      hasAppSecret: Boolean(process.env.META_APP_SECRET),
    })),
    saveDraft: publicProcedure.input(z.object({
      agentId: z.number().optional(),
      displayPhoneNumber: z.string().max(40).optional(),
      phoneNumberId: z.string().max(80).optional(),
      wabaId: z.string().max(80).optional(),
    })).mutation(async ({ input }) => {
      const status = input.phoneNumberId ? "ready" : "draft";
      const { agentId, ...values } = input;
      return updateWhatsAppChannel({ ...values, status, lastError: null }, agentId);
    }),
  }),
  instagram: router({
    getConfig: publicProcedure.input(z.object({ agentId: z.number().optional() }).optional()).query(({ input }) => getInstagramChannel(input?.agentId)),
    saveDraft: publicProcedure.input(z.object({ agentId: z.number().optional(), profileHandle: z.string().max(120).optional() })).mutation(({ input }) => {
      const { agentId, ...values } = input;
      return updateInstagramChannel({ ...values, status: values.profileHandle ? "ready" : "draft", lastError: null }, agentId);
    }),
  }),
  voice: router({
    getConfig: publicProcedure.input(z.object({ agentId: z.number() })).query(async ({ input }) => ({
      profile: await getVoiceProfile(input.agentId),
      readiness: getVoiceProviderReadiness(),
    })),
    save: publicProcedure.input(z.object({
      agentId: z.number(),
      provider: z.enum(["google_chirp", "elevenlabs", "disabled"]),
      replyMode: z.enum(["automatic", "text_only", "audio_only"]),
      googleVoice: z.string().min(3).max(120),
      elevenLabsVoiceId: z.string().max(120).nullable().optional(),
      speechRatePercent: z.number().int().min(75).max(125),
      maxAudioCharacters: z.number().int().min(120).max(1200),
    })).mutation(({ input }) => {
      const { agentId, ...values } = input;
      return updateVoiceProfile(agentId, values);
    }),
    preview: publicProcedure.input(z.object({ agentId: z.number(), text: z.string().min(1).max(1200) })).mutation(async ({ input }) => {
      const profile = await getVoiceProfile(input.agentId);
      if (!profile || profile.provider === "disabled") throw new Error("Ative um provedor de voz antes do teste.");
      const result = await synthesizeVoice({ text: input.text, provider: profile.provider, googleVoice: profile.googleVoice, elevenLabsVoiceId: profile.elevenLabsVoiceId, speechRatePercent: profile.speechRatePercent });
      return { dataUrl: `data:${result.contentType};base64,${result.audio.toString("base64")}` };
    }),
  }),
  availability: router({
    list: publicProcedure.input(z.object({ agentId: z.number() })).query(({ input }) => listAgentAvailability(input.agentId)),
    save: publicProcedure.input(z.object({
      agentId: z.number(),
      slots: z.array(z.object({ weekday: z.number().int().min(0).max(6), startTime: z.string().max(5), endTime: z.string().max(5), slotMinutes: z.number().int(), isActive: z.boolean() })).length(7),
    })).mutation(({ input }) => replaceAgentAvailability(input.agentId, validateAvailabilitySlots(input.slots))),
  }),
});

export type AppRouter = typeof appRouter;
