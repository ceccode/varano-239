import type { StoryNode } from "../../../../../core/model.ts";
import { nextChapterNodeId } from "../../../../chain-chapters.ts";
import type { ChapterBundle } from "../../../../story-pack.ts";
import { villageVersionsMessages } from "./messages.ts";

export const villageVersionsChapterId = "core.chapter.c08-village-versions";

const levelNodeId = "core.node.borgo.level";
const dialogueId = "core.node.borgo.dialogue";
const choiceId = "core.node.borgo.choice";

/**
 * The second of the three Six Hills chapters (ADR-045). Like the ditches
 * before it, both options grant the same two seals: the choice decides how
 * the clothesline gets read, never whether the village was crossed.
 */
const sealEffects = [
  { type: "add-seal", sealId: "core.seal.san-giorgio" },
  { type: "add-seal", sealId: "core.seal.san-zeno" },
] as const;

const nodes: readonly StoryNode[] = [
  {
    id: levelNodeId,
    chapterId: villageVersionsChapterId,
    type: "level",
    narrativeLayer: "legend",
    levelId: "core.level.borgo-delle-versioni",
    configId: "core.level-config.borgo-9",
    headingKey: "core.message.borgo.heading",
    recapKey: "core.message.borgo.recap",
    introKey: "core.message.borgo.intro",
    completedNodeId: dialogueId,
    skippedNodeId: dialogueId,
  },
  {
    id: dialogueId,
    chapterId: villageVersionsChapterId,
    type: "dialogue",
    narrativeLayer: "legend",
    lines: [
      {
        speakerId: "core.speaker.ada",
        textKey: "core.message.dialogue-borgo.ada",
      },
      {
        speakerId: "core.speaker.varano",
        textKey: "core.message.dialogue-borgo.varano",
        when: [{ type: "role-is", role: "varano" }],
      },
      {
        speakerId: "core.speaker.toni",
        textKey: "core.message.dialogue-borgo.hunter",
        when: [{ type: "role-is", role: "hunter" }],
      },
      {
        speakerId: "core.speaker.marta",
        textKey: "core.message.dialogue-borgo.guardian",
        when: [{ type: "role-is", role: "guardian" }],
      },
      {
        speakerId: "core.speaker.cesare",
        textKey: "core.message.dialogue-borgo.mayor",
        when: [{ type: "role-is", role: "mayor" }],
      },
      {
        speakerId: "core.speaker.ada",
        textKey: "core.message.dialogue-borgo.twist",
      },
    ],
    next: choiceId,
  },
  {
    id: choiceId,
    chapterId: villageVersionsChapterId,
    type: "choice",
    narrativeLayer: "legend",
    headingKey: "core.message.choice-borgo.heading",
    promptKey: "core.message.choice-borgo.prompt",
    options: [
      {
        id: "core.option.borgo.order",
        textKey: "core.message.choice-borgo.order",
        effects: [
          { type: "adjust-score", score: "evidence", delta: 1 },
          {
            type: "record-choice",
            choiceId: "core.choice.borgo.line",
            optionId: "core.option.borgo.order",
          },
          ...sealEffects,
        ],
        targetNodeId: nextChapterNodeId,
      },
      {
        id: "core.option.borgo.names",
        textKey: "core.message.choice-borgo.names",
        effects: [
          { type: "adjust-score", score: "publicTrust", delta: 1 },
          {
            type: "record-choice",
            choiceId: "core.choice.borgo.line",
            optionId: "core.option.borgo.names",
          },
          ...sealEffects,
        ],
        targetNodeId: nextChapterNodeId,
      },
    ],
  },
];

export const villageVersionsChapter: ChapterBundle = {
  chapter: {
    id: villageVersionsChapterId,
    titleKey: "core.message.chapter.borgo.title",
    entryNodeId: levelNodeId,
    checkpointNodeId: levelNodeId,
    exitNodeId: choiceId,
  },
  nodes,
  dossierCards: [],
  clues: [],
  messages: villageVersionsMessages,
  sources: [],
};
