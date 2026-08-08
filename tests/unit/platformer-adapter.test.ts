// @vitest-environment jsdom

import { fireEvent, getByRole } from "@testing-library/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createInitialState } from "../../src/core/game-state";
import type { Role } from "../../src/core/model";
import {
  platformerMiniGame,
  type PlatformerViewConfig,
} from "../../src/levels/adapters/platformer";
import type {
  LevelAudioPort,
  LevelOutcome,
  MiniGameRequest,
} from "../../src/levels/contract";
import { campiLevelConfig, registeredLevels } from "../../src/levels/registry";
import { stubCanvasContext } from "./helpers/canvas-stub";

type FrameCallback = (time: number) => void;

interface FrameHarness {
  run(frames: number, frameMs?: number): void;
}

function installFrameHarness(): FrameHarness {
  let queue: FrameCallback[] = [];
  let now = 0;
  Object.defineProperty(window, "requestAnimationFrame", {
    configurable: true,
    value: vi.fn((callback: FrameCallback) => {
      queue.push(callback);
      return queue.length;
    }),
  });
  Object.defineProperty(window, "cancelAnimationFrame", {
    configurable: true,
    value: vi.fn(() => {
      queue = [];
    }),
  });
  return {
    run(frames: number, frameMs = 16): void {
      for (let index = 0; index < frames; index += 1) {
        const callbacks = queue;
        queue = [];
        now += frameMs;
        for (const callback of callbacks) {
          callback(now);
        }
        if (queue.length === 0) {
          return;
        }
      }
    },
  };
}

function createAudio(): LevelAudioPort {
  return {
    startMusic: vi.fn<LevelAudioPort["startMusic"]>(),
    stopMusic: vi.fn<LevelAudioPort["stopMusic"]>(),
    playEffect: vi.fn<LevelAudioPort["playEffect"]>(),
  };
}

function createRequest(
  overrides: Partial<PlatformerViewConfig> = {},
  role: Role = "varano",
): MiniGameRequest<PlatformerViewConfig> {
  return {
    levelId: "core.level.campi-di-montichiari",
    configId: "core.level-config.campi-1",
    config: { ...campiLevelConfig, ...overrides },
    role,
    settings: createInitialState().settings,
    message: (key) => key,
    audio: createAudio(),
    onComplete: vi.fn(),
    onExit: vi.fn(),
  };
}

