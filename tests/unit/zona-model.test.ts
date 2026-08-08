import { describe, expect, it } from "vitest";

import { zonaLevelConfig } from "../../src/levels/registry";
import type { PlatformerViewConfig } from "../../src/levels/adapters/platformer";
import { jumpReach } from "../../src/levels/define-level";
import { movingPlatformAt } from "../../src/levels/platformer-model";
import { playthrough } from "./helpers/level-playthrough";

/**
 * Level design invariants for «La zona interdetta» (ADR-045). The generic
 * suites (honest gaps, fair jump windows, unique backdrop and music, clue
 * supports, shared physics) already cover it through `registeredLevels`;
 * here live the guarantees that are this level's own.
 */
describe("La zona interdetta level design", () => {
  const config = zonaLevelConfig;
  const reach = jumpReach(config);

  it("keeps every ditch within the reach of a jump without the sprint", () => {
    // The sprint is comfort, never a key (ADR-045): unlike level 2, every
    // gap of the sealed zone is honest at walking speed.
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
    // The sealed zone has no cables: every obstacle here blocks or pushes.
    const blocking = config.obstacles;
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

  it("never lets a sprinting walk-off a platform end in a ditch", () => {
    // The trap this level design walked into twice before the tests caught
    // it: a platform whose right edge is close enough to a ditch that gliding
    // off it at sprint speed lands in the water. The glide must always end
    // on the bank.
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
        `a sprint off the platform ending at ${String(edge)} lands in a ditch`,
      ).toBe(true);
    }
  });

  it("dresses both cages without touching their physics, and grants no ★", () => {
    expect(config.obstacleLooks["gabbia-1"]).toBe("cage");
    expect(config.obstacleLooks["gabbia-2"]).toBe("cage");
    // Before opening day nobody has a superpower (ADR-045), so no star. The
    // literal config omits both fields; the wide contract makes that visible.
    const viewConfig: PlatformerViewConfig = config;
    expect(viewConfig.powersByRole).toBeUndefined();
    expect(viewConfig.bonus).toBeUndefined();
  });

  it("ferries the walkway across the second ditch, never past its banks", () => {
    const walkway = config.movingPlatforms[0];
    for (let elapsed = 0; elapsed < 40; elapsed += 0.29) {
      const position = movingPlatformAt(walkway, elapsed);
      expect(position.x).toBeGreaterThanOrEqual(1260);
      expect(position.x + position.width).toBeLessThanOrEqual(1345);
      // Below bank level: reachable by falling in, never a wall.
      expect(position.y).toBeGreaterThan(config.floorY);
    }
  });

  it("completes the level with no falls and no powers", () => {
    const state = playthrough(config, undefined);
    expect(state.completed).toBe(true);
    expect(state.respawns).toBe(0);
  });
});
