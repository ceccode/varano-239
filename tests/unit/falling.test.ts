import { describe, expect, it } from "vitest";

import { registeredLevels } from "../../src/levels/registry";
import {
  createPlatformerState,
  stepPlatformer,
  type PlatformerConfig,
  type PlatformerInput,
  type PlatformerState,
} from "../../src/levels/platformer-model";

const step = 1 / 120;

const walkRight: PlatformerInput = {
  left: false,
  right: true,
  jumpPressed: false,
  jumpHeld: false,
};

describe("falling into a gap", () => {
  const config: PlatformerConfig = {
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
    groundSegments: [
      { x: 0, width: 400 },
      { x: 480, width: 1520 },
    ],
    platforms: [],
    pickups: [],
    checkpoints: [{ id: "flag", x: 200 }],
    finishX: 1900,
  };

  it("never lifts the player onto ground it did not cross from above", () => {
    // Already below the floor and overlapping the far segment: the ground must
    // not scoop the player up, exactly as a one-way platform would not.
    const falling: PlatformerState = {
      ...createPlatformerState(config),
      x: 500,
      y: 190,
      velocityY: 60,
      grounded: false,
    };

    const result = stepPlatformer(falling, walkRight, step, config);
    expect(result.state.grounded).toBe(false);
    expect(result.state.y).toBeGreaterThan(190);
  });

  it("respawns at the flag instead of crossing an 80px gap on foot", () => {
    let state = createPlatformerState(config);
    let respawned = false;

    for (let frame = 0; frame < 120 * 12 && !respawned; frame += 1) {
      const result = stepPlatformer(state, walkRight, step, config);
      state = result.state;
      respawned = result.events.respawned;
    }

    // Walking off a ledge is a fall, not a shortcut across the gap.
    expect(respawned).toBe(true);
    expect(state.x).toBe(200);
    expect(state.respawns).toBe(1);
  });

  it("still lands normally when jumping across the same gap", () => {
    let state = createPlatformerState(config);

    for (let frame = 0; frame < 120 * 12; frame += 1) {
      const atEdge =
        state.grounded && state.x + config.playerWidth >= 388 && state.x < 400;
      state = stepPlatformer(
        state,
        {
          ...walkRight,
          jumpPressed: atEdge,
          jumpHeld: !state.grounded || atEdge,
        },
        step,
        config,
      ).state;
      if (state.x > 700) {
        break;
      }
    }

    expect(state.respawns).toBe(0);
    expect(state.grounded).toBe(true);
    expect(state.x).toBeGreaterThan(700);
  });
});

describe("every gap can be jumped without frame-perfect timing", () => {
  /**
   * The window between the earliest jump that still reaches the far edge and
   * the last one the ledge (plus coyote time) allows. A narrow window is how a
   * platformer becomes unfair, and no constraint of this project allows that.
   */
  const minimumWindowSeconds = 0.25;

  for (const level of registeredLevels) {
    it(`leaves a fair window on every gap: ${level.levelId}`, () => {
      const config = level.config;
      const airtime = (2 * config.jumpSpeed) / config.gravity;
      const walkReach = config.maxSpeed * airtime;
      const segments = [...config.groundSegments].sort((a, b) => a.x - b.x);

      for (let index = 0; index < segments.length - 1; index += 1) {
        const current = segments[index];
        const next = segments[index + 1];
        if (current === undefined || next === undefined) {
          continue;
        }
        const ledge = current.x + current.width;
        const width = next.x - ledge;

        // A gap beyond a plain jump is meant for the sprint (ADR-029).
        const needsSprint = width > walkReach - 20;
        const speed =
          needsSprint && config.sprint !== undefined
            ? config.sprint.maxSpeed
            : config.maxSpeed;
        expect(
          needsSprint ? config.sprint !== undefined : true,
          `a ${String(width)}px gap needs a sprint this level does not grant`,
        ).toBe(true);

        const earliest = next.x - config.playerWidth - speed * airtime;
        const latest = ledge + speed * config.coyoteSeconds;
        const windowSeconds = (latest - earliest) / speed;

        expect(
          windowSeconds,
          `${String(width)}px gap at ${String(ledge)} leaves only ${(windowSeconds * 1000).toFixed(0)}ms`,
        ).toBeGreaterThan(minimumWindowSeconds);
      }
    });
  }
});

describe("every registered level treats its gaps as real", () => {
  for (const level of registeredLevels) {
    it(`makes a walk off the ledge a fall: ${level.levelId}`, () => {
      const config: PlatformerConfig = level.config;
      const segments = [...config.groundSegments].sort((a, b) => a.x - b.x);
      const first = segments[0];
      const second = segments[1];
      if (first === undefined || second === undefined) {
        return;
      }

      // Start just before the first ledge and walk off it without jumping.
      let state: PlatformerState = {
        ...createPlatformerState(config),
        x: first.x + first.width - config.playerWidth - 60,
      };
      let respawned = false;
      let crossed = false;

      for (let frame = 0; frame < 120 * 12 && !respawned; frame += 1) {
        const result = stepPlatformer(state, walkRight, step, config);
        state = result.state;
        respawned = result.events.respawned;
        if (!respawned && state.grounded && state.x > second.x) {
          crossed = true;
          break;
        }
      }

      expect(crossed, "the gap was crossed on foot").toBe(false);
      expect(respawned).toBe(true);
    });
  }
});
