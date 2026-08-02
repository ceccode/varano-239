import type { AccessibilitySettings } from "../core/game-state";
import type { LevelConfigId, LevelId, MessageKey } from "../core/model";

export type LevelSoundEffect =
  "jump" | "pickup" | "checkpoint" | "respawn" | "finish";

export interface LevelAudioPort {
  readonly startMusic: () => void;
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
  readonly settings: AccessibilitySettings;
  readonly message: (key: MessageKey) => string;
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
