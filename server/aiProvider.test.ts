import { describe, expect, it } from "vitest";
import { buildFallbackReply } from "./aiProvider";

describe("AI provider fallback", () => {
  it("mantém as condições comerciais configuradas quando a IA não responde", () => {
    const reply = buildFallbackReply({
      services: "Energia compartilhada e qualificação comercial",
      pricing: "Economia estimada de até 30%, sujeita a elegibilidade.",
    } as any);
    expect(reply).toContain("Economia estimada de até 30%");
    expect(reply).toContain("#gente");
  });

  it("continua útil quando o agente não possui condição comercial preenchida", () => {
    const reply = buildFallbackReply({ services: "Agendamento de visitas", pricing: "" } as any);
    expect(reply).toContain("Agendamento de visitas");
    expect(reply).toContain("#gente");
  });
});
