import type { StoryNode } from "../../src/core/model";
import type {
  DossierCard,
  SourceRef,
  TruthLabel,
} from "../../src/content/dossier";
import type {
  ChapterInsertion,
  CoreChapterTransition,
  StoryPack,
} from "../../src/content/story-pack";

const source = {
  id: "test.source.primary",
  publisher: "Editore di prova",
  title: "Fonte di prova",
  url: "https://example.invalid/source",
  accessedAt: "2026-08-01",
} satisfies SourceRef;

const dossierCard = {
  id: "test.dossier.legend",
  label: "legend",
  titleKey: "test.message.dossier-title",
  bodyKey: "test.message.dossier-body",
  sourceIds: [],
  fictionNoticeKey: "test.message.fiction-notice",
  verifiedAt: "2026-08-01",
} satisfies DossierCard;

const chapterEndNode = {
  id: "test.node.chapter-end",
  chapterId: "test.chapter.foundation",
  narrativeLayer: "legend",
  type: "chapter-end",
} satisfies StoryNode;

const storyPack = {
  id: "test",
  version: 1,
  kind: "core",
  titleKey: "test.message.pack-title",
  descriptionKey: "test.message.pack-description",
  estimatedMinutes: 0,
  requires: [],
  chapters: [
    {
      chapter: {
        id: "test.chapter.foundation",
        titleKey: "test.message.chapter-title",
        entryNodeId: chapterEndNode.id,
        checkpointNodeId: chapterEndNode.id,
      },
      nodes: [chapterEndNode],
      dossierCards: [dossierCard],
      clues: [],
      messages: {
        "test.message.pack-title": "Pacchetto di prova",
      },
      sources: [source],
    },
  ],
  mysteries: [],
  theories: [],
} satisfies StoryPack;

const transition = {
  exitNodeId: chapterEndNode.id,
  targetNodeId: "test.node.next",
  extensionPointId: "test.hook.after-foundation",
} satisfies CoreChapterTransition;

const insertion = {
  at: transition.extensionPointId,
  order: 0,
} satisfies ChapterInsertion;

// @ts-expect-error I timbri fuori dal contratto devono essere rifiutati.
const invalidTruthLabel: TruthLabel = "opinion";

void storyPack;
void transition;
void insertion;
void invalidTruthLabel;
