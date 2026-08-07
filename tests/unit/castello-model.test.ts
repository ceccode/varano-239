import { describe, expect, it } from "vitest";

import type { Role } from "../../src/core/model";
import {
  castelloLevelConfig,
  roleSuperpowers,
} from "../../src/levels/registry";
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
 * Level design invariants for level 5, the climb inside the castle (ADR-039).
 * The generic suites (honest gaps, fair jump windows, unique backdrop, shared
 * physics) already cover it through `registeredLevels`; here live the
 * guarantees that are this level's own.
 */
describe("Dentro il Castello level design", () => {
  const config = castelloLevelConfig;
  const reach = jumpReach(config);

  it("keeps every stairwell gap within the reach of a jump without any power", () => {
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
    // Cables slow but never block; everything else needs a route above.
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

  it("shares the exact superpower tuning of levels 3 and 4", () => {
    expect(config.powersByRole).toBe(roleSuperpowers);
  });

  it("is the one level without a sky, until the roof", () => {
    // ADR-039: stone until the tower doorway, then the 2:39 night again.
    expect(config.backdrop.night).toBe(true);
    expect(config.backdrop.indoor).toBeDefined();
    const indoor = config.backdrop.indoor;
    expect(indoor.skyFromX).toBeLessThan(config.finishX);
    // The roof stretch is long enough to be a place, not a glimpse.
    expect(config.finishX - indoor.skyFromX).toBeGreaterThan(
      config.viewportWidth,
    );
    expect(config.finishKind).toBe("sunstone");
    expect(config.groundKind).toBe("stone");
    expect(config.platformKind).toBe("stone");
  });

  it("dresses the AI decoys and the portcullis without touching their physics", () => {
    // Every look points at a declared obstacle of the kind it dresses.
    const byId = new Map<string, (typeof config.obstacles)[number]>(
      config.obstacles.map((obstacle) => [obstacle.id, obstacle]),
    );
    for (const [id, look] of Object.entries(config.obstacleLooks)) {
      const obstacle = byId.get(id);
      expect(obstacle, id).toBeDefined();
      expect(obstacle?.kind).toBe(look === "portcullis" ? "drone" : "onlooker");
    }
    expect(config.carLooks["robot-pattuglia"]).toBe("robot");
  });
});

describe("the patrol robot (ADR-037 mechanics, ADR-039 costume)", () => {
  const config = castelloLevelConfig;
  const car = config.cars[0];
  const reach = jumpReach(config);
  const step = 1 / 120;

  it("moves deterministically and never leaves its patrol range", () => {
    for (let elapsed = 0; elapsed < 60; elapsed += 0.37) {
      const x = carPositionAt(car, elapsed);
      expect(x).toBeGreaterThanOrEqual(car.minX);
      expect(x).toBeLessThanOrEqual(car.maxX);
      expect(carPositionAt(car, elapsed)).toBe(x);
    }
  });

  it("stays low enough that a plain jump always clears it", () => {
    expect(car.height).toBeLessThan(reach.height - 20);
  });

  it("patrols flat corridor ground, clear of the tower and the finish", () => {
    const segments = [...config.groundSegments].sort((a, b) => a.x - b.x);
    const home = segments.find(
      (segment) =>
        car.minX >= segment.x &&
        car.maxX + car.width <= segment.x + segment.width,
    );
    expect(home).toBeDefined();
    // It starts past the halls and stops well before the last watch drone,
    // the roof doorway and the sunstone: set pieces never stack.
    expect(car.maxX + car.width).toBeLessThan(3400);
    expect(car.maxX + car.width).toBeLessThan(config.finishX - 400);
  });

  it("passes under the window seat, so waiting is always an option", () => {
    const refuge = config.platforms.find(
      (platform) =>
        platform.x >= car.minX &&
        platform.x + platform.width <= car.maxX + car.width,
    );
    expect(refuge).toBeDefined();
    if (refuge !== undefined) {
      expect(refuge.y).toBeLessThanOrEqual(config.floorY - car.height);
    }
  });

  it("costs a life and sends the player back to the flag, clues intact", () => {
    const start = createPlatformerState(config);
    const onTheSpot: PlatformerState = {
      ...start,
      x: carPositionAt(car, 0) + 4,
      y: config.floorY - config.playerHeight,
      collectedIds: ["registro", "bozza"],
      activeCheckpointId: "castello-checkpoint-3",
    };

    const result = stepPlatformer(
      onTheSpot,
      { left: false, right: false, jumpPressed: false, jumpHeld: false },
      step,
      config,
    );

    expect(result.events.carHit).toBe(true);
    expect(result.events.respawned).toBe(true);
    expect(result.state.x).toBe(2390);
    expect(result.state.respawns).toBe(1);
    expect(result.state.livesRemaining).toBe(2);
    expect(result.state.collectedIds).toEqual(["registro", "bozza"]);
    expect(result.state.completed).toBe(false);
  });
});

describe("lives and the game over (ADR-041)", () => {
  const config = castelloLevelConfig;
  const step = 1 / 120;
  const idleInput = {
    left: false,
    right: false,
    jumpPressed: false,
    jumpHeld: false,
  };

  /** Mid-air over the first stairwell, already past the point of no return. */
  function falling(state: PlatformerState): PlatformerState {
    return {
      ...state,
      x: 640,
      y: config.worldHeight + 30,
      velocityY: 200,
      grounded: false,
    };
  }

  it("starts every attempt with the shared three lives", () => {
    expect(config.lives).toBe(3);
    expect(createPlatformerState(config).livesRemaining).toBe(3);
  });

  it("costs one life per fall and respawns while lives remain", () => {
    const result = stepPlatformer(
      falling(createPlatformerState(config)),
      idleInput,
      step,
      config,
    );
    expect(result.events.respawned).toBe(true);
    expect(result.events.gameOver).toBe(false);
    expect(result.state.livesRemaining).toBe(2);
    expect(result.state.gameOver).toBe(false);
  });

  it("ends the attempt instead of respawning on the last life", () => {
    const lastLife: PlatformerState = {
      ...falling(createPlatformerState(config)),
      livesRemaining: 1,
      collectedIds: ["registro"],
    };
    const result = stepPlatformer(lastLife, idleInput, step, config);

    expect(result.events.gameOver).toBe(true);
    expect(result.events.respawned).toBe(false);
    expect(result.state.gameOver).toBe(true);
    expect(result.state.livesRemaining).toBe(0);
    // No flag to come back to: the state freezes where the attempt ended.
    expect(result.state.x).toBe(640);

    // A game over is terminal for the attempt: further steps change nothing.
    const after = stepPlatformer(result.state, idleInput, step, config);
    expect(after.state).toBe(result.state);
  });

  it("never charges a life for static obstacles", () => {
    // Walk straight into an inflatable decoy: a push back, never a life.
    const decoy = config.obstacles.find(
      (obstacle) => obstacle.id === "gonfiabile-1",
    );
    expect(decoy).toBeDefined();
    if (decoy === undefined) {
      return;
    }
    let state: PlatformerState = {
      ...createPlatformerState(config),
      x: decoy.x - config.playerWidth - 2,
    };
    for (let frame = 0; frame < 120; frame += 1) {
      state = stepPlatformer(
        state,
        { ...idleInput, right: true },
        step,
        config,
      ).state;
    }
    expect(state.livesRemaining).toBe(3);
    expect(state.gameOver).toBe(false);
  });

  it("gives a fresh attempt three lives and zero clues", () => {
    // «Riprova il livello» rebuilds the session state from scratch.
    const fresh = createPlatformerState(config);
    expect(fresh.livesRemaining).toBe(3);
    expect(fresh.collectedIds).toEqual([]);
    expect(fresh.respawns).toBe(0);
  });
});

describe("Dentro il Castello is finishable by every role", () => {
  const config: PlatformerConfig = castelloLevelConfig;
  const roles: readonly Role[] = ["varano", "hunter", "guardian", "mayor"];

  const runs: readonly {
    readonly label: string;
    readonly power?: PowerConfig;
  }[] = [
    ...roles.map((role) => ({
      label: role,
      power: roleSuperpowers[role].power,
    })),
    // The guarantee of ADR-032/036/039: no power at all still finishes it.
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
