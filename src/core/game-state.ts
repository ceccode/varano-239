import type {
  ChoiceId,
  ClueId,
  DossierCardId,
  FlagId,
  ItemId,
  Locale,
  MysteryId,
  NodeId,
  OptionId,
  OutcomeId,
  Role,
  SealId,
  StoryPackId,
  StoryScope,
  TheoryId,
  VaranoCondition,
  VaranoFate,
} from "./model";

export type AppPhase = "title" | "playing" | "ending";

export interface SetupDraft {
  readonly role?: Role;
  readonly storyScope?: StoryScope;
}

export interface CompletedSetup {
  readonly role: Role;
  readonly storyScope: StoryScope;
}

export interface AccessibilitySettings {
  readonly locale: Locale;
  readonly playMode: "standard" | "story" | "calm";
  readonly textScale: "small" | "medium" | "large";
  readonly highContrast: boolean;
  readonly musicEnabled: boolean;
  readonly effectsEnabled: boolean;
}

export interface RunState {
  readonly currentNodeId: NodeId;
  readonly checkpointNodeId: NodeId;
  readonly coreCheckpointNodeId: NodeId;
  readonly evidence: number;
  readonly care: number;
  readonly publicTrust: number;
  readonly condition: VaranoCondition;
  readonly seals: readonly SealId[];
  readonly inventory: readonly ItemId[];
  readonly flags: Readonly<Record<FlagId, boolean>>;
  readonly dossierCardIdsSeen: readonly DossierCardId[];
  readonly discoveredClueIds: readonly ClueId[];
  readonly completedPackIds: readonly StoryPackId[];
  readonly varanoFate: VaranoFate;
  readonly selectedTheoryByMystery: Readonly<
    Partial<Record<MysteryId, TheoryId>>
  >;
  readonly visitedNodeIds: readonly NodeId[];
  readonly choices: Readonly<Record<ChoiceId, OptionId>>;
  readonly outcomeId?: OutcomeId;
}

export interface GameState {
  readonly phase: AppPhase;
  readonly setup: SetupDraft;
  readonly run?: RunState;
  readonly settings: AccessibilitySettings;
}

export function createInitialState(locale: Locale = "it"): GameState {
  return {
    phase: "title",
    setup: {
      role: "varano",
      storyScope: "core",
    },
    settings: {
      locale,
      playMode: "standard",
      textScale: "medium",
      highContrast: false,
      musicEnabled: true,
      effectsEnabled: true,
    },
  };
}

export function completeSetup(setup: SetupDraft): CompletedSetup | undefined {
  if (setup.role === undefined || setup.storyScope === undefined) {
    return undefined;
  }

  return {
    role: setup.role,
    storyScope: setup.storyScope,
  };
}
