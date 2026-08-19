import { normalizeText } from "./agentLogic";

export const HUMAN_REQUEST_COMMAND = "#gente";
export const OWNER_TAKEOVER_COMMAND = "#assumir";

export function isHumanRequest(text: string, command = HUMAN_REQUEST_COMMAND) {
  return normalizeText(text).includes(normalizeText(command));
}

export function isOwnerTakeoverCommand(text: string, command = OWNER_TAKEOVER_COMMAND) {
  return normalizeText(text).trim() === normalizeText(command);
}

export function appendHumanAvailabilityNotice(reply: string, transferred: boolean) {
  if (transferred || reply.includes(HUMAN_REQUEST_COMMAND)) return reply;
  return `${reply}\n\nSe preferir falar com uma pessoa da equipe, digite ${HUMAN_REQUEST_COMMAND}.`;
}
