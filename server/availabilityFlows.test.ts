import { describe, expect, it } from "vitest";
import { validateAvailabilitySlots } from "./availabilityFlows";

const slots = Array.from({ length: 7 }, (_, weekday) => ({ weekday, startTime: "08:00", endTime: "18:00", slotMinutes: 30, isActive: weekday > 0 && weekday < 6 }));

describe("disponibilidade por especialista", () => {
  it("aceita a semana completa com faixas e intervalos válidos", () => expect(validateAvailabilitySlots(slots)).toHaveLength(7));
  it("rejeita horário final anterior ao inicial", () => expect(() => validateAvailabilitySlots(slots.map((slot, index) => index === 1 ? { ...slot, endTime: "07:00" } : slot))).toThrow("Faixa de horário inválida"));
});
