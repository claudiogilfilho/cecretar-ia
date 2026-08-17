import { describe, expect, it } from "vitest";
import { extractQualification, isQualified, resolvePilotRule } from "./agentLogic";

const config = {
  transferKeyword: "gente",
  pricing: "Salas a partir de R$ 1.500",
  businessHours: "de segunda a quinta, das 8h às 18h, e sexta até as 17h",
  companyInfo: "Duconde Empresarial Boutique",
};

describe("agentLogic", () => {
  it("transfere o atendimento ao reconhecer a palavra-chave configurada", () => {
    const result = resolvePilotRule("Quero falar com gente agora", config);
    expect(result?.transferToHuman).toBe(true);
    expect(result?.intent).toBe("transferencia_humana");
  });

  it("identifica uma pergunta de preço e sugere a mídia associada", () => {
    const result = resolvePilotRule("Qual o valor da sala?", config);
    expect(result?.intent).toBe("precos_salas");
    expect(result?.mediaIntent).toBe("precos_salas");
  });

  it("extrai dados de qualificação e reconhece um lead qualificado", () => {
    const lead = extractQualification("Meu nome é Ana, moro em Recife e preciso de uma sala comercial");
    expect(lead.nome).toBe("Ana");
    expect(lead.cidade).toBe("Recife");
    expect(isQualified(lead)).toBe(true);
  });
});

