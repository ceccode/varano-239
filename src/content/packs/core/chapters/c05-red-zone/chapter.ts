import type { StoryNode } from "../../../../../core/model.ts";
import { nextChapterNodeId } from "../../../../chain-chapters.ts";
import type { ChapterBundle } from "../../../../story-pack.ts";
import { redZoneMessages } from "./messages.ts";

export const redZoneChapterId = "core.chapter.c05-red-zone";

const levelNodeId = "core.node.zona.level";
const dialogueId = "core.node.zona.dialogue";
const choiceId = "core.node.zona.choice";

const nodes: readonly StoryNode[] = [
  {
    id: levelNodeId,
    chapterId: redZoneChapterId,
    type: "level",
    narrativeLayer: "legend",
    levelId: "core.level.zona-interdetta",
    configId: "core.level-config.zona-6",
    headingKey: "core.message.zona.heading",
    recapKey: "core.message.zona.recap",
    introKey: "core.message.zona.intro",
    completedNodeId: dialogueId,
    skippedNodeId: dialogueId,
  },
  {
    id: dialogueId,
    chapterId: redZoneChapterId,
    type: "dialogue",
    narrativeLayer: "legend",
    lines: [
      {
        speakerId: "core.speaker.ada",
        textKey: "core.message.dialogue-zona.ada",
      },
      {
        speakerId: "core.speaker.varano",
        textKey: "core.message.dialogue-zona.varano",
        when: [{ type: "role-is", role: "varano" }],
      },
      {
        speakerId: "core.speaker.toni",
        textKey: "core.message.dialogue-zona.hunter",
        when: [{ type: "role-is", role: "hunter" }],
      },
      {
        speakerId: "core.speaker.marta",
        textKey: "core.message.dialogue-zona.guardian",
        when: [{ type: "role-is", role: "guardian" }],
      },
      {
        speakerId: "core.speaker.cesare",
        textKey: "core.message.dialogue-zona.mayor",
        when: [{ type: "role-is", role: "mayor" }],
      },
      {
        speakerId: "core.speaker.ada",
        textKey: "core.message.dialogue-zona.twist",
      },
    ],
    next: choiceId,
  },
  {
    id: choiceId,
    chapterId: redZoneChapterId,
    type: "choice",
    narrativeLayer: "legend",
    headingKey: "core.message.choice-zona.heading",
    promptKey: "core.message.choice-zona.prompt",
    options: [
      {
        id: "core.option.zona.photo",
        textKey: "core.message.choice-zona.photo",
        effects: [
          { type: "adjust-score", score: "evidence", delta: 1 },
          {
            type: "record-choice",
            choiceId: "core.choice.zona.cage",
            optionId: "core.option.zona.photo",
          },
        ],
        targetNodeId: nextChapterNodeId,
      },
      {
        id: "core.option.zona.bait",
        textKey: "core.message.choice-zona.bait",
        effects: [
          { type: "adjust-score", score: "care", delta: 1 },
          {
            type: "record-choice",
            choiceId: "core.choice.zona.cage",
            optionId: "core.option.zona.bait",
          },
        ],
        targetNodeId: nextChapterNodeId,
      },
    ],
  },
];

export const redZoneChapter: ChapterBundle = {
  chapter: {
    id: redZoneChapterId,
    titleKey: "core.message.chapter.zona.title",
    entryNodeId: levelNodeId,
    checkpointNodeId: levelNodeId,
    exitNodeId: choiceId,
  },
  nodes,
  dossierCards: [],
  clues: [],
  messages: redZoneMessages,
  sources: [],
};
