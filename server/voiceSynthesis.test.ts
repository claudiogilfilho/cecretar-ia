import { describe, expect, it } from "vitest";
import { shouldReplyWithAudio } from "./voiceSynthesis";

describe("voice reply policy", () => {
  it("mirrors audio only in automatic mode", () => {
    expect(shouldReplyWithAudio("automatic", "audio")).toBe(true);
    expect(shouldReplyWithAudio("automatic", "text")).toBe(false);
  });

  it("respects explicit reply modes", () => {
    expect(shouldReplyWithAudio("audio_only", "text")).toBe(true);
    expect(shouldReplyWithAudio("text_only", "audio")).toBe(false);
  });
});
