// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";

import {
  bestScoreKey,
  LocalBestScore,
} from "../../src/platform/storage/best-score";

describe("local personal best", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips a rounded score and clears it", () => {
    const best = new LocalBestScore(window.localStorage);
    expect(best.load()).toBeUndefined();

    best.save(1730.6);
    expect(window.localStorage.getItem(bestScoreKey)).toBe("1731");
    expect(best.load()).toBe(1731);

    best.clear();
    expect(best.load()).toBeUndefined();
  });

  it("ignores values that are not usable scores", () => {
    const best = new LocalBestScore(window.localStorage);

    for (const stored of ["", "abc", "-10", "NaN", "Infinity"]) {
      window.localStorage.setItem(bestScoreKey, stored);
      expect(best.load()).toBeUndefined();
    }

    window.localStorage.setItem(bestScoreKey, "0");
    expect(best.load()).toBe(0);
  });
});
