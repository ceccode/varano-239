// @vitest-environment jsdom

import { fireEvent, getByRole, queryByRole } from "@testing-library/dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createGameController } from "../../src/app/controller";
import { createInitialState, type GameState } from "../../src/core/game-state";
import type { AnalyticsPort, SavePort } from "../../src/core/ports";
import { reduce } from "../../src/core/reducer";
import { resolveItalianMessage } from "../../src/content/locales/it";
import { coreStoryGraph } from "../../src/content/packs/core/m1";
import type { GameAudio } from "../../src/platform/audio/chiptune-audio";
import type { BestScorePort } from "../../src/platform/storage/best-score";
import { renderGameApp } from "../../src/platform/dom/render-game";
import { assetManifest } from "../../src/assets/manifest";
import { stubCanvasContext } from "./helpers/canvas-stub";

class MemorySave implements SavePort {
  readonly save = vi.fn((state: GameState) => {
    this.state = state;
  });
  readonly clear = vi.fn(() => {
    this.state = undefined;
  });

  constructor(private state?: GameState) {}

  load(): GameState | undefined {
    return this.state;
  }
}

function createAudio(): GameAudio {
  return {
    setMusicEnabled: vi.fn<GameAudio["setMusicEnabled"]>(),
    setEffectsEnabled: vi.fn<GameAudio["setEffectsEnabled"]>(),
    startMusic: vi.fn<GameAudio["startMusic"]>(),
    stopMusic: vi.fn<GameAudio["stopMusic"]>(),
    playEffect: vi.fn<GameAudio["playEffect"]>(),
  };
}

function createBestScore(initial?: number): BestScorePort {
  let value = initial;
  return {
    load: () => value,
    save: (score: number) => {
      value = score;
    },
    clear: () => {
      value = undefined;
    },
  };
}

function prepareDocument(): { mount: HTMLElement } {
  document.body.innerHTML = `<main data-app-root></main>`;
  const mount = document.querySelector<HTMLElement>("[data-app-root]");
  if (mount === null) {
    throw new Error("Test mount unavailable.");
  }
  return { mount };
}

function clickMessage(key: Parameters<typeof resolveItalianMessage>[0]): void {
  fireEvent.click(
    getByRole(document.body, "button", { name: resolveItalianMessage(key) }),
  );
}

function pickRole(
  key: Parameters<
    typeof resolveItalianMessage
  >[0] = "core.message.ui.role-select.varano.title",
): void {
  fireEvent.click(
    getByRole(document.body, "button", {
      name: new RegExp(`^${resolveItalianMessage(key)}`),
    }),
  );
}

function radio(name: string, value: string): HTMLInputElement {
  const control = document.querySelector<HTMLInputElement>(
    `input[type="radio"][name="${name}"][value="${value}"]`,
  );
  if (control === null) {
    throw new Error(`Radio unavailable: ${name}=${value}.`);
  }
  return control;
}

function savedChoiceState(): GameState {
  let state: GameState = {
    ...createInitialState(),
    setup: {
      role: "guardian",
      approach: "rescue",
      sensitivity: "complete",
      storyScope: "core",
    },
  };
  for (const action of [
    { type: "RUN_STARTED" },
    { type: "MINIGAME_SKIPPED" },
    { type: "DIALOGUE_ADVANCED" },
  ] as const) {
    state = reduce(state, action, coreStoryGraph).state;
  }
  return state;
}

