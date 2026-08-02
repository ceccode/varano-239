import type { GameState } from "./game-state";

export type AnalyticsEvent =
  { readonly name: "page_view" } | { readonly name: "game_start" };

export interface AnalyticsPort {
  track(event: AnalyticsEvent): void;
}

export interface SavePort {
  load(): GameState | undefined;
  save(state: GameState): void;
  clear(): void;
}
