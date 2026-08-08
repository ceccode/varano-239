// @vitest-environment jsdom

import { fireEvent, getByRole, queryByRole } from "@testing-library/dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createGameController } from "../../src/app/controller";
import { createInitialState, type GameState } from "../../src/core/game-state";
import type { AnalyticsPort, SavePort } from "../../src/core/ports";
import { reduce } from "../../src/core/reducer";
import { resolveItalianMessage } from "../../src/content/locales/it";
import { coreStoryGraph } from "../../src/content/packs/core/pack";
import type { GameAudio } from "../../src/platform/audio/chiptune-audio";
import type { BestScorePort } from "../../src/platform/storage/best-score";
import { renderGameApp } from "../../src/platform/dom/render-game";
import { assetManifest } from "../../src/assets/manifest";
import { stubCanvasContext } from "./helpers/canvas-stub";
import { coreInterludes } from "../helpers/interludes";

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

  it("never puts a briefing between a new run and its first level", () => {
    // ADR-021's zero steps before playing survives the briefing (ADR-034).
    const { mount } = prepareDocument();
    createGameController({
      document,
      mount,
      analytics: { track: vi.fn() },
      save: new MemorySave(),
      audio: createAudio(),
      bestScore: createBestScore(),
      reducedMotion: false,
    });

    pickRole();
    expect(mount.querySelector("canvas")).toBeInstanceOf(HTMLCanvasElement);
    expect(
      queryByRole(document.body, "button", {
        name: resolveItalianMessage("core.message.level.play"),
      }),
    ).toBeNull();
    expect(mount.textContent).not.toContain(
      resolveItalianMessage("core.message.level.recap"),
    );
  });

  it("shows the assisted card instead of a briefing with reduced motion", () => {
    const { mount } = prepareDocument();
    createGameController({
      document,
      mount,
      analytics: { track: vi.fn() },
      save: new MemorySave(),
      audio: createAudio(),
      bestScore: createBestScore(),
      reducedMotion: true,
    });

    pickRole();
    // The same card, with «Continua la storia» in place of «Gioca».
    expect(mount.textContent).toContain(
      resolveItalianMessage("core.message.level.recap"),
    );
    expect(mount.textContent).toContain(
      resolveItalianMessage("core.message.level.assisted"),
    );
    expect(
      queryByRole(document.body, "button", {
        name: resolveItalianMessage("core.message.level.continue"),
      }),
    ).not.toBeNull();
    expect(
      queryByRole(document.body, "button", {
        name: resolveItalianMessage("core.message.level.play"),
      }),
    ).toBeNull();
    expect(mount.querySelector("canvas")).toBeNull();
  });

  it("asks for a role on first boot, then plays to an ending", () => {
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
    // From the second level on, a briefing recaps the story first (ADR-034)
    // and announces the level's place in the campaign (ADR-045).
    expect(mount.textContent).toContain(
      resolveItalianMessage("core.message.level2.recap"),
    );
    const totalLevels = coreStoryGraph.nodes.filter(
      (node) => node.type === "level",
    ).length;
    expect(mount.textContent).toContain(
      resolveItalianMessage("core.message.level.briefing.position", {
        index: 2,
        total: totalLevels,
      }),
    );
    expect(mount.querySelector("canvas")).toBeNull();
    clickMessage("core.message.level.play");
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
    // The interlude choice of ADR-043: the player decides something between
    // one level and the next.
    clickMessage("core.message.choice2.mute");

    // The long night begins (ADR-045): the sealed zone, third in story order.
    expect(controller.getState().run?.currentNodeId).toBe(
      "core.node.zona.level",
    );
    expect(mount.textContent).toContain(
      resolveItalianMessage("core.message.zona.recap"),
    );
    clickMessage("core.message.level.skip");
    expect(document.body.textContent).toContain(
      resolveItalianMessage("core.message.dialogue-zona.varano"),
    );
    expect(document.body.textContent).toContain(
      resolveItalianMessage("core.message.dialogue-zona.twist"),
    );
    clickMessage("core.message.ui.continue");
    clickMessage("core.message.choice-zona.bait");

    // Fourth in story order: the versions laboratory (ADR-045).
    expect(controller.getState().run?.currentNodeId).toBe(
      "core.node.lab.level",
    );
    expect(mount.textContent).toContain(
      resolveItalianMessage("core.message.lab.recap"),
    );
    clickMessage("core.message.level.skip");
    expect(document.body.textContent).toContain(
      resolveItalianMessage("core.message.dialogue-lab.varano"),
    );
    expect(document.body.textContent).toContain(
      resolveItalianMessage("core.message.dialogue-lab.twist"),
    );
    clickMessage("core.message.ui.continue");
    clickMessage("core.message.choice-lab.prudent");

    // Chapter 2: the media circus outside the castle walls (ADR-032).
    expect(controller.getState().run?.currentNodeId).toBe(
      "core.node.superstar.level",
    );
    // The briefing names the superpower this role gets in this level.
    expect(mount.textContent).toContain(
      resolveItalianMessage("core.message.level3.recap"),
    );
    expect(mount.textContent).toContain(
      resolveItalianMessage("core.message.power.varano.label"),
    );
    clickMessage("core.message.level.play");
    expect(mount.textContent).toContain(
      resolveItalianMessage("core.message.level3.narrative.start"),
    );
    // The Varano's power button carries its own accessible name.
    expect(
      queryByRole(document.body, "button", {
        name: resolveItalianMessage("core.message.power.varano.label"),
      }),
    ).not.toBeNull();
    clickMessage("core.message.level.skip");
    expect(document.body.textContent).toContain(
      resolveItalianMessage("core.message.dialogue3.varano"),
    );
    expect(document.body.textContent).toContain(
      resolveItalianMessage("core.message.dialogue3.twist"),
    );
    clickMessage("core.message.ui.continue");
    clickMessage("core.message.choice3.delete");

    // Chapter 3: the castle park (ADR-036). The briefing card carries its own
    // skip, so the level can be skipped without playing it.
    expect(controller.getState().run?.currentNodeId).toBe(
      "core.node.park.level",
    );
    expect(mount.textContent).toContain(
      resolveItalianMessage("core.message.level4.recap"),
    );
    clickMessage("core.message.level.skip");
    expect(document.body.textContent).toContain(
      resolveItalianMessage("core.message.dialogue4.varano"),
    );
    expect(document.body.textContent).toContain(
      resolveItalianMessage("core.message.dialogue4.twist"),
    );
    clickMessage("core.message.ui.continue");
    clickMessage("core.message.choice4.close");

    // Chapter 4: inside the castle, where the sender is named (ADR-039).
    expect(controller.getState().run?.currentNodeId).toBe(
      "core.node.keep.level",
    );
    expect(mount.textContent).toContain(
      resolveItalianMessage("core.message.level5.recap"),
    );
    clickMessage("core.message.level.skip");
    expect(document.body.textContent).toContain(
      resolveItalianMessage("core.message.dialogue5.pina"),
    );
    expect(document.body.textContent).toContain(
      resolveItalianMessage("core.message.dialogue5.varano"),
    );
    clickMessage("core.message.ui.continue");

    // The confrontation on the tower (ADR-040): the varano sees no lethal
    // option, and leaving the sunstone alone crowns the provisional Count.
    expect(document.body.textContent).toContain(
      resolveItalianMessage("core.message.finale.prompt"),
    );
    expect(
      queryByRole(document.body, "button", {
        name: resolveItalianMessage("core.message.finale.option.shoot"),
      }),
    ).toBeNull();
    clickMessage("core.message.finale.option.tower");

    expect(controller.getState().phase).toBe("ending");
    expect(controller.getState().run?.varanoFate).toBe("escaped");
    expect(document.body.textContent).toContain(
      resolveItalianMessage("core.message.ending.count.body"),
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

  it("shows seals and the Varano's condition in the briefing reputation", () => {
    // ADR-045: once the Sei Colli grant seals and San Pancrazio sets the
    // condition, the briefing spells both out in plain language.
    const { mount } = prepareDocument();
    let state: GameState = { ...createInitialState() };
    for (const action of [
      { type: "RUN_STARTED" },
      { type: "MINIGAME_SKIPPED" },
      { type: "DIALOGUE_ADVANCED" },
      { type: "OPTION_CHOSEN", optionId: "core.option.prologue.protect" },
    ] as const) {
      state = reduce(state, action, coreStoryGraph).state;
    }
    if (state.run === undefined) {
      throw new Error("The walkthrough must produce a run.");
    }
    state = {
      ...state,
      run: {
        ...state.run,
        seals: ["core.seal.rotondo", "core.seal.generale"],
        condition: "weak",
      },
    };

    renderGameApp({
      document,
      mount,
      state,
      savedState: undefined,
      content: {
        story: coreStoryGraph,
        assets: assetManifest,
        message: resolveItalianMessage,
      },
      dispatch: vi.fn(),
      showBriefing: true,
    });

    expect(mount.textContent).toContain(
      resolveItalianMessage("core.message.level.briefing.seals", { seals: 2 }),
    );
    expect(mount.textContent).toContain(
      resolveItalianMessage("core.message.level.briefing.condition.weak"),
    );
  });

  it("guards the lethal choice behind a confirmation that opens on cancel", () => {
    const { mount } = prepareDocument();
    const controller = createGameController({
      document,
      mount,
      analytics: { track: vi.fn() },
      save: new MemorySave(),
      audio: createAudio(),
      bestScore: createBestScore(),
      reducedMotion: false,
    });
    void mount;

    // The hunter who documents the scene: the one setup ADR-013 admits.
    pickRole("core.message.ui.role-select.hunter.title");
    clickMessage("core.message.level.skip");
    clickMessage("core.message.ui.continue");
    clickMessage("core.message.choice.document");
    for (const interlude of coreInterludes) {
      clickMessage("core.message.level.skip");
      clickMessage("core.message.ui.continue");
      if (interlude !== undefined) {
        clickMessage(interlude.textKey);
      }
    }

    // The confrontation shows the lethal option to this setup only.
    expect(document.body.textContent).toContain(
      resolveItalianMessage("core.message.finale.prompt"),
    );
    clickMessage("core.message.finale.option.shoot");

    // Selecting it does NOT act: a dialog opens with the focus on cancel.
    expect(controller.getState().phase).toBe("playing");
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain(
      resolveItalianMessage("core.message.finale.confirm.body"),
    );
    expect(document.activeElement?.textContent).toBe(
      resolveItalianMessage("core.message.finale.confirm.cancel"),
    );

    // Cancelling returns to the choice, focus back on the opener.
    clickMessage("core.message.finale.confirm.cancel");
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(controller.getState().run?.currentNodeId).toBe(
      "core.node.finale.confrontation",
    );
    expect(document.activeElement?.textContent).toBe(
      resolveItalianMessage("core.message.finale.option.shoot"),
    );

    // Confirming is the second, explicit act that reaches the ending.
    clickMessage("core.message.finale.option.shoot");
    clickMessage("core.message.finale.confirm.confirm");
    expect(controller.getState().phase).toBe("ending");
    expect(controller.getState().run?.varanoFate).toBe("killedByHunter");
    expect(document.body.textContent).toContain(
      resolveItalianMessage("core.message.ending.killed.title"),
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
      ...coreInterludes.flatMap((interlude) => [
        { type: "MINIGAME_SKIPPED" } as const,
        { type: "DIALOGUE_ADVANCED" } as const,
        ...(interlude === undefined
          ? []
          : [
              {
                type: "OPTION_CHOSEN",
                optionId: interlude.optionId,
              } as const,
            ]),
      ]),
      { type: "OPTION_CHOSEN", optionId: "core.option.finale.corridor" },
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
