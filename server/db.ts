import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  agents,
  agentAvailability,
  appointments,
  companies,
  conversations,
  ConversationMessage,
  InsertUser,
  mediaAssets,
  messages,
  qualificationFields,
  users,
  instagramChannels,
  whatsappChannels,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { calculatePilotMetrics } from "./metrics";
import { AGENT_TEMPLATES, getAgentTemplate } from "./agentTemplates";

let _db: ReturnType<typeof drizzle> | null = null;

async function ensurePilotData() {
  const db = await getDb();
  if (!db) return null;
  const existingAgent = (await db.select().from(agents).limit(1))[0];
  if (existingAgent) {
    if (existingAgent.transferKeyword !== "#gente" || existingAgent.ownerTakeoverCommand !== "#assumir") {
      await db.update(agents).set({ transferKeyword: "#gente", ownerTakeoverCommand: "#assumir" }).where(eq(agents.id, existingAgent.id));
    }
    const existingChannel = (await db.select().from(whatsappChannels).where(eq(whatsappChannels.agentId, existingAgent.id)).limit(1))[0];
    if (!existingChannel) {
      await db.insert(whatsappChannels).values({ companyId: existingAgent.companyId, agentId: existingAgent.id, provider: "meta_cloud", status: "draft" });
    }
    const existingInstagramChannel = (await db.select().from(instagramChannels).where(eq(instagramChannels.agentId, existingAgent.id)).limit(1))[0];
    if (!existingInstagramChannel) {
      await db.insert(instagramChannels).values({ companyId: existingAgent.companyId, agentId: existingAgent.id, status: "draft" });
    }
    return existingAgent.id;
  }

  const companyResult = await db.insert(companies).values({
    name: "Duconde Empresarial Boutique",
    slug: "duconde-empresarial-boutique",
    industry: "Locação de salas comerciais",
    brandColor: "#007E45",
  });
  const companyId = Number((companyResult as any)[0]?.insertId ?? 0);
  const agentResult = await db.insert(agents).values({
    companyId,
    name: "CECRETAR.IA",
    persona: "Assistente comercial cordial, consultiva e objetiva. Faz perguntas apenas quando forem necessárias para entender o interesse do contato. Nunca pressiona a decisão e nunca inventa disponibilidade, preços ou condições.",
    companyInfo: "O Duconde Empresarial Boutique oferece salas privativas para profissionais e empresas na Rua Conde de Irajá, 910, Torre, na divisa com a Madalena. A estrutura inclui sala climatizada, chave privativa, móveis, recepção, copa e banheiros compartilhados.",
    services: "Locação de salas comerciais privativas, apresentação da estrutura, envio de fotos e áudios, qualificação de interessados e agendamento de visitas presenciais.",
    pricing: "Salas para até quatro pessoas a partir de R$ 1.500 mensais. Para equipes maiores, opções para até oito pessoas a partir de R$ 2.000 mensais. Valores e disponibilidade devem ser confirmados na visita.",
    businessHours: "de segunda a quinta, das 8h às 18h, e às sextas até as 17h",
    transferKeyword: "#gente",
    ownerTakeoverCommand: "#assumir",
    templateKey: "real_estate_rental",
    onboardingSources: {},
    provider: "embedded",
    modelPreference: "Modelo embutido — modo de teste",
  });
  const agentId = Number((agentResult as any)[0]?.insertId ?? 0);
  await db.insert(qualificationFields).values([
    { agentId, key: "nome", label: "Nome", prompt: "Como posso te chamar?", required: true, position: 0, isActive: true },
    { agentId, key: "cidade", label: "Cidade", prompt: "Em qual cidade você está?", required: true, position: 1, isActive: true },
    { agentId, key: "necessidade", label: "Necessidade", prompt: "Quantas pessoas vão utilizar a sala e qual é a sua necessidade?", required: true, position: 2, isActive: true },
    { agentId, key: "orcamento", label: "Orçamento", prompt: "Você possui alguma faixa de investimento mensal em mente?", required: false, position: 3, isActive: true },
    { agentId, key: "urgencia", label: "Urgência", prompt: "Para quando você pretende começar a utilizar a sala?", required: false, position: 4, isActive: true },
  ]);
  await db.insert(whatsappChannels).values({ companyId, agentId, provider: "meta_cloud", status: "draft" });
  await db.insert(instagramChannels).values({ companyId, agentId, status: "draft" });
  return agentId;
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

async function ensureAvailabilityForAgent(agentId: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(agentAvailability).where(eq(agentAvailability.agentId, agentId));
  if (existing.length) return;
  await db.insert(agentAvailability).values([1, 2, 3, 4, 5].map(weekday => ({ agentId, weekday, startTime: "08:00", endTime: "18:00", slotMinutes: 30, isActive: true })));
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = {
    openId: user.openId,
    name: user.name ?? null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? null,
    lastSignedIn: user.lastSignedIn ?? new Date(),
    role: user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user"),
  };
  await db.insert(users).values(values).onDuplicateKeyUpdate({
    set: {
      name: values.name,
      email: values.email,
      loginMethod: values.loginMethod,
      lastSignedIn: values.lastSignedIn,
    },
  });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getAgentConfig(agentId?: number) {
  const db = await getDb();
  if (!db) return null;
  await ensurePilotData();
  const agent = agentId
    ? (await db.select().from(agents).where(eq(agents.id, agentId)).limit(1))[0]
    : (await db.select().from(agents).limit(1))[0];
  if (!agent) return null;
  await ensureAvailabilityForAgent(agent.id);
  const company = (await db.select().from(companies).where(eq(companies.id, agent.companyId)).limit(1))[0];
  const fields = await db.select().from(qualificationFields).where(eq(qualificationFields.agentId, agent.id));
  const assets = await db.select().from(mediaAssets).where(eq(mediaAssets.agentId, agent.id)).orderBy(desc(mediaAssets.createdAt));
  const whatsappChannel = (await db.select().from(whatsappChannels).where(eq(whatsappChannels.agentId, agent.id)).limit(1))[0] ?? null;
  return { agent, company, qualificationFields: fields.sort((a, b) => a.position - b.position), mediaAssets: assets, whatsappChannel };
}

export async function getPilotAgentConfig() {
  return getAgentConfig();
}

export async function listConfiguredAgents() {
  const db = await getDb();
  if (!db) return [];
  await ensurePilotData();
  return db.select().from(agents).orderBy(desc(agents.createdAt));
}

export async function listAgentTemplates() {
  return AGENT_TEMPLATES.map(({ qualificationFields, ...template }) => ({ ...template, qualificationCount: qualificationFields.length }));
}

export async function createAgentFromTemplate(templateKey: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await ensurePilotData();
  const template = getAgentTemplate(templateKey);
  if (!template) throw new Error("Especialidade não encontrada");
  const company = (await db.select().from(companies).limit(1))[0];
  if (!company) throw new Error("Empresa piloto não encontrada");
  const result = await db.insert(agents).values({
    companyId: company.id,
    name: template.name,
    persona: template.persona,
    companyInfo: template.companyInfo,
    services: template.services,
    pricing: template.pricing,
    businessHours: template.businessHours,
    transferKeyword: "#gente",
    ownerTakeoverCommand: "#assumir",
    templateKey: template.key,
    onboardingSources: {},
    provider: "embedded",
    modelPreference: "Modelo embutido — modo de teste",
  });
  const agentId = Number((result as any)[0]?.insertId ?? 0);
  await db.insert(qualificationFields).values(template.qualificationFields.map((field, position) => ({ ...field, agentId, position, isActive: true })));
  await db.insert(whatsappChannels).values({ companyId: company.id, agentId, provider: "meta_cloud", status: "draft" });
  await db.insert(instagramChannels).values({ companyId: company.id, agentId, status: "draft" });
  return agentId;
}

export async function getWhatsAppChannel(agentId?: number) {
  const config = await getAgentConfig(agentId);
  return config?.whatsappChannel ?? null;
}

export async function updateWhatsAppChannel(values: Record<string, unknown>, agentId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await ensurePilotData();
  const channel = agentId
    ? (await db.select().from(whatsappChannels).where(eq(whatsappChannels.agentId, agentId)).limit(1))[0]
    : (await db.select().from(whatsappChannels).limit(1))[0];
  if (!channel) throw new Error("Canal WhatsApp não encontrado");
  await db.update(whatsappChannels).set(values as any).where(eq(whatsappChannels.id, channel.id));
  return getWhatsAppChannel(agentId);
}

export async function getInstagramChannel(agentId?: number) {
  const db = await getDb();
  if (!db) return null;
  await ensurePilotData();
  const agent = agentId ? (await db.select().from(agents).where(eq(agents.id, agentId)).limit(1))[0] : (await db.select().from(agents).limit(1))[0];
  if (!agent) return null;
  return (await db.select().from(instagramChannels).where(eq(instagramChannels.agentId, agent.id)).limit(1))[0] ?? null;
}

export async function updateInstagramChannel(values: Record<string, unknown>, agentId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await ensurePilotData();
  const channel = agentId
    ? (await db.select().from(instagramChannels).where(eq(instagramChannels.agentId, agentId)).limit(1))[0]
    : (await db.select().from(instagramChannels).limit(1))[0];
  if (!channel) throw new Error("Canal Instagram não encontrado");
  await db.update(instagramChannels).set(values as any).where(eq(instagramChannels.id, channel.id));
  return getInstagramChannel(agentId);
}

export async function getWhatsAppChannelByPhoneNumberId(phoneNumberId: string) {
  const db = await getDb();
  if (!db) return null;
  return (await db.select().from(whatsappChannels).where(eq(whatsappChannels.phoneNumberId, phoneNumberId)).limit(1))[0] ?? null;
}

export async function getInstagramChannelByBusinessAccountId(instagramBusinessAccountId: string) {
  const db = await getDb();
  if (!db) return null;
  return (await db.select().from(instagramChannels).where(eq(instagramChannels.instagramBusinessAccountId, instagramBusinessAccountId)).limit(1))[0] ?? null;
}

export async function updateAgentConfig(agentId: number, values: Record<string, unknown>) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.update(agents).set(values as any).where(eq(agents.id, agentId));
  return getAgentConfig(agentId);
}

export async function updateQualificationFields(agentId: number, fields: Array<Record<string, unknown>>) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.delete(qualificationFields).where(eq(qualificationFields.agentId, agentId));
  if (fields.length) {
    await db.insert(qualificationFields).values(fields.map((field, index) => ({
      agentId,
      key: String(field.key),
      label: String(field.label),
      prompt: String(field.prompt),
      required: Boolean(field.required),
      position: index,
      isActive: true,
    })));
  }
  return getAgentConfig(agentId);
}

