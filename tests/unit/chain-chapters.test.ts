import { describe, expect, it } from "vitest";

import {
  chainChapters,
  nextChapterNodeId,
} from "../../src/content/chain-chapters";
import { corePack, coreStoryGraph } from "../../src/content/packs/core/pack";
import type { ChapterBundle } from "../../src/content/story-pack";

function chapter(index: number, linkOnward: boolean): ChapterBundle {
  const entryId = `core.node.c${String(index)}.entry`;
  return {
    chapter: {
      id: `core.chapter.c${String(index)}`,
      titleKey: "core.message.pack.title",
      entryNodeId: entryId,
      checkpointNodeId: entryId,
      exitNodeId: entryId,
    },
    nodes: [
      {
        id: entryId,
        chapterId: `core.chapter.c${String(index)}`,
        type: "dialogue",
        narrativeLayer: "legend",
        lines: [],
        next: linkOnward ? nextChapterNodeId : entryId,
      },
    ],
    dossierCards: [],
    clues: [],
    messages: {},
    sources: [],
  };
}

describe("chapter chaining", () => {
  it("links each chapter to the entry of the one that follows", () => {
    const chained = chainChapters([
      chapter(0, true),
      chapter(1, true),
      chapter(2, true),
      chapter(3, false),
    ]);

    for (let index = 0; index < chained.length - 1; index += 1) {
      const node = chained[index]?.nodes[0];
      const successor = chained[index + 1]?.chapter.entryNodeId;
      expect(node?.type).toBe("dialogue");
      if (node?.type === "dialogue") {
        expect(node.next).toBe(successor);
      }
    }
  });

  it("refuses a last chapter that still points at a successor", () => {
    // A dangling placeholder would be a broken graph, so it fails the build.
    expect(() => chainChapters([chapter(0, true), chapter(1, true)])).toThrow(
      /is the last one/,
    );
  });

  it("leaves no placeholder anywhere in the shipped graph", () => {
    const links = coreStoryGraph.nodes.flatMap((node) => {
      switch (node.type) {
        case "dialogue":
        case "dossier-card":
        case "surprise":
          return [node.next];
        case "choice":
          return node.options.map((option) => option.targetNodeId);
        case "level":
          return [node.completedNodeId, node.skippedNodeId];
        case "scene":
          return node.hotspots.map((hotspot) => hotspot.targetNodeId);
        case "chapter-end":
        case "ending":
          return [];
      }
    });
    expect(links).not.toContain(nextChapterNodeId);
  });

  it("keeps the finale in its own chapter, always last", () => {
    // This is what lets a new level be one array entry: nothing has to move
    // the finale, and no chapter that already shipped gets edited (ADR-034).
    // Since ADR-040 the finale opens on the tower confrontation and owns all
    // of the ending families.
    const last = corePack.chapters.at(-1);
    expect(last?.chapter.id).toBe("core.chapter.c99-finale");
    expect(last?.chapter.entryNodeId).toBe("core.node.finale.confrontation");
    expect(
      last?.nodes.find((node) => node.id === last.chapter.entryNodeId)?.type,
    ).toBe("choice");

    const endings = coreStoryGraph.nodes.filter(
      (node) => node.type === "ending",
    );
    // Five families plus the six-seal coronation (ADR-045).
    expect(endings).toHaveLength(6);
    for (const ending of endings) {
      expect(ending.chapterId).toBe("core.chapter.c99-finale");
    }
  });

  it("gives every chapter a distinct recap for its level", () => {
    const recaps = coreStoryGraph.nodes
      .filter((node) => node.type === "level")
      .map((node) => node.recapKey);
    expect(recaps.length).toBeGreaterThan(1);
    expect(new Set(recaps).size).toBe(recaps.length);
  });
});
