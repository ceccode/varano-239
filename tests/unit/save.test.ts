// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";

import { createInitialState, type GameState } from "../../src/core/game-state";
import { decodeSave, encodeSave, saveVersion } from "../../src/core/save";
import { LocalSave, localSaveKey } from "../../src/platform/storage/local-save";

function playableState(): GameState {
  return {
    ...createInitialState(),
    phase: "playing",
    setup: {
      role: "varano",
      approach: "rescue",
      sensitivity: "gentle",
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
