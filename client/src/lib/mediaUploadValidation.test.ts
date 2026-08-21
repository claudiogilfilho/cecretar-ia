import { describe, expect, it } from "vitest";
import { MAX_MEDIA_FILE_BYTES, validateMediaUpload } from "./mediaUploadValidation";

describe("media upload validation", () => {
  it("aceita mídias de atendimento e PDFs de instrução dentro do limite", () => {
    expect(validateMediaUpload({ name: "foto.jpg", type: "image/jpeg", size: 1024 }, "outbound")).toBeNull();
    expect(validateMediaUpload({ name: "regras.pdf", type: "application/pdf", size: 1024 }, "instruction")).toBeNull();
  });
  it("rejeita instruções que não são PDF e arquivos acima de 16 MB", () => {
    expect(validateMediaUpload({ name: "foto.png", type: "image/png", size: 1024 }, "instruction")).toContain("PDF");
    expect(validateMediaUpload({ name: "video.mp4", type: "video/mp4", size: MAX_MEDIA_FILE_BYTES + 1 }, "outbound")).toContain("16 MB");
  });
});
