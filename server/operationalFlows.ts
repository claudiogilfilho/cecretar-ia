export function prepareHumanTakeover() {
  return {
    conversationUpdate: { status: "human" as const },
    systemMessage: "Atendimento transferido para uma pessoa da equipe.",
  };
}

export function prepareManualAppointment(input: {
  agentId: number;
  visitorName: string;
  visitorPhone?: string;
  scheduledFor: number;
  notes?: string;
}) {
  return {
    agentId: input.agentId,
    visitorName: input.visitorName,
    visitorPhone: input.visitorPhone ?? null,
    scheduledFor: new Date(input.scheduledFor),
    notes: input.notes ?? null,
    calendarProvider: "manual" as const,
    status: "scheduled" as const,
  };
}

export function prepareReschedule(scheduledFor: number) {
  return { scheduledFor: new Date(scheduledFor), status: "rescheduled" as const };
}

export function prepareCancellation() {
  return { status: "canceled" as const };
}
