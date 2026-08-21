import { describe, expect, it } from "vitest";
import { isInstructionPdf, sanitizeInstructionText } from "./pdfInstructions";

describe("PDF instructions", () => {
  it("aceita somente PDF como instrução interna", () => {
    expect(isInstructionPdf("manual.pdf", "application/pdf", "instruction")).toBe(true);
    expect(isInstructionPdf("foto.png", "image/png", "instruction")).toBe(false);
  });
  it("normaliza e limita o texto extraído", () => {
    expect(sanitizeInstructionText("  Regra\n\nimportante\u0000 ")).toBe("Regra importante");
    expect(sanitizeInstructionText("a".repeat(20), 10)).toHaveLength(10);
  });
});
