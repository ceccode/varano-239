export type GameSoundEffect =
  | "jump"
  | "pickup"
  | "checkpoint"
  | "respawn"
  | "finish"
  | "sprint"
  | "power"
  | "blocked"
  | "select";

/** One looping tune per level (ADR-042/045): ten levels, ten songs. */
export type MusicTrackId =
  | "fields"
  | "chats"
  | "redzone"
  | "lab"
  | "hills"
  | "versions"
  | "dawn"
  | "fanfare"
  | "sunset"
  | "keep";

export interface GameAudio {
  readonly setMusicEnabled: (enabled: boolean) => void;
  readonly setEffectsEnabled: (enabled: boolean) => void;
  /**
   * Starts the given track; the original A-minor loop when omitted or
   * unknown. The name is a plain string so the levels layer never has to
   * import audio types (the port stays small).
   */
  readonly startMusic: (track?: string) => void;
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

const schedulerIntervalMs = 80;
const lookAheadSeconds = 0.2;

function noteFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

interface MusicTrack {
  readonly beatsPerMinute: number;
  readonly leadType: OscillatorType;
  readonly bassType: OscillatorType;
  /** 32 steps (two per beat): a 4-bar loop. 0 is a rest. */
  readonly lead: readonly number[];
  readonly bass: readonly number[];
}

/**
 * Five original 4-bar chiptune loops, one per level (ADR-042). `fields` is
 * the shipped A-minor loop, untouched: level 1 must sound exactly as it
 * always has. Everything is synthesised at runtime — no files, no deps.
 */
const musicTracks: Readonly<Record<MusicTrackId, MusicTrack>> = {
  // 2:39 in the fields: the original loop in A minor, lead over A, F, G, E.
  fields: {
    beatsPerMinute: 108,
    leadType: "square",
    bassType: "triangle",
    lead: [
      69, 0, 72, 74, 76, 0, 74, 72, 69, 0, 67, 69, 64, 0, 67, 0, 65, 0, 69, 72,
      71, 0, 69, 67, 69, 0, 76, 0, 74, 72, 71, 69,
    ],
    bass: [
      45, 0, 57, 0, 45, 0, 52, 0, 41, 0, 53, 0, 41, 0, 48, 0, 43, 0, 55, 0, 43,
      0, 50, 0, 40, 0, 52, 0, 40, 47, 0, 0,
    ],
  },
  // The village chats at 2:41: fast, jittery E minor — eighty messages a
  // minute and everyone typing.
  chats: {
    beatsPerMinute: 132,
    leadType: "square",
    bassType: "square",
    lead: [
      76, 76, 0, 74, 71, 0, 74, 71, 69, 0, 71, 69, 67, 69, 71, 0, 76, 76, 0, 74,
      71, 0, 74, 76, 79, 0, 76, 74, 71, 74, 71, 0,
    ],
    bass: [
      40, 0, 40, 52, 36, 0, 36, 48, 38, 0, 38, 50, 35, 0, 47, 0, 40, 0, 40, 52,
      36, 0, 36, 48, 38, 0, 50, 0, 35, 47, 0, 0,
    ],
  },
  // The sealed zone at 3 a.m.: G minor, a pulsing low end like a search
  // drone sweeping the ditches.
  redzone: {
    beatsPerMinute: 100,
    leadType: "square",
    bassType: "square",
    lead: [
      67, 0, 0, 70, 74, 0, 70, 67, 65, 0, 67, 0, 62, 0, 0, 0, 67, 0, 0, 70, 74,
      0, 75, 74, 70, 0, 67, 0, 65, 0, 62, 0,
    ],
    bass: [
      31, 31, 0, 31, 31, 0, 31, 0, 29, 29, 0, 29, 34, 0, 34, 0, 31, 31, 0, 31,
      31, 0, 31, 0, 27, 27, 0, 27, 34, 0, 34, 0,
    ],
  },
  // The versions laboratory: a lopsided whole-tone riff — three species, two
  // weights and no certainty anywhere.
  lab: {
    beatsPerMinute: 112,
    leadType: "square",
    bassType: "triangle",
    lead: [
      66, 0, 68, 0, 70, 0, 68, 66, 64, 0, 66, 0, 62, 0, 0, 0, 66, 0, 68, 0, 72,
      0, 70, 68, 66, 0, 64, 0, 62, 0, 60, 0,
    ],
    bass: [
      42, 0, 0, 42, 40, 0, 0, 40, 38, 0, 0, 38, 36, 0, 42, 0, 42, 0, 0, 42, 40,
      0, 0, 40, 38, 0, 36, 0, 38, 0, 0, 0,
    ],
  },
  // First light over the ditches and the reed beds: a slow night pentatonic.
  hills: {
    beatsPerMinute: 92,
    leadType: "triangle",
    bassType: "triangle",
    lead: [
      64, 0, 0, 67, 69, 0, 0, 72, 74, 0, 72, 69, 67, 0, 64, 0, 62, 0, 0, 64, 67,
      0, 0, 69, 72, 0, 69, 67, 64, 0, 62, 0,
    ],
    bass: [
      40, 0, 52, 0, 38, 0, 50, 0, 36, 0, 48, 0, 40, 0, 45, 0, 40, 0, 52, 0, 38,
      0, 50, 0, 36, 0, 48, 0, 40, 45, 0, 0,
    ],
  },
  // The village of versions: a little 3/4 waltz for Ada's clothesline —
  // 24 steps, because the scheduler loops on the pattern's own length.
  versions: {
    beatsPerMinute: 116,
    leadType: "square",
    bassType: "triangle",
    lead: [
      69, 0, 72, 0, 76, 0, 74, 0, 72, 0, 69, 0, 71, 0, 74, 0, 77, 0, 76, 0, 74,
      0, 71, 0,
    ],
    bass: [
      45, 0, 57, 57, 0, 0, 41, 0, 53, 53, 0, 0, 43, 0, 55, 55, 0, 0, 43, 0, 55,
      55, 0, 0,
    ],
  },
  // The last climb to San Pancrazio: a slow chorale that opens with the dawn.
  dawn: {
    beatsPerMinute: 88,
    leadType: "triangle",
    bassType: "triangle",
    lead: [
      62, 0, 0, 0, 66, 0, 0, 0, 69, 0, 0, 66, 71, 0, 0, 0, 74, 0, 0, 71, 69, 0,
      0, 66, 69, 0, 0, 0, 66, 0, 62, 0,
    ],
    bass: [
      38, 0, 45, 0, 42, 0, 50, 0, 45, 0, 54, 0, 43, 0, 50, 0, 38, 0, 45, 0, 42,
      0, 50, 0, 45, 0, 50, 0, 38, 0, 0, 0,
    ],
  },
  // Opening day outside the walls: a bright C-major fanfare for the circus.
  fanfare: {
    beatsPerMinute: 120,
    leadType: "square",
    bassType: "triangle",
    lead: [
      72, 0, 76, 0, 79, 0, 76, 79, 81, 0, 79, 76, 72, 0, 74, 76, 77, 0, 74, 0,
      72, 0, 74, 77, 79, 0, 76, 72, 74, 76, 74, 72,
    ],
    bass: [
      48, 0, 60, 0, 48, 0, 55, 0, 53, 0, 65, 0, 53, 0, 60, 0, 50, 0, 62, 0, 50,
      0, 57, 0, 55, 0, 55, 0, 48, 55, 0, 0,
    ],
  },
  // Golden hour in the park: warm, unhurried D dorian.
  sunset: {
    beatsPerMinute: 96,
    leadType: "triangle",
    bassType: "triangle",
    lead: [
      62, 0, 0, 65, 67, 0, 69, 0, 72, 0, 69, 67, 65, 0, 67, 0, 62, 0, 0, 65, 67,
      0, 69, 72, 74, 0, 72, 69, 67, 0, 65, 0,
    ],
    bass: [
      38, 0, 50, 0, 36, 0, 48, 0, 43, 0, 55, 0, 38, 0, 45, 0, 38, 0, 50, 0, 36,
      0, 48, 0, 43, 0, 55, 0, 38, 45, 0, 0,
    ],
  },
  // Inside the castle: slow, low D minor under the vaults — until the roof.
  keep: {
    beatsPerMinute: 84,
    leadType: "triangle",
    bassType: "square",
    lead: [
      50, 0, 53, 0, 57, 0, 53, 50, 48, 0, 52, 0, 55, 0, 52, 48, 50, 0, 53, 57,
      62, 0, 57, 53, 48, 0, 55, 0, 45, 0, 0, 0,
    ],
    bass: [
      38, 0, 0, 38, 36, 0, 0, 36, 33, 0, 0, 33, 34, 0, 0, 34, 38, 0, 0, 38, 36,
      0, 0, 36, 33, 0, 34, 0, 38, 0, 0, 0,
    ],
  },
};

function isMusicTrackId(value: string | undefined): value is MusicTrackId {
  return value !== undefined && Object.hasOwn(musicTracks, value);
}

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
  private track: MusicTrack = musicTracks.fields;

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

