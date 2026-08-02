export type GameSoundEffect =
  "jump" | "pickup" | "checkpoint" | "respawn" | "finish" | "sprint" | "select";

export interface GameAudio {
  readonly setMusicEnabled: (enabled: boolean) => void;
  readonly setEffectsEnabled: (enabled: boolean) => void;
  readonly startMusic: () => void;
  readonly stopMusic: () => void;
  readonly playEffect: (effect: GameSoundEffect) => void;
}

export class NoopGameAudio implements GameAudio {
  setMusicEnabled(): void {
    // Audio is optional; the game never depends on it.
  }
  setEffectsEnabled(): void {
    // Audio is optional; the game never depends on it.
  }
  startMusic(): void {
    // Audio is optional; the game never depends on it.
  }
  stopMusic(): void {
    // Audio is optional; the game never depends on it.
  }
  playEffect(): void {
    // Audio is optional; the game never depends on it.
  }
}

const tempoBeatsPerMinute = 108;
const stepSeconds = 60 / tempoBeatsPerMinute / 2;
const schedulerIntervalMs = 80;
const lookAheadSeconds = 0.2;

function noteFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Original 4-bar loop in A minor: lead melody and bass roots A, F, G, E.
const leadPattern: readonly number[] = [
  69, 0, 72, 74, 76, 0, 74, 72, 69, 0, 67, 69, 64, 0, 67, 0, 65, 0, 69, 72, 71,
  0, 69, 67, 69, 0, 76, 0, 74, 72, 71, 69,
];
const bassPattern: readonly number[] = [
  45, 0, 57, 0, 45, 0, 52, 0, 41, 0, 53, 0, 41, 0, 48, 0, 43, 0, 55, 0, 43, 0,
  50, 0, 40, 0, 52, 0, 40, 47, 0, 0,
];

export class ChiptuneAudio implements GameAudio {
  private readonly view: Window & typeof globalThis;
  private context: AudioContext | undefined;
  private masterGain: GainNode | undefined;
  private musicGain: GainNode | undefined;
  private musicEnabled: boolean;
  private effectsEnabled: boolean;
  private schedulerId: number | undefined;
  private nextStepTime = 0;
  private stepIndex = 0;

  constructor(
    view: Window & typeof globalThis,
    musicEnabled: boolean,
    effectsEnabled: boolean,
  ) {
    this.view = view;
    this.musicEnabled = musicEnabled;
    this.effectsEnabled = effectsEnabled;
  }

  private ensureContext(): AudioContext | undefined {
    if (this.context !== undefined) {
      if (this.context.state === "suspended") {
        void this.context.resume();
      }
      return this.context;
    }

    let context: AudioContext;
    try {
      context = new this.view.AudioContext();
    } catch {
      return undefined;
    }
    const masterGain = context.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(context.destination);
    const musicGain = context.createGain();
    musicGain.gain.value = 0.14;
    musicGain.connect(masterGain);
    this.context = context;
    this.masterGain = masterGain;
    this.musicGain = musicGain;
    return context;
  }

  private playNote(
    destination: AudioNode,
    type: OscillatorType,
    frequency: number,
    startTime: number,
    duration: number,
    peakGain: number,
    endFrequency?: number,
  ): void {
    const context = this.context;
    if (context === undefined) {
      return;
    }
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    if (endFrequency !== undefined) {
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(1, endFrequency),
        startTime + duration,
      );
    }
    envelope.gain.setValueAtTime(0, startTime);
    envelope.gain.linearRampToValueAtTime(peakGain, startTime + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    oscillator.connect(envelope);
    envelope.connect(destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.02);
  }

  private scheduleMusicSteps(): void {
    const context = this.context;
    const musicGain = this.musicGain;
    if (context === undefined || musicGain === undefined) {
      return;
    }

    while (this.nextStepTime < context.currentTime + lookAheadSeconds) {
      const step = this.stepIndex % leadPattern.length;
      const lead = leadPattern[step];
      const bass = bassPattern[step];
      if (lead !== undefined && lead > 0) {
        this.playNote(
          musicGain,
          "square",
          noteFrequency(lead),
          this.nextStepTime,
          stepSeconds * 0.9,
          0.5,
        );
      }
      if (bass !== undefined && bass > 0) {
        this.playNote(
          musicGain,
          "triangle",
          noteFrequency(bass),
          this.nextStepTime,
          stepSeconds * 0.95,
          0.9,
        );
      }
      this.nextStepTime += stepSeconds;
      this.stepIndex += 1;
    }
  }

  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopMusic();
    }
  }

  setEffectsEnabled(enabled: boolean): void {
    this.effectsEnabled = enabled;
  }

  startMusic(): void {
    if (!this.musicEnabled || this.schedulerId !== undefined) {
      return;
    }
    const context = this.ensureContext();
    if (context === undefined) {
      return;
    }
    this.nextStepTime = context.currentTime + 0.05;
    this.stepIndex = 0;
    this.scheduleMusicSteps();
    this.schedulerId = this.view.setInterval(() => {
      this.scheduleMusicSteps();
    }, schedulerIntervalMs);
  }

  stopMusic(): void {
    if (this.schedulerId !== undefined) {
      this.view.clearInterval(this.schedulerId);
      this.schedulerId = undefined;
    }
  }

  playEffect(effect: GameSoundEffect): void {
    if (!this.effectsEnabled) {
      return;
    }
    const context = this.ensureContext();
    const masterGain = this.masterGain;
    if (context === undefined || masterGain === undefined) {
      return;
    }
    const now = context.currentTime;

    switch (effect) {
      case "jump":
        this.playNote(masterGain, "square", 180, now, 0.12, 0.08, 420);
        return;
      case "pickup":
        this.playNote(masterGain, "triangle", 880, now, 0.07, 0.12);
        this.playNote(masterGain, "triangle", 1318, now + 0.07, 0.12, 0.12);
        return;
      case "checkpoint":
        this.playNote(masterGain, "triangle", 523, now, 0.07, 0.1);
        this.playNote(masterGain, "triangle", 659, now + 0.07, 0.07, 0.1);
        this.playNote(masterGain, "triangle", 784, now + 0.14, 0.12, 0.1);
        return;
      case "respawn":
        this.playNote(masterGain, "square", 300, now, 0.18, 0.05, 150);
        return;
      case "sprint":
        // A rising whoosh: the run superpower kicking in.
        this.playNote(masterGain, "square", 420, now, 0.16, 0.06, 900);
        this.playNote(masterGain, "triangle", 660, now + 0.05, 0.14, 0.07);
        return;
      case "finish":
        this.playNote(masterGain, "square", 523, now, 0.09, 0.09);
        this.playNote(masterGain, "square", 659, now + 0.09, 0.09, 0.09);
        this.playNote(masterGain, "square", 784, now + 0.18, 0.09, 0.09);
        this.playNote(masterGain, "square", 1046, now + 0.27, 0.24, 0.1);
        this.playNote(masterGain, "triangle", 262, now + 0.27, 0.3, 0.12);
        return;
      case "select":
        this.playNote(masterGain, "square", 660, now, 0.05, 0.06);
        return;
    }
  }
}
