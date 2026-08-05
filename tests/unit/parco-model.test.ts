import { describe, expect, it } from "vitest";

import type { Role } from "../../src/core/model";
import { parcoLevelConfig, roleSuperpowers } from "../../src/levels/registry";
import { jumpReach } from "../../src/levels/define-level";
import {
  carPositionAt,
  createPlatformerState,
  stepPlatformer,
  type PlatformerConfig,
  type PlatformerState,
  type PowerConfig,
} from "../../src/levels/platformer-model";
import { playthrough } from "./helpers/level-playthrough";

/**
 * Level design invariants for level 4, the castle park (ADR-036). The generic
 * suites (honest gaps, fair jump windows, unique backdrop, shared physics)
 * already cover it through `registeredLevels`; here live the guarantees that
 * are this level's own.
 */
describe("Il parco del Castello level design", () => {
  const config = parcoLevelConfig;
  const reach = jumpReach(config);

  it("keeps every gap within the reach of a jump without any power", () => {
    // Same guarantee as level 3 (ADR-032): the moat never needs a sprint.
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

  it("keeps every clue reachable from a support below", () => {
    for (const pickup of config.pickups) {
      const supports = [
        ...config.platforms
          .filter(
            (platform) =>
              pickup.x >= platform.x &&
              pickup.x <= platform.x + platform.width &&
              platform.y >= pickup.y,
          )
          .map((platform) => platform.y),
        ...config.groundSegments
          .filter(
            (segment) =>
              pickup.x >= segment.x && pickup.x <= segment.x + segment.width,
          )
          .map(() => config.floorY),
      ];
      expect(supports.length, pickup.id).toBeGreaterThan(0);
      const closest = Math.min(...supports);
      expect(closest - pickup.y).toBeGreaterThanOrEqual(0);
      expect(closest - pickup.y).toBeLessThan(reach.height);
    }
  });

  it("covers every blocking obstacle with a platform route above it", () => {
    // The park has no cables, so every obstacle here blocks and needs a route.
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

  it("shares the exact superpower tuning of level 3", () => {
    // The player just learned these; level 4 consolidates, never retunes.
    expect(config.powersByRole).toBe(roleSuperpowers);
  });

  it("draws its gaps as the moat's water", () => {
    expect(config.gapKind).toBe("water");
  });
});

describe("the gadget van (ADR-037)", () => {
  const config = parcoLevelConfig;
  const car = config.cars[0];
  const reach = jumpReach(config);
  const step = 1 / 120;

  it("moves deterministically and never leaves its patrol range", () => {
    for (let elapsed = 0; elapsed < 60; elapsed += 0.37) {
      const x = carPositionAt(car, elapsed);
      expect(x).toBeGreaterThanOrEqual(car.minX);
      expect(x).toBeLessThanOrEqual(car.maxX);
      // Pure function of time: the same moment always gives the same spot.
      expect(carPositionAt(car, elapsed)).toBe(x);
    }
  });

  it("stays low enough that a plain jump always clears it", () => {
    // The whole contract of the van: it must be jumpable by every role,
    // with no power and with margin — a hazard, never a wall.
    expect(car.height).toBeLessThan(reach.height - 20);
  });

  it("patrols flat ground, clear of the moat, the kiosk and the finish", () => {
    const segments = [...config.groundSegments].sort((a, b) => a.x - b.x);
    const home = segments.find(
      (segment) =>
        car.minX >= segment.x &&
        car.maxX + car.width <= segment.x + segment.width,
    );
    // One segment holds the whole patrol: the van never dives into the water.
    expect(home).toBeDefined();
    // It starts past the kiosk roof (ends at 2680) and stops short of the
    // walls, so neither set piece turns into a squeeze.
    expect(car.minX).toBeGreaterThan(2680);
    expect(car.maxX + car.width).toBeLessThan(config.finishX - 400);
  });

  it("passes under the terrace, so waiting is always an option", () => {
    // No-reflex route: stand on a platform inside the patrol range and let it
    // go by. Standing there must keep the player above the van's roof.
    const refuge = config.platforms.find(
      (platform) =>
        platform.x >= car.minX &&
        platform.x + platform.width <= car.maxX + car.width,
    );
    expect(refuge).toBeDefined();
    if (refuge !== undefined) {
      const standingBottom = refuge.y;
      const carTop = config.floorY - car.height;
      expect(standingBottom).toBeLessThanOrEqual(carTop);
    }
  });

  it("sends the player back to the flag on contact, clues intact", () => {
    // Park the player right where the van is at t=0 and let one step run.
    const start = createPlatformerState(config);
    const onTheSpot: PlatformerState = {
      ...start,
      x: carPositionAt(car, 0) + 4,
      y: config.floorY - config.playerHeight,
      collectedIds: ["badge", "porta"],
      activeCheckpointId: "parco-checkpoint-2",
    };

    const result = stepPlatformer(
      onTheSpot,
      { left: false, right: false, jumpPressed: false, jumpHeld: false },
      step,
      config,
    );

    // ADR-018/035/037: a soft respawn, never damage, never a game over.
    expect(result.events.carHit).toBe(true);
    expect(result.events.respawned).toBe(true);
    expect(result.state.x).toBe(2310);
    expect(result.state.respawns).toBe(1);
    expect(result.state.collectedIds).toEqual(["badge", "porta"]);
    expect(result.state.completed).toBe(false);
  });

  it("never touches a player jumping over it", () => {
    const start = createPlatformerState(config);
    const overIt: PlatformerState = {
      ...start,
      x: carPositionAt(car, 0) + 4,
      // Mid-jump: above the van's roof by a whisker.
      y: config.floorY - car.height - config.playerHeight - 2,
      grounded: false,
      velocityY: 0,
    };

    const result = stepPlatformer(
      overIt,
      { left: false, right: true, jumpPressed: false, jumpHeld: true },
      step,
      config,
    );
    expect(result.events.carHit).toBe(false);
    expect(result.state.respawns).toBe(0);
  });
});

describe("Il parco del Castello is finishable by every role", () => {
  const config: PlatformerConfig = parcoLevelConfig;
  const roles: readonly Role[] = ["varano", "hunter", "guardian", "mayor"];

  const runs: readonly {
    readonly label: string;
    readonly power?: PowerConfig;
  }[] = [
    ...roles.map((role) => ({
      label: role,
      power: roleSuperpowers[role].power,
    })),
    // The guarantee of ADR-032/036: no power at all still finishes the level.
    { label: "senza alcun potere" },
  ];

  for (const run of runs) {
    it(`completes the level with no falls: ${run.label}`, () => {
      const state = playthrough(config, run.power);
      expect(state.completed).toBe(true);
      expect(state.respawns).toBe(0);
    });
  }
});
