import type { StoryNode } from "../../../../../core/model.ts";
import { nextChapterNodeId } from "../../../../chain-chapters.ts";
import type { ChapterBundle } from "../../../../story-pack.ts";
import { waterTracksMessages } from "./messages.ts";

export const waterTracksChapterId = "core.chapter.c07-water-tracks";

const levelNodeId = "core.node.acqua.level";
const dialogueId = "core.node.acqua.dialogue";
const choiceId = "core.node.acqua.choice";

/**
 * The first of the three Six Hills chapters (ADR-045). Both options grant the
 * same two seals: the choice decides how the night is spent, never whether the
 * road up the hills was walked. That is what keeps «Salta il livello» honest —
 * a skipped level still reaches this interlude, so it still earns its seals.
 */
const sealEffects = [
  { type: "add-seal", sealId: "core.seal.rotondo" },
  { type: "add-seal", sealId: "core.seal.generale" },
] as const;

const nodes: readonly StoryNode[] = [
  {
    id: levelNodeId,
    chapterId: waterTracksChapterId,
    type: "level",
    narrativeLayer: "legend",
    levelId: "core.level.acqua-e-impronte",
    configId: "core.level-config.acqua-8",
    headingKey: "core.message.acqua.heading",
    recapKey: "core.message.acqua.recap",
    introKey: "core.message.acqua.intro",
    completedNodeId: dialogueId,
    skippedNodeId: dialogueId,
  },
  {
    id: dialogueId,
    chapterId: waterTracksChapterId,
    type: "dialogue",
    narrativeLayer: "legend",
    lines: [
      {
        speakerId: "core.speaker.ada",
        textKey: "core.message.dialogue-acqua.ada",
      },
      {
        speakerId: "core.speaker.varano",
        textKey: "core.message.dialogue-acqua.varano",
        when: [{ type: "role-is", role: "varano" }],
      },
      {
        speakerId: "core.speaker.toni",
        textKey: "core.message.dialogue-acqua.hunter",
        when: [{ type: "role-is", role: "hunter" }],
      },
      {
        speakerId: "core.speaker.marta",
        textKey: "core.message.dialogue-acqua.guardian",
        when: [{ type: "role-is", role: "guardian" }],
      },
      {
        speakerId: "core.speaker.cesare",
        textKey: "core.message.dialogue-acqua.mayor",
        when: [{ type: "role-is", role: "mayor" }],
      },
      {
        speakerId: "core.speaker.ada",
        textKey: "core.message.dialogue-acqua.twist",
      },
    ],
    next: choiceId,
  },
  {
    id: choiceId,
    chapterId: waterTracksChapterId,
    type: "choice",
    narrativeLayer: "legend",
    headingKey: "core.message.choice-acqua.heading",
    promptKey: "core.message.choice-acqua.prompt",
    options: [
      {
        id: "core.option.acqua.follow",
        textKey: "core.message.choice-acqua.follow",
        effects: [
          { type: "adjust-score", score: "evidence", delta: 1 },
          {
            type: "record-choice",
            choiceId: "core.choice.acqua.tail",
            optionId: "core.option.acqua.follow",
          },
          ...sealEffects,
        ],
        targetNodeId: nextChapterNodeId,
      },
      {
        id: "core.option.acqua.wait",
        textKey: "core.message.choice-acqua.wait",
        effects: [
          { type: "adjust-score", score: "care", delta: 1 },
          {
            type: "record-choice",
            choiceId: "core.choice.acqua.tail",
            optionId: "core.option.acqua.wait",
          },
          ...sealEffects,
        ],
        targetNodeId: nextChapterNodeId,
      },
    ],
  },
];

export const waterTracksChapter: ChapterBundle = {
  chapter: {
    id: waterTracksChapterId,
    titleKey: "core.message.chapter.acqua.title",
    entryNodeId: levelNodeId,
    checkpointNodeId: levelNodeId,
    exitNodeId: choiceId,
  },
  nodes,
  dossierCards: [],
  clues: [],
  messages: waterTracksMessages,
  sources: [],
};
