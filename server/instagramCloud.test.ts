import { describe, expect, it } from "vitest";
import { buildInstagramTextPayload, normalizeInstagramPayload } from "./instagramCloud";

describe("Instagram Direct adapter", () => {
  it("normaliza um Direct recebido da Meta", () => {
    const messages = normalizeInstagramPayload({ entry: [{ id: "178414", messaging: [{ sender: { id: "user-1" }, recipient: { id: "178414" }, message: { mid: "mid-1", text: "Quero saber mais" } }] }] });
    expect(messages).toEqual([{ messageId: "mid-1", instagramBusinessAccountId: "178414", senderId: "user-1", text: "Quero saber mais" }]);
  });

  it("compõe a resposta de texto no formato de Direct", () => {
    expect(buildInstagramTextPayload("user-1", "Olá!")).toEqual({ recipient: { id: "user-1" }, message: { text: "Olá!" } });
  });
});
