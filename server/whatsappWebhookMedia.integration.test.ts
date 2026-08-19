import { describe, expect, it, vi } from "vitest";
import { dispatchAgentReplyToWhatsApp, processWhatsAppWebhookPayload } from "./whatsappCloud";

describe("Webhook WhatsApp com resposta de mídia", () => {
  it("normaliza a entrada, gera resposta com mediaIntent, busca a mídia do agente e envia texto e arquivo", async () => {
    const resolveMedia = vi.fn().mockResolvedValue({ agentId: 7, intent: "tour_salas", kind: "video", url: "https://storage.example/tour.mp4" });
    const sendTextPayload = vi.fn().mockResolvedValue({});
    const sendMediaAsset = vi.fn().mockResolvedValue({});
    const dispatch = vi.fn((values: any) => dispatchAgentReplyToWhatsApp(values, { resolveMedia, sendTextPayload, sendMediaAsset }));
    const appendMessage = vi.fn().mockResolvedValue(undefined);

    const processed = await processWhatsAppWebhookPayload({ entry: [{ changes: [{ value: { metadata: { phone_number_id: "phone-7" }, contacts: [{ profile: { name: "Ana" } }], messages: [{ id: "wamid.1", from: "5581999999999", type: "text", text: { body: "Quero conhecer as salas" } }] } }] }] }, {
      getChannel: vi.fn().mockResolvedValue({ agentId: 7, phoneNumberId: "phone-7", status: "connected" }),
      findConversation: vi.fn().mockResolvedValue(null),
      createConversation: vi.fn().mockResolvedValue(44),
      appendMessage,
      getContext: vi.fn().mockResolvedValue({ agent: { id: 7 }, history: [], conversation: { qualification: {}, leadStatus: "new" } }),
      generateReply: vi.fn().mockResolvedValue({ reply: "Vou enviar o tour.", mediaIntent: "tour_salas", qualification: {}, transferToHuman: false, qualified: false, source: "rule" }),
      update: vi.fn().mockResolvedValue(undefined),
      dispatch,
    });

    expect(processed).toBe(1);
    expect(appendMessage).toHaveBeenCalledWith(expect.objectContaining({ conversationId: 44, role: "lead", body: "Quero conhecer as salas" }));
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ agentId: 7, reply: expect.objectContaining({ mediaIntent: "tour_salas" }) }));
    expect(resolveMedia).toHaveBeenCalledWith(7, "tour_salas");
    expect(sendTextPayload).toHaveBeenCalledWith("phone-7", expect.objectContaining({ type: "text" }));
    expect(sendMediaAsset).toHaveBeenCalledWith("phone-7", "5581999999999", expect.objectContaining({ agentId: 7, url: "https://storage.example/tour.mp4" }));
  });
});
