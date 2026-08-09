import type { StoryNode } from "../../../../../core/model.ts";
import type { ChapterBundle } from "../../../../story-pack.ts";
import { finaleMessages } from "./messages.ts";

export const finaleChapterId = "core.chapter.c99-finale";
export const finaleConfrontationNodeId = "core.node.finale.confrontation";
export const finaleNodeId = "core.node.finale.open-mystery";

/**
 * The finale lives in its own bundle, always last (ADR-034). With level 5 the
 * arc closes: the entry is the confrontation on the tower — an enigma of
 * positioning and trust, never a fight — and every option targets one of the
 * ending families inside this same chapter (ADR-040).
 *
 * The lethal option follows ADR-013 to the letter: only the Cacciatore who
 * chose «Documenta la scena» in the prologue, in the single 12+ complete
 * edition, with a second explicit confirmation that opens on «Torna indietro»,
 * at least two non-lethal alternatives always visible, and the act itself off
 * screen.
 */
const nodes: readonly StoryNode[] = [
  {
    id: finaleConfrontationNodeId,
    chapterId: finaleChapterId,
    type: "choice",
    narrativeLayer: "legend",
    headingKey: "core.message.finale.heading",
    promptKey: "core.message.finale.prompt",
    options: [
      {
        id: "core.option.finale.corridor",
        textKey: "core.message.finale.option.corridor",
        effects: [
          { type: "adjust-score", score: "care", delta: 1 },
          {
            type: "record-choice",
            choiceId: "core.choice.finale.stand",
            optionId: "core.option.finale.corridor",
          },
          { type: "set-varano-fate", fate: "rescued" },
        ],
        targetNodeId: "core.node.finale.rescued",
      },
      {
        id: "core.option.finale.garden",
        textKey: "core.message.finale.option.garden",
        effects: [
          { type: "adjust-score", score: "care", delta: 1 },
          {
            type: "record-choice",
            choiceId: "core.choice.finale.stand",
            optionId: "core.option.finale.garden",
          },
          { type: "set-varano-fate", fate: "escaped" },
        ],
        targetNodeId: "core.node.finale.escaped",
      },
      {
        // The full coronation (ADR-045): only a run that gathered all six
        // Sei Colli seals ever sees this stand. Purely additive — without
        // the seals the confrontation is exactly the five families.
        id: "core.option.finale.crown",
        textKey: "core.message.finale.option.crown",
        when: [
          { type: "has-seal", sealId: "core.seal.rotondo" },
          { type: "has-seal", sealId: "core.seal.generale" },
          { type: "has-seal", sealId: "core.seal.san-giorgio" },
          { type: "has-seal", sealId: "core.seal.san-zeno" },
          { type: "has-seal", sealId: "core.seal.santa-margherita" },
          { type: "has-seal", sealId: "core.seal.san-pancrazio" },
        ],
        effects: [
          { type: "adjust-score", score: "publicTrust", delta: 1 },
          {
            type: "record-choice",
            choiceId: "core.choice.finale.stand",
            optionId: "core.option.finale.crown",
          },
          { type: "set-varano-fate", fate: "escaped" },
        ],
        targetNodeId: "core.node.finale.crowned",
      },
      {
        id: "core.option.finale.tower",
        textKey: "core.message.finale.option.tower",
        effects: [
          { type: "adjust-score", score: "publicTrust", delta: 1 },
          {
            type: "record-choice",
            choiceId: "core.choice.finale.stand",
            optionId: "core.option.finale.tower",
          },
          { type: "set-varano-fate", fate: "escaped" },
        ],
        targetNodeId: "core.node.finale.count",
      },
      {
        id: "core.option.finale.document",
        textKey: "core.message.finale.option.document",
        effects: [
          { type: "adjust-score", score: "evidence", delta: 1 },
          {
            type: "record-choice",
            choiceId: "core.choice.finale.stand",
            optionId: "core.option.finale.document",
          },
        ],
        targetNodeId: finaleNodeId,
      },
      {
        id: "core.option.finale.shoot",
        textKey: "core.message.finale.option.shoot",
        sensitivityTags: ["impliedAnimalDeath"],
        // ADR-013 via ADR-040: «Cerca una prova» is the prologue's
        // «Documenta la scena». The `sensitivity-is complete` clause fell
        // away with the axis (ADR-048): the edition IS the complete one.
        when: [
          { type: "role-is", role: "hunter" },
          {
            type: "choice-is",
            choiceId: "core.choice.prologue.priority",
            optionId: "core.option.prologue.document",
          },
        ],
        confirmation: {
          titleKey: "core.message.finale.confirm.title",
          bodyKey: "core.message.finale.confirm.body",
          confirmKey: "core.message.finale.confirm.confirm",
          cancelKey: "core.message.finale.confirm.cancel",
          safeInitialFocus: "cancel",
        },
        effects: [
          { type: "adjust-score", score: "evidence", delta: 1 },
          { type: "adjust-score", score: "care", delta: -1 },
          { type: "adjust-score", score: "publicTrust", delta: -1 },
          {
            type: "record-choice",
            choiceId: "core.choice.finale.stand",
            optionId: "core.option.finale.shoot",
          },
          { type: "set-varano-fate", fate: "killedByHunter" },
        ],
        targetNodeId: "core.node.finale.killed",
      },
    ],
  },
  {
    id: "core.node.finale.rescued",
    chapterId: finaleChapterId,
    type: "ending",
    narrativeLayer: "legend",
    outcomeId: "core.outcome.varano-chooses-rescue",
    titleKey: "core.message.ending.rescued.title",
    bodyKey: "core.message.ending.rescued.body",
  },
  {
    id: "core.node.finale.escaped",
    chapterId: finaleChapterId,
    type: "ending",
    narrativeLayer: "legend",
    outcomeId: "core.outcome.escaped-alive",
    titleKey: "core.message.ending.escaped.title",
    bodyKey: "core.message.ending.escaped.body",
  },
  {
    id: "core.node.finale.count",
    chapterId: finaleChapterId,
    type: "ending",
    narrativeLayer: "legend",
    outcomeId: "core.outcome.varano-count",
    titleKey: "core.message.ending.count.title",
    bodyKey: "core.message.ending.count.body",
  },
  {
    id: "core.node.finale.crowned",
    chapterId: finaleChapterId,
    type: "ending",
    narrativeLayer: "legend",
    outcomeId: "core.outcome.count-of-six-hills",
    titleKey: "core.message.ending.crowned.title",
    bodyKey: "core.message.ending.crowned.body",
  },
  {
    id: "core.node.finale.killed",
    chapterId: finaleChapterId,
    type: "ending",
    narrativeLayer: "legend",
    sensitivityTags: ["impliedAnimalDeath"],
    outcomeId: "core.outcome.hunter-killed-varano",
    titleKey: "core.message.ending.killed.title",
    bodyKey: "core.message.ending.killed.body",
  },
  {
    id: finaleNodeId,
    chapterId: finaleChapterId,
    type: "ending",
    narrativeLayer: "legend",
    outcomeId: "core.outcome.open-mystery",
    titleKey: "core.message.ending.title",
    bodyKey: "core.message.ending.body",
  },
];

export const finaleChapter: ChapterBundle = {
  chapter: {
    id: finaleChapterId,
    titleKey: "core.message.chapter.finale.title",
    entryNodeId: finaleConfrontationNodeId,
    checkpointNodeId: finaleConfrontationNodeId,
  },
  nodes,
  dossierCards: [],
  clues: [],
  messages: finaleMessages,
  sources: [],
};
