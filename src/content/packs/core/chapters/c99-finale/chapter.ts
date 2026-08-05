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
    "core.message.ending.title": "La porta della torre è socchiusa",
    "core.message.ending.body":
      "Tre notti, un giorno di gloria e dodici indizi: chi ha spedito la foto delle 2:39 è entrato nel castello prima di tutti, con le chiavi giuste, e ha lasciato la strada aperta fino alla torre. Il Varano ci è già passato: da qualche parte là sopra c’è una pietra al sole che aspetta il suo Conte. Manca solo un nome, e sta un piano più su. Questa ricostruzione è Leggenda: specie, provenienza e destino reale del Varano restano tutti da scoprire.",
  },
  sources: [],
};
