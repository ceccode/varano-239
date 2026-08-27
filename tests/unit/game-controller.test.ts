// @vitest-environment jsdom

import { fireEvent, getByRole, queryByRole } from "@testing-library/dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  analyticsMilestoneForLevel,
  createGameController,
} from "../../src/app/controller";
import { createInitialState, type GameState } from "../../src/core/game-state";
import type { AnalyticsPort, SavePort } from "../../src/core/ports";
import { reduce } from "../../src/core/reducer";
import { resolveItalianMessage } from "../../src/content/locales/it";
import { coreStoryGraph } from "../../src/content/packs/core/pack";
import type { GameAudio } from "../../src/platform/audio/chiptune-audio";
import type { BestScorePort } from "../../src/platform/storage/best-score";
import {
  mergeRecords,
  type LevelRecord,
  type LevelRecordsPort,
} from "../../src/platform/storage/level-records";
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

function createLevelRecords(): LevelRecordsPort {
  let records: Record<string, LevelRecord> = {};
  return {
    load: () => records,
    record: (levelId, result) => {
      records = {
        ...records,
        [levelId]: mergeRecords(records[levelId], result),
      };
    },
    clear: () => {
      records = {};
    },
  };
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

  it("exposes only the four aggregate level milestones", () => {
    expect(
      Array.from({ length: 10 }, (_, index) =>
        analyticsMilestoneForLevel(index + 1),
      ),
    ).toEqual([
      "level_1_complete",
      undefined,
      "level_3_complete",
      undefined,
      undefined,
      "level_6_complete",
      undefined,
      undefined,
      undefined,
      "level_10_complete",
    ]);
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
      levelRecords: createLevelRecords(),
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

  it("keeps the assisted card behind the story/calm play modes (ADR-046)", () => {
    // The system's reduced-motion signal no longer reroutes here: the
    // assisted path answers only to an explicit non-standard play mode.
    const initial = createInitialState();
    const storyMode: GameState = {
      ...initial,
      settings: { ...initial.settings, playMode: "story" },
    };
    const atLevel = reduce(
      storyMode,
      { type: "RUN_STARTED" },
      coreStoryGraph,
    ).state;
    const { mount } = prepareDocument();
    createGameController({
      document,
      mount,
      analytics: { track: vi.fn() },
      save: new MemorySave(atLevel),
      audio: createAudio(),
      bestScore: createBestScore(),
      levelRecords: createLevelRecords(),
    });
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
      levelRecords: createLevelRecords(),
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

    // Fifth in story order: the ditches and the six nutrias, first of the
    // Six Hills — and the first chapter that hands out seals (ADR-045).
    expect(controller.getState().run?.currentNodeId).toBe(
      "core.node.acqua.level",
    );
    expect(mount.textContent).toContain(
      resolveItalianMessage("core.message.acqua.recap"),
    );
    clickMessage("core.message.level.skip");
    expect(document.body.textContent).toContain(
      resolveItalianMessage("core.message.dialogue-acqua.varano"),
    );
    expect(document.body.textContent).toContain(
      resolveItalianMessage("core.message.dialogue-acqua.twist"),
    );
    clickMessage("core.message.ui.continue");
    clickMessage("core.message.choice-acqua.wait");
    // Waiting for the Brigade earns the same two seals as chasing the tail.
    expect(controller.getState().run?.seals).toEqual([
      "core.seal.rotondo",
      "core.seal.generale",
    ]);

    // Sixth in story order: the upper village, its clothesline and the
    // second pair of seals (ADR-045).
    expect(controller.getState().run?.currentNodeId).toBe(
      "core.node.borgo.level",
    );
    expect(mount.textContent).toContain(
      resolveItalianMessage("core.message.borgo.recap"),
    );
    clickMessage("core.message.level.skip");
    expect(document.body.textContent).toContain(
      resolveItalianMessage("core.message.dialogue-borgo.varano"),
    );
    expect(document.body.textContent).toContain(
      resolveItalianMessage("core.message.dialogue-borgo.twist"),
    );
    clickMessage("core.message.ui.continue");
    clickMessage("core.message.choice-borgo.order");
    expect(controller.getState().run?.seals).toEqual([
      "core.seal.rotondo",
      "core.seal.generale",
      "core.seal.san-giorgio",
      "core.seal.san-zeno",
    ]);

    // Seventh in story order and tenth level: the terraces at dawn, the last
    // two seals and the only interlude that sets `condition` (ADR-045).
    expect(controller.getState().run?.currentNodeId).toBe(
      "core.node.colle.level",
    );
    expect(mount.textContent).toContain(
      resolveItalianMessage("core.message.colle.recap"),
    );
    clickMessage("core.message.level.skip");
    expect(document.body.textContent).toContain(
      resolveItalianMessage("core.message.dialogue-colle.varano"),
    );
    expect(document.body.textContent).toContain(
      resolveItalianMessage("core.message.dialogue-colle.twist"),
    );
    clickMessage("core.message.ui.continue");
    clickMessage("core.message.choice-colle.road");
    expect(controller.getState().run?.seals).toHaveLength(6);
    expect(controller.getState().run?.condition).toBe("healthy");

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
    expect(track).toHaveBeenCalledWith({ name: "game_complete" });
    expect(track).not.toHaveBeenCalledWith({ name: "level_1_complete" });
    expect(track).not.toHaveBeenCalledWith({ name: "level_3_complete" });
    expect(track).not.toHaveBeenCalledWith({ name: "level_6_complete" });
    expect(track).not.toHaveBeenCalledWith({ name: "level_10_complete" });

    // "Rigioca" clears the save and returns to the role selection.
    clickMessage("core.message.ui.ending.restart");
    expect(track).toHaveBeenCalledWith({ name: "replay_start" });
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
      levelRecords: createLevelRecords(),
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
      levelRecords: createLevelRecords(),
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

    // By name, not by position: the contrast toggle (ADR-053) now comes
    // first in the settings panel.
    const music = getByRole<HTMLInputElement>(document.body, "checkbox", {
      name: resolveItalianMessage("core.message.ui.options.music"),
    });
    music.checked = false;
    fireEvent.change(music);
    expect(controller.getState().settings.musicEnabled).toBe(false);
    expect(audio.setMusicEnabled).toHaveBeenLastCalledWith(false);

    clickMessage("core.message.ui.menu.close");
    expect(
      mount.querySelector<HTMLElement>("[data-menu]")?.hasAttribute("hidden"),
    ).toBe(true);
  });

  it("keeps the level running when audio is toggled from the menu (ADR-050)", () => {
    // The bug the owner hit on every playtest: every dispatch re-rendered,
    // `render()` destroys the mounted level, so muting the music restarted
    // the level from the beginning without saying so.
    const { mount } = prepareDocument();
    stubCanvasContext();
    const audio = createAudio();
    createGameController({
      document,
      mount,
      analytics: { track: vi.fn() },
      save: new MemorySave(),
      audio,
      bestScore: createBestScore(),
      levelRecords: createLevelRecords(),
    });
    pickRole();

    const host = mount.querySelector<HTMLElement>("[data-level-host]");
    expect(host).not.toBeNull();
    host?.setAttribute("data-player-x", "742");

    clickMessage("core.message.ui.menu.open");
    const music = getByRole(document.body, "checkbox", {
      name: resolveItalianMessage("core.message.ui.options.music"),
    });
    fireEvent.click(music);

    // The very same node, still carrying the run's position.
    expect(mount.querySelector("[data-level-host]")).toBe(host);
    expect(host?.getAttribute("data-player-x")).toBe("742");
    // …and the port heard about it.
    expect(audio.setMusicEnabled).toHaveBeenLastCalledWith(false);
  });

  it("applies text scale and contrast on the root without remounting (ADR-053)", () => {
    const { mount } = prepareDocument();
    stubCanvasContext();
    createGameController({
      document,
      mount,
      analytics: { track: vi.fn() },
      save: new MemorySave(),
      audio: createAudio(),
      bestScore: createBestScore(),
      levelRecords: createLevelRecords(),
    });
    pickRole();
    const host = mount.querySelector<HTMLElement>("[data-level-host]");
    host?.setAttribute("data-player-x", "500");
    expect(document.documentElement.dataset.textScale).toBe("medium");

    clickMessage("core.message.ui.menu.open");
    const large = document.querySelector<HTMLInputElement>(
      'input[type="radio"][name="text-scale"][value="large"]',
    );
    if (large === null) {
      throw new Error("Text scale radio unavailable.");
    }
    fireEvent.click(large);
    const contrast = getByRole<HTMLInputElement>(document.body, "checkbox", {
      name: resolveItalianMessage("core.message.ui.options.contrast"),
    });
    contrast.checked = true;
    fireEvent.change(contrast);

    // The root carries both, and the level never noticed.
    expect(document.documentElement.dataset.textScale).toBe("large");
    expect(document.documentElement.dataset.contrast).toBe("high");
    expect(mount.querySelector("[data-level-host]")).toBe(host);
    expect(host?.getAttribute("data-player-x")).toBe("500");
  });

  it("rebuilds the level when the role changes, because the power changes", () => {
    // The counterpart: a role swap genuinely needs a remount (ADR-050), so
    // the exception stays as narrow as the reason for it.
    const { mount } = prepareDocument();
    stubCanvasContext();
    createGameController({
      document,
      mount,
      analytics: { track: vi.fn() },
      save: new MemorySave(),
      audio: createAudio(),
      bestScore: createBestScore(),
      levelRecords: createLevelRecords(),
    });
    pickRole();
    const host = mount.querySelector<HTMLElement>("[data-level-host]");

    clickMessage("core.message.ui.menu.open");
    fireEvent.click(radio("role", "hunter"));
    expect(mount.querySelector("[data-level-host]")).not.toBe(host);
  });

  it("makes the game inert and closes on Escape while the menu is open", () => {
    const { mount } = prepareDocument();
    stubCanvasContext();
    createGameController({
      document,
      mount,
      analytics: { track: vi.fn() },
      save: new MemorySave(),
      audio: createAudio(),
      bestScore: createBestScore(),
      levelRecords: createLevelRecords(),
    });
    pickRole();

    clickMessage("core.message.ui.menu.open");
    // Tab and screen readers must not reach the game under the overlay.
    expect(mount.querySelector(".stage")?.hasAttribute("inert")).toBe(true);
    expect(mount.querySelector(".hud")?.hasAttribute("inert")).toBe(true);

    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: "Escape",
      bubbles: true,
    });
    expect(mount.querySelector<HTMLElement>("[data-menu]")?.hidden).toBe(true);
    expect(mount.querySelector(".stage")?.hasAttribute("inert")).toBe(false);
  });

  it("pauses by name and restarts the attempt from the menu (ADR-051)", () => {
    const { mount } = prepareDocument();
    stubCanvasContext();
    createGameController({
      document,
      mount,
      analytics: { track: vi.fn() },
      save: new MemorySave(),
      audio: createAudio(),
      bestScore: createBestScore(),
      levelRecords: createLevelRecords(),
    });
    pickRole();
    const host = mount.querySelector<HTMLElement>("[data-level-host]");
    host?.setAttribute("data-player-x", "300");

    clickMessage("core.message.ui.menu.open");
    // With a level alive behind it, the menu is the pause and says so.
    expect(
      getByRole(document.body, "heading", {
        name: resolveItalianMessage("core.message.ui.menu.paused"),
      }),
    ).not.toBeNull();

    clickMessage("core.message.ui.menu.restart-level");
    // Menu closed, same host, attempt reset to the spawn.
    expect(mount.querySelector<HTMLElement>("[data-menu]")?.hidden).toBe(true);
    expect(mount.querySelector("[data-level-host]")).toBe(host);
    expect(host?.getAttribute("data-player-x")).toBe("14");
  });

  it("fills the Collection as levels are finished, and clears with the data (ADR-057)", () => {
    const { mount } = prepareDocument();
    stubCanvasContext();
    const levelRecords = createLevelRecords();
    levelRecords.record("core.level.campi-di-montichiari", {
      score: 1740,
      clues: 3,
      totalClues: 3,
      bonusCollected: false,
      cameoSeen: true,
      unscathed: true,
    });
    createGameController({
      document,
      mount,
      analytics: { track: vi.fn() },
      save: new MemorySave(),
      audio: createAudio(),
      bestScore: createBestScore(),
      levelRecords,
    });
    pickRole();

    clickMessage("core.message.ui.menu.open");
    const menu = mount.querySelector<HTMLElement>("[data-menu]");
    // Ten rows, one per level, numbered from the story graph.
    expect(menu?.querySelectorAll(".collection__row")).toHaveLength(10);
    // The one played level shows what it earned; the rest wait.
    expect(menu?.textContent).toContain("Record 1740");
    expect(menu?.textContent).toContain(
      resolveItalianMessage("core.message.ui.collection.cameo"),
    );
    expect(menu?.textContent).not.toContain(
      resolveItalianMessage("core.message.ui.collection.star"),
    );
    expect(menu?.textContent).toContain(
      resolveItalianMessage("core.message.ui.collection.pending"),
    );

    // Clearing local data empties the archive too, like the personal best.
    clickMessage("core.message.ui.clear-save");
    expect(levelRecords.load()).toEqual({});
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
      levelRecords: createLevelRecords(),
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
      levelRecords: createLevelRecords(),
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
        bonusCollected: true,
        cameoSeen: true,
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

    // Two real canvases with accessible names: the score card and the
    // completion meme card (ADR-049).
    const card = mount.querySelector<HTMLCanvasElement>(
      `canvas[aria-label="${resolveItalianMessage("core.message.ui.score.card-alt")}"]`,
    );
    expect(card).toBeInstanceOf(HTMLCanvasElement);
    expect(card?.getAttribute("role")).toBe("img");
    expect(
      mount.querySelector(
        `canvas[aria-label="${resolveItalianMessage("core.message.ui.meme.card-alt")}"]`,
      ),
    ).toBeInstanceOf(HTMLCanvasElement);
    expect(canvasStub.texts).toContain("1730");
    expect(canvasStub.texts).toContain("3/3");
    expect(canvasStub.texts).toContain("47s");
    expect(canvasStub.texts).toContain(
      resolveItalianMessage("core.message.ui.card.record"),
    );
    expect(canvasStub.texts).toContain(
      resolveItalianMessage("core.message.ui.role-select.varano.title"),
    );

    // The game is concluded (ADR-049): no next-episode promise — instead
    // the completion meme card, shareable like the score card.
    expect(mount.textContent).not.toContain("PROSSIMO EPISODIO");
    expect(
      queryByRole(document.body, "button", {
        name: resolveItalianMessage("core.message.ui.meme.share"),
      }),
    ).not.toBeNull();
    expect(
      mount.querySelector(
        `canvas[aria-label="${resolveItalianMessage("core.message.ui.meme.card-alt")}"]`,
      ),
    ).not.toBeNull();
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

    const onShareAttempt = vi.fn();
    renderEndingWithScore(mount, { onShareAttempt });
    clickMessage("core.message.ui.score.share");
    expect(onShareAttempt).toHaveBeenCalledOnce();
    await vi.waitFor(() => {
      expect(share).toHaveBeenCalledOnce();
    });

    const payload = share.mock.calls[0]?.[0];
    expect(payload?.files?.[0]?.type).toBe("image/png");
    expect(payload?.text).toContain("1730");
    expect(payload?.text).toContain("3/3");
    await vi.waitFor(() => {
      const notices = document.body.querySelectorAll('[role="status"]');
      expect(
        [...notices].some(
          (notice) =>
            notice.textContent ===
            resolveItalianMessage("core.message.ui.score.shared"),
        ),
      ).toBe(true);
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
      const notices = document.body.querySelectorAll('[role="status"]');
      expect(
        [...notices].some(
          (notice) =>
            notice.textContent ===
            resolveItalianMessage("core.message.ui.score.copied"),
        ),
      ).toBe(true);
    });
  });
});
