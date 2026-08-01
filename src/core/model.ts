export type NodeId = string;
export type ChapterId = string;
export type MessageKey = string;
export type AssetId = string;
export type SourceId = string;
export type DossierCardId = string;
export type OutcomeId = string;
export type MysteryId = string;
export type TheoryId = string;
export type ClueId = string;
export type StoryPackId = string;
export type ExtensionPointId = string;
export type LevelId = string;
export type LevelConfigId = string;
export type ItemId = string;
export type SealId = string;
export type ChoiceId = string;
export type OptionId = string;
export type HotspotId = string;
export type SpeakerId = string;
export type SurpriseId = string;
export type FlagId = string;

export type Role = "hunter" | "guardian" | "mayor" | "varano";
export type Approach = "evidence" | "rescue";
export type Sensitivity = "gentle" | "complete";
export type StoryScope = "core" | "origins" | "all-registered";
export type ScoreName = "evidence" | "care" | "publicTrust";
export type VaranoCondition = "unknown" | "healthy" | "weak" | "critical";
export type VaranoFate =
  "unresolved" | "rescued" | "escaped" | "foundDead" | "killedByHunter";
export type ContentSensitivityTag = "impliedAnimalDeath";

export type Condition =
  | { readonly type: "role-is"; readonly role: Role }
  | { readonly type: "approach-is"; readonly approach: Approach }
  | {
      readonly type: "sensitivity-is";
      readonly sensitivity: Sensitivity;
    }
  | { readonly type: "story-scope-is"; readonly scope: StoryScope }
  | {
      readonly type: "flag-is";
      readonly flagId: FlagId;
      readonly value: boolean;
    }
  | {
      readonly type: "score-at-least";
      readonly score: ScoreName;
      readonly value: number;
    }
  | { readonly type: "condition-is"; readonly value: VaranoCondition }
  | { readonly type: "fate-is"; readonly fate: VaranoFate }
  | { readonly type: "has-item"; readonly itemId: ItemId }
  | { readonly type: "has-seal"; readonly sealId: SealId }
  | { readonly type: "has-clue"; readonly clueId: ClueId }
  | {
      readonly type: "theory-selected";
      readonly mysteryId: MysteryId;
      readonly theoryId: TheoryId;
    }
  | { readonly type: "pack-complete"; readonly packId: StoryPackId }
  | {
      readonly type: "choice-is";
      readonly choiceId: ChoiceId;
      readonly optionId: OptionId;
    };

export type StoryEffect =
  | {
      readonly type: "adjust-score";
      readonly score: ScoreName;
      readonly delta: -1 | 1;
    }
  | { readonly type: "set-condition"; readonly value: VaranoCondition }
  | {
      readonly type: "set-flag";
      readonly flagId: FlagId;
      readonly value: boolean;
    }
  | { readonly type: "add-item"; readonly itemId: ItemId }
  | { readonly type: "add-seal"; readonly sealId: SealId }
  | {
      readonly type: "reveal-dossier";
      readonly dossierCardId: DossierCardId;
    }
  | { readonly type: "add-clue"; readonly clueId: ClueId }
  | { readonly type: "complete-pack"; readonly packId: StoryPackId }
  | {
      readonly type: "select-theory";
      readonly mysteryId: MysteryId;
      readonly theoryId: TheoryId;
    }
  | { readonly type: "set-varano-fate"; readonly fate: VaranoFate }
  | {
      readonly type: "record-choice";
      readonly choiceId: ChoiceId;
      readonly optionId: OptionId;
    };

export interface ChoiceConfirmation {
  readonly titleKey: MessageKey;
  readonly bodyKey: MessageKey;
  readonly confirmKey: MessageKey;
  readonly cancelKey: MessageKey;
  readonly safeInitialFocus: "cancel";
}

export interface ChoiceOption {
  readonly id: OptionId;
  readonly textKey: MessageKey;
  readonly sensitivityTags?: readonly ContentSensitivityTag[];
  readonly when?: readonly Condition[];
  readonly effects?: readonly StoryEffect[];
  readonly targetNodeId: NodeId;
  readonly confirmation?: ChoiceConfirmation;
}

export interface Hotspot {
  readonly id: HotspotId;
  readonly labelKey: MessageKey;
  readonly rect: Readonly<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  readonly targetNodeId: NodeId;
  readonly when?: readonly Condition[];
}

export interface DialogueLine {
  readonly speakerId: SpeakerId;
  readonly textKey: MessageKey;
  readonly dialectTextKey?: MessageKey;
  readonly portraitAssetId?: AssetId;
}

export interface BaseNode {
  readonly id: NodeId;
  readonly chapterId: ChapterId;
  readonly narrativeLayer: "legend";
  readonly sensitivityTags?: readonly ContentSensitivityTag[];
  readonly when?: readonly Condition[];
}

export interface SceneNode extends BaseNode {
  readonly type: "scene";
  readonly backgroundAssetId: AssetId;
  readonly objectiveKey: MessageKey;
  readonly hotspots: readonly Hotspot[];
  readonly noSurprise?: boolean;
}

export interface DialogueNode extends BaseNode {
  readonly type: "dialogue";
  readonly lines: readonly DialogueLine[];
  readonly next: NodeId;
}

export interface ChoiceNode extends BaseNode {
  readonly type: "choice";
  readonly promptKey: MessageKey;
  readonly options: readonly ChoiceOption[];
}

export interface DossierCardNode extends BaseNode {
  readonly type: "dossier-card";
  readonly dossierCardId: DossierCardId;
  readonly next: NodeId;
}

export interface SurpriseNode extends BaseNode {
  readonly type: "surprise";
  readonly surpriseId: SurpriseId;
  readonly hostSceneNodeId: NodeId;
  readonly assetId: AssetId;
  readonly messageKey?: MessageKey;
  readonly clueId?: ClueId;
  readonly next: NodeId;
}

export interface LevelNode extends BaseNode {
  readonly type: "level";
  readonly levelId: LevelId;
  readonly configId: LevelConfigId;
  readonly completedNodeId: NodeId;
  readonly skippedNodeId: NodeId;
}

export interface ChapterEndNode extends BaseNode {
  readonly type: "chapter-end";
}

export interface EndingNode extends BaseNode {
  readonly type: "ending";
  readonly outcomeId: OutcomeId;
  readonly titleKey: MessageKey;
  readonly bodyKey: MessageKey;
}

export type StoryNode =
  | SceneNode
  | DialogueNode
  | ChoiceNode
  | DossierCardNode
  | SurpriseNode
  | LevelNode
  | ChapterEndNode
  | EndingNode;