    const track = this.track;
    const stepSeconds = 60 / track.beatsPerMinute / 2;
    while (this.nextStepTime < context.currentTime + lookAheadSeconds) {
      const step = this.stepIndex % track.lead.length;
      const lead = track.lead[step];
      const bass = track.bass[step];
      if (lead !== undefined && lead > 0) {
        this.playNote(
          musicGain,
          track.leadType,
          noteFrequency(lead),
          this.nextStepTime,
          stepSeconds * 0.9,
          0.5,
        );
      }
      if (bass !== undefined && bass > 0) {
        this.playNote(
          musicGain,
          track.bassType,
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

  startMusic(track?: string): void {
    const nextTrack = isMusicTrackId(track)
      ? musicTracks[track]
      : musicTracks.fields;
    if (this.schedulerId !== undefined && this.track !== nextTrack) {
      // A different level asked for its own song: switch cleanly.
      this.stopMusic();
    }
    this.track = nextTrack;
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
      case "power":
        // A chime that opens upward: a role superpower engaging (ADR-031).
        this.playNote(masterGain, "triangle", 523, now, 0.1, 0.09);
        this.playNote(masterGain, "triangle", 784, now + 0.08, 0.1, 0.09);
        this.playNote(masterGain, "square", 1046, now + 0.16, 0.18, 0.06);
        return;
      case "blocked":
        // A soft, low thud: bumping into something costs time, never health.
        this.playNote(masterGain, "triangle", 140, now, 0.1, 0.05, 96);
        return;
      case "select":
        this.playNote(masterGain, "square", 660, now, 0.05, 0.06);
        return;
    }
  }
}
