import type { GameAction, GameEffect, TransitionResult } from "./actions";
import { matchesConditions } from "./conditions";
import {
  completeSetup,
  createInitialState,
  type GameState,
  type RunState,
} from "./game-state";
import type {
  ChoiceOption,
  ScoreName,
  StoryEffect,
  StoryGraph,
  StoryNode,
} from "./model";

const noEffects: readonly GameEffect[] = [];

function unchanged(state: GameState): TransitionResult {
  return { state, effects: noEffects };
}

function findNode(story: StoryGraph, nodeId: string): StoryNode | undefined {
  return story.nodes.find((node) => node.id === nodeId);
}

function addUnique<T>(items: readonly T[], item: T): readonly T[] {
  return items.includes(item) ? items : [...items, item];
}

function adjustScore(run: RunState, score: ScoreName, delta: -1 | 1): RunState {
  const value = Math.max(0, Math.min(6, run[score] + delta));

  switch (score) {
    case "evidence":
      return { ...run, evidence: value };
    case "care":
      return { ...run, care: value };
    case "publicTrust":
      return { ...run, publicTrust: value };
  }
}

function applyStoryEffect(run: RunState, effect: StoryEffect): RunState {
  switch (effect.type) {
    case "adjust-score":
      return adjustScore(run, effect.score, effect.delta);
    case "set-condition":
      return { ...run, condition: effect.value };
    case "set-flag":
      return { ...run, flags: { ...run.flags, [effect.flagId]: effect.value } };
    case "add-item":
      return { ...run, inventory: addUnique(run.inventory, effect.itemId) };
    case "add-seal":
      return { ...run, seals: addUnique(run.seals, effect.sealId) };
    case "reveal-dossier":
      return {
        ...run,
        dossierCardIdsSeen: addUnique(
          run.dossierCardIdsSeen,
          effect.dossierCardId,
        ),
      };
    case "add-clue":
      return {
        ...run,
        discoveredClueIds: addUnique(run.discoveredClueIds, effect.clueId),
      };
    case "complete-pack":
      return {
        ...run,
        completedPackIds: addUnique(run.completedPackIds, effect.packId),
      };
    case "select-theory":
      return {
        ...run,
        selectedTheoryByMystery: {
          ...run.selectedTheoryByMystery,
          [effect.mysteryId]: effect.theoryId,
        },
      };
    case "set-varano-fate":
      return { ...run, varanoFate: effect.fate };
    case "record-choice":
      return {
        ...run,
        choices: { ...run.choices, [effect.choiceId]: effect.optionId },
      };
  }
}

function applyStoryEffects(
  run: RunState,
  effects: readonly StoryEffect[] | undefined,
): RunState {
  return effects?.reduce(applyStoryEffect, run) ?? run;
}

function createRun(entryNodeId: string): RunState {
  return {
    currentNodeId: entryNodeId,
    checkpointNodeId: entryNodeId,
    coreCheckpointNodeId: entryNodeId,
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
    visitedNodeIds: [entryNodeId],
    choices: {},
  };
}

function enterNode(
  state: GameState,
  nodeId: string,
  story: StoryGraph,
  runOverride?: RunState,
): TransitionResult {
  const currentRun = runOverride ?? state.run;
  const node = findNode(story, nodeId);

  if (currentRun === undefined || node === undefined) {
    return unchanged(state);
  }

  let run: RunState = {
    ...currentRun,
    currentNodeId: node.id,
    visitedNodeIds: addUnique(currentRun.visitedNodeIds, node.id),
  };

  if (node.type === "dossier-card") {
    run = {
      ...run,
      dossierCardIdsSeen: addUnique(run.dossierCardIdsSeen, node.dossierCardId),
    };
  }

  if (
    node.type === "surprise" &&
    (state.settings.playMode === "calm" || state.settings.reducedMotion)
  ) {
    return enterNode({ ...state, run }, node.next, story, run);
  }

  const nextState: GameState =
    node.type === "ending"
      ? {
          ...state,
          phase: "ending",
          run: { ...run, outcomeId: node.outcomeId },
        }
      : { ...state, phase: "playing", run };

  return {
    state: nextState,
    effects: [
      { type: "save-requested" },
      {
        type: "focus",
        target:
          node.type === "surprise" ? "surprise-dismiss" : "screen-heading",
      },
    ],
  };
}

function currentNode(
  state: GameState,
  story: StoryGraph,
): StoryNode | undefined {
  return state.run === undefined
    ? undefined
    : findNode(story, state.run.currentNodeId);
}

