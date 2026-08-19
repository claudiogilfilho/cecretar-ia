import { describe, expect, it, vi } from "vitest";
import { dispatchAgentReplyToWhatsApp } from "./whatsappCloud";

describe("dispatcher integrado de mídia do WhatsApp", () => {
  it("envia o texto e busca a mídia certa do agente antes de disparar o arquivo", async () => {
    const resolveMedia = vi.fn().mockResolvedValue({ agentId: 7, intent: "tour_salas", kind: "video", url: "https://storage.example/tour.mp4" });
    const sendTextPayload = vi.fn().mockResolvedValue({ messages: [{ id: "text-1" }] });
    const sendMediaAsset = vi.fn().mockResolvedValue({ messages: [{ id: "media-1" }] });

    const asset = await dispatchAgentReplyToWhatsApp(
      { phoneNumberId: "phone-7", to: "5581999999999", agentId: 7, reply: { reply: "Vou enviar o tour do espaço.", mediaIntent: "tour_salas" } },
      { resolveMedia, sendTextPayload, sendMediaAsset },
    );

    expect(sendTextPayload).toHaveBeenCalledWith("phone-7", expect.objectContaining({ to: "5581999999999", type: "text" }));
    expect(resolveMedia).toHaveBeenCalledWith(7, "tour_salas");
    expect(sendMediaAsset).toHaveBeenCalledWith("phone-7", "5581999999999", expect.objectContaining({ agentId: 7, kind: "video", url: "https://storage.example/tour.mp4" }));
    expect(asset).toMatchObject({ agentId: 7, intent: "tour_salas" });
  });
});
