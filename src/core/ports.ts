import type { GameState } from "./game-state";

export interface AnalyticsEvent {
  readonly name:
    | "page_view"
    | "game_start"
    | "level_1_complete"
    | "level_3_complete"
    | "level_6_complete"
    | "level_10_complete"
    | "game_complete"
    | "share_attempt"
    | "replay_start";
}

export interface AnalyticsPort {
  track(event: AnalyticsEvent): void;
}

export interface SavePort {
  load(): GameState | undefined;
  save(state: GameState): void;
  clear(): void;
}
