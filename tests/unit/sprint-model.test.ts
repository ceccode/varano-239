import { describe, expect, it } from "vitest";

import { chatLevelConfig } from "../../src/levels/registry";
import {
  createPlatformerState,
  stepPlatformer,
  type PlatformerConfig,
  type PlatformerInput,
  type PlatformerState,
} from "../../src/levels/platformer-model";

const idle: PlatformerInput = {
  left: false,
  right: false,
  jumpPressed: false,
  jumpHeld: false,
};

const step = 1 / 120;

/** A flat runway, so only the sprint behaviour is under test. */
const sprintConfig: PlatformerConfig = {
  worldWidth: 4000,
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
  sprint: { holdSeconds: 0.9, maxSpeed: 235, acceleration: 620 },
  groundSegments: [{ x: 0, width: 4000 }],
  platforms: [],
  pickups: [],
  checkpoints: [],
  finishX: 3900,
};

function hold(
  state: PlatformerState,
  input: PlatformerInput,
  seconds: number,
  config: PlatformerConfig = sprintConfig,
): { state: PlatformerState; sprintStarts: number } {
  let current = state;
  let sprintStarts = 0;
  for (let elapsed = 0; elapsed < seconds; elapsed += step) {
    const result = stepPlatformer(current, input, step, config);
    current = result.state;
    if (result.events.sprintStarted) {
      sprintStarts += 1;
    }
  }
  return { state: current, sprintStarts };
}

describe("run superpower", () => {
  it("charges while holding a direction and then raises the top speed", () => {
    const start = createPlatformerState(sprintConfig);

    // Before the hold time the Varano runs at the normal top speed.
    const early = hold(start, { ...idle, right: true }, 0.8).state;
    expect(early.sprinting).toBe(false);
    expect(early.velocityX).toBeCloseTo(sprintConfig.maxSpeed, 0);

    const sprinted = hold(start, { ...idle, right: true }, 2.2);
    expect(sprinted.state.sprinting).toBe(true);
    expect(sprinted.state.velocityX).toBeCloseTo(235, 0);
    // The event fires once, not on every frame.
    expect(sprinted.sprintStarts).toBe(1);
  });

  it("loses the sprint when stopping or turning back", () => {
    const charged = hold(
      createPlatformerState(sprintConfig),
      { ...idle, right: true },
      1.5,
    ).state;
    expect(charged.sprinting).toBe(true);

    const stopped = hold(charged, idle, 0.2).state;
    expect(stopped.sprinting).toBe(false);
    expect(stopped.sprintCharge).toBe(0);

    const turned = hold(charged, { ...idle, left: true }, 0.1).state;
    expect(turned.sprinting).toBe(false);
  });

  it("keeps the sprint through a jump so wide gaps stay crossable", () => {
    const charged = hold(
      createPlatformerState(sprintConfig),
      { ...idle, right: true },
      1.5,
    ).state;

    const airborne = hold(
      charged,
      { ...idle, right: true, jumpPressed: true, jumpHeld: true },
      0.3,
    ).state;
    expect(airborne.grounded).toBe(false);
    expect(airborne.sprinting).toBe(true);
    expect(airborne.velocityX).toBeGreaterThan(sprintConfig.maxSpeed);
  });

  it("resets the sprint after a fall", () => {
    // The runway ends at 200, so past it there is nothing to land on.
    const pitConfig: PlatformerConfig = {
      ...sprintConfig,
      groundSegments: [{ x: 0, width: 200 }],
      checkpoints: [{ id: "mid", x: 150 }],
    };
    const charged = hold(
      createPlatformerState(pitConfig),
      { ...idle, right: true },
      1.5,
      pitConfig,
    ).state;
    expect(charged.sprinting).toBe(true);

    const falling: PlatformerState = {
      ...charged,
      x: 400,
      y: pitConfig.worldHeight + 200,
      grounded: false,
    };

    const result = stepPlatformer(falling, idle, step, pitConfig);
    expect(result.events.respawned).toBe(true);
    expect(result.state.sprinting).toBe(false);
    expect(result.state.sprintCharge).toBe(0);
    // A respawn must not be reported as a fresh sprint.
    expect(result.events.sprintStarted).toBe(false);
  });
});

describe("Le chat di paese level design", () => {
  const config = chatLevelConfig;

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

  it("has gaps that need the sprint but stay within its reach", () => {
    const airtime = (2 * config.jumpSpeed) / config.gravity;
    const walkReach = config.maxSpeed * airtime;
    const sprintReach = config.sprint.maxSpeed * airtime;
    const widths = gaps().map((gap) => gap.end - gap.start);

    // Every gap is crossable while sprinting…
    for (const width of widths) {
      expect(width).toBeLessThan(sprintReach - 20);
    }
    // …and at least one of them is impossible without the sprint.
    expect(widths.some((width) => width > walkReach)).toBe(true);
  });

  it("gives enough runway before each gap to charge the sprint", () => {
    const chargeDistance = config.sprint.holdSeconds * config.maxSpeed;
    const segments = [...config.groundSegments].sort((a, b) => a.x - b.x);
    const airtime = (2 * config.jumpSpeed) / config.gravity;
    const walkReach = config.maxSpeed * airtime;

    gaps().forEach((gap, index) => {
      if (gap.end - gap.start <= walkReach) {
        return;
      }
      const runway = segments[index]?.width ?? 0;
      expect(runway).toBeGreaterThan(chargeDistance);
    });
  });

  it("keeps every clue reachable from a support below", () => {
    const jumpHeight =
      (config.jumpSpeed * config.jumpSpeed) / (2 * config.gravity);

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
      const closest = Math.min(...supports);
      expect(supports.length).toBeGreaterThan(0);
      expect(closest - pickup.y).toBeGreaterThanOrEqual(0);
      expect(closest - pickup.y).toBeLessThan(jumpHeight);
    }
  });

  it("is solvable by holding right and jumping at the gap edges", () => {
    const gapList = gaps();
    let state = createPlatformerState(config);
    let finished = false;

    for (let frame = 0; frame < 120 * 90 && !finished; frame += 1) {
      const playerRight = state.x + config.playerWidth;
      const atEdge = gapList.some(
        (gap) =>
          state.grounded &&
          playerRight >= gap.start - 10 &&
          state.x < gap.start,
      );
      const result = stepPlatformer(
        state,
        {
          left: false,
          right: true,
          jumpPressed: atEdge,
          jumpHeld: !state.grounded || atEdge,
        },
        step,
        config,
      );
      state = result.state;
      finished = result.events.finished;
    }

    expect(state.respawns).toBe(0);
    expect(finished).toBe(true);
  });
});
