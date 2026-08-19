import { describe, expect, it } from "vitest";
import { buildInboxHistory, buildInboxList } from "./inboxFlows";

describe("fluxos da caixa de entrada", () => {
  it("lista primeiro a conversa mais recente e sinaliza atendimento humano", () => {
    const list = buildInboxList([
      { id: 1, status: "bot" as const, updatedAt: new Date("2026-08-19T10:00:00Z") },
      { id: 2, status: "human" as const, updatedAt: new Date("2026-08-19T11:00:00Z") },
    ]);
    expect(list.map(item => item.id)).toEqual([2, 1]);
    expect(list[0]?.needsHumanAttention).toBe(true);
    expect(list[1]?.needsHumanAttention).toBe(false);
  });

  it("reconstrói o histórico de mensagens em ordem cronológica", () => {
    const history = buildInboxHistory([
      { id: 2, createdAt: new Date("2026-08-19T11:01:00Z") },
      { id: 1, createdAt: new Date("2026-08-19T11:00:00Z") },
    ]);
    expect(history.map(item => item.id)).toEqual([1, 2]);
  });
});
