import { describe, expect, it } from "vitest";
import { buildTextPayload, isWebhookSignatureValid, normalizeWhatsAppPayload } from "./whatsappCloud";

describe("WhatsApp Cloud adapter", () => {
  it("normaliza uma mensagem de texto recebida da Meta", () => {
    const messages = normalizeWhatsAppPayload({ entry: [{ changes: [{ value: { metadata: { phone_number_id: "123" }, contacts: [{ profile: { name: "Ana" } }], messages: [{ id: "wamid.1", from: "5581999999999", type: "text", text: { body: "Quero uma sala" } }] } }] }] });
    expect(messages).toEqual([{ messageId: "wamid.1", phoneNumberId: "123", from: "5581999999999", contactName: "Ana", text: "Quero uma sala", type: "text" }]);
  });

  it("compõe uma resposta de texto no formato da Cloud API", () => {
    expect(buildTextPayload("5581999999999", "Olá!")).toMatchObject({ messaging_product: "whatsapp", to: "5581999999999", type: "text", text: { body: "Olá!" } });
  });

  it("rejeita assinatura ausente quando há segredo configurado", () => {
    expect(isWebhookSignatureValid(Buffer.from("{}"), undefined, "segredo")).toBe(false);
  });

  it("rejeita Webhook quando o segredo do aplicativo não foi configurado", () => {
    expect(isWebhookSignatureValid(Buffer.from("{}"), "sha256=qualquer-coisa", undefined)).toBe(false);
  });

  it("rejeita assinatura malformada sem lançar exceção", () => {
    expect(() => isWebhookSignatureValid(Buffer.from("{}"), "sha256=x", "segredo")).not.toThrow();
    expect(isWebhookSignatureValid(Buffer.from("{}"), "sha256=x", "segredo")).toBe(false);
  });
});
