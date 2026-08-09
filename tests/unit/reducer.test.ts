import { describe, expect, it } from "vitest";

import type { GameAction } from "../../src/core/actions";
import { createInitialState, type GameState } from "../../src/core/game-state";
import type { StoryGraph } from "../../src/core/model";
import { reduce } from "../../src/core/reducer";
import { coreStoryGraph } from "../../src/content/packs/core/pack";

function setupState(): GameState {
  return {
    ...createInitialState(),
    setup: {
      role: "hunter",
      storyScope: "core",
    },
  };
}

const effectsStory = {
  entryNodeId: "core.node.effects-choice",
  nodes: [
    {
      id: "core.node.effects-choice",
      chapterId: "core.chapter.effects",
      narrativeLayer: "legend",
      type: "choice",
      promptKey: "core.message.choice.prompt",
      options: [
        {
          id: "core.option.effects",
          textKey: "core.message.choice.document",
          effects: [
            { type: "adjust-score", score: "evidence", delta: 1 },
            { type: "adjust-score", score: "care", delta: 1 },
            { type: "adjust-score", score: "publicTrust", delta: 1 },
            { type: "set-condition", value: "healthy" },
            { type: "set-flag", flagId: "core.flag.test", value: true },
            { type: "add-item", itemId: "core.item.test" },
            { type: "add-seal", sealId: "core.seal.test" },
            {
              type: "reveal-dossier",
              dossierCardId: "core.dossier.test",
            },
            { type: "add-clue", clueId: "core.clue.test" },
            { type: "complete-pack", packId: "core.pack.test" },
            {
              type: "select-theory",
              mysteryId: "core.mystery.test",
              theoryId: "core.theory.test",
            },
            { type: "set-varano-fate", fate: "rescued" },
            {
              type: "record-choice",
              choiceId: "core.choice.test",
              optionId: "core.option.effects",
            },
          ],
          targetNodeId: "core.node.effects-ending",
        },
        {
          id: "core.option.lower",
          textKey: "core.message.choice.protect",
          effects: [{ type: "adjust-score", score: "evidence", delta: -1 }],
          targetNodeId: "core.node.effects-ending",
        },
      ],
    },
    {
      id: "core.node.effects-ending",
      chapterId: "core.chapter.effects",
      narrativeLayer: "legend",
      type: "ending",
      outcomeId: "core.outcome.open-mystery",
      titleKey: "core.message.ending.title",
      bodyKey: "core.message.ending.body",
    },
  ],
} as const satisfies StoryGraph;

describe("game reducer", () => {
  it("starts a run from the title with safe defaults or adjusted options", () => {
    const initial = createInitialState();
    expect(initial.setup).toEqual({
      role: "varano",
      storyScope: "core",
    });

    const quickStart = reduce(initial, { type: "RUN_STARTED" }, coreStoryGraph);
    expect(quickStart.state.phase).toBe("playing");
    expect(quickStart.state.run?.currentNodeId).toBe(
      "core.node.prologue.campi",
    );

    let state = initial;
    for (const action of [
      { type: "ROLE_SELECTED", value: "mayor" },
      { type: "STORY_SCOPE_SELECTED", value: "all-registered" },
      {
        type: "SETTINGS_UPDATED",
        settings: { playMode: "calm", musicEnabled: false },
      },
    ] as const satisfies readonly GameAction[]) {
      state = reduce(state, action, coreStoryGraph).state;
    }
    expect(state.settings.playMode).toBe("calm");
    expect(state.settings.musicEnabled).toBe(false);
    expect(state.settings.effectsEnabled).toBe(true);

    const started = reduce(state, { type: "RUN_STARTED" }, coreStoryGraph);
    expect(started.state.phase).toBe("playing");
    expect(started.state.setup).toEqual({
      role: "mayor",
      storyScope: "all-registered",
    });
    expect(started.effects).toEqual([
      { type: "save-requested" },
      { type: "analytics", event: "game_start" },
      { type: "focus", target: "screen-heading" },
    ]);
  });

  it("ignores invalid phase events and unknown graph references", () => {
    const incomplete: GameState = { ...createInitialState(), setup: {} };
    expect(
      reduce(incomplete, { type: "RUN_STARTED" }, coreStoryGraph).state,
    ).toBe(incomplete);

    const started = reduce(
      setupState(),
      { type: "RUN_STARTED" },
      coreStoryGraph,
    ).state;
    for (const action of [
      { type: "DIALOGUE_ADVANCED" },
      { type: "SURPRISE_DISMISSED" },
      { type: "DOSSIER_CLOSED" },
      { type: "OPTION_CHOSEN", optionId: "core.option.missing" },
      { type: "HOTSPOT_ACTIVATED", hotspotId: "core.hotspot.missing" },
      { type: "RUN_RESUMED", savedState: started },
    ] as const satisfies readonly GameAction[]) {
      expect(reduce(started, action, coreStoryGraph).state).toBe(started);
    }
  });

  it("applies every declarative story effect and clamps scores", () => {
    const started = reduce(
      setupState(),
      { type: "RUN_STARTED" },
      effectsStory,
    ).state;
    const finished = reduce(
      started,
      { type: "OPTION_CHOSEN", optionId: "core.option.effects" },
      effectsStory,
    ).state;
    expect(finished.phase).toBe("ending");
    expect(finished.run).toMatchObject({
      evidence: 1,
      care: 1,
      publicTrust: 1,
      condition: "healthy",
      flags: { "core.flag.test": true },
      inventory: ["core.item.test"],
      seals: ["core.seal.test"],
      dossierCardIdsSeen: ["core.dossier.test"],
      discoveredClueIds: ["core.clue.test"],
      completedPackIds: ["core.pack.test"],
      varanoFate: "rescued",
      selectedTheoryByMystery: {
        "core.mystery.test": "core.theory.test",
      },
      choices: { "core.choice.test": "core.option.effects" },
      outcomeId: "core.outcome.open-mystery",
    });

    const lowered = reduce(
      started,
      { type: "OPTION_CHOSEN", optionId: "core.option.lower" },
      effectsStory,
    ).state;
    expect(lowered.run?.evidence).toBe(0);
  });

  it("accepts completed and skipped level outcomes and clears local state", () => {
    let state: GameState = setupState();
    state = reduce(state, { type: "RUN_STARTED" }, coreStoryGraph).state;
    const skipped = reduce(state, { type: "MINIGAME_SKIPPED" }, coreStoryGraph);
    const completed = reduce(
      state,
      { type: "MINIGAME_COMPLETED" },
      coreStoryGraph,
    );
    expect(skipped.state.run?.currentNodeId).toBe(
      "core.node.prologue.dialogue",
    );
    expect(completed.state.run?.currentNodeId).toBe(
      "core.node.prologue.dialogue",
    );
    state = reduce(
      skipped.state,
      { type: "DIALOGUE_ADVANCED" },
      coreStoryGraph,
    ).state;
    expect(state.run?.currentNodeId).toBe("core.node.prologue.choice");

    const cleared = reduce(
      state,
      { type: "LOCAL_DATA_CLEARED" },
      coreStoryGraph,
    );
    expect(cleared.state.phase).toBe("title");
    // Clearing local data resets every preference to the defaults (ADR-046):
    // no system property survives, because none is stored any more.
    expect(cleared.state.settings).toEqual(createInitialState().settings);
    expect(cleared.effects).toContainEqual({ type: "clear-save" });
  });
});