export async function listAgentAvailability(agentId: number) {
  const db = await getDb();
  if (!db) return [];
  await ensureAvailabilityForAgent(agentId);
  return db.select().from(agentAvailability).where(eq(agentAvailability.agentId, agentId)).orderBy(agentAvailability.weekday);
}

export async function replaceAgentAvailability(agentId: number, slots: Array<{ weekday: number; startTime: string; endTime: string; slotMinutes: number; isActive: boolean }>) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.delete(agentAvailability).where(eq(agentAvailability.agentId, agentId));
  await db.insert(agentAvailability).values(slots.map(slot => ({ ...slot, agentId })));
  return listAgentAvailability(agentId);
}

export async function createMediaAsset(values: typeof mediaAssets.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  const result = await db.insert(mediaAssets).values(values);
  return Number((result as any)[0]?.insertId ?? 0);
}

export function selectMediaAssetForIntent<T extends { agentId: number; intent: string; createdAt?: Date | null }>(assets: T[], agentId: number, intent: string) {
  return assets.filter(asset => asset.agentId === agentId && asset.intent === intent).sort((a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0))[0] ?? null;
}

export async function getMediaAssetForIntent(agentId: number, intent: string) {
  const db = await getDb();
  if (!db) return null;
  const assets = await db.select().from(mediaAssets).where(eq(mediaAssets.agentId, agentId)).orderBy(desc(mediaAssets.createdAt));
  return selectMediaAssetForIntent(assets, agentId, intent);
}

