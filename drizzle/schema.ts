import {
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  industry: varchar("industry", { length: 120 }).notNull(),
  brandColor: varchar("brandColor", { length: 20 }).default("#007E45").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  persona: text("persona").notNull(),
  companyInfo: text("companyInfo").notNull(),
  services: text("services").notNull(),
  pricing: text("pricing").notNull(),
  businessHours: text("businessHours").notNull(),
  transferKeyword: varchar("transferKeyword", { length: 80 }).default("gente").notNull(),
  provider: mysqlEnum("provider", ["embedded", "openai"]).default("embedded").notNull(),
  modelPreference: varchar("modelPreference", { length: 120 }).default("automático").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const qualificationFields = mysqlTable("qualificationFields", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  key: varchar("key", { length: 60 }).notNull(),
  label: varchar("label", { length: 120 }).notNull(),
  prompt: varchar("prompt", { length: 260 }).notNull(),
  required: boolean("required").default(true).notNull(),
  position: int("position").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
});

export const mediaAssets = mysqlTable("mediaAssets", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  kind: mysqlEnum("kind", ["image", "audio", "video", "document"]).notNull(),
  url: text("url").notNull(),
  storageKey: varchar("storageKey", { length: 512 }),
  intent: varchar("intent", { length: 120 }).notNull(),
  flowStage: varchar("flowStage", { length: 120 }).default("Atendimento").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  contactName: varchar("contactName", { length: 160 }).default("Contato de teste").notNull(),
  contactPhone: varchar("contactPhone", { length: 40 }),
  channel: mysqlEnum("channel", ["simulator", "whatsapp", "instagram"]).default("simulator").notNull(),
  status: mysqlEnum("status", ["bot", "human", "closed"]).default("bot").notNull(),
  leadStatus: mysqlEnum("leadStatus", ["new", "qualified", "scheduled", "lost"]).default("new").notNull(),
  qualification: json("qualification").$type<Record<string, string>>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  role: mysqlEnum("role", ["lead", "agent", "human", "system"]).notNull(),
  body: text("body").notNull(),
  mediaIntent: varchar("mediaIntent", { length: 120 }),
  metadata: json("metadata").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  conversationId: int("conversationId"),
  visitorName: varchar("visitorName", { length: 160 }).notNull(),
  visitorPhone: varchar("visitorPhone", { length: 40 }),
  scheduledFor: timestamp("scheduledFor").notNull(),
  status: mysqlEnum("status", ["scheduled", "rescheduled", "canceled", "pending"]).default("scheduled").notNull(),
  calendarProvider: mysqlEnum("calendarProvider", ["google", "manual"]).default("manual").notNull(),
  externalEventId: varchar("externalEventId", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Agent = typeof agents.$inferSelect;
export type MediaAsset = typeof mediaAssets.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type ConversationMessage = typeof messages.$inferSelect;
