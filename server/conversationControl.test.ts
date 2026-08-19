import { describe, expect, it } from "vitest";
import { appendHumanAvailabilityNotice, isHumanRequest, isOwnerTakeoverCommand } from "./conversationControl";

describe("comandos de controle de conversa", () => {
  it("reconhece #gente como pedido do interlocutor", () => {
    expect(isHumanRequest("Quero falar com #gente agora")).toBe(true);
    expect(isHumanRequest("Quero falar com gente agora")).toBe(false);
  });

  it("aceita #assumir somente como comando exato do proprietário", () => {
    expect(isOwnerTakeoverCommand("#assumir")).toBe(true);
    expect(isOwnerTakeoverCommand("cliente escreveu #assumir")).toBe(false);
  });

  it("lembra o interlocutor sobre a opção humana em toda resposta do robô", () => {
    expect(appendHumanAvailabilityNotice("Olá, como posso ajudar?", false)).toContain("#gente");
    expect(appendHumanAvailabilityNotice("Conversa transferida.", true)).not.toContain("#gente");
  });
});
