import { describe, expect, it } from "vitest";
import { prepareCancellation, prepareHumanTakeover, prepareManualAppointment, prepareReschedule } from "./operationalFlows";

describe("fluxos operacionais", () => {
  it("prepara a assunção humana com status e registro de sistema", () => {
    expect(prepareHumanTakeover()).toEqual({
      conversationUpdate: { status: "human" },
      systemMessage: "Atendimento transferido para uma pessoa da equipe.",
    });
  });

  it("cria uma visita manual com status agendado e datas coerentes", () => {
    const scheduledFor = Date.UTC(2026, 7, 21, 14, 0, 0);
    const appointment = prepareManualAppointment({ agentId: 1, visitorName: "Ana Silva", visitorPhone: "5581999999999", scheduledFor, notes: "Interesse em sala para três pessoas" });
    expect(appointment).toMatchObject({ agentId: 1, visitorName: "Ana Silva", calendarProvider: "manual", status: "scheduled" });
    expect(appointment.scheduledFor.getTime()).toBe(scheduledFor);
  });

  it("remarca uma visita sem perder o estado explícito de remarcação", () => {
    const scheduledFor = Date.UTC(2026, 7, 22, 15, 30, 0);
    const update = prepareReschedule(scheduledFor);
    expect(update.status).toBe("rescheduled");
    expect(update.scheduledFor.getTime()).toBe(scheduledFor);
  });

  it("cancela uma visita sem excluir o histórico do agendamento", () => {
    expect(prepareCancellation()).toEqual({ status: "canceled" });
  });
});
