export const MAX_MEDIA_FILE_BYTES = 16 * 1024 * 1024;

export type MediaUploadUsage = "outbound" | "instruction";

export function validateMediaUpload(file: Pick<File, "name" | "type" | "size">, usage: MediaUploadUsage) {
  if (file.size > MAX_MEDIA_FILE_BYTES) return "Envie arquivos de até 16 MB.";
  if (usage === "instruction" && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return "Instruções internas devem ser carregadas em PDF.";
  return null;
}