function chooseOption(
  state: GameState,
  option: ChoiceOption,
  story: StoryGraph,
): TransitionResult {
  const setup = completeSetup(state.setup);

  if (state.run === undefined || setup === undefined) {
    return unchanged(state);
  }

  if (!matchesConditions(option.when, { setup, run: state.run })) {
    return unchanged(state);
  }

  const run = applyStoryEffects(state.run, option.effects);
  return enterNode({ ...state, run }, option.targetNodeId, story, run);
}

export function reduce(
  state: GameState,
  action: GameAction,
  story: StoryGraph,
): TransitionResult {
  switch (action.type) {
    case "SENSITIVITY_SELECTED":
      return {
        state: {
          ...state,
          setup: { ...state.setup, sensitivity: action.value },
        },
        effects: noEffects,
      };
    case "ROLE_SELECTED":
      return {
        state: { ...state, setup: { ...state.setup, role: action.value } },
        effects: noEffects,
      };
    case "APPROACH_SELECTED":
      return {
        state: {
          ...state,
          setup: { ...state.setup, approach: action.value },
        },
        effects: noEffects,
      };
    case "STORY_SCOPE_SELECTED":
      return {
        state: {
          ...state,
          setup: { ...state.setup, storyScope: action.value },
        },
        effects: noEffects,
      };
    case "SETTINGS_UPDATED":
      return {
        state: {
          ...state,
          settings: { ...state.settings, ...action.settings },
        },
        effects:
          state.run === undefined ? noEffects : [{ type: "save-requested" }],
      };
    case "RUN_STARTED": {
      if (state.phase !== "title" || completeSetup(state.setup) === undefined) {
        return unchanged(state);
      }

      const run = createRun(story.entryNodeId);
      return {
        state: { ...state, phase: "playing", run },
        effects: [
          { type: "save-requested" },
          { type: "analytics", event: "game_start" },
          { type: "focus", target: "screen-heading" },
        ],
      };
    }
    case "HOTSPOT_ACTIVATED": {
      const node = currentNode(state, story);
      const setup = completeSetup(state.setup);

      if (
        node?.type !== "scene" ||
        state.run === undefined ||
        setup === undefined
      ) {
        return unchanged(state);
      }

      const hotspot = node.hotspots.find(
        (candidate) => candidate.id === action.hotspotId,
      );

      if (
        hotspot === undefined ||
        !matchesConditions(hotspot.when, { setup, run: state.run })
      ) {
        return unchanged(state);
      }

      return enterNode(state, hotspot.targetNodeId, story);
    }
    case "DIALOGUE_ADVANCED": {
      const node = currentNode(state, story);
      return node?.type === "dialogue"
        ? enterNode(state, node.next, story)
        : unchanged(state);
    }
    case "SURPRISE_DISMISSED": {
      const node = currentNode(state, story);
      return node?.type === "surprise"
        ? enterNode(state, node.next, story)
        : unchanged(state);
    }
    case "MINIGAME_COMPLETED": {
      const node = currentNode(state, story);
      return node?.type === "level"
        ? enterNode(state, node.completedNodeId, story)
        : unchanged(state);
    }
    case "MINIGAME_SKIPPED": {
      const node = currentNode(state, story);
      return node?.type === "level"
        ? enterNode(state, node.skippedNodeId, story)
        : unchanged(state);
    }
    case "DOSSIER_CLOSED": {
      const node = currentNode(state, story);
      return node?.type === "dossier-card"
        ? enterNode(state, node.next, story)
        : unchanged(state);
    }
    case "OPTION_CHOSEN": {
      const node = currentNode(state, story);
      const option =
        node?.type === "choice"
          ? node.options.find((candidate) => candidate.id === action.optionId)
          : undefined;
      // An option guarded by a confirmation needs the second, explicit act
      // (ADR-013): without it the choice simply does not happen.
      if (option?.confirmation !== undefined && action.confirmed !== true) {
        return unchanged(state);
      }
      return option === undefined
        ? unchanged(state)
        : chooseOption(state, option, story);
    }
    case "RUN_RESUMED":
      if (state.phase !== "title") {
        return unchanged(state);
      }
      return {
        state: action.savedState,
        effects: [{ type: "focus", target: "screen-heading" }],
      };
    case "LOCAL_DATA_CLEARED":
      return {
        state: {
          ...createInitialState(state.settings.reducedMotion),
          settings: state.settings,
        },
        effects: [
          { type: "clear-save" },
          { type: "focus", target: "screen-heading" },
        ],
      };
  }
}
