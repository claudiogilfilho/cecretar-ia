import { describe, expect, it } from "vitest";
import { getBehaviorGuidance } from "./behaviorModes";

describe("behavior modes", () => {
  it("expõe os três modos com cordialidade preservada", () => {
    expect(getBehaviorGuidance("objective").label).toBe("Objetivo");
    expect(getBehaviorGuidance("balanced").label).toBe("Equilibrado");
    expect(getBehaviorGuidance("consultative").guidance).toContain("gentil");
  });
  it("usa o modo equilibrado quando o valor é inválido", () => {
    expect(getBehaviorGuidance("qualquer").label).toBe("Equilibrado");
  });
});
