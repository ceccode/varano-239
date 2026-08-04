// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";

import { createInitialState } from "../../src/core/game-state";
import type { LevelNode } from "../../src/core/model";
import { mountRegisteredLevel } from "../../src/levels/registry";

describe("level registry", () => {
  it("returns no adapter for an unknown level/configuration pair", () => {
    const unknownLevel: LevelNode = {
      id: "core.node.unknown-level",
      chapterId: "core.chapter.test",
      type: "level",
      narrativeLayer: "legend",
      levelId: "core.level.unknown",
      configId: "core.level-config.unknown",
      headingKey: "core.message.level.heading",
      recapKey: "core.message.level.recap",
      introKey: "core.message.level.intro",
      completedNodeId: "core.node.completed",
      skippedNodeId: "core.node.skipped",
    };
    expect(
      mountRegisteredLevel({
        host: document.createElement("div"),
        node: unknownLevel,
        role: "varano",
        settings: createInitialState().settings,
        message: (key) => key,
        audio: {
          startMusic: vi.fn(),
          stopMusic: vi.fn(),
          playEffect: vi.fn(),
        },
        onComplete: vi.fn(),
        onExit: vi.fn(),
      }),
    ).toBeUndefined();
  });
});
