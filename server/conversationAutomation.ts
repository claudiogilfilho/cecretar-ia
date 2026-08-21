export function getAutomationStateUpdate(paused: boolean) {
  return paused
    ? { automationPaused: true, status: "human" as const, systemMessage: "Automação pausada pelo proprietário. O atendimento seguirá com uma pessoa da equipe." }
    : { automationPaused: false, status: "bot" as const, systemMessage: "Automação retomada pelo proprietário. O robô voltará a responder novas mensagens." };
}