describe("full-screen game controller", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    stubCanvasContext();
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: vi.fn(() => 1),
    });
    Object.defineProperty(window, "cancelAnimationFrame", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("asks for a role on first boot, then plays to the open ending", () => {
    const { mount } = prepareDocument();
    const save = new MemorySave();
    const track = vi.fn<AnalyticsPort["track"]>();
    const audio = createAudio();
    const controller = createGameController({
      document,
      mount,
      analytics: { track },
      save,
      audio,
      bestScore: createBestScore(),
      reducedMotion: false,
    });

    // First boot: role selection instead of an immediate run.
    expect(controller.getState().phase).toBe("title");
    expect(track).not.toHaveBeenCalledWith({ name: "game_start" });
    expect(mount.textContent).toContain(
      resolveItalianMessage("core.message.ui.role-select.heading"),
    );
    expect(mount.textContent).toContain(
      resolveItalianMessage("core.message.ui.role-select.varano.goal"),
    );

    pickRole();
    expect(controller.getState().phase).toBe("playing");
    expect(controller.getState().setup.role).toBe("varano");
    expect(track).toHaveBeenCalledWith({ name: "game_start" });
    expect(mount.querySelector("canvas")).toBeInstanceOf(HTMLCanvasElement);
    expect(mount.textContent).toContain(
      resolveItalianMessage("core.message.ui.legend-banner"),
    );
    expect(mount.textContent).toContain(
      resolveItalianMessage("core.message.level.narrative.start"),
    );

    clickMessage("core.message.level.skip");
    expect(document.body.textContent).toContain(
      resolveItalianMessage("core.message.dialogue.varano"),
    );
    expect(document.body.textContent).toContain(
      resolveItalianMessage("core.message.dialogue.twist"),
    );
    clickMessage("core.message.ui.continue");

    // The dialogue leads straight to the choice: no dossier card in between.
    expect(document.body.textContent).toContain(
      resolveItalianMessage("core.message.choice.prompt"),
    );
    clickMessage("core.message.choice.protect");

    // Chapter 1: the choice hands over to level 2 with the run superpower.
    expect(controller.getState().run?.currentNodeId).toBe(
      "core.node.chat.level",
    );
    expect(mount.textContent).toContain(
      resolveItalianMessage("core.message.level2.narrative.start"),
    );
    clickMessage("core.message.level.skip");
    expect(document.body.textContent).toContain(
      resolveItalianMessage("core.message.dialogue2.varano"),
    );
    expect(document.body.textContent).toContain(
      resolveItalianMessage("core.message.dialogue2.twist"),
    );
    clickMessage("core.message.ui.continue");

    expect(controller.getState().phase).toBe("ending");
    expect(document.body.textContent).toContain(
      resolveItalianMessage("core.message.ending.body"),
    );
    // The level was skipped, so there is no score to show or share.
    expect(
      queryByRole(document.body, "button", {
        name: resolveItalianMessage("core.message.ui.score.share"),
      }),
    ).toBeNull();
    expect(save.save).toHaveBeenCalled();

    // "Rigioca" clears the save and returns to the role selection.
    clickMessage("core.message.ui.ending.restart");
    expect(save.clear).toHaveBeenCalledOnce();
    expect(controller.getState().phase).toBe("title");
    expect(mount.textContent).toContain(
      resolveItalianMessage("core.message.ui.role-select.heading"),
    );
  });

  it("opens the in-game menu with settings, credits, privacy and terms", () => {
    const { mount } = prepareDocument();
    const audio = createAudio();
    const controller = createGameController({
      document,
      mount,
      analytics: { track: vi.fn() },
      save: new MemorySave(),
      audio,
      bestScore: createBestScore(),
      reducedMotion: false,
    });

    const menu = mount.querySelector<HTMLElement>("[data-menu]");
    expect(menu?.hasAttribute("hidden")).toBe(true);
    clickMessage("core.message.ui.menu.open");
    expect(
      mount.querySelector<HTMLElement>("[data-menu]")?.hasAttribute("hidden"),
    ).toBe(false);

    for (const key of [
      "core.message.ui.menu.settings",
      "core.message.ui.menu.credits",
      "core.message.ui.menu.privacy",
      "core.message.ui.menu.terms",
    ] as const) {
      expect(mount.textContent).toContain(resolveItalianMessage(key));
    }
    const creditsLink = getByRole(document.body, "link", {
      name: resolveItalianMessage("core.message.ui.credits.link"),
    });
    expect(creditsLink.getAttribute("href")).toBe(
      "https://github.com/ceccode/varano-239",
    );
    // The legal notices are pages of the site itself, so they work offline.
    const privacyLink = getByRole(document.body, "link", {
      name: resolveItalianMessage("core.message.ui.privacy.link"),
    });
    expect(privacyLink.getAttribute("href")).toBe("privacy.html");
    const termsLink = getByRole(document.body, "link", {
      name: resolveItalianMessage("core.message.ui.terms.link"),
    });
    expect(termsLink.getAttribute("href")).toBe("termini.html");
    // The single 12+ edition has no sensitivity or play-mode selectors.
    expect(
      document.querySelector('input[type="radio"][name="sensitivity"]'),
    ).toBeNull();
    expect(
      document.querySelector('input[type="radio"][name="play-mode"]'),
    ).toBeNull();

    fireEvent.click(radio("role", "hunter"));
    expect(controller.getState().setup.role).toBe("hunter");
    expect(
      mount.querySelector<HTMLElement>("[data-menu]")?.hasAttribute("hidden"),
    ).toBe(false);

    const music = document.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    if (music === null) {
      throw new Error("Music toggle unavailable.");
    }
    music.checked = false;
    fireEvent.change(music);
    expect(controller.getState().settings.musicEnabled).toBe(false);
    expect(audio.setMusicEnabled).toHaveBeenLastCalledWith(false);

    clickMessage("core.message.ui.menu.close");
    expect(
      mount.querySelector<HTMLElement>("[data-menu]")?.hasAttribute("hidden"),
    ).toBe(true);
  });

  it("resumes a saved run automatically and skips the role selection", () => {
    const savedState = savedChoiceState();
    const { mount } = prepareDocument();
    const track = vi.fn<AnalyticsPort["track"]>();
    const controller = createGameController({
      document,
      mount,
      analytics: { track },
      save: new MemorySave(savedState),
      audio: createAudio(),
      bestScore: createBestScore(),
      reducedMotion: false,
    });

    expect(controller.getState()).toBe(savedState);
    expect(track).not.toHaveBeenCalledWith({ name: "game_start" });
    expect(document.body.textContent).toContain(
      resolveItalianMessage("core.message.choice.prompt"),
    );

    clickMessage("core.message.ui.menu.open");
    clickMessage("core.message.ui.clear-save");
    expect(controller.getState().phase).toBe("title");
    expect(mount.textContent).toContain(
      resolveItalianMessage("core.message.ui.role-select.heading"),
    );
  });

  it("offers the equivalent assisted path even when the platform fails", () => {
    const { mount } = prepareDocument();
    const failingSave: SavePort = {
      load(): GameState | undefined {
        throw new Error("unavailable");
      },
      save(): void {
        throw new Error("full");
      },
      clear(): void {
        throw new Error("blocked");
      },
    };
    const controller = createGameController({
      document,
      mount,
      analytics: {
        track(): void {
          throw new Error("offline");
        },
      },
      save: failingSave,
      audio: createAudio(),
      bestScore: createBestScore(),
      reducedMotion: false,
    });

    controller.dispatch({
      type: "SETTINGS_UPDATED",
      settings: { playMode: "calm" },
    });
    controller.dispatch({ type: "STORY_SCOPE_SELECTED", value: "origins" });
    pickRole("core.message.ui.role-select.hunter.title");

    expect(mount.querySelector("canvas")).toBeNull();
    expect(
      queryByRole(document.body, "button", {
        name: resolveItalianMessage("core.message.level.skip"),
      }),
    ).toBeNull();
    expect(getByRole(document.body, "status").textContent).toContain(
      resolveItalianMessage("core.message.ui.scope-fallback"),
    );
    expect(document.body.textContent).toContain(
      resolveItalianMessage("core.message.level.assisted"),
    );
    clickMessage("core.message.level.continue");
    expect(document.body.textContent).toContain(
      resolveItalianMessage("core.message.dialogue.hunter"),
    );
    clickMessage("core.message.ui.continue");
    expect(document.body.textContent).toContain(
      resolveItalianMessage("core.message.choice.prompt"),
    );
  });

  function renderEndingWithScore(
    mount: HTMLElement,
    overrides: Partial<Parameters<typeof renderGameApp>[0]> = {},
  ): void {
    let state: GameState = { ...createInitialState() };
    for (const action of [
      { type: "RUN_STARTED" },
      { type: "MINIGAME_SKIPPED" },
      { type: "DIALOGUE_ADVANCED" },
      { type: "OPTION_CHOSEN", optionId: "core.option.prologue.protect" },
      { type: "MINIGAME_SKIPPED" },
      { type: "DIALOGUE_ADVANCED" },
    ] as const) {
      state = reduce(state, action, coreStoryGraph).state;
    }

    renderGameApp({
      document,
      mount,
      state,
      savedState: undefined,
      lastOutcome: {
        score: 1730,
        clues: 3,
        totalClues: 3,
        seconds: 47,
        respawns: 0,
      },
      bestScore: 1800,
      content: {
        story: coreStoryGraph,
        assets: assetManifest,
        message: resolveItalianMessage,
      },
      dispatch: vi.fn(),
      ...overrides,
    });
  }

  it("draws a score card and teases the next level on the ending", () => {
    const { mount } = prepareDocument();
    const canvasStub = stubCanvasContext();
    renderEndingWithScore(mount, { isRecord: true });

    expect(mount.textContent).toContain(
      `${resolveItalianMessage("core.message.ui.score.last")}: 1730`,
    );
    expect(mount.textContent).toContain(
      `${resolveItalianMessage("core.message.ui.score.best")}: 1800`,
    );

    // The card is a real canvas with an accessible name.
    const card = mount.querySelector<HTMLCanvasElement>("canvas.score-card");
    expect(card).toBeInstanceOf(HTMLCanvasElement);
    expect(card?.getAttribute("role")).toBe("img");
    expect(card?.getAttribute("aria-label")).toBe(
      resolveItalianMessage("core.message.ui.score.card-alt"),
    );
    expect(canvasStub.texts).toContain("1730");
    expect(canvasStub.texts).toContain("3/3");
    expect(canvasStub.texts).toContain("47s");
    expect(canvasStub.texts).toContain(
      resolveItalianMessage("core.message.ui.card.record"),
    );
    expect(canvasStub.texts).toContain(
      resolveItalianMessage("core.message.ui.role-select.varano.title"),
    );

    // The suspense block announces that level 2 is on the way.
    expect(mount.textContent).toContain(
      resolveItalianMessage("core.message.ui.next-level.label"),
    );
    expect(mount.textContent).toContain(
      resolveItalianMessage("core.message.ui.next-level.title"),
    );
    expect(mount.textContent).toContain(
      resolveItalianMessage("core.message.ui.next-level.install"),
    );
  });

  it("shares the card as an image and reports the outcome", async () => {
    const { mount } = prepareDocument();
    stubCanvasContext();
    const blob = new Blob(["png"], { type: "image/png" });
    HTMLCanvasElement.prototype.toBlob = vi.fn((callback: BlobCallback) => {
      callback(blob);
    });
    const share = vi.fn((data: ShareData) => {
      void data;
      return Promise.resolve();
    });
    Object.defineProperty(window.navigator, "canShare", {
      configurable: true,
      value: () => true,
    });
    Object.defineProperty(window.navigator, "share", {
      configurable: true,
      value: share,
    });

    renderEndingWithScore(mount);
    clickMessage("core.message.ui.score.share");
    await vi.waitFor(() => {
      expect(share).toHaveBeenCalledOnce();
    });

    const payload = share.mock.calls[0]?.[0];
    expect(payload?.files?.[0]?.type).toBe("image/png");
    expect(payload?.text).toContain("1730");
    expect(payload?.text).toContain("3/3");
    await vi.waitFor(() => {
      expect(getByRole(document.body, "status").textContent).toBe(
        resolveItalianMessage("core.message.ui.score.shared"),
      );
    });
  });

  it("falls back to copying the text when no sharing API works", async () => {
    const { mount } = prepareDocument();
    stubCanvasContext();
    // No toBlob, no Web Share: only the clipboard is left.
    HTMLCanvasElement.prototype.toBlob =
      undefined as unknown as HTMLCanvasElement["toBlob"];
    Object.defineProperty(window.navigator, "canShare", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(window.navigator, "share", {
      configurable: true,
      value: undefined,
    });
    const writeText = vi.fn((text: string) => {
      void text;
      return Promise.resolve();
    });
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    renderEndingWithScore(mount);
    clickMessage("core.message.ui.score.share");
    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledOnce();
    });
    expect(writeText.mock.calls[0]?.[0]).toContain("1730");
    await vi.waitFor(() => {
      expect(getByRole(document.body, "status").textContent).toBe(
        resolveItalianMessage("core.message.ui.score.copied"),
      );
    });
  });
});
