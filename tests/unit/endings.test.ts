import { describe, expect, it } from "vitest";

import {
  endingCount,
  endingNumber,
  endingOutcomes,
} from "../../src/core/endings";

describe("the six campaign endings (FASE 4)", () => {
  it("numbers exactly six distinct outcomes", () => {
    expect(endingCount).toBe(6);
    expect(new Set(endingOutcomes).size).toBe(6);
  });

  it("maps every outcome to its stable 1-based position", () => {
    endingOutcomes.forEach((outcomeId, index) => {
      expect(endingNumber(outcomeId)).toBe(index + 1);
    });
  });

  it("returns undefined for a missing or unknown outcome", () => {
    expect(endingNumber(undefined)).toBeUndefined();
    expect(endingNumber("core.outcome.not-a-real-ending")).toBeUndefined();
  });
});