export async function listConversations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conversations).orderBy(desc(conversations.updatedAt));
}

export async function getConversationMessages(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
}

export async function createConversation(agentId: number, contactName: string, channel: "simulator" | "whatsapp" | "instagram" = "simulator", contactPhone?: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  const result = await db.insert(conversations).values({ agentId, contactName, channel, contactPhone: contactPhone ?? null, qualification: {} });
  return Number((result as any)[0]?.insertId ?? 0);
}

export async function findOpenWhatsAppConversation(agentId: number, contactPhone: string) {
  const db = await getDb();
  if (!db) return null;
  return (await db.select().from(conversations).where(and(eq(conversations.agentId, agentId), eq(conversations.channel, "whatsapp"), eq(conversations.contactPhone, contactPhone))).orderBy(desc(conversations.updatedAt)).limit(1))[0] ?? null;
}

export async function findOpenInstagramConversation(agentId: number, contactId: string) {
  const db = await getDb();
  if (!db) return null;
  return (await db.select().from(conversations).where(and(eq(conversations.agentId, agentId), eq(conversations.channel, "instagram"), eq(conversations.contactPhone, contactId))).orderBy(desc(conversations.updatedAt)).limit(1))[0] ?? null;
}

export async function getConversation(conversationId: number) {
  const db = await getDb();
  if (!db) return null;
  return (await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1))[0] ?? null;
}

export async function appendConversationMessage(values: typeof messages.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  const result = await db.insert(messages).values(values);
  return Number((result as any)[0]?.insertId ?? 0);
}

export async function updateConversation(conversationId: number, values: Record<string, unknown>) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.update(conversations).set(values as any).where(eq(conversations.id, conversationId));
}

export async function getDashboardOverview() {
  await ensurePilotData();
  const [config, conversationRows, appointmentRows] = await Promise.all([
    getPilotAgentConfig(),
    listConversations(),
    listAppointments(),
  ]);
  const metrics = calculatePilotMetrics(conversationRows, appointmentRows);
  return { config, metrics, conversations: conversationRows.slice(0, 5), appointments: appointmentRows.slice(0, 5) };
}

export async function listAppointments() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(appointments).orderBy(desc(appointments.scheduledFor));
}

export async function createAppointment(values: typeof appointments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  const result = await db.insert(appointments).values(values);
  return Number((result as any)[0]?.insertId ?? 0);
}

export async function updateAppointment(appointmentId: number, values: Record<string, unknown>) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.update(appointments).set(values as any).where(eq(appointments.id, appointmentId));
}

export async function getPilotConversationContext(conversationId: number) {
  const [conversation, history, config] = await Promise.all([
    getConversation(conversationId),
    getConversationMessages(conversationId),
    getAgentConfig(),
  ]);
  if (!conversation || !config) throw new Error("Conversa ou agente não encontrado");
  return { conversation, history: history as ConversationMessage[], agent: config.agent, mediaAssets: config.mediaAssets };
}
