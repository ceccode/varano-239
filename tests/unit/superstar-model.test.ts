import { describe, expect, it } from "vitest";

import type { Role } from "../../src/core/model";
import { superstarLevelConfig } from "../../src/levels/registry";
import {
  createPlatformerState,
  stepPlatformer,
  type PlatformerConfig,
  type PlatformerInput,
  type PlatformerObstacle,
  type PlatformerState,
  type PowerConfig,
} from "../../src/levels/platformer-model";

const step = 1 / 120;

const idle: PlatformerInput = {
  left: false,
  right: false,
  jumpPressed: false,
  jumpHeld: false,
};

/** A flat runway with one obstacle, so only the power behaviour is under test. */
function bench(
  power: PowerConfig | undefined,
  obstacles: readonly PlatformerObstacle[] = [],
): PlatformerConfig {
  return {
    worldWidth: 2000,
    worldHeight: 180,
    viewportWidth: 320,
    viewportHeight: 180,
    floorY: 154,
    playerWidth: 24,
    playerHeight: 14,
    maxSpeed: 150,
    groundAcceleration: 560,
    groundDeceleration: 820,
    airAcceleration: 430,
    gravity: 640,
    jumpSpeed: 250,
    jumpCutFactor: 0.45,
    terminalFallSpeed: 330,
    coyoteSeconds: 0.1,
    jumpBufferSeconds: 0.14,
    groundSegments: [{ x: 0, width: 2000 }],
    platforms: [],
    pickups: [],
    checkpoints: [],
    finishX: 1900,
    ...(power === undefined ? {} : { power }),
    ...(obstacles.length === 0 ? {} : { obstacles }),
  };
}

function hold(
  state: PlatformerState,
  input: PlatformerInput,
  seconds: number,
  config: PlatformerConfig,
): { state: PlatformerState; powerStarts: number; blocks: number } {
  let current = state;
  let powerStarts = 0;
  let blocks = 0;
  for (let elapsed = 0; elapsed < seconds; elapsed += step) {
    const result = stepPlatformer(current, input, step, config);
    current = result.state;
    if (result.events.powerStarted) {
      powerStarts += 1;
    }
    if (result.events.blocked) {
      blocks += 1;
    }
  }
  return { state: current, powerStarts, blocks };
}

const crowd: PlatformerObstacle = {
  id: "crowd",
  kind: "onlooker",
  x: 200,
  y: 128,
  width: 22,
  height: 26,
};

