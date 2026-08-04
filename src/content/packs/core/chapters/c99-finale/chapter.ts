import type { StoryNode } from "../../../../../core/model.ts";
import type { ChapterBundle } from "../../../../story-pack.ts";

export const finaleChapterId = "core.chapter.c99-finale";
export const finaleNodeId = "core.node.finale.open-mystery";

/**
 * The open ending lives in its own bundle, always last. Adding a chapter is
 * then a new entry in the pack's array: nothing has to move the ending, and no
 * chapter that already shipped gets edited.
 */
const nodes: readonly StoryNode[] = [
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
    entryNodeId: finaleNodeId,
    checkpointNodeId: finaleNodeId,
  },
  nodes,
  dossierCards: [],
  clues: [],
  messages: {
    "core.message.chapter.finale.title": "Il mistero resta aperto",
    "core.message.ending.title": "Il Conte è entrato nel parco",
    "core.message.ending.body":
      "Tre notti, nove indizi e un nome solo: la foto delle 2:39 non è arrivata per caso ai telefoni del paese, e chi l’ha spedita voleva esattamente questo circo. Adesso il poster ha incoronato il Varano «Conte dei Sei Colli», il Castello Bonoris ha aperto i cancelli e il Varano è entrato nel parco da solo. Questa ricostruzione è Leggenda: specie, provenienza e destino reale del Varano restano tutti da scoprire.",
  },
  sources: [],
};
