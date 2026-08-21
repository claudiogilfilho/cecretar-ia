import { describe, expect, it, vi } from "vitest";
import { processWhatsAppWebhookPayload } from "./whatsappCloud";

describe("webhook de coexistência WhatsApp Business App", () => {
  it("processa smb_message_echoes e assume a conversa quando o proprietário envia #assumir", async () => {
    const update = vi.fn().mockResolvedValue(undefined);
    const appendMessage = vi.fn().mockResolvedValue(undefined);

    const processed = await processWhatsAppWebhookPayload({
      object: "whatsapp_business_account",
      entry: [{
        changes: [{
          field: "smb_message_echoes",
          value: {
            metadata: { phone_number_id: "phone-1" },
            message_echoes: [{
              id: "wamid.owner-command",
              to: "5581999999999",
              type: "text",
              text: { body: "#assumir" },
            }],
          },
        }],
      }],
    }, {
      getChannel: vi.fn().mockResolvedValue({ agentId: 12, status: "connected" }),
      findConversation: vi.fn().mockResolvedValue({ id: 31, status: "bot" }),
      update,
      appendMessage,
    });

    expect(processed).toBe(1);
    expect(update).toHaveBeenCalledWith(31, { status: "human" });
    expect(appendMessage).toHaveBeenCalledWith(expect.objectContaining({
      conversationId: 31,
      role: "system",
      body: expect.stringContaining("assumido pelo proprietário"),
    }));
  });

  it("ignora ecos que não sejam exatamente o comando #assumir", async () => {
    const update = vi.fn().mockResolvedValue(undefined);
    const processed = await processWhatsAppWebhookPayload({
      entry: [{
        changes: [{
          field: "smb_message_echoes",
          value: {
            metadata: { phone_number_id: "phone-1" },
            message_echoes: [{ id: "wamid.reply", to: "5581999999999", type: "text", text: { body: "Olá, já vou ajudar." } }],
          },
        }],
      }],
    }, {
      getChannel: vi.fn().mockResolvedValue({ agentId: 12, status: "connected" }),
      findConversation: vi.fn().mockResolvedValue({ id: 31, status: "bot" }),
      update,
      appendMessage: vi.fn().mockResolvedValue(undefined),
    });

    expect(processed).toBe(1);
    expect(update).not.toHaveBeenCalled();
  });
});
