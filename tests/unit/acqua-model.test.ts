import { describe, expect, it } from "vitest";

import { acquaLevelConfig } from "../../src/levels/registry";
import type { PlatformerViewConfig } from "../../src/levels/adapters/platformer";
import { jumpReach } from "../../src/levels/define-level";
import {
  movingPlatformAt,
  type PlatformerObstacle,
} from "../../src/levels/platformer-model";
import { playthrough } from "./helpers/level-playthrough";

/**
 * Level design invariants for «Acqua e impronte» (ADR-045). The generic suites
 * (honest gaps, unique backdrop and music, clue supports, no forced ferry,
 * shared physics) already cover it through `registeredLevels`; here live the
 * guarantees that are this level's own.
 */
describe("Acqua e impronte level design", () => {
  const config = acquaLevelConfig;
  // `defineLevel` keeps the literal shape, which is what lets the geometry
  // assertions read `config.platforms[0].x` without a null check. The wider
  // view is how the optional halves of the contract are reached.
  const viewConfig: PlatformerViewConfig = config;
  const obstacles: readonly PlatformerObstacle[] = config.obstacles;
  const reach = jumpReach(config);

  it("keeps every ditch within the reach of a jump without the sprint", () => {
    const segments = [...config.groundSegments].sort((a, b) => a.x - b.x);
    for (let index = 0; index < segments.length - 1; index += 1) {
      const current = segments[index];
      const next = segments[index + 1];
      if (current === undefined || next === undefined) {
        continue;
      }
      const width = next.x - (current.x + current.width);
      expect(width).toBeLessThan(reach.horizontal - 20);
    }
  });

  it("covers every blocking obstacle with a platform route above it", () => {
    const blocking = obstacles.filter((obstacle) => obstacle.kind !== "cables");
    expect(blocking.length).toBeGreaterThan(0);
    for (const obstacle of blocking) {
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

  it("keeps every platform reachable, from the ground or from a neighbour", () => {
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
        `platform at ${String(platform.x)}/${String(platform.y)} is unreachable`,
      ).toBe(true);
    }
  });

  it("never lets a sprinting walk-off a platform end in the water", () => {
    // The invariant learned in the red zone (ADR-045): gliding off any
    // platform at sprint speed must land on a bank, never in a ditch.
    const sprintSpeed = config.sprint.maxSpeed;
    const segments = [...config.groundSegments].sort((a, b) => a.x - b.x);
    for (const platform of config.platforms) {
      const edge = platform.x + platform.width;
      const drop = config.floorY - platform.y;
      const glide = sprintSpeed * Math.sqrt((2 * drop) / config.gravity);
      const landing = edge + glide;
      const overGround = segments.some(
        (segment) =>
          landing >= segment.x && landing <= segment.x + segment.width,
      );
      expect(
        overGround,
        `a sprint off the platform ending at ${String(edge)} lands in the water`,
      ).toBe(true);
    }
  });

  it("counts six nutrias, and dresses every one of them (ADR-045)", () => {
    // Canon: the drone finds seven warm shapes, six of them are nutrias, and
    // nobody has told Toni about the seventh.
    const nutrias = obstacles.filter((obstacle) =>
      obstacle.id.startsWith("nutria-"),
    );
    expect(nutrias).toHaveLength(6);
    for (const nutria of nutrias) {
      // They nudge and can be calmed by the Custode's call: never blockers.
      expect(nutria.kind, nutria.id).toBe("onlooker");
      expect(viewConfig.obstacleLooks?.[nutria.id], nutria.id).toBe("nutria");
    }
  });

  it("takes the poplar rows out on the water, at the hour before dawn", () => {
    expect(config.backdrop.near).toBe("poplars");
    expect(config.backdrop.night).toBe(true);
    expect(config.gapKind).toBe("water");
    // The reed beds belong to the sealed zone; this level is its own place,
    // and unlike the laboratory it never goes indoors.
    expect(viewConfig.backdrop.indoor).toBeUndefined();
  });

  it("grants no ★ and hides no star: the powers stay an opening-day debut", () => {
    expect(viewConfig.powersByRole).toBeUndefined();
    expect(viewConfig.bonus).toBeUndefined();
  });

  it("shuttles the raft across the second ditch, never past its banks", () => {
    const raft = config.movingPlatforms[0];
    for (let elapsed = 0; elapsed < 40; elapsed += 0.29) {
      const position = movingPlatformAt(raft, elapsed);
      expect(position.x).toBeGreaterThanOrEqual(1380);
      expect(position.x + position.width).toBeLessThanOrEqual(1470);
      expect(position.y).toBeGreaterThan(config.floorY);
    }
  });

  it("completes the level with no falls and no powers", () => {
    const state = playthrough(config, undefined);
    expect(state.completed).toBe(true);
    expect(state.respawns).toBe(0);
  });
});
