// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";

import {
  LocalLevelRecords,
  levelRecordsKey,
  mergeRecords,
  type LevelRecord,
} from "../../src/platform/storage/level-records";

const perfect: LevelRecord = {
  score: 1800,
  clues: 3,
  totalClues: 3,
  bonusCollected: true,
  cameoSeen: true,
  unscathed: true,
};

const sloppy: LevelRecord = {
  score: 900,
  clues: 1,
  totalClues: 3,
  bonusCollected: false,
  cameoSeen: false,
  unscathed: false,
};

describe("the level archive (ADR-057)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("keeps the best of every field, never the latest run", () => {
    // The rule that makes the Collection worth filling: a run that finally
    // spots the cameo must not erase the star taken three runs ago.
    const half: LevelRecord = { ...sloppy, cameoSeen: true, score: 1200 };
    const merged = mergeRecords(
      { ...sloppy, bonusCollected: true, score: 1000 },
      half,
    );
    expect(merged).toEqual({
      score: 1200,
      clues: 1,
      totalClues: 3,
      bonusCollected: true,
      cameoSeen: true,
      unscathed: false,
    });
  });

  it("round-trips through storage and merges across sessions", () => {
    const archive = new LocalLevelRecords(window.localStorage);
    archive.record("core.level.campi-di-montichiari", sloppy);
    archive.record("core.level.campi-di-montichiari", {
      ...sloppy,
      score: 1500,
      cameoSeen: true,
    });
    archive.record("core.level.chat-di-paese", perfect);

    // A fresh instance reads what the previous one wrote.
    const reloaded = new LocalLevelRecords(window.localStorage).load();
    expect(reloaded["core.level.campi-di-montichiari"]?.score).toBe(1500);
    expect(reloaded["core.level.campi-di-montichiari"]?.cameoSeen).toBe(true);
    expect(reloaded["core.level.chat-di-paese"]).toEqual(perfect);
  });

  it("survives a corrupt entry without losing the rest", () => {
    window.localStorage.setItem(
      levelRecordsKey,
      JSON.stringify({
        "core.level.campi-di-montichiari": perfect,
        "core.level.broken": { score: "molto" },
      }),
    );
    const records = new LocalLevelRecords(window.localStorage).load();
    expect(records["core.level.campi-di-montichiari"]).toEqual(perfect);
    expect(records["core.level.broken"]).toBeUndefined();
  });

  it("treats malformed JSON as an empty archive", () => {
    window.localStorage.setItem(levelRecordsKey, "{");
    expect(new LocalLevelRecords(window.localStorage).load()).toEqual({});
  });

  it("clears on request, like the personal best", () => {
    const archive = new LocalLevelRecords(window.localStorage);
    archive.record("core.level.campi-di-montichiari", perfect);
    archive.clear();
    expect(archive.load()).toEqual({});
  });
});
