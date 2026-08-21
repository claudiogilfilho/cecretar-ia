import { describe, expect, it, vi } from "vitest";
import {
  normalizeBusinessAppEchoes,
  processBusinessAppEcho,
  processInboundWhatsAppMessage,
} from "./whatsappCloud";

const ownerEchoPayload = {
  object: "whatsapp_business_account",
  entry: [{ changes: [{ field: "smb_message_echoes", value: {
    metadata: { phone_number_id: "phone-1" },
    message_echoes: [{ id: "wamid.owner", to: "5581999999999", type: "text", text: { body: "#assumir" } }],
  } }] }],
};

describe("assunção via WhatsApp Business App", () => {
  it("normaliza o eco oficial de mensagem enviado pela Business App", () => {
    expect(normalizeBusinessAppEchoes(ownerEchoPayload)).toEqual([{ messageId: "wamid.owner", phoneNumberId: "phone-1", to: "5581999999999", text: "#assumir", type: "text" }]);
  });

  it("assume a conversa somente quando #assumir chega como eco da Business App", async () => {
    const update = vi.fn().mockResolvedValue(undefined);
    const appendMessage = vi.fn().mockResolvedValue(undefined);
    const handled = await processBusinessAppEcho(normalizeBusinessAppEchoes(ownerEchoPayload)[0]!, {
      getChannel: vi.fn().mockResolvedValue({ agentId: 4, status: "connected" }),
      findConversation: vi.fn().mockResolvedValue({ id: 88, status: "bot" }),
      update,
      appendMessage,
    });
    expect(handled).toBe(true);
    expect(update).toHaveBeenCalledWith(88, { status: "human" });
    expect(appendMessage).toHaveBeenCalledWith(expect.objectContaining({ conversationId: 88, role: "system", metadata: expect.objectContaining({ source: "smb_message_echoes" }) }));
  });

  it("não interpreta #assumir escrito pelo cliente como assunção interna", async () => {
    const generateReply = vi.fn().mockResolvedValue({ reply: "Posso chamar uma pessoa se você escrever #gente.", qualification: {}, transferToHuman: false, qualified: false });
    const update = vi.fn().mockResolvedValue(undefined);
    await processInboundWhatsAppMessage({ messageId: "wamid.client", phoneNumberId: "phone-1", from: "5581999999999", contactName: "Cliente", text: "#assumir", type: "text" }, {
      getChannel: vi.fn().mockResolvedValue({ agentId: 4, status: "connected", phoneNumberId: "phone-1" }),
      findConversation: vi.fn().mockResolvedValue({ id: 88, status: "bot", leadStatus: "new", qualification: {} }),
      appendMessage: vi.fn().mockResolvedValue(undefined),
      getContext: vi.fn().mockResolvedValue({ agent: {}, history: [], conversation: { qualification: {}, leadStatus: "new" } }),
      generateReply,
      update,
      dispatch: vi.fn().mockResolvedValue(undefined),
    });
    expect(generateReply).toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(88, expect.objectContaining({ status: "bot" }));
  });
});
