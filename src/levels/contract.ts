import type { AccessibilitySettings } from "../core/game-state";
import type { LevelConfigId, LevelId, MessageKey, Role } from "../core/model";

export type LevelSoundEffect =
  | "jump"
  | "pickup"
  | "checkpoint"
  | "respawn"
  | "finish"
  | "sprint"
  | "power"
  | "blocked";

export interface LevelAudioPort {
  /** Starts the level's own track (ADR-042); the default loop when omitted. */
  readonly startMusic: (track?: string) => void;
  readonly stopMusic: () => void;
  readonly playEffect: (effect: LevelSoundEffect) => void;
}

/** What a finished level reports back: enough for a score card, nothing more. */
export interface LevelOutcome {
  readonly score: number;
  readonly clues: number;
  readonly totalClues: number;
  readonly seconds: number;
  readonly respawns: number;
}

export interface MiniGameRequest<Config extends object> {
  readonly levelId: LevelId;
  readonly configId: LevelConfigId;
  readonly config: Readonly<Config>;
  /** Which superpower the level grants, when it gates them per role (ADR-031). */
  readonly role: Role;
  readonly settings: AccessibilitySettings;
  readonly message: (
    key: MessageKey,
    values?: Readonly<Record<string, string | number>>,
  ) => string;
  readonly audio: LevelAudioPort;
  readonly onComplete: (outcome: LevelOutcome) => void;
  readonly onExit: () => void;
}

export interface MiniGameHandle {
  pause(): void;
  resume(): void;
  destroy(): void;
}

export interface MiniGamePort<Config extends object> {
  mount(host: HTMLElement, request: MiniGameRequest<Config>): MiniGameHandle;
}
