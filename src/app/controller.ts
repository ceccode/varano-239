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
import { levelPosition } from "../content/level-position";

export interface GameControllerDependencies {
  readonly document: Document;
  readonly mount: HTMLElement;
  readonly analytics: AnalyticsPort;
  readonly save: SavePort;
  readonly audio: GameAudio;
  readonly bestScore: BestScorePort;
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
  let state = createInitialState();
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

  /**
   * Text scale and contrast live on the document root (ADR-053), so CSS can
   * scale every rem and swap the tokens without a re-render. Applied by
   * render() and by the skip path alike.
   */
  const applyRootSettings = (): void => {
    const root = dependencies.document.documentElement;
    root.dataset.textScale = state.settings.textScale;
    if (state.settings.highContrast) {
      root.dataset.contrast = "high";
    } else {
      delete root.dataset.contrast;
    }
  };

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
    applyRootSettings();
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
      // «Riprova il livello» in the menu (ADR-051): arcade only — like the
      // KO card's retry, it never touches the story. The renderer closes
      // the menu first, so the restart is not raced by the menu's resume.
      onRestartLevel:
        node?.type === "level" && !briefing
          ? (): void => {
              activeLevel?.restart();
            }
          : undefined,
    });

    const currentNode = node;
    const levelHost =
      dependencies.mount.querySelector<HTMLElement>("[data-level-host]");
    if (currentNode?.type === "level" && levelHost !== null) {
      const position = levelPosition(coreStoryGraph, currentNode.id);
      activeLevel = mountRegisteredLevel({
        host: levelHost,
        node: currentNode,
        // The role decides which superpower the level grants (ADR-031).
        role: state.setup.role ?? "varano",
        ...(position === undefined ? {} : { position }),
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

  /**
   * The one action that must not rebuild the DOM (ADR-050). Every dispatch
   * re-renders, and `render()` destroys the mounted level — so toggling music
   * or effects from the in-game menu used to restart the level from scratch,
   * silently. Audio flags change nothing the renderer draws: the checkbox has
   * already updated itself, and the audio port takes the new value directly.
   */
  const presentationOnlySettings = new Set([
    "musicEnabled",
    "effectsEnabled",
    // Scale and contrast live on the document root (ADR-053): CSS applies
    // them without any DOM rebuild, so the level survives these too.
    "textScale",
    "highContrast",
  ]);
  const isPresentationOnlySettingsChange = (action: GameAction): boolean =>
    action.type === "SETTINGS_UPDATED" &&
    activeLevel !== undefined &&
    Object.keys(action.settings).every((key) =>
      presentationOnlySettings.has(key),
    );

  function dispatch(action: GameAction): void {
    if (action.type === "RUN_STARTED") {
      // A brand new run starts from zero points.
      lastOutcome = undefined;
      isRecord = false;
    }

    const keepLevelMounted = isPresentationOnlySettingsChange(action);
    const transition = reduce(state, action, coreStoryGraph);
    state = transition.state;

    for (const effect of transition.effects) {
      if (effect.type !== "focus") {
        handleEffect(effect);
      }
    }

    if (keepLevelMounted) {
      // What `render()` would have done for presentation, minus the teardown.
      applyRootSettings();
      try {
        dependencies.audio.setMusicEnabled(state.settings.musicEnabled);
        dependencies.audio.setEffectsEnabled(state.settings.effectsEnabled);
      } catch {
        // Audio is optional and never blocks the story.
      }
      return;
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