describe("role superpowers", () => {
  const sprint: PowerConfig = {
    kind: "sprint",
    chargeSeconds: 0.4,
    maxSpeed: 235,
    acceleration: 620,
  };

  it("engages only after the hold time and reports the start once", () => {
    const config = bench(sprint);
    const start = createPlatformerState(config);

    const early = hold(start, { ...idle, powerHeld: true }, 0.3, config);
    expect(early.state.powerActive).toBe(false);
    expect(early.powerStarts).toBe(0);

    const engaged = hold(start, { ...idle, powerHeld: true }, 0.8, config);
    expect(engaged.state.powerActive).toBe(true);
    // Held, not tapped: the event fires on engagement, not every frame.
    expect(engaged.powerStarts).toBe(1);
  });

  it("discharges completely as soon as the button is released", () => {
    const config = bench(sprint);
    const engaged = hold(
      createPlatformerState(config),
      { ...idle, powerHeld: true },
      0.8,
      config,
    ).state;

    const released = hold(engaged, idle, 0.05, config).state;
    expect(released.powerActive).toBe(false);
    expect(released.powerCharge).toBe(0);
  });

  it("raises the top speed with the sprint and carries it through a jump", () => {
    const config = bench(sprint);
    const running = hold(
      createPlatformerState(config),
      { ...idle, right: true, powerHeld: true },
      1.5,
      config,
    ).state;
    expect(running.sprinting).toBe(true);
    expect(running.velocityX).toBeCloseTo(235, 0);

    const airborne = hold(
      running,
      {
        ...idle,
        right: true,
        powerHeld: true,
        jumpPressed: true,
        jumpHeld: true,
      },
      0.3,
      config,
    ).state;
    expect(airborne.grounded).toBe(false);
    expect(airborne.velocityX).toBeGreaterThan(config.maxSpeed);
  });

  it("opens a crowd for good with the scent, and only a crowd", () => {
    const drone: PlatformerObstacle = {
      id: "tv-drone",
      kind: "drone",
      x: 210,
      y: 124,
      width: 30,
      height: 26,
    };
    const config = bench({ kind: "scent", chargeSeconds: 0.4, radius: 52 }, [
      crowd,
      drone,
    ]);
    // Start close enough for the crowd to fall inside the radius.
    const near: PlatformerState = { ...createPlatformerState(config), x: 170 };

    const sniffed = hold(near, { ...idle, powerHeld: true }, 0.8, config);
    expect(sniffed.state.openedObstacleIds).toContain("crowd");
    // Information, not neutralisation: the troupe's drone stays put.
    expect(sniffed.state.openedObstacleIds).not.toContain("tv-drone");

    // Releasing the button does not close the gap again.
    const later = hold(sniffed.state, idle, 0.5, config).state;
    expect(later.openedObstacleIds).toContain("crowd");
  });

  it("calms every nearby obstacle with the call, but only while held", () => {
    const config = bench({ kind: "call", chargeSeconds: 0.4, radius: 46 }, [
      crowd,
    ]);
    const near: PlatformerState = { ...createPlatformerState(config), x: 175 };

    const calling = hold(near, { ...idle, powerHeld: true }, 0.8, config).state;
    expect(calling.calmedObstacleIds).toContain("crowd");
    // Temporary by design: it is a call, not a permit.
    const quiet = hold(calling, idle, 0.1, config).state;
    expect(quiet.calmedObstacleIds).toEqual([]);
    expect(quiet.openedObstacleIds).toEqual([]);
  });

  it("lifts with the drone, drains its fuel and refills it on the ground", () => {
    const power: PowerConfig = {
      kind: "drone",
      chargeSeconds: 0.4,
      hoverSeconds: 2.2,
      liftSpeed: 62,
    };
    const config = bench(power);
    const start = createPlatformerState(config);
    expect(start.droneFuel).toBeCloseTo(2.2, 5);

    const lifted = hold(start, { ...idle, powerHeld: true }, 1, config).state;
    expect(lifted.y).toBeLessThan(start.y);
    expect(lifted.droneFuel).toBeLessThan(2.2);
    expect(lifted.grounded).toBe(false);

    // The tank is finite: holding it down does not mean flying forever. Sampled
    // frame by frame, because once it empties the Mayor lands and refuels.
    let current = lifted;
    let emptied = false;
    let highest = lifted.y;
    for (let frame = 0; frame < 120 * 4; frame += 1) {
      current = stepPlatformer(
        current,
        { ...idle, powerHeld: true },
        step,
        config,
      ).state;
      highest = Math.min(highest, current.y);
      if (current.droneFuel === 0) {
        emptied = true;
        break;
      }
    }
    expect(emptied).toBe(true);
    // The tank empties at the end of a step, so the lift stops on the next one.
    const afterEmpty = stepPlatformer(
      current,
      { ...idle, powerHeld: true },
      step,
      config,
    ).state;
    expect(afterEmpty.powerActive).toBe(false);
    // The lift is bounded by the fuel, so it cannot climb out of the world.
    expect(highest).toBeGreaterThan(
      start.y - power.hoverSeconds * power.liftSpeed - 2,
    );

    // Back on the ground it refills, ready for the next obstacle.
    const landed = hold(current, idle, 3, config).state;
    expect(landed.grounded).toBe(true);
    expect(landed.droneFuel).toBeCloseTo(2.2, 5);
  });

  it("keeps what the scent found after a fall, and recharges the rest", () => {
    const pit: PlatformerConfig = {
      ...bench({ kind: "scent", chargeSeconds: 0.4, radius: 52 }, [crowd]),
      groundSegments: [{ x: 0, width: 260 }],
      checkpoints: [{ id: "mid", x: 120 }],
    };
    const sniffed = hold(
      { ...createPlatformerState(pit), x: 170 },
      { ...idle, powerHeld: true },
      0.8,
      pit,
    ).state;
    expect(sniffed.openedObstacleIds).toContain("crowd");

    const falling: PlatformerState = {
      ...sniffed,
      x: 400,
      y: pit.worldHeight + 200,
      grounded: false,
    };
    const result = stepPlatformer(falling, idle, step, pit);
    expect(result.events.respawned).toBe(true);
    expect(result.state.powerCharge).toBe(0);
    expect(result.state.powerActive).toBe(false);
    // A fall never costs discovered knowledge, just like collected clues.
    expect(result.state.openedObstacleIds).toContain("crowd");
    // A respawn must not be reported as a fresh activation.
    expect(result.events.powerStarted).toBe(false);
  });
});

