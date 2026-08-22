import { describe, expect, it } from "vitest";
import { parseBrazilianAppointmentDateTime } from "./appointmentDateTime";

describe("parseBrazilianAppointmentDateTime", () => {
  it("converte data e hora no padrão brasileiro para um instante local", () => {
    const value = parseBrazilianAppointmentDateTime("22/08/2026", "14:30");
    expect(value).not.toBeNull();
    const date = new Date(value!);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(7);
    expect(date.getDate()).toBe(22);
    expect(date.getHours()).toBe(14);
    expect(date.getMinutes()).toBe(30);
  });

  it("rejeita datas impossíveis, horários inválidos e formatos ambíguos", () => {
    expect(parseBrazilianAppointmentDateTime("31/02/2026", "09:00")).toBeNull();
    expect(parseBrazilianAppointmentDateTime("22/08/2026", "25:00")).toBeNull();
    expect(parseBrazilianAppointmentDateTime("2026-08-22", "09:00")).toBeNull();
  });
});
