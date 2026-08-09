// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";

import { createInitialState, type GameState } from "../../src/core/game-state";
import { decodeSave, encodeSave, saveVersion } from "../../src/core/save";
import { LocalSave, localSaveKey } from "../../src/platform/storage/local-save";

describe("renamed node migration", () => {
  it("moves a run saved on the old ending node to its new home", () => {
    // The ending moved into its own finale chapter (ADR-034). Renaming an ID
    // needs a pure migration, or the run lands on «non disponibile».
    const old = playableState();
    const saved = {
      version: saveVersion,
      state: {
        ...old,
        phase: "ending" as const,
        run: {
          ...old.run,
          currentNodeId: "core.node.superstar.ending",
          checkpointNodeId: "core.node.superstar.ending",
          coreCheckpointNodeId: "core.node.superstar.ending",
          visitedNodeIds: [
            "core.node.prologue.campi",
            "core.node.superstar.ending",
          ],
        },
      },
    };

    const decoded = decodeSave(saved);
    expect(decoded?.run?.currentNodeId).toBe("core.node.finale.open-mystery");
    expect(decoded?.run?.checkpointNodeId).toBe(
      "core.node.finale.open-mystery",
    );
    expect(decoded?.run?.coreCheckpointNodeId).toBe(
      "core.node.finale.open-mystery",
    );
    expect(decoded?.run?.visitedNodeIds).toEqual([
      "core.node.prologue.campi",
      "core.node.finale.open-mystery",
    ]);
  });

  it("leaves every other node ID untouched", () => {
    const decoded = decodeSave(encodeSave(playableState()));
    expect(decoded?.run?.currentNodeId).toBe("core.node.prologue.field");
  });
});

function playableState(): GameState {
  return {
    ...createInitialState(),
    phase: "playing",
    setup: {
      role: "varano",
      storyScope: "core",
    },
    run: {
      currentNodeId: "core.node.prologue.field",
      checkpointNodeId: "core.node.prologue.field",
      coreCheckpointNodeId: "core.node.prologue.field",
      evidence: 0,
      care: 0,
      publicTrust: 0,
      condition: "unknown",
      seals: [],
      inventory: [],
      flags: {},
      dossierCardIdsSeen: [],
      discoveredClueIds: [],
      completedPackIds: [],
      varanoFate: "unresolved",
      selectedTheoryByMystery: {},
      visitedNodeIds: ["core.node.prologue.field"],
      choices: {},
    },
  };
}

describe("versioned local save", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips a valid M1 state and clears it", () => {
    const state = playableState();
    const save = new LocalSave(window.localStorage);
    save.save(state);

    expect(save.load()).toEqual(state);
    expect(
      JSON.parse(window.localStorage.getItem(localSaveKey) ?? "{}"),
    ).toEqual(encodeSave(state));
    save.clear();
    expect(save.load()).toBeUndefined();
  });

  it("accepts a save still carrying the removed setup axes (ADR-048)", () => {
    // Saves written before the two-axis setup carry `approach` and
    // `sensitivity`. The validator checks the fields it lists: the stray
    // keys ride along and the run resumes untouched.
    const state = playableState();
    const legacy = {
      version: saveVersion,
      state: {
        ...state,
        setup: {
          ...state.setup,
          approach: "rescue",
          sensitivity: "complete",
        },
      },
    };
    const decoded = decodeSave(legacy);
    expect(decoded).toBeDefined();
    expect(decoded?.run?.currentNodeId).toBe(state.run?.currentNodeId);
  });

  it("accepts a save still carrying the removed reducedMotion key (ADR-046)", () => {
    // Every save written before the arcade-by-default decision has the key.
    // The validator checks the fields it lists, so the stray key must ride
    // along harmlessly: a Samsung player stuck on the assisted path gets the
    // arcade back on first load, without losing the run.
    const state = playableState();
    const legacy = {
      version: saveVersion,
      state: {
        ...state,
        settings: { ...state.settings, reducedMotion: true },
      },
    };
    const decoded = decodeSave(legacy);
    expect(decoded).toBeDefined();
    expect(decoded?.run?.currentNodeId).toBe(state.run?.currentNodeId);
  });

  it("rejects malformed JSON, unknown versions and incomplete run states", () => {
    const save = new LocalSave(window.localStorage);
    window.localStorage.setItem(localSaveKey, "{");
    expect(save.load()).toBeUndefined();
    expect(
      decodeSave({ version: saveVersion + 1, state: playableState() }),
    ).toBe(undefined);
    expect(
      decodeSave({
        version: saveVersion,
        state: { ...createInitialState(), phase: "playing" },
      }),
    ).toBeUndefined();
    expect(decodeSave(null)).toBeUndefined();
  });

  it("rejects invalid setup, settings and run members", () => {
    const state = playableState();
    expect(
      decodeSave({
        version: saveVersion,
        state: { ...state, setup: { ...state.setup, role: "real-person" } },
      }),
    ).toBeUndefined();
    expect(
      decodeSave({
        version: saveVersion,
        state: { ...state, settings: { ...state.settings, playMode: "fast" } },
      }),
    ).toBeUndefined();
    expect(
      decodeSave({
        version: saveVersion,
        state: {
          ...state,
          run: { ...state.run, dossierCardIdsSeen: [3] },
        },
      }),
    ).toBeUndefined();
  });
});