describe("non-lethal obstacles", () => {
  it("pushes the player back off a crowd without ever respawning them", () => {
    const config = bench(undefined, [crowd]);
    const approach = hold(
      { ...createPlatformerState(config), x: 150 },
      { ...idle, right: true },
      2,
      config,
    );
    // Held short of the queue, and no fall, no life lost, no game over.
    expect(approach.state.x).toBeLessThan(crowd.x);
    expect(approach.state.respawns).toBe(0);
    expect(approach.state.completed).toBe(false);
  });

  it("lets a sprint carry the Varano straight through a crowd", () => {
    const config = bench(
      { kind: "sprint", chargeSeconds: 0.4, maxSpeed: 235, acceleration: 620 },
      [crowd],
    );
    const through = hold(
      { ...createPlatformerState(config), x: 60 },
      { ...idle, right: true, powerHeld: true },
      2.5,
      config,
    ).state;
    expect(through.sprinting).toBe(true);
    expect(through.x).toBeGreaterThan(crowd.x + crowd.width);
    expect(through.respawns).toBe(0);
  });

  it("stops the player at the troupe drone and reports the bump, not damage", () => {
    const drone: PlatformerObstacle = {
      id: "tv-drone",
      kind: "drone",
      x: 200,
      y: 124,
      width: 30,
      height: 26,
    };
    const config = bench(
      { kind: "sprint", chargeSeconds: 0.4, maxSpeed: 235, acceleration: 620 },
      [drone],
    );
    // Even at full sprint: speed is not the answer to the drone.
    const stopped = hold(
      { ...createPlatformerState(config), x: 60 },
      { ...idle, right: true, powerHeld: true },
      2.5,
      config,
    );
    expect(stopped.state.x).toBeLessThanOrEqual(drone.x);
    expect(stopped.blocks).toBeGreaterThan(0);
    expect(stopped.state.respawns).toBe(0);
  });

  it("lets the call land the drone so the corridor opens", () => {
    const drone: PlatformerObstacle = {
      id: "tv-drone",
      kind: "drone",
      x: 200,
      y: 124,
      width: 30,
      height: 26,
    };
    const config = bench({ kind: "call", chargeSeconds: 0.4, radius: 46 }, [
      drone,
    ]);
    const past = hold(
      { ...createPlatformerState(config), x: 150 },
      { ...idle, right: true, powerHeld: true },
      2.5,
      config,
    ).state;
    expect(past.x).toBeGreaterThan(drone.x + drone.width);
    expect(past.respawns).toBe(0);
  });

  it("slows the player inside the cables and forbids a sprint there", () => {
    const cables: PlatformerObstacle = {
      id: "cables",
      kind: "cables",
      x: 100,
      y: 134,
      width: 400,
      height: 20,
    };
    const config = bench(
      { kind: "sprint", chargeSeconds: 0.4, maxSpeed: 235, acceleration: 620 },
      [cables],
    );
    const inside = hold(
      { ...createPlatformerState(config), x: 150 },
      { ...idle, right: true, powerHeld: true },
      1.5,
      config,
    ).state;

    expect(inside.sprinting).toBe(false);
    expect(Math.abs(inside.velocityX)).toBeLessThanOrEqual(
      config.maxSpeed * 0.46,
    );
    // Cables never block: they cost time, and the player keeps moving.
    expect(inside.x).toBeGreaterThan(150);
    expect(inside.respawns).toBe(0);
  });
});

describe("Varano superstar level design", () => {
  const config = superstarLevelConfig;
  const airtime = (2 * config.jumpSpeed) / config.gravity;
  const walkReach = config.maxSpeed * airtime;
  const jumpHeight =
    (config.jumpSpeed * config.jumpSpeed) / (2 * config.gravity);

  function gaps(): readonly { start: number; end: number }[] {
    const segments = [...config.groundSegments].sort((a, b) => a.x - b.x);
    const list: { start: number; end: number }[] = [];
    for (let index = 0; index < segments.length - 1; index += 1) {
      const current = segments[index];
      const next = segments[index + 1];
      if (current !== undefined && next !== undefined) {
        list.push({ start: current.x + current.width, end: next.x });
      }
    }
    return list;
  }

  it("keeps every gap within the reach of a jump without any power", () => {
    // This is what makes the level finishable by all four roles (ADR-032).
    const widths = gaps().map((gap) => gap.end - gap.start);
    expect(widths.length).toBeGreaterThan(0);
    for (const width of widths) {
      expect(width).toBeLessThan(walkReach - 20);
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
      expect(supports.length).toBeGreaterThan(0);
      const closest = Math.min(...supports);
      expect(closest - pickup.y).toBeGreaterThanOrEqual(0);
      expect(closest - pickup.y).toBeLessThan(jumpHeight);
    }
  });

  it("covers every blocking obstacle with a platform route above it", () => {
    const blocking = config.obstacles.filter(
      (obstacle) => obstacle.kind !== "cables",
    );
    expect(blocking.length).toBeGreaterThan(0);

    for (const obstacle of blocking) {
      // Standing on a platform at or above the obstacle's top clears it, so a
      // player with no power — or the wrong power — always has a way through.
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
    // A platform nobody can stand on is not a route, it is decoration — and a
    // decorative bypass would make the "playable by every role" claim false.
    for (const platform of config.platforms) {
      const fromGround = config.groundSegments.some(
        (segment) =>
          platform.x < segment.x + segment.width &&
          platform.x + platform.width > segment.x &&
          config.floorY - platform.y < jumpHeight,
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
        return horizontal < walkReach && other.y - platform.y < jumpHeight;
      });
      expect(
        fromGround || fromNeighbour,
        `platform at ${String(platform.x)}/${String(platform.y)} is unreachable`,
      ).toBe(true);
    }
  });

  it("grants exactly one distinct power to each of the four roles", () => {
    const roles: readonly Role[] = ["varano", "hunter", "guardian", "mayor"];
    const kinds = roles.map(
      (role) => superstarLevelConfig.powersByRole[role].power.kind,
    );
    expect(new Set(kinds).size).toBe(roles.length);
  });
});

