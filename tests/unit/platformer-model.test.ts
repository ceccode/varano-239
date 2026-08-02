import { describe, expect, it } from "vitest";

import { campiLevelConfig } from "../../src/levels/registry";
import {
  cameraX,
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

const testConfig: PlatformerConfig = {
  worldWidth: 640,
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
    { x: 0, width: 200 },
    { x: 260, width: 380 },
  ],
  platforms: [{ x: 80, y: 110, width: 60 }],
  pickups: [{ id: "glint", x: 110, y: 96 }],
  checkpoints: [{ id: "mid", x: 280 }],
  finishX: 600,
};

function run(
  state: PlatformerState,
  input: PlatformerInput,
  seconds: number,
  config: PlatformerConfig = testConfig,
): PlatformerState {
  let current = state;
  const step = 1 / 120;
  for (let elapsed = 0; elapsed < seconds; elapsed += step) {
    current = stepPlatformer(current, input, step, config).state;
  }
  return current;
}

describe("platformer model", () => {
  it("accelerates, decelerates and tracks facing", () => {
    let state = createPlatformerState(testConfig);
    state = run(state, { ...idle, right: true }, 0.1);
    expect(state.velocityX).toBeGreaterThan(0);
    expect(state.velocityX).toBeLessThan(testConfig.maxSpeed);
    expect(state.facing).toBe("right");

    state = run(state, { ...idle, right: true }, 1.5);
    expect(state.velocityX).toBeCloseTo(testConfig.maxSpeed, 0);

    state = run(state, idle, 0.5);
    expect(state.velocityX).toBe(0);
    expect(state.facing).toBe("right");

    state = run(state, { ...idle, left: true }, 0.2);
    expect(state.facing).toBe("left");
    expect(state.x).toBeGreaterThanOrEqual(0);
  });

  it("jumps once per press, cuts short jumps and honours the buffer", () => {
    const state = createPlatformerState(testConfig);
    const jumpFrame = stepPlatformer(
      state,
      { ...idle, jumpPressed: true, jumpHeld: true },
      1 / 120,
      testConfig,
    );
    expect(jumpFrame.events.jumped).toBe(true);
    expect(jumpFrame.state.velocityY).toBeLessThan(0);

    const fullJump = run(jumpFrame.state, { ...idle, jumpHeld: true }, 0.9);
    const fullApex = testConfig.floorY - testConfig.playerHeight - 40;

    const cutStart = stepPlatformer(
      createPlatformerState(testConfig),
      { ...idle, jumpPressed: true, jumpHeld: true },
      1 / 120,
      testConfig,
    ).state;
    let cutApex = cutStart.y;
    let cut = cutStart;
    for (let frame = 0; frame < 60; frame += 1) {
      cut = stepPlatformer(cut, idle, 1 / 120, testConfig).state;
      cutApex = Math.min(cutApex, cut.y);
    }
    let fullApexMeasured = jumpFrame.state.y;
    let full = jumpFrame.state;
    for (let frame = 0; frame < 60; frame += 1) {
      full = stepPlatformer(
        full,
        { ...idle, jumpHeld: true },
        1 / 120,
        testConfig,
      ).state;
      fullApexMeasured = Math.min(fullApexMeasured, full.y);
    }
    expect(fullApexMeasured).toBeLessThan(fullApex);
    expect(cutApex).toBeGreaterThan(fullApexMeasured);
    expect(fullJump.grounded).toBe(true);

    // A buffered press just before landing triggers the jump on touchdown.
    let buffered = jumpFrame.state;
    let bufferedJumped = false;
    for (let frame = 0; frame < 300 && !bufferedJumped; frame += 1) {
      const nearGround =
        buffered.velocityY > 0 &&
        buffered.y > testConfig.floorY - testConfig.playerHeight - 6;
      const result = stepPlatformer(
        buffered,
        { ...idle, jumpPressed: nearGround, jumpHeld: nearGround },
        1 / 120,
        testConfig,
      );
      buffered = result.state;
      bufferedJumped = result.events.jumped;
    }
    expect(bufferedJumped).toBe(true);
    expect(buffered.velocityY).toBeLessThan(0);
  });

  it("lands on one-way platforms from above and collects pickups", () => {
    let state: PlatformerState = {
      ...createPlatformerState(testConfig),
      x: 100,
    };
    const jump = stepPlatformer(
      state,
      { ...idle, jumpPressed: true, jumpHeld: true },
      1 / 120,
      testConfig,
    );
    state = run(jump.state, { ...idle, jumpHeld: true }, 0.8);
    expect(state.y).toBe(110 - testConfig.playerHeight);
    expect(state.grounded).toBe(true);
    expect(state.collectedIds).toContain("glint");

    // Walking below the same platform never snaps the player onto it.
    let below: PlatformerState = {
      ...createPlatformerState(testConfig),
      x: 60,
    };
    below = run(below, { ...idle, right: true }, 0.4);
    expect(below.y).toBe(testConfig.floorY - testConfig.playerHeight);
  });

  it("respawns at the last checkpoint after a pit and keeps progress", () => {
    let state: PlatformerState = {
      ...createPlatformerState(testConfig),
      x: 300,
      collectedIds: ["glint"],
      activeCheckpointId: "mid",
    };
    state = { ...state, x: 205, y: 170, grounded: false, velocityY: 200 };
    let respawned = false;
    for (let frame = 0; frame < 240 && !respawned; frame += 1) {
      const result = stepPlatformer(state, idle, 1 / 120, testConfig);
      state = result.state;
      respawned = result.events.respawned;
    }
    expect(respawned).toBe(true);
    expect(state.x).toBe(280);
    expect(state.grounded).toBe(true);
    expect(state.collectedIds).toContain("glint");
    expect(state.respawns).toBe(1);
  });

  it("completes at the reed bed and freezes afterwards", () => {
    let state: PlatformerState = {
      ...createPlatformerState(testConfig),
      x: 560,
    };
    let finished = false;
    for (let frame = 0; frame < 600 && !finished; frame += 1) {
      const result = stepPlatformer(
        state,
        { ...idle, right: true },
        1 / 120,
        testConfig,
      );
      state = result.state;
      finished = result.events.finished;
    }
    expect(finished).toBe(true);
    expect(state.completed).toBe(true);
    const frozen = stepPlatformer(
      state,
      { ...idle, right: true },
      1 / 120,
      testConfig,
    );
    expect(frozen.state).toBe(state);
  });

  it("keeps the camera inside the world bounds", () => {
    const config = testConfig;
    const start = createPlatformerState(config);
    expect(cameraX(start, config)).toBe(0);
    const far: PlatformerState = { ...start, x: config.worldWidth - 30 };
    expect(cameraX(far, config)).toBe(config.worldWidth - config.viewportWidth);
  });
});

