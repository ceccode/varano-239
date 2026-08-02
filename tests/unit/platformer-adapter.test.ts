// @vitest-environment jsdom

import { fireEvent, getByRole } from "@testing-library/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createInitialState } from "../../src/core/game-state";
import {
  platformerMiniGame,
  type PlatformerViewConfig,
} from "../../src/levels/adapters/platformer";
import type {
  LevelAudioPort,
  LevelOutcome,
  MiniGameRequest,
} from "../../src/levels/contract";
import { campiLevelConfig } from "../../src/levels/registry";
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
): MiniGameRequest<PlatformerViewConfig> {
  return {
    levelId: "core.level.campi-di-montichiari",
    configId: "core.level-config.campi-1",
    config: { ...campiLevelConfig, ...overrides },
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
    expect(getByRole(host, "status").textContent).toBe(
      "core.message.level.status.0",
    );
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
