import type {
  Approach,
  ChoiceId,
  ClueId,
  DossierCardId,
  FlagId,
  ItemId,
  MysteryId,
  NodeId,
  OptionId,
  OutcomeId,
  Role,
  SealId,
  Sensitivity,
  StoryPackId,
  StoryScope,
  TheoryId,
  VaranoCondition,
  VaranoFate,
} from "./model";

export type AppPhase = "title" | "playing" | "ending";

export interface SetupDraft {
  readonly role?: Role;
  readonly approach?: Approach;
  readonly sensitivity?: Sensitivity;
  readonly storyScope?: StoryScope;
}

export interface CompletedSetup {
  readonly role: Role;
  readonly approach: Approach;
  readonly sensitivity: Sensitivity;
  readonly storyScope: StoryScope;
}

export interface AccessibilitySettings {
  readonly playMode: "standard" | "story" | "calm";
  readonly textScale: "small" | "medium" | "large";
  readonly highContrast: boolean;
  readonly musicEnabled: boolean;
  readonly effectsEnabled: boolean;
  readonly dialectEnabled: boolean;
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

export function createInitialState(): GameState {
  return {
    phase: "title",
    setup: {
      role: "varano",
      approach: "rescue",
      sensitivity: "complete",
      storyScope: "core",
    },
    settings: {
      playMode: "standard",
      textScale: "medium",
      highContrast: false,
      musicEnabled: true,
      effectsEnabled: true,
      dialectEnabled: false,
    },
  };
}

export function completeSetup(setup: SetupDraft): CompletedSetup | undefined {
  if (
    setup.role === undefined ||
    setup.approach === undefined ||
    setup.sensitivity === undefined ||
    setup.storyScope === undefined
  ) {
    return undefined;
  }

  return {
    role: setup.role,
    approach: setup.approach,
    sensitivity: setup.sensitivity,
    storyScope: setup.storyScope,
  };
}
