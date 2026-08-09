import type { StoryNode } from "../../../../../core/model.ts";
import { nextChapterNodeId } from "../../../../chain-chapters.ts";
import type { ChapterBundle } from "../../../../story-pack.ts";
import { sanPancrazioMessages } from "./messages.ts";

export const sanPancrazioChapterId = "core.chapter.c09-san-pancrazio";

const levelNodeId = "core.node.colle.level";
const dialogueId = "core.node.colle.dialogue";
const choiceId = "core.node.colle.choice";

/**
 * The last of the three Six Hills chapters (ADR-045), and the one that closes
 * the campaign at ten levels. Both options grant the final two seals — with
 * these the throne at the confrontation becomes reachable for the first time.
 *
 * This is also the only interlude that sets `condition`: the canonical «fresh
 * track or safe road» choice. Either way the Varano is found; the difference
 * is what the night cost him, and the briefing says it in plain words.
 */
const sealEffects = [
  { type: "add-seal", sealId: "core.seal.santa-margherita" },
  { type: "add-seal", sealId: "core.seal.san-pancrazio" },
] as const;

const nodes: readonly StoryNode[] = [
  {
    id: levelNodeId,
    chapterId: sanPancrazioChapterId,
    type: "level",
    narrativeLayer: "legend",
    levelId: "core.level.colle-san-pancrazio",
    configId: "core.level-config.colle-10",
    headingKey: "core.message.colle.heading",
    recapKey: "core.message.colle.recap",
    introKey: "core.message.colle.intro",
    completedNodeId: dialogueId,
    skippedNodeId: dialogueId,
  },
  {
    id: dialogueId,
    chapterId: sanPancrazioChapterId,
    type: "dialogue",
    narrativeLayer: "legend",
    lines: [
      {
        speakerId: "core.speaker.ada",
        textKey: "core.message.dialogue-colle.ada",
      },
      {
        speakerId: "core.speaker.varano",
        textKey: "core.message.dialogue-colle.varano",
        when: [{ type: "role-is", role: "varano" }],
      },
      {
        speakerId: "core.speaker.toni",
        textKey: "core.message.dialogue-colle.hunter",
        when: [{ type: "role-is", role: "hunter" }],
      },
      {
        speakerId: "core.speaker.marta",
        textKey: "core.message.dialogue-colle.guardian",
        when: [{ type: "role-is", role: "guardian" }],
      },
      {
        speakerId: "core.speaker.cesare",
        textKey: "core.message.dialogue-colle.mayor",
        when: [{ type: "role-is", role: "mayor" }],
      },
      {
        speakerId: "core.speaker.ada",
        textKey: "core.message.dialogue-colle.twist",
      },
    ],
    next: choiceId,
  },
  {
    id: choiceId,
    chapterId: sanPancrazioChapterId,
    type: "choice",
    narrativeLayer: "legend",
    headingKey: "core.message.choice-colle.heading",
    promptKey: "core.message.choice-colle.prompt",
    options: [
      {
        id: "core.option.colle.track",
        textKey: "core.message.choice-colle.track",
        effects: [
          { type: "adjust-score", score: "evidence", delta: 1 },
          { type: "set-condition", value: "weak" },
          {
            type: "record-choice",
            choiceId: "core.choice.colle.road",
            optionId: "core.option.colle.track",
          },
          ...sealEffects,
        ],
        targetNodeId: nextChapterNodeId,
      },
      {
        id: "core.option.colle.road",
        textKey: "core.message.choice-colle.road",
        effects: [
          { type: "adjust-score", score: "care", delta: 1 },
          { type: "set-condition", value: "healthy" },
          {
            type: "record-choice",
            choiceId: "core.choice.colle.road",
            optionId: "core.option.colle.road",
          },
          ...sealEffects,
        ],
        targetNodeId: nextChapterNodeId,
      },
    ],
  },
];

export const sanPancrazioChapter: ChapterBundle = {
  chapter: {
    id: sanPancrazioChapterId,
    titleKey: "core.message.chapter.colle.title",
    entryNodeId: levelNodeId,
    checkpointNodeId: levelNodeId,
    exitNodeId: choiceId,
  },
  nodes,
  dossierCards: [],
  clues: [],
  messages: sanPancrazioMessages,
  sources: [],
};
