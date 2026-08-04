import { describe, expect, it } from "vitest";

import {
  defineLevel,
  jumpReach,
  platformerDefaults,
} from "../../src/levels/define-level";
import { registeredLevels } from "../../src/levels/registry";

describe("level definition defaults", () => {
  it("keeps the shipped feel identical on every level", () => {
    // The physics is what makes the game feel like itself: a level that drifted
    // from these numbers would play like a different game (ADR-034).
    for (const level of registeredLevels) {
      expect(level.config.maxSpeed, level.levelId).toBe(150);
      expect(level.config.gravity, level.levelId).toBe(640);
      expect(level.config.jumpSpeed, level.levelId).toBe(250);
      expect(level.config.jumpCutFactor, level.levelId).toBe(0.45);
      expect(level.config.coyoteSeconds, level.levelId).toBe(0.1);
      expect(level.config.jumpBufferSeconds, level.levelId).toBe(0.14);
      expect(level.config.playerWidth, level.levelId).toBe(24);
      expect(level.config.playerHeight, level.levelId).toBe(14);
      expect(level.config.floorY, level.levelId).toBe(154);
    }
  });

  it("shares the control labels instead of repeating them", () => {
    for (const level of registeredLevels) {
      expect(level.config.leftKey).toBe("core.message.level.control.left");
      expect(level.config.rightKey).toBe("core.message.level.control.right");
      expect(level.config.jumpKey).toBe("core.message.level.control.jump");
    }
  });

  it("lets a level override a default when it means to", () => {
    const level = defineLevel({
      worldWidth: 100,
      maxSpeed: 999,
      groundSegments: [],
      platforms: [],
      pickups: [],
      checkpoints: [],
      finishX: 90,
      backdrop: {
        sky: ["#000", "#111", "#222"],
        night: true,
        far: "none",
        near: "none",
      },
      objectiveKey: "k",
      controlsKey: "k",
      statusKeys: ["k", "k", "k", "k"],
      finishStatusKey: "k",
      narrativeStartKey: "k",
      narrativePickupKeys: {},
      narrativeCheckpointKey: "k",
      narrativeRespawnKey: "k",
      narrativeFinishKey: "k",
    });
    expect(level.maxSpeed).toBe(999);
    expect(level.gravity).toBe(platformerDefaults.gravity);
  });

  it("reports the reach of a plain jump", () => {
    const reach = jumpReach(registeredLevels[0]?.config ?? defaultsProbe());
    expect(reach.horizontal).toBeCloseTo(117.19, 1);
    expect(reach.height).toBeCloseTo(48.83, 1);
  });
});

function defaultsProbe(): never {
  throw new Error("At least one level must be registered.");
}
