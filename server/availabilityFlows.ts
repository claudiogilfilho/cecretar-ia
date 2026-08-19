export type AvailabilitySlotInput = { weekday: number; startTime: string; endTime: string; slotMinutes: number; isActive: boolean };

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validateAvailabilitySlots(slots: AvailabilitySlotInput[]) {
  if (slots.length !== 7) throw new Error("Configure os sete dias da semana.");
  const weekdays = new Set<number>();
  for (const slot of slots) {
    if (!Number.isInteger(slot.weekday) || slot.weekday < 0 || slot.weekday > 6 || weekdays.has(slot.weekday)) throw new Error("Dia da semana inválido.");
    weekdays.add(slot.weekday);
    if (!timePattern.test(slot.startTime) || !timePattern.test(slot.endTime) || slot.startTime >= slot.endTime) throw new Error("Faixa de horário inválida.");
    if (![15, 30, 45, 60].includes(slot.slotMinutes)) throw new Error("Intervalo de agenda inválido.");
  }
  return slots;
}
