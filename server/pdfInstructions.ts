import { PDFParse } from "pdf-parse";

export function isInstructionPdf(filename: string, contentType: string, usage: string) {
  return usage === "instruction" && (contentType === "application/pdf" || filename.toLowerCase().endsWith(".pdf"));
}

export function sanitizeInstructionText(value: string, maxChars = 16_000) {
  return value.replace(/\u0000/g, "").replace(/\s+/g, " ").trim().slice(0, maxChars);
}

export async function extractPdfInstructionText(buffer: Buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return sanitizeInstructionText(result.text);
  } finally {
    await parser.destroy();
  }
}