describe("Campi di Montichiari level design", () => {
  function gapsOf(
    config: PlatformerConfig,
  ): readonly { start: number; end: number }[] {
    const segments = [...config.groundSegments].sort((a, b) => a.x - b.x);
    const gaps: { start: number; end: number }[] = [];
    for (let index = 0; index < segments.length - 1; index += 1) {
      const current = segments[index];
      const next = segments[index + 1];
      if (current !== undefined && next !== undefined) {
        gaps.push({ start: current.x + current.width, end: next.x });
      }
    }
    return gaps;
  }

  it("keeps every gap crossable with a single edge jump", () => {
    const airtime = (2 * campiLevelConfig.jumpSpeed) / campiLevelConfig.gravity;
    const jumpDistance = campiLevelConfig.maxSpeed * airtime;
    for (const gap of gapsOf(campiLevelConfig)) {
      expect(gap.end - gap.start).toBeLessThan(jumpDistance - 20);
    }
  });

  it("keeps every signal reachable from a support below", () => {
    const jumpHeight =
      (campiLevelConfig.jumpSpeed * campiLevelConfig.jumpSpeed) /
      (2 * campiLevelConfig.gravity);
    for (const pickup of campiLevelConfig.pickups) {
      const supports = [
        ...campiLevelConfig.platforms.filter(
          (platform) =>
            pickup.x >= platform.x &&
            pickup.x <= platform.x + platform.width &&
            platform.y >= pickup.y,
        ),
        ...campiLevelConfig.groundSegments
          .filter(
            (segment) =>
              pickup.x >= segment.x && pickup.x <= segment.x + segment.width,
          )
          .map(() => ({ y: campiLevelConfig.floorY })),
      ];
      const closest = supports.reduce<number | undefined>(
        (best, support) =>
          best === undefined ? support.y : Math.min(best, support.y),
        undefined,
      );
      expect(closest).toBeDefined();
      if (closest !== undefined) {
        expect(closest - pickup.y).toBeLessThan(jumpHeight);
        expect(closest - pickup.y).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("is solvable by running right and jumping at gap edges", () => {
    const config = campiLevelConfig;
    const gaps = gapsOf(config);
    let state = createPlatformerState(config);
    let finished = false;
    const step = 1 / 120;

    for (let frame = 0; frame < 120 * 60 && !finished; frame += 1) {
      const playerRight = state.x + config.playerWidth;
      const nearGap = gaps.some(
        (gap) =>
          state.grounded && playerRight >= gap.start - 8 && state.x < gap.start,
      );
      const result = stepPlatformer(
        state,
        {
          left: false,
          right: true,
          jumpPressed: nearGap,
          jumpHeld: !state.grounded || nearGap,
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
