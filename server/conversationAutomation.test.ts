import { describe, expect, it } from "vitest";
import { getAutomationStateUpdate } from "./conversationAutomation";

describe("conversation automation", () => {
  it("pausa o robô e direciona a conversa para humano", () => {
    expect(getAutomationStateUpdate(true)).toMatchObject({ automationPaused: true, status: "human" });
  });
  it("retoma o robô de forma explícita", () => {
    expect(getAutomationStateUpdate(false)).toMatchObject({ automationPaused: false, status: "bot" });
  });
});
