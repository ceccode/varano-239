import { describe, expect, it } from "vitest";

import { labLevelConfig } from "../../src/levels/registry";
import type { PlatformerViewConfig } from "../../src/levels/adapters/platformer";
import { jumpReach } from "../../src/levels/define-level";
import { movingPlatformAt } from "../../src/levels/platformer-model";
import { playthrough } from "./helpers/level-playthrough";

/**
 * Level design invariants for «Tre identità» (ADR-045). The generic suites
 * (honest gaps, fair jump windows, unique backdrop and music, clue supports,
 * shared physics) already cover it through `registeredLevels`; here live the
 * guarantees that are this level's own.
 */
describe("Tre identità level design", () => {
  const config = labLevelConfig;
  const reach = jumpReach(config);

  it("keeps every loading pit within the reach of a jump without the sprint", () => {
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
    const blocking = config.obstacles.filter(
      (obstacle) => obstacle.kind !== "cables",
    );
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

  it("never lets a sprinting walk-off a platform end in a pit", () => {
    // The invariant learned in the red zone (ADR-045): gliding off any
    // platform at sprint speed must land on the floor, never in a pit.
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
        `a sprint off the platform ending at ${String(edge)} lands in a pit`,
      ).toBe(true);
    }
  });

  it("is the second interior, and reopens on the night sky before the end", () => {
    // ADR-039 mechanics, ADR-045 usage: warehouse shell, doorway to the hills.
    expect(config.backdrop.indoor).toBeDefined();
    const indoor = config.backdrop.indoor;
    expect(indoor.skyFromX).toBeLessThan(config.finishX);
    expect(config.finishX - indoor.skyFromX).toBeGreaterThan(
      config.viewportWidth,
    );
    // Its shell and its outside sky are both its own: no level shares them.
    expect(config.backdrop.night).toBe(true);
    expect(config.groundKind).toBe("stone");
  });

  it("grants no ★ and hides no star: the powers stay an opening-day debut", () => {
    const viewConfig: PlatformerViewConfig = config;
    expect(viewConfig.powersByRole).toBeUndefined();
    expect(viewConfig.bonus).toBeUndefined();
  });

  it("shuttles the conveyor across the second pit, never past its edges", () => {
    const conveyor = config.movingPlatforms[0];
    for (let elapsed = 0; elapsed < 40; elapsed += 0.27) {
      const position = movingPlatformAt(conveyor, elapsed);
      expect(position.x).toBeGreaterThanOrEqual(1440);
      expect(position.x + position.width).toBeLessThanOrEqual(1520);
      expect(position.y).toBeGreaterThan(config.floorY);
    }
  });

  it("completes the level with no falls and no powers", () => {
    const state = playthrough(config, undefined);
    expect(state.completed).toBe(true);
    expect(state.respawns).toBe(0);
  });
});