describe("platformer canvas adapter", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    stubCanvasContext();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("mounts canvas, accessible controls, status and narrative", () => {
    const harness = installFrameHarness();
    const host = document.createElement("div");
    document.body.append(host);
    const request = createRequest();
    const handle = platformerMiniGame.mount(host, request);

    expect(host.querySelector("canvas")).toBeInstanceOf(HTMLCanvasElement);
    // Music waits for the first user gesture (autoplay policy).
    expect(request.audio.startMusic).not.toHaveBeenCalled();
    for (const name of [
      "core.message.level.control.left",
      "core.message.level.control.right",
      "core.message.level.control.jump",
    ]) {
      expect(getByRole(host, "button", { name })).toBeInstanceOf(
        HTMLButtonElement,
      );
    }
    // Status carries the clue count and, since ADR-041, the lives left.
    expect(getByRole(host, "status").textContent).toBe(
      "core.message.level.status.0 core.message.level.lives",
    );
    expect(host.dataset.lives).toBe("3");
    expect(host.querySelector(".arcade-narrative")?.textContent).toBe(
      "core.message.level.narrative.start",
    );
    const viewport = host.querySelector<HTMLElement>(".arcade-viewport");
    expect(viewport?.getAttribute("aria-label")).toBe(
      "core.message.level.objective",
    );

    harness.run(3);
    expect(host.dataset.playerX).toBeDefined();

    handle.destroy();
    expect(request.audio.stopMusic).toHaveBeenCalled();
  });

  it("ends the attempt with a KO card and restarts it in place (ADR-041)", () => {
    const harness = installFrameHarness();
    const host = document.createElement("div");
    document.body.append(host);
    // Two lives over a walkable ledge: two walk-offs end the attempt.
    const request = createRequest({
      lives: 2,
      groundSegments: [
        { x: 0, width: 60 },
        { x: 200, width: 200 },
      ],
      platforms: [],
      pickups: [],
      checkpoints: [],
      cars: [],
      finishX: 380,
    });
    const handle = platformerMiniGame.mount(host, request);

    expect(host.dataset.lives).toBe("2");
    fireEvent.keyDown(window, { key: "ArrowRight" });
    harness.run(400);

    // First fall: one life gone, back at the start, still playing.
    // Second fall: the KO card, with the focus on «Riprova il livello».
    expect(host.dataset.lives).toBe("0");
    const card = host.querySelector<HTMLElement>(".arcade-gameover");
    expect(card).not.toBeNull();
    expect(card?.getAttribute("role")).toBe("dialog");
    expect(card?.textContent).toContain("core.message.level.gameover.title");
    expect(document.activeElement?.textContent).toBe(
      "core.message.level.gameover.retry",
    );
    // The equivalent skip stays available right on the card (ADR-018). The
    // standalone host renders no HUD, so this is the card's own button.
    expect(
      getByRole(host, "button", { name: "core.message.level.skip" }),
    ).toBeInstanceOf(HTMLButtonElement);

    // «Riprova il livello» is a fresh attempt: full lives, card gone.
    fireEvent.keyUp(window, { key: "ArrowRight" });
    fireEvent.click(
      getByRole(host, "button", { name: "core.message.level.gameover.retry" }),
    );
    expect(host.querySelector(".arcade-gameover")).toBeNull();
    expect(host.dataset.lives).toBe("2");

    // A second KO: this time the player skips with the same narrative exit.
    fireEvent.keyDown(window, { key: "ArrowRight" });
    harness.run(400);
    expect(host.querySelector(".arcade-gameover")).not.toBeNull();
    fireEvent.click(
      getByRole(host, "button", { name: "core.message.level.skip" }),
    );
    expect(request.onExit).toHaveBeenCalledOnce();
    expect(request.onComplete).not.toHaveBeenCalled();
    handle.destroy();
  });

  it("draws the long-night variants before any level ships them (ADR-045)", () => {
    // The ADR-033 lesson: a variant nobody exercises is a crash waiting for
    // the level that uses it. Reed beds, the clothesline, nutrias and cages
    // arrive with chapters c05-c09; their rendering is proven here first.
    const harness = installFrameHarness();
    const host = document.createElement("div");
    document.body.append(host);
    const handle = platformerMiniGame.mount(
      host,
      createRequest({
        backdrop: {
          sky: ["#050810", "#0a1020", "#101828"],
          night: true,
          far: "hills",
          near: "reeds",
        },
        obstacles: [
          {
            id: "nutria-1",
            kind: "onlooker",
            x: 300,
            y: 128,
            width: 22,
            height: 26,
          },
          {
            id: "gabbia-1",
            kind: "drone",
            x: 380,
            y: 124,
            width: 30,
            height: 26,
          },
        ],
        obstacleLooks: { "nutria-1": "nutria", "gabbia-1": "cage" },
      }),
    );
    harness.run(4);
    expect(host.querySelector("canvas")).toBeInstanceOf(HTMLCanvasElement);
    handle.destroy();
    host.remove();

    const laundryHarness = installFrameHarness();
    const laundryHost = document.createElement("div");
    document.body.append(laundryHost);
    const laundryHandle = platformerMiniGame.mount(
      laundryHost,
      createRequest({
        backdrop: {
          sky: ["#0d1430", "#152a4c", "#24405e"],
          night: true,
          far: "rooftops",
          near: "laundry",
        },
      }),
    );
    laundryHarness.run(4);
    expect(laundryHost.querySelector("canvas")).toBeInstanceOf(
      HTMLCanvasElement,
    );
    laundryHandle.destroy();
    laundryHost.remove();
  });

  it("renders every registered level's backdrop without failing", () => {
    // Each level uses different parallax layers (ADR-033); a variant nobody
    // exercises is a crash waiting for the level that uses it.
    for (const level of registeredLevels) {
      const harness = installFrameHarness();
      const host = document.createElement("div");
      document.body.append(host);
      const handle = platformerMiniGame.mount(host, {
        levelId: level.levelId,
        configId: level.configId,
        config: level.config,
        role: "varano",
        settings: createInitialState().settings,
        message: (key) => key,
        audio: createAudio(),
        onComplete: vi.fn(),
        onExit: vi.fn(),
      });
      harness.run(4);
      expect(host.querySelector("canvas"), level.levelId).toBeInstanceOf(
        HTMLCanvasElement,
      );
      handle.destroy();
      host.remove();
    }
  });

  it("draws the scent and call rings without a real canvas", () => {
    // These powers stroke arcs, a path no other test reaches.
    for (const kind of ["scent", "call"] as const) {
      const harness = installFrameHarness();
      const host = document.createElement("div");
      document.body.append(host);
      const handle = platformerMiniGame.mount(
        host,
        createRequest(
          {
            power: { kind, chargeSeconds: 0.05, radius: 50 },
            powersByRole: {
              hunter: {
                power: { kind, chargeSeconds: 0.05, radius: 50 },
                labelKey: "power.label",
                narrativeKey: "power.narrative",
              },
            },
          },
          "hunter",
        ),
      );
      harness.run(2);
      fireEvent.keyDown(window, { key: "Shift" });
      harness.run(30);
      expect(host.dataset.powerActive, kind).toBe("true");
      fireEvent.keyUp(window, { key: "Shift" });
      handle.destroy();
      host.remove();
    }
  });

  it("shows no power button on a level without a superpower", () => {
    installFrameHarness();
    const host = document.createElement("div");
    document.body.append(host);
    // Level 1 and level 2 keep their three controls and their wider targets.
    const handle = platformerMiniGame.mount(host, createRequest());

    expect(host.querySelector(".arcade-control--power")).toBeNull();
    expect(host.dataset.powerActive).toBeUndefined();
    handle.destroy();
  });

  it("names the power button after the role's own superpower", () => {
    installFrameHarness();
    const host = document.createElement("div");
    document.body.append(host);
    const handle = platformerMiniGame.mount(
      host,
      createRequest(
        {
          powersByRole: {
            hunter: {
              power: { kind: "scent", chargeSeconds: 0.4, radius: 52 },
              labelKey: "power.hunter.label",
              narrativeKey: "power.hunter.narrative",
            },
          },
        },
        "hunter",
      ),
    );

    // A held gesture would have had no accessible name at all (ADR-031).
    expect(
      getByRole(host, "button", { name: "power.hunter.label" }),
    ).toBeInstanceOf(HTMLButtonElement);
    handle.destroy();
  });

  it("engages the power from the keyboard and narrates it", () => {
    const harness = installFrameHarness();
    const host = document.createElement("div");
    document.body.append(host);
    const request = createRequest(
      {
        powersByRole: {
          varano: {
            power: {
              kind: "sprint",
              chargeSeconds: 0.2,
              maxSpeed: 235,
              acceleration: 620,
            },
            labelKey: "power.varano.label",
            narrativeKey: "power.varano.narrative",
          },
        },
        power: {
          kind: "sprint",
          chargeSeconds: 0.2,
          maxSpeed: 235,
          acceleration: 620,
        },
      },
      "varano",
    );
    const handle = platformerMiniGame.mount(host, request);

    harness.run(2);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: "Shift" });
    harness.run(40);

    expect(host.dataset.powerActive).toBe("true");
    expect(request.audio.playEffect).toHaveBeenCalledWith("power");
    expect(host.querySelector(".arcade-narrative")?.textContent).toBe(
      "power.varano.narrative",
    );

    // Releasing discharges it, and Shift keeps working for Shift+Tab.
    fireEvent.keyUp(window, { key: "Shift" });
    harness.run(4);
    expect(host.dataset.powerActive).toBe("false");
    handle.destroy();
  });

  it("moves with the keyboard, starts music on input and plays the jump effect", () => {
    const harness = installFrameHarness();
    const host = document.createElement("div");
    document.body.append(host);
    const request = createRequest();
    const handle = platformerMiniGame.mount(host, request);

    harness.run(2);
    const initialX = Number(host.dataset.playerX);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(request.audio.startMusic).toHaveBeenCalledOnce();
    harness.run(30);
    expect(Number(host.dataset.playerX)).toBeGreaterThan(initialX);
    fireEvent.keyUp(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    fireEvent.keyUp(window, { key: "ArrowLeft" });
    expect(request.audio.startMusic).toHaveBeenCalledOnce();

    fireEvent.keyDown(window, { key: " " });
    harness.run(4);
    expect(request.audio.playEffect).toHaveBeenCalledWith("jump");
    fireEvent.keyUp(window, { key: " " });
    harness.run(90);

    // Keys targeted at buttons are ignored so Space can activate them.
    const leftControl = getByRole(host, "button", {
      name: "core.message.level.control.left",
    });
    const before = Number(host.dataset.playerX);
    fireEvent.keyDown(leftControl, { key: "ArrowRight" });
    harness.run(10);
    fireEvent.keyUp(window, { key: "ArrowRight" });
    expect(Number(host.dataset.playerX)).toBe(before);

    handle.destroy();
    fireEvent.keyDown(window, { key: "ArrowRight" });
    harness.run(2);
  });

  it("drives touch input through pointer events", () => {
    const harness = installFrameHarness();
    const host = document.createElement("div");
    document.body.append(host);
    const request = createRequest();
    const handle = platformerMiniGame.mount(host, request);

    const right = getByRole(host, "button", {
      name: "core.message.level.control.right",
    });
    right.setPointerCapture = vi.fn();
    harness.run(2);
    const initialX = Number(host.dataset.playerX);
    fireEvent.pointerDown(right, { pointerId: 1 });
    harness.run(30);
    fireEvent.pointerUp(right, { pointerId: 1 });
    expect(Number(host.dataset.playerX)).toBeGreaterThan(initialX);

    handle.destroy();
  });

  it("completes the run and reports it once after the celebration delay", () => {
    const harness = installFrameHarness();
    const host = document.createElement("div");
    document.body.append(host);
    const onComplete = vi.fn<(outcome: LevelOutcome) => void>();
    const request = {
      ...createRequest({
        groundSegments: [{ x: 0, width: 400 }],
        platforms: [],
        pickups: [],
        checkpoints: [],
        finishX: 90,
        worldWidth: 400,
      }),
      onComplete,
    };
    const handle = platformerMiniGame.mount(host, request);

    fireEvent.keyDown(window, { key: "ArrowRight" });
    harness.run(240);
    expect(request.audio.playEffect).toHaveBeenCalledWith("finish");
    expect(onComplete).not.toHaveBeenCalled();
    vi.advanceTimersByTime(800);
    expect(onComplete).toHaveBeenCalledOnce();

    const outcome = onComplete.mock.calls[0]?.[0];
    expect(outcome?.score).toBeGreaterThanOrEqual(0);
    expect(outcome?.clues).toBe(0);
    expect(outcome?.totalClues).toBe(0);
    expect(outcome?.respawns).toBe(0);
    expect(outcome?.seconds).toBeGreaterThanOrEqual(0);

    vi.advanceTimersByTime(800);
    expect(onComplete).toHaveBeenCalledOnce();

    handle.destroy();
  });

  it("pauses and resumes the frame loop", () => {
    const harness = installFrameHarness();
    const host = document.createElement("div");
    document.body.append(host);
    const request = createRequest();
    const handle = platformerMiniGame.mount(host, request);

    harness.run(2);
    handle.pause();
    const paused = Number(host.dataset.playerX);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    harness.run(10);
    expect(Number(host.dataset.playerX)).toBe(paused);

    handle.resume();
    harness.run(30);
    expect(Number(host.dataset.playerX)).toBeGreaterThan(paused);
    fireEvent.keyUp(window, { key: "ArrowRight" });
    handle.destroy();
  });

  it("throws without a browser window", () => {
    const host = document.createElement("div");
    Object.defineProperty(host, "ownerDocument", {
      value: { defaultView: null },
    });
    expect(() => platformerMiniGame.mount(host, createRequest())).toThrow(
      "browser window",
    );
  });
});
