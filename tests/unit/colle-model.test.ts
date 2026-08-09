import { describe, expect, it } from "vitest";

import { colleLevelConfig, registeredLevels } from "../../src/levels/registry";
import type { PlatformerViewConfig } from "../../src/levels/adapters/platformer";
import { jumpReach } from "../../src/levels/define-level";
import type { PlatformerObstacle } from "../../src/levels/platformer-model";
import { playthrough } from "./helpers/level-playthrough";

/**
 * Level design invariants for «Il colle di San Pancrazio» (ADR-045), tenth
 * and last. Two of them are the level's argument: it is the breather of the
 * campaign, and its shape rehearses its own interlude — the low road always
 * gets you there, the terraces are where the evidence is.
 */
describe("Il colle di San Pancrazio level design", () => {
  const config = colleLevelConfig;
  const viewConfig: PlatformerViewConfig = config;
  const obstacles: readonly PlatformerObstacle[] = config.obstacles;
  const reach = jumpReach(config);

  it("keeps every washout within the reach of a jump without the sprint", () => {
    const segments = [...config.groundSegments].sort((a, b) => a.x - b.x);
    for (let index = 0; index < segments.length - 1; index += 1) {
      const current = segments[index];
      const next = segments[index + 1];
      if (current === undefined || next === undefined) {
        continue;
      }
      expect(next.x - (current.x + current.width)).toBeLessThan(
        reach.horizontal - 20,
      );
    }
  });

  it("is the breather: the emptiest level that has obstacles at all", () => {
    // The two opening levels teach movement and carry none; among every
    // level that does put something in the way, this one puts the least.
    const populated = registeredLevels.filter(
      (level) =>
        level.config !== viewConfig &&
        (level.config.obstacles?.length ?? 0) > 0,
    );
    expect(populated.length).toBeGreaterThan(0);
    for (const level of populated) {
      expect(obstacles.length, `${level.levelId} is emptier`).toBeLessThan(
        level.config.obstacles?.length ?? 0,
      );
    }
    // And nothing shuttles here: the terraces are the whole mechanic.
    expect(viewConfig.movingPlatforms ?? []).toHaveLength(0);
  });

  it("puts every clue on the terraces, never on the low road", () => {
    // The level rehearses its own interlude: the safe road always gets you
    // there, the fresh evidence is what asks you to climb.
    for (const pickup of config.pickups) {
      const onGround = config.groundSegments.some(
        (segment) =>
          pickup.x >= segment.x &&
          pickup.x <= segment.x + segment.width &&
          config.floorY - pickup.y < reach.height,
      );
      expect(onGround, `${pickup.id} is grabbable from the road`).toBe(false);
      const terrace = config.platforms.filter(
        (platform) =>
          pickup.x >= platform.x &&
          pickup.x <= platform.x + platform.width &&
          platform.y >= pickup.y &&
          platform.y - pickup.y < reach.height,
      );
      expect(terrace.length, `${pickup.id} has no terrace`).toBeGreaterThan(0);
    }
  });

  it("climbs higher than every other level in the campaign", () => {
    const highestHere = Math.min(
      ...config.platforms.map((platform) => platform.y),
    );
    for (const level of registeredLevels) {
      if (level.config === viewConfig) {
        continue;
      }
      expect(
        highestHere,
        `${level.levelId} climbs at least as high`,
      ).toBeLessThan(Math.min(...level.config.platforms.map((p) => p.y)));
    }
  });

  it("covers every blocking obstacle with a platform route above it", () => {
    for (const obstacle of obstacles.filter(
      (candidate) => candidate.kind !== "cables",
    )) {
      const bypass = config.platforms.filter(
        (platform) =>
          platform.y <= obstacle.y &&
          platform.x <= obstacle.x &&
          platform.x + platform.width >= obstacle.x + obstacle.width,
      );
      expect(
        bypass.length,
        `${obstacle.id} has no platform route above it`,
      ).toBeGreaterThan(0);
    }
  });

  it("keeps every terrace reachable, from the ground or from the one below", () => {
    for (const platform of config.platforms) {
      const fromGround = config.groundSegments.some(
        (segment) =>
          platform.x < segment.x + segment.width &&
          platform.x + platform.width > segment.x &&
          config.floorY - platform.y < reach.height,
      );
      const fromNeighbour = config.platforms.some((other) => {
        if (other === platform) {
          return false;
        }
        const horizontal = Math.max(
          0,
          Math.max(
            platform.x - (other.x + other.width),
            other.x - (platform.x + platform.width),
          ),
        );
        return (
          horizontal < reach.horizontal && other.y - platform.y < reach.height
        );
      });
      expect(
        fromGround || fromNeighbour,
        `terrace at ${String(platform.x)}/${String(platform.y)} is unreachable`,
      ).toBe(true);
    }
  });

  it("never lets a sprinting walk-off a terrace end in a washout", () => {
    const sprintSpeed = config.sprint.maxSpeed;
    const segments = [...config.groundSegments].sort((a, b) => a.x - b.x);
    for (const platform of config.platforms) {
      const edge = platform.x + platform.width;
      const drop = config.floorY - platform.y;
      const landing =
        edge + sprintSpeed * Math.sqrt((2 * drop) / config.gravity);
      expect(
        segments.some(
          (segment) =>
            landing >= segment.x && landing <= segment.x + segment.width,
        ),
        `a sprint off the terrace ending at ${String(edge)} lands in a washout`,
      ).toBe(true);
    }
  });

  it("is the one dawn of the campaign, with the castle on the skyline", () => {
    expect(config.backdrop.night).toBe(false);
    expect(config.backdrop.far).toBe("castle");
    expect(config.backdrop.near).toBe("terraces");
    expect(config.music).toBe("dawn");
  });

  it("grants no ★ and hides no star: the powers stay an opening-day debut", () => {
    expect(viewConfig.powersByRole).toBeUndefined();
    expect(viewConfig.bonus).toBeUndefined();
  });

  it("completes the level with no falls and no powers", () => {
    const state = playthrough(config, undefined);
    expect(state.completed).toBe(true);
    expect(state.respawns).toBe(0);
  });
});
