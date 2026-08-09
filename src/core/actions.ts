import type { GameState } from "./game-state";
import type { HotspotId, OptionId, Role, StoryScope } from "./model";

export interface SettingsUpdate {
  readonly playMode?: "standard" | "story" | "calm";
  readonly musicEnabled?: boolean;
  readonly effectsEnabled?: boolean;
}

export type GameAction =
  | { readonly type: "ROLE_SELECTED"; readonly value: Role }
  | { readonly type: "STORY_SCOPE_SELECTED"; readonly value: StoryScope }
  | {
      readonly type: "SETTINGS_UPDATED";
      readonly settings: SettingsUpdate;
    }
  | { readonly type: "RUN_STARTED" }
  | { readonly type: "HOTSPOT_ACTIVATED"; readonly hotspotId: HotspotId }
  | { readonly type: "DIALOGUE_ADVANCED" }
  | { readonly type: "SURPRISE_DISMISSED" }
  | { readonly type: "MINIGAME_COMPLETED" }
  | { readonly type: "MINIGAME_SKIPPED" }
  | { readonly type: "DOSSIER_CLOSED" }
  | {
      readonly type: "OPTION_CHOSEN";
      readonly optionId: OptionId;
      /**
       * Required true for an option that declares a `confirmation` (ADR-013):
       * the reducer refuses the plain action, so the second, explicit act of
       * confirming is enforced by the domain, not just by the dialog.
       */
      readonly confirmed?: boolean;
    }
  | { readonly type: "RUN_RESUMED"; readonly savedState: GameState }
  | { readonly type: "LOCAL_DATA_CLEARED" };

export type FocusTarget = "screen-heading" | "surprise-dismiss";

export type GameEffect =
  | { readonly type: "save-requested" }
  | { readonly type: "clear-save" }
  | { readonly type: "analytics"; readonly event: "game_start" }
  | { readonly type: "focus"; readonly target: FocusTarget };

export interface TransitionResult {
  readonly state: GameState;
  readonly effects: readonly GameEffect[];
}