describe("Varano superstar is finishable by every role", () => {
  const config: PlatformerConfig = superstarLevelConfig;

  /**
   * Runs right, jumps at the edge of a gap and before whatever still stands in
   * the way, and holds the power while approaching an obstacle — which is how
   * the control is actually used, rather than pinned down for the whole level.
   * This is the proof that matters: the level design is playable, not merely
   * that the code compiles.
   */
  function playthrough(power: PowerConfig | undefined): PlatformerState {
    // The registered config carries no `power`: the registry resolves it per
    // role at mount time, so omitting it here is the no-power run.
    const levelConfig: PlatformerConfig =
      power === undefined ? config : { ...config, power };
    const gapEdges = [...levelConfig.groundSegments]
      .sort((a, b) => a.x - b.x)
      .slice(0, -1)
      .map((segment) => segment.x + segment.width);

    let state = createPlatformerState(levelConfig);
    let finished = false;

    for (let frame = 0; frame < 120 * 150 && !finished; frame += 1) {
      const playerRight = state.x + levelConfig.playerWidth;
      const atGapEdge = gapEdges.some(
        (edge) => state.grounded && playerRight >= edge - 12 && state.x < edge,
      );
      const standing = (levelConfig.obstacles ?? []).filter(
        (obstacle) =>
          obstacle.kind !== "cables" &&
          !state.openedObstacleIds.includes(obstacle.id) &&
          !state.calmedObstacleIds.includes(obstacle.id),
      );
      // Jump early enough to clear it, or to land on the roofs, tripods and
      // scaffolding that carry the route above it.
      const beforeObstacle = standing.some(
        (obstacle) =>
          state.grounded &&
          playerRight >= obstacle.x - 34 &&
          state.x < obstacle.x,
      );
      // Charge the power on the approach, then let go: the Mayor's drone needs
      // ground contact to refuel, so holding it down forever is not the answer.
      const approaching = standing.some(
        (obstacle) => playerRight >= obstacle.x - 210 && state.x < obstacle.x,
      );
      const jump = atGapEdge || beforeObstacle;

      const result = stepPlatformer(
        state,
        {
          left: false,
          right: true,
          jumpPressed: jump,
          jumpHeld: !state.grounded || jump,
          powerHeld: power !== undefined && approaching,
        },
        1 / 120,
        levelConfig,
      );
      state = result.state;
      finished = result.events.finished;
    }

    return state;
  }

  const runs: readonly {
    readonly label: string;
    readonly power?: PowerConfig;
  }[] = [
    {
      label: "Varano — scatto",
      power: superstarLevelConfig.powersByRole.varano.power,
    },
    {
      label: "Cacciatore — fiuto",
      power: superstarLevelConfig.powersByRole.hunter.power,
    },
    {
      label: "Custode — richiamo",
      power: superstarLevelConfig.powersByRole.guardian.power,
    },
    {
      label: "Sindaco — drone",
      power: superstarLevelConfig.powersByRole.mayor.power,
    },
    // The guarantee of ADR-032: no power at all still finishes the level.
    { label: "senza alcun potere" },
  ];

  for (const run of runs) {
    it(`completes the level with no falls: ${run.label}`, () => {
      const state = playthrough(run.power);
      expect(state.completed).toBe(true);
      expect(state.respawns).toBe(0);
    });
  }
});
