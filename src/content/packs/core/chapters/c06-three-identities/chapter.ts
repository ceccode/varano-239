import type { StoryNode } from "../../../../../core/model.ts";
import { nextChapterNodeId } from "../../../../chain-chapters.ts";
import type { ChapterBundle } from "../../../../story-pack.ts";
import { threeIdentitiesMessages } from "./messages.ts";

export const threeIdentitiesChapterId = "core.chapter.c06-three-identities";

const levelNodeId = "core.node.lab.level";
const dialogueId = "core.node.lab.dialogue";
const choiceId = "core.node.lab.choice";

const nodes: readonly StoryNode[] = [
  {
    id: levelNodeId,
    chapterId: threeIdentitiesChapterId,
    type: "level",
    narrativeLayer: "legend",
    levelId: "core.level.tre-identita",
    configId: "core.level-config.lab-7",
    headingKey: "core.message.lab.heading",
    recapKey: "core.message.lab.recap",
    introKey: "core.message.lab.intro",
    completedNodeId: dialogueId,
    skippedNodeId: dialogueId,
  },
  {
    id: dialogueId,
    chapterId: threeIdentitiesChapterId,
    type: "dialogue",
    narrativeLayer: "legend",
    lines: [
      {
        speakerId: "core.speaker.ada",
        textKey: "core.message.dialogue-lab.ada",
      },
      {
        speakerId: "core.speaker.varano",
        textKey: "core.message.dialogue-lab.varano",
        when: [{ type: "role-is", role: "varano" }],
      },
      {
        speakerId: "core.speaker.toni",
        textKey: "core.message.dialogue-lab.hunter",
        when: [{ type: "role-is", role: "hunter" }],
      },
      {
        speakerId: "core.speaker.marta",
        textKey: "core.message.dialogue-lab.guardian",
        when: [{ type: "role-is", role: "guardian" }],
      },
      {
        speakerId: "core.speaker.cesare",
        textKey: "core.message.dialogue-lab.mayor",
        when: [{ type: "role-is", role: "mayor" }],
      },
      {
        speakerId: "core.speaker.ada",
        textKey: "core.message.dialogue-lab.twist",
      },
    ],
    next: choiceId,
  },
  {
    id: choiceId,
    chapterId: threeIdentitiesChapterId,
    type: "choice",
    narrativeLayer: "legend",
    headingKey: "core.message.choice-lab.heading",
    promptKey: "core.message.choice-lab.prompt",
    options: [
      {
        id: "core.option.lab.doubt",
        textKey: "core.message.choice-lab.doubt",
        effects: [
          { type: "adjust-score", score: "publicTrust", delta: 1 },
          {
            type: "record-choice",
            choiceId: "core.choice.lab.version",
            optionId: "core.option.lab.doubt",
          },
        ],
        targetNodeId: nextChapterNodeId,
      },
      {
        id: "core.option.lab.prudent",
        textKey: "core.message.choice-lab.prudent",
        effects: [
          { type: "adjust-score", score: "care", delta: 1 },
          {
            type: "record-choice",
            choiceId: "core.choice.lab.version",
            optionId: "core.option.lab.prudent",
          },
        ],
        targetNodeId: nextChapterNodeId,
      },
    ],
  },
];

export const threeIdentitiesChapter: ChapterBundle = {
  chapter: {
    id: threeIdentitiesChapterId,
    titleKey: "core.message.chapter.lab.title",
    entryNodeId: levelNodeId,
    checkpointNodeId: levelNodeId,
    exitNodeId: choiceId,
  },
  nodes,
  dossierCards: [],
  clues: [],
  messages: threeIdentitiesMessages,
  sources: [],
};
