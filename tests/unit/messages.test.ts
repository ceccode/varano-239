import { describe, expect, it } from "vitest";

import {
  formatMessage,
  italianMessages,
  resolveItalianMessage,
} from "../../src/content/locales/it";
import { englishMessages } from "../../src/content/locales/en";
import {
  registerEnglishMessages,
  resolveMessage,
} from "../../src/content/locales";

registerEnglishMessages(englishMessages);

describe("message formatting", () => {
  it("fills every placeholder with its value", () => {
    expect(formatMessage("{a} punti in {b}s", { a: 1200, b: 42 })).toBe(
      "1200 punti in 42s",
    );
  });

  it("leaves an unknown placeholder visible instead of dropping it", () => {
    // A catalogue typo must be noticed, not silently swallowed.
    expect(formatMessage("{score} su {tot}", { score: 5 })).toBe("5 su {tot}");
  });

  it("resolves without values and interpolates with them", () => {
    const template = resolveItalianMessage("core.message.ui.score.share-text");
    expect(template).toContain("{score}");

    const filled = resolveItalianMessage("core.message.ui.score.share-text", {
      score: 900,
      clues: 2,
      totalClues: 3,
      seconds: 31,
      url: "https://example.test/",
    });
    expect(filled).toContain("900");
    expect(filled).toContain("2/3");
    expect(filled).toContain("31");
    expect(filled).toContain("https://example.test/");
    expect(filled).not.toMatch(/[{}]/);
    // The score is the run total, so no single level may be named.
    expect(filled).not.toMatch(/Livello \d/);
  });

  it("throws on a missing key", () => {
    expect(() => resolveItalianMessage("core.message.nope")).toThrow(
      /Missing Italian message/,
    );
  });

  it("keeps the English catalogue complete and placeholder-compatible", () => {
    expect(Object.keys(englishMessages)).toEqual(Object.keys(italianMessages));
    const placeholders = (message: string): string[] =>
      [...message.matchAll(/\{\w+\}/g)].map(([value]) => value).sort();

    for (const key of Object.keys(
      italianMessages,
    ) as (keyof typeof italianMessages)[]) {
      expect(englishMessages[key], key).toBeTypeOf("string");
      expect(placeholders(englishMessages[key]), key).toEqual(
        placeholders(italianMessages[key]),
      );
    }
  });

  it("resolves English without falling back to Italian", () => {
    expect(resolveMessage("en", "core.message.ui.role-select.heading")).toBe(
      "Who are you tonight?",
    );
    expect(
      resolveMessage("en", "core.message.level.briefing.position", {
        index: 3,
        total: 10,
      }),
    ).toBe("Level 3 of 10");
  });
});
