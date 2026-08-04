import { describe, expect, it } from "vitest";

import {
  campiLevelConfig,
  chatLevelConfig,
  registeredLevels,
  superstarLevelConfig,
} from "../../src/levels/registry";

describe("level backdrops", () => {
  it("gives every registered level its own backdrop", () => {
    for (const level of registeredLevels) {
      expect(level.config.backdrop, level.levelId).toBeDefined();
      expect(level.config.backdrop.sky).toHaveLength(3);
    }
  });

  it("never repeats the same backdrop on two levels", () => {
    // The whole point of ADR-033: the levels must stop looking alike.
    const signatures = registeredLevels.map((level) => {
      const backdrop = level.config.backdrop;
      return [
        backdrop.sky.join(","),
        String(backdrop.night),
        backdrop.far,
        backdrop.near,
      ].join("|");
    });
    expect(new Set(signatures).size).toBe(registeredLevels.length);
  });

  it("keeps level 1 pixel-identical to what shipped before ADR-033", () => {
    // Level 1 is published: its night sky must not shift by a single value.
    expect(campiLevelConfig.backdrop).toEqual({
      sky: ["#0a0f26", "#10203f", "#1c3350"],
      night: true,
      far: "hills",
      near: "corn",
    });
  });

  it("matches the time of day to the story", () => {
    // 2:39 and 2:41 are night; the public opening of the castle is not.
    expect(campiLevelConfig.backdrop.night).toBe(true);
    expect(chatLevelConfig.backdrop.night).toBe(true);
    expect(superstarLevelConfig.backdrop.night).toBe(false);
  });

  it("shows the castle in the distance on the level that heads there", () => {
    expect(superstarLevelConfig.backdrop.far).toBe("castle");
    expect(superstarLevelConfig.finishKind).toBe("walls");
  });
});
