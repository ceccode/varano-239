import type { StoryNode } from "../../../../../core/model.ts";
import { nextChapterNodeId } from "../../../../chain-chapters.ts";
import type { ChapterBundle } from "../../../../story-pack.ts";
import { castleParkMessages } from "./messages.ts";

export const castleParkChapterId = "core.chapter.c03-castle-park";

const levelNodeId = "core.node.park.level";
const dialogueId = "core.node.park.dialogue";

const nodes: readonly StoryNode[] = [
  {
    id: levelNodeId,
    chapterId: castleParkChapterId,
    type: "level",
    narrativeLayer: "legend",
    levelId: "core.level.parco-del-castello",
    configId: "core.level-config.parco-4",
    headingKey: "core.message.level4.heading",
    recapKey: "core.message.level4.recap",
    introKey: "core.message.level4.intro",
    completedNodeId: dialogueId,
    skippedNodeId: dialogueId,
  },
  {
    id: dialogueId,
    chapterId: castleParkChapterId,
    type: "dialogue",
    narrativeLayer: "legend",
    lines: [
      { speakerId: "core.speaker.ada", textKey: "core.message.dialogue4.ada" },
      {
        speakerId: "core.speaker.varano",
        textKey: "core.message.dialogue4.varano",
        when: [{ type: "role-is", role: "varano" }],
      },
      {
        speakerId: "core.speaker.toni",
        textKey: "core.message.dialogue4.hunter",
        when: [{ type: "role-is", role: "hunter" }],
      },
      {
        speakerId: "core.speaker.marta",
        textKey: "core.message.dialogue4.guardian",
        when: [{ type: "role-is", role: "guardian" }],
      },
      {
        speakerId: "core.speaker.cesare",
        textKey: "core.message.dialogue4.mayor",
        when: [{ type: "role-is", role: "mayor" }],
      },
      {
        speakerId: "core.speaker.ada",
        textKey: "core.message.dialogue4.twist",
      },
    ],
    next: nextChapterNodeId,
  },
];

export const castleParkChapter: ChapterBundle = {
  chapter: {
    id: castleParkChapterId,
    titleKey: "core.message.chapter.park.title",
    entryNodeId: levelNodeId,
    checkpointNodeId: levelNodeId,
    exitNodeId: dialogueId,
  },
  nodes,
  dossierCards: [],
  clues: [],
  messages: castleParkMessages,
  sources: [],
};
