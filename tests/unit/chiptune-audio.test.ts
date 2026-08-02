// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ChiptuneAudio,
  NoopGameAudio,
  type GameAudio,
  type GameSoundEffect,
} from "../../src/platform/audio/chiptune-audio";

interface FakeContextLog {
  oscillatorsStarted: number;
  gainsCreated: number;
  resumed: number;
}

function installFakeAudioContext(
  log: FakeContextLog,
  options: { state?: AudioContextState; failConstruction?: boolean } = {},
): void {
  const param = (): Record<string, unknown> => ({
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  });

  class FakeAudioContext {
    currentTime = 0;
    state = options.state ?? "running";
    destination = {};

    constructor() {
      if (options.failConstruction === true) {
        throw new Error("Web Audio unavailable");
      }
    }

    resume(): Promise<void> {
      log.resumed += 1;
      this.state = "running";
      return Promise.resolve();
    }

    createGain(): Record<string, unknown> {
      log.gainsCreated += 1;
      return { gain: param(), connect: vi.fn() };
    }

    createOscillator(): Record<string, unknown> {
      return {
        type: "sine",
        frequency: param(),
        connect: vi.fn(),
        start: vi.fn(() => {
          log.oscillatorsStarted += 1;
        }),
        stop: vi.fn(),
      };
    }
  }

  Object.defineProperty(window, "AudioContext", {
    configurable: true,
    value: FakeAudioContext,
  });
}

describe("chiptune audio adapter", () => {
  let log: FakeContextLog;

  beforeEach(() => {
    log = { oscillatorsStarted: 0, gainsCreated: 0, resumed: 0 };
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("schedules looping music only while enabled", () => {
    installFakeAudioContext(log);
    const audio = new ChiptuneAudio(window, true, true);

    audio.startMusic();
    expect(log.gainsCreated).toBeGreaterThanOrEqual(2);
    const initialNotes = log.oscillatorsStarted;
    expect(initialNotes).toBeGreaterThan(0);

    audio.startMusic();
    expect(log.oscillatorsStarted).toBe(initialNotes);

    audio.stopMusic();
    const stoppedNotes = log.oscillatorsStarted;
    vi.advanceTimersByTime(1000);
    expect(log.oscillatorsStarted).toBe(stoppedNotes);
  });

  it("does not create an audio context while music is disabled", () => {
    installFakeAudioContext(log);
    const audio = new ChiptuneAudio(window, false, true);
    audio.startMusic();
    expect(log.gainsCreated).toBe(0);

    audio.setMusicEnabled(true);
    audio.startMusic();
    expect(log.oscillatorsStarted).toBeGreaterThan(0);

    audio.setMusicEnabled(false);
    const notes = log.oscillatorsStarted;
    vi.advanceTimersByTime(1000);
    expect(log.oscillatorsStarted).toBe(notes);
  });

  it("plays every effect and honours the effects toggle", () => {
    installFakeAudioContext(log);
    const audio = new ChiptuneAudio(window, false, true);
    const effects: readonly GameSoundEffect[] = [
      "jump",
      "pickup",
      "checkpoint",
      "respawn",
      "finish",
      "select",
    ];
    for (const effect of effects) {
      audio.playEffect(effect);
    }
    const played = log.oscillatorsStarted;
    expect(played).toBeGreaterThanOrEqual(effects.length);

    audio.setEffectsEnabled(false);
    audio.playEffect("jump");
    expect(log.oscillatorsStarted).toBe(played);
  });

  it("resumes a suspended context on the next user gesture", () => {
    installFakeAudioContext(log, { state: "suspended" });
    const audio = new ChiptuneAudio(window, true, true);
    audio.playEffect("select");
    audio.playEffect("select");
    expect(log.resumed).toBeGreaterThan(0);
  });

  it("degrades to silence when Web Audio is unavailable", () => {
    installFakeAudioContext(log, { failConstruction: true });
    const audio = new ChiptuneAudio(window, true, true);
    expect(() => {
      audio.startMusic();
      audio.playEffect("jump");
      audio.stopMusic();
    }).not.toThrow();
    expect(log.oscillatorsStarted).toBe(0);
  });

  it("keeps the noop adapter inert", () => {
    const audio: GameAudio = new NoopGameAudio();
    expect(() => {
      audio.setMusicEnabled(true);
      audio.setEffectsEnabled(true);
      audio.startMusic();
      audio.playEffect("finish");
      audio.stopMusic();
    }).not.toThrow();
  });
});
