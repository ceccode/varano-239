import type {
  ChapterId,
  ClueId,
  DossierCardId,
  ExtensionPointId,
  MessageKey,
  MysteryId,
  NodeId,
  StoryNode,
  StoryPackId,
  TheoryId,
} from "../core/model";
import type { DossierCard, SourceRef } from "./dossier";

export type MessageCatalog = Readonly<Record<MessageKey, string>>;

export interface TheoryDefinition {
  readonly id: TheoryId;
  readonly mysteryId: MysteryId;
  readonly titleKey: MessageKey;
  readonly descriptionKey: MessageKey;
}

export interface MysteryDefinition {
  readonly id: MysteryId;
  readonly titleKey: MessageKey;
  readonly descriptionKey: MessageKey;
  readonly theoryIds: readonly TheoryId[];
}

export interface ClueDefinition {
  readonly id: ClueId;
  readonly mysteryId: MysteryId;
  readonly dossierCardId: DossierCardId;
  readonly supports: readonly TheoryId[];
  readonly contradicts: readonly TheoryId[];
}

export interface Chapter {
  readonly id: ChapterId;
  readonly titleKey: MessageKey;
  readonly entryNodeId: NodeId;
  readonly exitNodeId?: NodeId;
  readonly checkpointNodeId: NodeId;
}

export interface ChapterInsertion {
  readonly at: ExtensionPointId;
  readonly order: number;
}

export interface ChapterBundle {
  readonly chapter: Chapter;
  readonly insertion?: ChapterInsertion;
  readonly nodes: readonly StoryNode[];
  readonly dossierCards: readonly DossierCard[];
  readonly clues: readonly ClueDefinition[];
  readonly messages: MessageCatalog;
  readonly sources: readonly SourceRef[];
}

export interface StoryPack {
  readonly id: StoryPackId;
  readonly version: number;
  readonly kind: "core" | "mystery" | "expansion";
  readonly titleKey: MessageKey;
  readonly descriptionKey: MessageKey;
  readonly estimatedMinutes: number;
  readonly requires: readonly StoryPackId[];
  readonly chapters: readonly ChapterBundle[];
  readonly mysteries: readonly MysteryDefinition[];
  readonly theories: readonly TheoryDefinition[];
}

export interface CoreChapterTransition {
  readonly exitNodeId: NodeId;
  readonly targetNodeId: NodeId;
  readonly extensionPointId?: ExtensionPointId;
}
