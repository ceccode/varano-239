import type { StoryNode } from "../../../../../core/model.ts";
import { nextChapterNodeId } from "../../../../chain-chapters.ts";
import type { ChapterBundle } from "../../../../story-pack.ts";
import { castleKeepMessages } from "./messages.ts";

export const castleKeepChapterId = "core.chapter.c04-castle-keep";

const levelNodeId = "core.node.keep.level";
const dialogueId = "core.node.keep.dialogue";

const nodes: readonly StoryNode[] = [
  {
    id: levelNodeId,
    chapterId: castleKeepChapterId,
    type: "level",
    narrativeLayer: "legend",
    levelId: "core.level.dentro-il-castello",
    configId: "core.level-config.castello-5",
    headingKey: "core.message.level5.heading",
    recapKey: "core.message.level5.recap",
    introKey: "core.message.level5.intro",
    completedNodeId: dialogueId,
    skippedNodeId: dialogueId,
  },
  {
    id: dialogueId,
    chapterId: castleKeepChapterId,
    type: "dialogue",
    narrativeLayer: "legend",
    lines: [
      { speakerId: "core.speaker.ada", textKey: "core.message.dialogue5.ada" },
      {
        speakerId: "core.speaker.pina",
        textKey: "core.message.dialogue5.pina",
      },
      {
        speakerId: "core.speaker.varano",
        textKey: "core.message.dialogue5.varano",
        when: [{ type: "role-is", role: "varano" }],
      },
      {
        speakerId: "core.speaker.toni",
        textKey: "core.message.dialogue5.hunter",
        when: [{ type: "role-is", role: "hunter" }],
      },
      {
        speakerId: "core.speaker.marta",
        textKey: "core.message.dialogue5.guardian",
        when: [{ type: "role-is", role: "guardian" }],
      },
      {
        speakerId: "core.speaker.cesare",
        textKey: "core.message.dialogue5.mayor",
        when: [{ type: "role-is", role: "mayor" }],
      },
      {
        speakerId: "core.speaker.ada",
        textKey: "core.message.dialogue5.twist",
      },
    ],
    next: nextChapterNodeId,
  },
];

export const castleKeepChapter: ChapterBundle = {
  chapter: {
    id: castleKeepChapterId,
    titleKey: "core.message.chapter.keep.title",
    entryNodeId: levelNodeId,
    checkpointNodeId: levelNodeId,
    exitNodeId: dialogueId,
  },
  nodes,
  dossierCards: [],
  clues: [],
  messages: castleKeepMessages,
  sources: [],
};
