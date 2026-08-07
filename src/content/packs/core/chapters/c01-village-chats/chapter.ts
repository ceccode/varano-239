import type { StoryNode } from "../../../../../core/model.ts";
import { nextChapterNodeId } from "../../../../chain-chapters.ts";
import type { ChapterBundle } from "../../../../story-pack.ts";
import { villageChatsMessages } from "./messages.ts";

export const villageChatsChapterId = "core.chapter.c01-village-chats";

const levelNodeId = "core.node.chat.level";
const dialogueId = "core.node.chat.dialogue";
const choiceId = "core.node.chat.choice";

const nodes: readonly StoryNode[] = [
  {
    id: levelNodeId,
    chapterId: villageChatsChapterId,
    type: "level",
    narrativeLayer: "legend",
    levelId: "core.level.chat-di-paese",
    configId: "core.level-config.chat-2",
    headingKey: "core.message.level2.heading",
    recapKey: "core.message.level2.recap",
    introKey: "core.message.level2.intro",
    completedNodeId: dialogueId,
    skippedNodeId: dialogueId,
  },
  {
    id: dialogueId,
    chapterId: villageChatsChapterId,
    type: "dialogue",
    narrativeLayer: "legend",
    lines: [
      { speakerId: "core.speaker.ada", textKey: "core.message.dialogue2.ada" },
      {
        speakerId: "core.speaker.varano",
        textKey: "core.message.dialogue2.varano",
        when: [{ type: "role-is", role: "varano" }],
      },
      {
        speakerId: "core.speaker.toni",
        textKey: "core.message.dialogue2.hunter",
        when: [{ type: "role-is", role: "hunter" }],
      },
      {
        speakerId: "core.speaker.marta",
        textKey: "core.message.dialogue2.guardian",
        when: [{ type: "role-is", role: "guardian" }],
      },
      {
        speakerId: "core.speaker.cesare",
        textKey: "core.message.dialogue2.mayor",
        when: [{ type: "role-is", role: "mayor" }],
      },
      {
        speakerId: "core.speaker.ada",
        textKey: "core.message.dialogue2.twist",
      },
    ],
    next: choiceId,
  },
  {
    id: choiceId,
    chapterId: villageChatsChapterId,
    type: "choice",
    narrativeLayer: "legend",
    headingKey: "core.message.choice2.heading",
    promptKey: "core.message.choice2.prompt",
    options: [
      {
        id: "core.option.chat.call",
        textKey: "core.message.choice2.call",
        effects: [
          { type: "adjust-score", score: "evidence", delta: 1 },
          {
            type: "record-choice",
            choiceId: "core.choice.chat.number",
            optionId: "core.option.chat.call",
          },
        ],
        targetNodeId: nextChapterNodeId,
      },
      {
        id: "core.option.chat.mute",
        textKey: "core.message.choice2.mute",
        effects: [
          { type: "adjust-score", score: "publicTrust", delta: 1 },
          {
            type: "record-choice",
            choiceId: "core.choice.chat.number",
            optionId: "core.option.chat.mute",
          },
        ],
        targetNodeId: nextChapterNodeId,
      },
    ],
  },
];

export const villageChatsChapter: ChapterBundle = {
  chapter: {
    id: villageChatsChapterId,
    titleKey: "core.message.chapter.chat.title",
    entryNodeId: levelNodeId,
    checkpointNodeId: levelNodeId,
    exitNodeId: choiceId,
  },
  nodes,
  dossierCards: [],
  clues: [],
  messages: villageChatsMessages,
  sources: [],
};
