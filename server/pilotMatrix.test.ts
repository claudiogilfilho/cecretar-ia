import { describe, expect, it } from "vitest";
import { extractQualification, isQualified, resolvePilotRule } from "./agentLogic";

const config = {
  transferKeyword: "gente",
  pricing: "Salas a partir de R$ 1.500",
  businessHours: "de segunda a quinta, das 8h às 18h, e sexta até as 17h",
  companyInfo: "Duconde Empresarial Boutique",
};

describe("matriz do piloto Duconde", () => {
  it("responde preço sem inventar disponibilidade", () => {
    const response = resolvePilotRule("Quanto custa uma sala para quatro pessoas?", config);
    expect(response?.intent).toBe("precos_salas");
    expect(response?.reply).toContain("R$ 1.500");
    expect(response?.reply).toContain("confirmados na visita");
  });

  it("informa a localização completa e correta", () => {
    const response = resolvePilotRule("Onde fica o Duconde?", config);
    expect(response?.intent).toBe("localizacao");
    expect(response?.reply).toContain("Rua Conde de Irajá, 910");
    expect(response?.reply).toContain("50610-100");
  });

  it("associa mídia de salas sem afirmar que está enviando uma foto", () => {
    const response = resolvePilotRule("Quero ver fotos das salas", config);
    expect(response?.mediaIntent).toBe("fotos_salas");
    expect(response?.reply).not.toMatch(/separei|enviando/i);
  });

  it("qualifica nome, cidade e necessidade em uma única conversa", () => {
    const lead = extractQualification("Meu nome é Ana, moro em Recife e preciso de uma sala para três pessoas.");
    expect(lead).toMatchObject({ nome: "Ana", cidade: "Recife" });
    expect(lead.necessidade).toContain("sala para três pessoas");
    expect(isQualified(lead)).toBe(true);
  });

  it("transfere imediatamente quando o interessado pede uma pessoa", () => {
    const response = resolvePilotRule("Quero falar com gente", config);
    expect(response).toMatchObject({ intent: "transferencia_humana", transferToHuman: true });
  });

  it("orienta agendamento sem prometer reserva automática", () => {
    const response = resolvePilotRule("Quero agendar uma visita na sexta-feira à tarde", config);
    expect(response?.intent).toBe("agendamento_visita");
    expect(response?.reply).toMatch(/qual dia e faixa de horário/i);
    expect(response?.reply).not.toMatch(/reservad|confirmad/i);
  });
});
