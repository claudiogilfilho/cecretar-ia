import { describe, expect, it } from "vitest";
import { calculatePilotMetrics } from "./metrics";

describe("calculatePilotMetrics", () => {
  it("contabiliza conversas, qualificação, visitas ativas e transferências humanas", () => {
    const metrics = calculatePilotMetrics(
      [
        { status: "bot", leadStatus: "new" },
        { status: "human", leadStatus: "qualified" },
        { status: "bot", leadStatus: "scheduled" },
      ],
      [
        { status: "scheduled" },
        { status: "rescheduled" },
        { status: "canceled" },
      ],
    );

    expect(metrics).toEqual({
      conversations: 3,
      qualified: 2,
      appointments: 2,
      humanHandoffs: 1,
    });
  });
});
