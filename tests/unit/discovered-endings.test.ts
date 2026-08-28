// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";

import {
  LocalDiscoveredEndings,
  discoveredEndingsKey,
} from "../../src/platform/storage/discovered-endings";

describe("discovered endings (FASE 4)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("records each ending once and round-trips through storage", () => {
    const discovered = new LocalDiscoveredEndings(window.localStorage);
    discovered.record("core.outcome.varano-chooses-rescue");
    discovered.record("core.outcome.varano-chooses-rescue");
    discovered.record("core.outcome.count-of-six-hills");

    const reloaded = new LocalDiscoveredEndings(window.localStorage).load();
    expect(reloaded).toHaveLength(2);
    expect(reloaded).toContain("core.outcome.count-of-six-hills");
  });

  it("drops unknown ids and tolerates malformed JSON", () => {
    window.localStorage.setItem(
      discoveredEndingsKey,
      JSON.stringify(["core.outcome.varano-count", "not-an-outcome"]),
    );
    expect(new LocalDiscoveredEndings(window.localStorage).load()).toEqual([
      "core.outcome.varano-count",
    ]);

    window.localStorage.setItem(discoveredEndingsKey, "{");
    expect(new LocalDiscoveredEndings(window.localStorage).load()).toEqual([]);
  });

  it("ignores records for outcomes outside the campaign", () => {
    const discovered = new LocalDiscoveredEndings(window.localStorage);
    discovered.record("not-an-outcome");
    expect(discovered.load()).toEqual([]);
  });

  it("clears on request, like the other local ports", () => {
    const discovered = new LocalDiscoveredEndings(window.localStorage);
    discovered.record("core.outcome.open-mystery");
    discovered.clear();
    expect(discovered.load()).toEqual([]);
  });
});
