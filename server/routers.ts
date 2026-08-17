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
  getPilotAgentConfig,
  getPilotConversationContext,
  listAppointments,
  listConversations,
  updateAgentConfig,
  updateAppointment,
  updateConversation,
  updateQualificationFields,
} from "./db";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

const agentConfigSchema = z.object({
  agentId: z.number(),
  name: z.string().min(2).max(120),
  persona: z.string().min(20),
  companyInfo: z.string().min(20),
  services: z.string().min(10),
  pricing: z.string().min(5),
  businessHours: z.string().min(5),
  transferKeyword: z.string().min(2).max(80),
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
    getConfig: publicProcedure.query(() => getPilotAgentConfig()),
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
      intent: z.string().min(2).max(120),
      flowStage: z.string().min(2).max(120),
      description: z.string().max(500).optional(),
      dataUrl: z.string().min(10).max(12_000_000),
    })).mutation(async ({ input }) => {
      const match = input.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) throw new Error("Arquivo inválido");
      const contentType = match[1];
      const buffer = Buffer.from(match[2], "base64");
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
      });
      return { id, url: saved.url };
    }),
  }),
  conversations: router({
    list: publicProcedure.query(() => listConversations()),
    messages: publicProcedure.input(z.object({ conversationId: z.number() })).query(({ input }) => getConversationMessages(input.conversationId)),
    send: publicProcedure.input(z.object({
      conversationId: z.number().optional(),
      text: z.string().min(1).max(3000),
      contactName: z.string().min(2).max(160).default("Contato de teste"),
    })).mutation(async ({ input }) => {
      const config = await getPilotAgentConfig();
      if (!config) throw new Error("Configure o agente piloto antes de iniciar o teste");
      const conversationId = input.conversationId ?? await createConversation(config.agent.id, input.contactName);
      await appendConversationMessage({ conversationId, role: "lead", body: input.text, metadata: {} });
      const context = await getPilotConversationContext(conversationId);
      const reply = await generateAgentReply({
        agent: context.agent,
        history: context.history,
        incomingText: input.text,
        qualification: context.conversation.qualification ?? {},
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
    takeOver: publicProcedure.input(z.object({ conversationId: z.number() })).mutation(async ({ input }) => {
      await updateConversation(input.conversationId, { status: "human" });
      await appendConversationMessage({ conversationId: input.conversationId, role: "system", body: "Atendimento transferido para uma pessoa da equipe.", metadata: {} });
      return { success: true };
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
      const id = await createAppointment({
        agentId: input.agentId,
        visitorName: input.visitorName,
        visitorPhone: input.visitorPhone ?? null,
        scheduledFor: new Date(input.scheduledFor),
        notes: input.notes ?? null,
        calendarProvider: "manual",
        status: "scheduled",
      });
      return { id };
    }),
    reschedule: publicProcedure.input(z.object({ appointmentId: z.number(), scheduledFor: z.number() })).mutation(async ({ input }) => {
      await updateAppointment(input.appointmentId, { scheduledFor: new Date(input.scheduledFor), status: "rescheduled" });
      return { success: true };
    }),
    cancel: publicProcedure.input(z.object({ appointmentId: z.number() })).mutation(async ({ input }) => {
      await updateAppointment(input.appointmentId, { status: "canceled" });
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
