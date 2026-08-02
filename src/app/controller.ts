import { assetManifest } from "../assets/manifest";
import type { FocusTarget, GameAction, GameEffect } from "../core/actions";
import { createInitialState, type GameState } from "../core/game-state";
import type { AnalyticsPort, SavePort } from "../core/ports";
import { reduce } from "../core/reducer";
import { resolveItalianMessage } from "../content/locales/it";
import { coreStoryGraph } from "../content/packs/core/m1";
import { renderGameApp } from "../platform/dom/render-game";
import type { GameAudio } from "../platform/audio/chiptune-audio";
import type { BestScorePort } from "../platform/storage/best-score";
import type { MiniGameHandle } from "../levels/contract";
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
  let lastScore: number | undefined;

  const safeBestScore = (): number | undefined => {
    try {
      return dependencies.bestScore.load();
    } catch {
      return undefined;
    }
  };

  const recordScore = (score: number): void => {
    lastScore = score;
    const best = safeBestScore();
    if (best === undefined || score > best) {
      try {
        dependencies.bestScore.save(score);
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
      lastScore,
      bestScore: safeBestScore(),
      content: {
        story: coreStoryGraph,
        assets: assetManifest,
        message: resolveItalianMessage,
      },
      dispatch,
      onMenuToggled: (open) => {
        if (open) {
          activeLevel?.pause();
        } else {
          activeLevel?.resume();
        }
      },
    });

    const currentNode =
      state.run === undefined
        ? undefined
        : coreStoryGraph.nodes.find(
            (node) => node.id === state.run?.currentNodeId,
          );
    const levelHost =
      dependencies.mount.querySelector<HTMLElement>("[data-level-host]");
    if (currentNode?.type === "level" && levelHost !== null) {
      activeLevel = mountRegisteredLevel({
        host: levelHost,
        node: currentNode,
        settings: state.settings,
        message: resolveItalianMessage,
        audio: dependencies.audio,
        onComplete: (score) => {
          recordScore(score);
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
        lastScore = undefined;
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
