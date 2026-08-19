import { describe, expect, it } from "vitest";
import { selectMediaAssetForIntent } from "./db";
import { buildMediaPayload } from "./whatsappCloud";

describe("mídia por especialista", () => {
  const assets = [
    { id: 1, agentId: 1, intent: "fotos_salas", kind: "image", url: "https://storage.example/duconde-antiga.jpg", createdAt: new Date("2026-08-01") },
    { id: 2, agentId: 1, intent: "fotos_salas", kind: "image", url: "https://storage.example/duconde-atual.jpg", createdAt: new Date("2026-08-02") },
    { id: 3, agentId: 2, intent: "fotos_salas", kind: "image", url: "https://storage.example/outro-negocio.jpg", createdAt: new Date("2026-08-03") },
  ];

  it("seleciona a mídia mais recente da intenção para o agente correto", () => {
    expect(selectMediaAssetForIntent(assets, 1, "fotos_salas")?.url).toBe("https://storage.example/duconde-atual.jpg");
    expect(selectMediaAssetForIntent(assets, 2, "fotos_salas")?.url).toBe("https://storage.example/outro-negocio.jpg");
  });

  it("converte a mídia selecionada pela resposta do agente em payload de envio", () => {
    const reply = { mediaIntent: "fotos_salas" };
    const asset = selectMediaAssetForIntent(assets, 1, reply.mediaIntent);
    expect(asset).not.toBeNull();
    expect(buildMediaPayload("5581999999999", asset!)).toMatchObject({ to: "5581999999999", type: "image", image: { link: "https://storage.example/duconde-atual.jpg" } });
  });
});
