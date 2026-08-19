import { describe, expect, it } from "vitest";
import { AGENT_TEMPLATES, getAgentTemplate } from "./agentTemplates";

describe("modelos de especialistas", () => {
  it("oferece os cinco especialistas previstos para a CECRETAR.IA", () => {
    expect(AGENT_TEMPLATES.map(template => template.key)).toEqual([
      "legal_office",
      "solar_energy",
      "psychology",
      "precatarios",
      "real_estate_rental",
    ]);
  });

  it("inclui salvaguardas para os modelos jurídico, psicológico e de precatórios", () => {
    expect(getAgentTemplate("legal_office")?.persona).toMatch(/não emite parecer/i);
    expect(getAgentTemplate("psychology")?.persona).toMatch(/não faz diagnóstico/i);
    expect(getAgentTemplate("precatarios")?.persona).toMatch(/não oferece parecer jurídico ou financeiro/i);
  });
});
