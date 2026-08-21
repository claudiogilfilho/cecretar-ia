import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  appendConversationMessage: vi.fn(),
  createAppointment: vi.fn(),
  createConversation: vi.fn(),
  createMediaAsset: vi.fn(),
  getConversationMessages: vi.fn(),
  getDashboardOverview: vi.fn(),
  getPilotAgentConfig: vi.fn(),
  getPilotConversationContext: vi.fn(),
  getWhatsAppChannel: vi.fn(),
  listAppointments: vi.fn(),
  listConversations: vi.fn(),
  listConversationsForAgent: vi.fn(),
  setConversationAutomation: vi.fn(),
  updateAgentConfig: vi.fn(),
  updateAppointment: vi.fn(),
  updateConversation: vi.fn(),
  updateQualificationFields: vi.fn(),
  updateWhatsAppChannel: vi.fn(),
}));

vi.mock("./db", () => db);
vi.mock("./storage", () => ({ storagePut: vi.fn() }));
vi.mock("./aiProvider", () => ({ generateAgentReply: vi.fn() }));
vi.mock("./whatsappCloud", () => ({ WHATSAPP_WEBHOOK_PATH: "/api/webhooks/meta/whatsapp" }));

import { appRouter } from "./routers";

const context = { user: null, req: { protocol: "https", headers: {} }, res: {} } as any;
const authenticatedContext = { user: { id: 9, openId: "owner", role: "admin" }, req: { protocol: "https", headers: {} }, res: {} } as any;
const memberContext = { user: { id: 10, openId: "member", role: "user" }, req: { protocol: "https", headers: {} }, res: {} } as any;

describe("conversations router integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.updateConversation.mockResolvedValue(undefined);
    db.appendConversationMessage.mockResolvedValue(undefined);
    db.setConversationAutomation.mockResolvedValue({ automationPaused: true, status: "human" });
  });

  it("assume uma conversa, muda o status para humano e anexa a mensagem de sistema", async () => {
    const caller = appRouter.createCaller(authenticatedContext);

    await expect(caller.conversations.takeOver({ conversationId: 42 })).resolves.toEqual({ success: true });
    expect(db.updateConversation).toHaveBeenCalledWith(42, { status: "human" });
    expect(db.appendConversationMessage).toHaveBeenCalledWith({
      conversationId: 42,
      role: "system",
      body: "Atendimento transferido para uma pessoa da equipe.",
      metadata: { ownerId: 9 },
    });
  });

  it("rejeita a assunção de conversa por visitante não autenticado", async () => {
    const caller = appRouter.createCaller(context);
    await expect(caller.conversations.takeOver({ conversationId: 42 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejeita a assunção por usuário sem permissão de proprietário", async () => {
    const caller = appRouter.createCaller(memberContext);
    await expect(caller.conversations.ownerCommand({ conversationId: 42, text: "#assumir" })).rejects.toThrow("Somente o proprietário");
  });

  it("reflete a ordenação da inbox e o histórico cronológico pelos procedimentos reais", async () => {
    db.listConversations.mockResolvedValue([
      { id: 1, status: "bot", updatedAt: new Date("2026-08-19T10:00:00Z") },
      { id: 2, status: "human", updatedAt: new Date("2026-08-19T11:00:00Z") },
    ]);
    db.getConversationMessages.mockResolvedValue([
      { id: 2, createdAt: new Date("2026-08-19T11:01:00Z") },
      { id: 1, createdAt: new Date("2026-08-19T11:00:00Z") },
    ]);
    const caller = appRouter.createCaller(context);

    const conversations = await caller.conversations.list();
    const messages = await caller.conversations.messages({ conversationId: 2 });

    expect(conversations.map(item => item.id)).toEqual([2, 1]);
    expect(conversations[0]?.needsHumanAttention).toBe(true);
    expect(messages.map(item => item.id)).toEqual([1, 2]);
  });

  it("filtra por especialista e permite pausar ou retomar a automação pelo painel", async () => {
    db.listConversationsForAgent.mockResolvedValue([{ id: 7, agentId: 33, status: "bot", updatedAt: new Date("2026-08-21T12:00:00Z") }]);
    const visitor = appRouter.createCaller(context);
    const owner = appRouter.createCaller(authenticatedContext);

    await expect(visitor.conversations.list({ agentId: 33 })).resolves.toHaveLength(1);
    expect(db.listConversationsForAgent).toHaveBeenCalledWith(33);

    await expect(owner.conversations.setAutomation({ conversationId: 7, paused: true })).resolves.toEqual({ success: true, paused: true });
    expect(db.setConversationAutomation).toHaveBeenCalledWith(7, true, { ownerId: 9, source: "dashboard" });

    db.setConversationAutomation.mockResolvedValueOnce({ automationPaused: false, status: "bot" });
    await expect(owner.conversations.setAutomation({ conversationId: 7, paused: false })).resolves.toEqual({ success: true, paused: false });
  });
});
