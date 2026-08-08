import type { StoryGraph, StoryNode } from "../../../core/model.ts";
import { chainChapters } from "../../chain-chapters.ts";
import type { MessageCatalog, StoryPack } from "../../story-pack.ts";
import { firstSightingChapter } from "./chapters/c00-first-sighting/chapter.ts";
import { villageChatsChapter } from "./chapters/c01-village-chats/chapter.ts";
import { superstarChapter } from "./chapters/c02-superstar/chapter.ts";
import { redZoneChapter } from "./chapters/c05-red-zone/chapter.ts";
import { threeIdentitiesChapter } from "./chapters/c06-three-identities/chapter.ts";
import { castleParkChapter } from "./chapters/c03-castle-park/chapter.ts";
import { castleKeepChapter } from "./chapters/c04-castle-keep/chapter.ts";
import { finaleChapter } from "./chapters/c99-finale/chapter.ts";
import { uiMessages } from "./ui-messages.ts";

/**
 * The campaign in order. Adding a level means adding a chapter folder and one
 * entry here, before the finale: the chapters already written stay untouched
 * because each one links onward to `nextChapterNodeId` (ADR-034).
 */
const chapters = chainChapters([
  firstSightingChapter,
  villageChatsChapter,
  // The long night (ADR-045): story order lives here, folder numbers are
  // production order.
  redZoneChapter,
  threeIdentitiesChapter,
  superstarChapter,
  castleParkChapter,
  castleKeepChapter,
  finaleChapter,
]);

export const corePack = {
  id: "core",
  version: 7,
  kind: "core",
  titleKey: "core.message.pack.title",
  descriptionKey: "core.message.pack.description",
  estimatedMinutes: 16,
  requires: [],
  chapters,
  mysteries: [],
  theories: [],
} as const satisfies StoryPack;

/** Chrome plus every chapter's own catalogue, in chapter order. */
export const coreMessages: MessageCatalog = corePack.chapters.reduce<
  Record<string, string>
>((catalog, bundle) => ({ ...catalog, ...bundle.messages }), {
  ...uiMessages,
});

const entryChapter = corePack.chapters[0];
if (entryChapter === undefined) {
  throw new Error("The core pack needs at least one chapter.");
}

export const coreStoryGraph: StoryGraph = {
  entryNodeId: entryChapter.chapter.entryNodeId,
  nodes: corePack.chapters.flatMap(
    (bundle): readonly StoryNode[] => bundle.nodes,
  ),
};
