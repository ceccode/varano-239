import type { StoryNode } from "../../../../../core/model.ts";
import { nextChapterNodeId } from "../../../../chain-chapters.ts";
import type { ChapterBundle } from "../../../../story-pack.ts";
import { superstarMessages } from "./messages.ts";

export const superstarChapterId = "core.chapter.c02-superstar";

const levelNodeId = "core.node.superstar.level";
const dialogueId = "core.node.superstar.dialogue";

const nodes: readonly StoryNode[] = [
  {
    id: levelNodeId,
    chapterId: superstarChapterId,
    type: "level",
    narrativeLayer: "legend",
    levelId: "core.level.varano-superstar",
    configId: "core.level-config.superstar-3",
    headingKey: "core.message.level3.heading",
    recapKey: "core.message.level3.recap",
    introKey: "core.message.level3.intro",
    completedNodeId: dialogueId,
    skippedNodeId: dialogueId,
  },
  {
    id: dialogueId,
    chapterId: superstarChapterId,
    type: "dialogue",
    narrativeLayer: "legend",
    lines: [
      { speakerId: "core.speaker.ada", textKey: "core.message.dialogue3.ada" },
      {
        speakerId: "core.speaker.varano",
        textKey: "core.message.dialogue3.varano",
        when: [{ type: "role-is", role: "varano" }],
      },
      {
        speakerId: "core.speaker.toni",
        textKey: "core.message.dialogue3.hunter",
        when: [{ type: "role-is", role: "hunter" }],
      },
      {
        speakerId: "core.speaker.marta",
        textKey: "core.message.dialogue3.guardian",
        when: [{ type: "role-is", role: "guardian" }],
      },
      {
        speakerId: "core.speaker.cesare",
        textKey: "core.message.dialogue3.mayor",
        when: [{ type: "role-is", role: "mayor" }],
      },
      {
        speakerId: "core.speaker.ada",
        textKey: "core.message.dialogue3.ai-poster",
      },
      {
        speakerId: "core.speaker.ada",
        textKey: "core.message.dialogue3.twist",
      },
    ],
    next: nextChapterNodeId,
  },
];

export const superstarChapter: ChapterBundle = {
  chapter: {
    id: superstarChapterId,
    titleKey: "core.message.chapter.superstar.title",
    entryNodeId: levelNodeId,
    checkpointNodeId: levelNodeId,
    exitNodeId: dialogueId,
  },
  nodes,
  dossierCards: [],
  clues: [],
  messages: superstarMessages,
  sources: [],
};
