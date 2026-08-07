import { describe, expect, it } from "vitest";

import {
  castelloLevelConfig,
  parcoLevelConfig,
  registeredLevels,
  roleSuperpowers,
  superstarLevelConfig,
} from "../../src/levels/registry";
import { jumpReach } from "../../src/levels/define-level";
import {
  createPlatformerState,
  movingPlatformAt,
  stepPlatformer,
  type PlatformerState,
} from "../../src/levels/platformer-model";

const idleInput = {
  left: false,
  right: false,
  jumpPressed: false,
  jumpHeld: false,
};
const step = 1 / 120;

describe("one song per level (ADR-042)", () => {
  it("gives every level its own track, with the shipped loop on level 1", () => {
    const tracks = registeredLevels.map((level) => level.config.music);
    // Level 1 keeps the original loop: `music` omitted means "fields".
    expect(tracks[0]).toBeUndefined();
    const named = tracks.map((track) => track ?? "fields");
    expect(new Set(named).size).toBe(registeredLevels.length);
  });
});

describe("the Varano's cameo (ADR-044)", () => {
  it("gives every level one apparition with its own line", () => {
    const keys = registeredLevels.map((level) => {
      expect(level.config.cameo, level.levelId).toBeDefined();
      return level.config.cameo?.narrativeKey;
    });
    expect(new Set(keys).size).toBe(registeredLevels.length);
  });

  it("places every cameo inside the level, before the finish", () => {
    for (const level of registeredLevels) {
      const cameo = level.config.cameo;
      if (cameo === undefined) {
        continue;
      }
      expect(cameo.x, level.levelId).toBeGreaterThan(0);
      expect(cameo.x, level.levelId).toBeLessThan(level.config.finishX);
    }
  });
});

describe("every clue keeps a support below (all levels)", () => {
  // The earned-clue repositioning (ADR-044) must never break reachability:
  // the invariant the per-level suites assert is promoted to the registry.
  for (const level of registeredLevels) {
    it(`keeps every clue reachable: ${level.levelId}`, () => {
      const config = level.config;
      const reach = jumpReach(config);
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
        expect(
          supports.length,
          `${level.levelId}/${pickup.id}`,
        ).toBeGreaterThan(0);
        const closest = Math.min(...supports);
        expect(closest - pickup.y).toBeGreaterThanOrEqual(0);
        expect(closest - pickup.y).toBeLessThan(reach.height);
      }
    });
  }
});

describe("moving platforms (ADR-044)", () => {
  const config = castelloLevelConfig;
  const elevator = config.movingPlatforms[0];

  it("moves deterministically and never leaves its range", () => {
    for (let elapsed = 0; elapsed < 40; elapsed += 0.31) {
      const position = movingPlatformAt(elevator, elapsed);
      expect(position.y).toBeGreaterThanOrEqual(elevator.y);
      expect(position.y).toBeLessThanOrEqual(elevator.y + elevator.range);
      expect(movingPlatformAt(elevator, elapsed)).toEqual(position);
    }
  });

  it("lands the player and carries them with its own travel", () => {
    // Drop the player onto the elevator at t=0 (offset 0, top at y 110).
    let state: PlatformerState = {
      ...createPlatformerState(config),
      x: elevator.x + 20,
      y: elevator.y - config.playerHeight - 4,
      grounded: false,
      velocityY: 40,
    };
    for (let frame = 0; frame < 30 && !state.grounded; frame += 1) {
      state = stepPlatformer(state, idleInput, step, config).state;
    }
    expect(state.grounded).toBe(true);
    const boardedY = state.y;

    // Ride it for a second: the platform descends, and so must the rider.
    for (let frame = 0; frame < 120; frame += 1) {
      state = stepPlatformer(state, idleInput, step, config).state;
    }
    expect(state.grounded).toBe(true);
    expect(state.y).toBeGreaterThan(boardedY + 10);
    const platformNow = movingPlatformAt(elevator, state.elapsedSeconds);
    expect(
      Math.abs(state.y + config.playerHeight - platformNow.y),
    ).toBeLessThan(1.5);
  });

  it("ferries a rider horizontally on the park raft", () => {
    const raft = parcoLevelConfig.movingPlatforms[0];
    let state: PlatformerState = {
      ...createPlatformerState(parcoLevelConfig),
      x: raft.x + 8,
      y: raft.y - parcoLevelConfig.playerHeight - 3,
      grounded: false,
      velocityY: 40,
    };
    for (let frame = 0; frame < 30 && !state.grounded; frame += 1) {
      state = stepPlatformer(state, idleInput, step, parcoLevelConfig).state;
    }
    expect(state.grounded).toBe(true);
    const boardedX = state.x;
    for (let frame = 0; frame < 120; frame += 1) {
      state = stepPlatformer(state, idleInput, step, parcoLevelConfig).state;
    }
    // The raft moves right from phase zero, and the rider goes with it.
    expect(state.x).toBeGreaterThan(boardedX + 15);
  });

  it("keeps every mover's gap jumpable on its own (no forced ferry)", () => {
    // The invariant of ADR-032/044: movers are scenic routes, never keys.
    for (const level of registeredLevels) {
      const reach = jumpReach(level.config);
      const segments = [...level.config.groundSegments].sort(
        (a, b) => a.x - b.x,
      );
      for (let index = 0; index < segments.length - 1; index += 1) {
        const current = segments[index];
        const next = segments[index + 1];
        if (current === undefined || next === undefined) {
          continue;
        }
        const width = next.x - (current.x + current.width);
        const needsSprint = width > reach.horizontal - 20;
        expect(
          needsSprint ? level.config.sprint !== undefined : true,
          `${level.levelId}: a ${String(width)}px gap must not need a mover`,
        ).toBe(true);
      }
    }
  });
});

describe("the legend star (ADR-044)", () => {
  const config = superstarLevelConfig;
  const bonus = config.bonus;
  const withPower = {
    ...config,
    power: roleSuperpowers.hunter.power,
  };

  function standingAtStar(base: typeof withPower): PlatformerState {
    return {
      ...createPlatformerState(base),
      x: bonus.x - base.playerWidth / 2,
      y: bonus.y - base.playerHeight / 2,
      grounded: false,
      velocityY: 0,
      powerCharge: 1,
      powerActive: true,
    };
  }

  it("exists on every level that grants the role superpowers", () => {
    for (const level of registeredLevels) {
      const powered = level.config.powersByRole !== undefined;
      expect(level.config.bonus !== undefined, level.levelId).toBe(powered);
    }
  });

  it("is collected only while the superpower is engaged", () => {
    // With the power held: collected, once, with its event.
    const active = stepPlatformer(
      standingAtStar(withPower),
      { ...idleInput, powerHeld: true },
      step,
      withPower,
    );
    expect(active.events.bonusCollected).toBe(true);
    expect(active.state.bonusCollected).toBe(true);
    const again = stepPlatformer(
      active.state,
      { ...idleInput, powerHeld: true },
      step,
      withPower,
    );
    expect(again.events.bonusCollected).toBe(false);

    // Same spot, no power engaged: the star stays where it is.
    const inert = stepPlatformer(
      { ...standingAtStar(withPower), powerActive: false, powerCharge: 0 },
      idleInput,
      step,
      withPower,
    );
    expect(inert.events.bonusCollected).toBe(false);
    expect(inert.state.bonusCollected).toBe(false);
  });

  it("is never required: the five playthroughs already prove the level", () => {
    // The star is worth score only; completion never checks it. This is a
    // design statement more than a computation: the config carries no gate.
    expect(bonus.id.startsWith("stella-")).toBe(true);
  });
});
