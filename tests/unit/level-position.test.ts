import { describe, expect, it } from "vitest";

import { coreStoryGraph } from "../../src/content/packs/core/pack";
import { levelPosition } from "../../src/content/level-position";

describe("levelPosition (ADR-045)", () => {
  it("numbers the levels in story order, straight from the graph", () => {
    const levels = coreStoryGraph.nodes.filter((node) => node.type === "level");
    levels.forEach((level, index) => {
      expect(levelPosition(coreStoryGraph, level.id)).toEqual({
        index: index + 1,
        total: levels.length,
      });
    });
  });

  it("places the sealed zone third, between the chats and opening day", () => {
    // The point of computing instead of hardcoding: the inserted chapter
    // renumbers everything by itself.
    const position = levelPosition(coreStoryGraph, "core.node.zona.level");
    expect(position?.index).toBe(3);
  });

  it("returns undefined for anything that is not a level", () => {
    expect(
      levelPosition(coreStoryGraph, "core.node.finale.confrontation"),
    ).toBeUndefined();
  });
});
