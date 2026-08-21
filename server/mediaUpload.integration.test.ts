import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ createMediaAsset: vi.fn() }));
const storage = vi.hoisted(() => ({ storagePut: vi.fn() }));

vi.mock("./db", () => db);
vi.mock("./storage", () => storage);
vi.mock("./aiProvider", () => ({ generateAgentReply: vi.fn() }));
vi.mock("./whatsappCloud", () => ({ WHATSAPP_WEBHOOK_PATH: "/api/webhooks/meta/whatsapp" }));

import { appRouter } from "./routers";

const context = { user: null, req: { protocol: "https", headers: {} }, res: {} } as any;
const baseInput = {
  agentId: 12,
  filename: "apresentacao.png",
  kind: "image" as const,
  usage: "outbound" as const,
  intent: "apresentacao",
  flowStage: "Atendimento",
  dataUrl: "data:image/png;base64,aGVsbG8=",
};

describe("media upload router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storage.storagePut.mockResolvedValue({ key: "agents/12/media/apresentacao.png", url: "https://storage.example/apresentacao.png" });
    db.createMediaAsset.mockResolvedValue(88);
  });

  it("aceita o arquivo arrastado de atendimento e persiste seus metadados", async () => {
    const caller = appRouter.createCaller(context);
    await expect(caller.media.upload(baseInput)).resolves.toEqual({ id: 88, url: "https://storage.example/apresentacao.png" });
    expect(storage.storagePut).toHaveBeenCalledWith(expect.stringContaining("agents/12/media/"), Buffer.from("hello"), "image/png");
    expect(db.createMediaAsset).toHaveBeenCalledWith(expect.objectContaining({ agentId: 12, filename: "apresentacao.png", usage: "outbound", extractedText: null }));
  });

  it("rejeita uma instrução interna que não seja PDF antes de armazenar", async () => {
    const caller = appRouter.createCaller(context);
    await expect(caller.media.upload({ ...baseInput, usage: "instruction", filename: "foto.png" })).rejects.toThrow("PDF");
    expect(storage.storagePut).not.toHaveBeenCalled();
  });
});
