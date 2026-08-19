import { describe, expect, it } from "vitest";
import { normalizeInstagramHandle, validatePublicWebsiteUrl } from "./configurationSuggestion";

describe("onboarding por fontes públicas", () => {
  it("normaliza uma conta pública do Instagram", () => {
    expect(normalizeInstagramHandle("https://www.instagram.com/ducondeempresarial/")).toBe("ducondeempresarial");
    expect(normalizeInstagramHandle("@ducondeempresarial")).toBe("ducondeempresarial");
  });

  it("aceita URL pública e bloqueia endereços internos", () => {
    expect(validatePublicWebsiteUrl("empresa.example.com")).toBe("https://empresa.example.com/");
    expect(() => validatePublicWebsiteUrl("http://127.0.0.1:3000")).toThrow(/internos/i);
    expect(() => validatePublicWebsiteUrl("http://localhost:3000")).toThrow(/internos/i);
  });
});
