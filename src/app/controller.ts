import { assetManifest } from "../assets/manifest";
import type { FocusTarget, GameAction, GameEffect } from "../core/actions";
import { createInitialState, type GameState } from "../core/game-state";
import type { AnalyticsPort, SavePort } from "../core/ports";
import { reduce } from "../core/reducer";
import { resolveItalianMessage } from "../content/locales/it";
import { coreStoryGraph } from "../content/packs/core/pack";
import { renderGameApp } from "../platform/dom/render-game";
import type { GameAudio } from "../platform/audio/chiptune-audio";
import type { BestScorePort } from "../platform/storage/best-score";
import type { LevelOutcome, MiniGameHandle } from "../levels/contract";
import { mountRegisteredLevel } from "../levels/registry";

export interface GameControllerDependencies {
  readonly document: Document;
  readonly mount: HTMLElement;
  readonly analytics: AnalyticsPort;
  readonly save: SavePort;
  readonly audio: GameAudio;
  readonly bestScore: BestScorePort;
  readonly reducedMotion: boolean;
}

export interface GameController {
  readonly dispatch: (action: GameAction) => void;
  readonly getState: () => GameState;
}

function safeLoad(save: SavePort): GameState | undefined {
  try {
    return save.load();
  } catch {
    return undefined;
  }
}

function focusTarget(document: Document, target: FocusTarget): void {
  document
    .querySelector<HTMLElement>(`[data-focus-target="${target}"]`)
    ?.focus();
}

export function createGameController(
  dependencies: GameControllerDependencies,
): GameController {
  let state = createInitialState(dependencies.reducedMotion);
  let savedState = safeLoad(dependencies.save);
  let activeLevel: MiniGameHandle | undefined;
  let lastOutcome: LevelOutcome | undefined;
  let isRecord = false;
  let briefingClearedNodeId: string | undefined;

  /**
   * Every level opens with its briefing, except the very first one of a brand
   * new run: there ADR-021's zero steps before playing still wins. The card is
   * presentation, so the decision lives here and never touches the reducer.
   */
  const showBriefing = (nodeId: string): boolean =>
    briefingClearedNodeId !== nodeId &&
    (state.run?.visitedNodeIds.length ?? 0) > 1;

  const safeBestScore = (): number | undefined => {
    try {
      return dependencies.bestScore.load();
    } catch {
      return undefined;
    }
  };

  /** The card shows the whole run, so each level adds to the running total. */
  const recordOutcome = (outcome: LevelOutcome): void => {
    const previous = lastOutcome;
    lastOutcome =
      previous === undefined
        ? outcome
        : {
            score: previous.score + outcome.score,
            clues: previous.clues + outcome.clues,
            totalClues: previous.totalClues + outcome.totalClues,
            seconds: previous.seconds + outcome.seconds,
            respawns: previous.respawns + outcome.respawns,
          };

    const best = safeBestScore();
    isRecord = best === undefined || lastOutcome.score > best;
    if (isRecord) {
      try {
        dependencies.bestScore.save(lastOutcome.score);
      } catch {
        // The personal best is optional; the session continues.
      }
    }
  };

  const isMenuOpen = (): boolean =>
    dependencies.mount.querySelector<HTMLElement>("[data-menu]")?.hidden ===
    false;

  const render = (): void => {
    activeLevel?.destroy();
    activeLevel = undefined;
    const node =
      state.run === undefined
        ? undefined
        : coreStoryGraph.nodes.find(
            (candidate) => candidate.id === state.run?.currentNodeId,
          );
    const briefing = node?.type === "level" && showBriefing(node.id);
    try {
      dependencies.audio.setMusicEnabled(state.settings.musicEnabled);
      dependencies.audio.setEffectsEnabled(state.settings.effectsEnabled);
    } catch {
      // Audio is optional and never blocks the story.
    }
    renderGameApp({
      document: dependencies.document,
      mount: dependencies.mount,
      state,
      savedState,
      lastOutcome,
      bestScore: safeBestScore(),
      isRecord,
      content: {
        story: coreStoryGraph,
        assets: assetManifest,
        message: resolveItalianMessage,
      },
      dispatch,
      showBriefing: briefing,
      onBriefingCleared:
        node === undefined
          ? undefined
          : (): void => {
              briefingClearedNodeId = node.id;
              render();
              // The level's own heading, never a control: the keyboard handler
              // ignores events aimed at a button, so focusing one would leave
              // the game unplayable from the keyboard.
              focusTarget(dependencies.document, "screen-heading");
            },
      onMenuToggled: (open) => {
        if (open) {
          activeLevel?.pause();
        } else {
          activeLevel?.resume();
        }
      },
    });

    const currentNode = node;
    const levelHost =
      dependencies.mount.querySelector<HTMLElement>("[data-level-host]");
    if (currentNode?.type === "level" && levelHost !== null) {
      activeLevel = mountRegisteredLevel({
        host: levelHost,
        node: currentNode,
        // The role decides which superpower the level grants (ADR-031).
        role: state.setup.role ?? "varano",
        settings: state.settings,
        message: resolveItalianMessage,
        audio: dependencies.audio,
        onComplete: (outcome) => {
          recordOutcome(outcome);
          dispatch({ type: "MINIGAME_COMPLETED" });
        },
        onExit: () => {
          dispatch({ type: "MINIGAME_SKIPPED" });
        },
      });
      if (isMenuOpen()) {
        activeLevel?.pause();
      }
    }
  };

  const handleEffect = (effect: GameEffect): void => {
    switch (effect.type) {
      case "save-requested":
        try {
          dependencies.save.save(state);
          savedState = state;
        } catch {
          // Persistence is optional; the current session remains playable.
        }
        return;
      case "clear-save":
        try {
          dependencies.save.clear();
          dependencies.bestScore.clear();
        } catch {
          // Clearing storage must not block a new local session.
        }
        savedState = undefined;
        lastOutcome = undefined;
        isRecord = false;
        return;
      case "analytics":
        try {
          dependencies.analytics.track({ name: effect.event });
        } catch {
          // Analytics is optional and never blocks the story.
        }
        return;
      case "focus":
        focusTarget(dependencies.document, effect.target);
        return;
    }
  };

  // Without a saved run the "title" phase shows the role selection screen;
  // with one, the game resumes immediately.
  const autoStart = (): void => {
    if (
      state.phase === "title" &&
      savedState !== undefined &&
      savedState.phase !== "title"
    ) {
      dispatch({ type: "RUN_RESUMED", savedState });
    }
  };

  function dispatch(action: GameAction): void {
    if (action.type === "RUN_STARTED") {
      // A brand new run starts from zero points.
      lastOutcome = undefined;
      isRecord = false;
    }

    const transition = reduce(state, action, coreStoryGraph);
    state = transition.state;

    for (const effect of transition.effects) {
      if (effect.type !== "focus") {
        handleEffect(effect);
      }
    }

    render();

    for (const effect of transition.effects) {
      if (effect.type === "focus") {
        handleEffect(effect);
      }
    }

    autoStart();
  }

  render();
  autoStart();

  return {
    dispatch,
    getState: () => state,
  };
}
