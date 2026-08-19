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

describe("conversations router integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.updateConversation.mockResolvedValue(undefined);
    db.appendConversationMessage.mockResolvedValue(undefined);
  });

  it("assume uma conversa, muda o status para humano e anexa a mensagem de sistema", async () => {
    const caller = appRouter.createCaller(context);

    await expect(caller.conversations.takeOver({ conversationId: 42 })).resolves.toEqual({ success: true });
    expect(db.updateConversation).toHaveBeenCalledWith(42, { status: "human" });
    expect(db.appendConversationMessage).toHaveBeenCalledWith({
      conversationId: 42,
      role: "system",
      body: "Atendimento transferido para uma pessoa da equipe.",
      metadata: {},
    });
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
});
