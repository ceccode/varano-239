import type { StoryNode } from "../../../../../core/model.ts";
import { nextChapterNodeId } from "../../../../chain-chapters.ts";
import type { ChapterBundle } from "../../../../story-pack.ts";
import { firstSightingMessages } from "./messages.ts";

export const firstSightingChapterId = "core.chapter.c00-first-sighting";

const levelNodeId = "core.node.prologue.campi";
const dialogueId = "core.node.prologue.dialogue";
const choiceId = "core.node.prologue.choice";

const nodes: readonly StoryNode[] = [
  {
    id: levelNodeId,
    chapterId: firstSightingChapterId,
    type: "level",
    narrativeLayer: "legend",
    levelId: "core.level.campi-di-montichiari",
    configId: "core.level-config.campi-1",
    headingKey: "core.message.level.heading",
    recapKey: "core.message.level.recap",
    introKey: "core.message.level.intro",
    completedNodeId: dialogueId,
    skippedNodeId: dialogueId,
  },
  {
    id: dialogueId,
    chapterId: firstSightingChapterId,
    type: "dialogue",
    narrativeLayer: "legend",
    lines: [
      { speakerId: "core.speaker.ada", textKey: "core.message.dialogue.ada" },
      {
        speakerId: "core.speaker.toni",
        textKey: "core.message.dialogue.hunter",
        when: [{ type: "role-is", role: "hunter" }],
      },
      {
        speakerId: "core.speaker.marta",
        textKey: "core.message.dialogue.guardian",
        when: [{ type: "role-is", role: "guardian" }],
      },
      {
        speakerId: "core.speaker.cesare",
        textKey: "core.message.dialogue.mayor",
        when: [{ type: "role-is", role: "mayor" }],
      },
      {
        speakerId: "core.speaker.varano",
        textKey: "core.message.dialogue.varano",
        when: [{ type: "role-is", role: "varano" }],
      },
      { speakerId: "core.speaker.ada", textKey: "core.message.dialogue.twist" },
    ],
    next: choiceId,
  },
  {
    id: choiceId,
    chapterId: firstSightingChapterId,
    type: "choice",
    narrativeLayer: "legend",
    promptKey: "core.message.choice.prompt",
    options: [
      {
        id: "core.option.prologue.document",
        textKey: "core.message.choice.document",
        effects: [
          { type: "adjust-score", score: "evidence", delta: 1 },
          {
            type: "record-choice",
            choiceId: "core.choice.prologue.priority",
            optionId: "core.option.prologue.document",
          },
        ],
        targetNodeId: nextChapterNodeId,
      },
      {
        id: "core.option.prologue.protect",
        textKey: "core.message.choice.protect",
        effects: [
          { type: "adjust-score", score: "care", delta: 1 },
          {
            type: "record-choice",
            choiceId: "core.choice.prologue.priority",
            optionId: "core.option.prologue.protect",
          },
        ],
        targetNodeId: nextChapterNodeId,
      },
    ],
  },
];

export const firstSightingChapter: ChapterBundle = {
  chapter: {
    id: firstSightingChapterId,
    titleKey: "core.message.chapter.prologue.title",
    entryNodeId: levelNodeId,
    checkpointNodeId: levelNodeId,
    exitNodeId: choiceId,
  },
  nodes,
  // The playable prologue carries no dossier card (ADR-024): the editorial
  // source registry lives in docs/SOURCES.md and is linked from the menu.
  dossierCards: [],
  clues: [],
  messages: firstSightingMessages,
  sources: [],
};
