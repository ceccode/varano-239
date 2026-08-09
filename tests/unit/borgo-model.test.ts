import { describe, expect, it } from "vitest";

import {
  acquaLevelConfig,
  borgoLevelConfig,
  campiLevelConfig,
  castelloLevelConfig,
  chatLevelConfig,
  colleLevelConfig,
  labLevelConfig,
  parcoLevelConfig,
  superstarLevelConfig,
  zonaLevelConfig,
} from "../../src/levels/registry";
import type { PlatformerViewConfig } from "../../src/levels/adapters/platformer";
import { jumpReach } from "../../src/levels/define-level";
import {
  movingPlatformAt,
  type PlatformerObstacle,
} from "../../src/levels/platformer-model";
import { playthrough } from "./helpers/level-playthrough";

/**
 * Level design invariants for «Il borgo delle versioni» (ADR-045). The
 * generic suites already cover the shared rules through `registeredLevels`;
 * here live the guarantees that are this level's own — chief among them the
 * anti-monotony brief from the owner's playtest: a route choice instead of a
 * corridor, and the tallest climb of the game.
 */
describe("Il borgo delle versioni level design", () => {
  const config = borgoLevelConfig;
  const viewConfig: PlatformerViewConfig = config;
  const obstacles: readonly PlatformerObstacle[] = config.obstacles;
  const reach = jumpReach(config);

  it("keeps every alley within the reach of a jump without the sprint", () => {
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

  it("offers the roofs over every curioso: street or rooftops, always both", () => {
    // The route-choice brief: every onlooker on the street must sit under a
    // rooftop that spans it, so the level is two paths and not a corridor.
    const onlookers = obstacles.filter(
      (obstacle) => obstacle.kind === "onlooker",
    );
    expect(onlookers.length).toBeGreaterThanOrEqual(6);
    for (const onlooker of onlookers) {
      const roof = config.platforms.filter(
        (platform) =>
          platform.y <= onlooker.y &&
          platform.x <= onlooker.x &&
          platform.x + platform.width >= onlooker.x + onlooker.width,
      );
      expect(roof.length, `${onlooker.id} has no roof route`).toBeGreaterThan(
        0,
      );
    }
  });

  it("strings the clippings low: the one stretch where the sprint dies", () => {
    // Under Ada's investigation raw speed is not the answer (ADR-039 rule,
    // this level's set piece): the threads sit in the running lane.
    const cables = obstacles.filter((obstacle) => obstacle.kind === "cables");
    expect(cables).toHaveLength(1);
    const threads = cables[0];
    expect(threads?.id).toBe("fili-ritagli");
    expect(threads !== undefined && threads.y + threads.height).toBe(154);
  });

  it("opened the vertical axis: it climbs higher than every level before it", () => {
    // The anti-monotony brief made measurable. The village is where the
    // campaign starts using height; only the final hill goes higher still,
    // which is the escalation working — so it is the one level excluded.
    const before = [
      campiLevelConfig,
      chatLevelConfig,
      zonaLevelConfig,
      labLevelConfig,
      acquaLevelConfig,
      superstarLevelConfig,
      parcoLevelConfig,
      castelloLevelConfig,
    ];
    const highestHere = Math.min(
      ...config.platforms.map((platform) => platform.y),
    );
    for (const other of before) {
      expect(highestHere).toBeLessThan(
        Math.min(...other.platforms.map((platform) => platform.y)),
      );
    }
    // …and the last hill tops even this one.
    expect(
      Math.min(...colleLevelConfig.platforms.map((platform) => platform.y)),
    ).toBeLessThan(highestHere);
    const meme = config.pickups.find((pickup) => pickup.id === "meme");
    expect(meme?.y).toBeLessThan(highestHere);
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

  it("never lets a sprinting walk-off a rooftop end in an alley", () => {
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
        `a sprint off the rooftop ending at ${String(edge)} lands in an alley`,
      ).toBe(true);
    }
  });

  it("swings the basket between the courtyard and the meme's perch", () => {
    // The pulley ride is scenic: it reaches the perch the climb already
    // reaches, boards from the ground, and never drifts sideways.
    const basket = config.movingPlatforms[0];
    const perch = config.platforms.find((platform) => platform.y === 56);
    expect(perch).toBeDefined();
    for (let elapsed = 0; elapsed < 40; elapsed += 0.27) {
      const position = movingPlatformAt(basket, elapsed);
      expect(position.x).toBe(basket.x);
      expect(position.y).toBeGreaterThanOrEqual(56);
      expect(position.y).toBeLessThanOrEqual(120);
    }
    // Boarding from the ground stays a plain jump.
    expect(config.floorY - (basket.y + basket.range)).toBeLessThan(
      reach.height,
    );
  });

  it("grants no ★ and hides no star: the powers stay an opening-day debut", () => {
    expect(viewConfig.powersByRole).toBeUndefined();
    expect(viewConfig.bonus).toBeUndefined();
  });

  it("completes the level with no falls and no powers", () => {
    const state = playthrough(config, undefined);
    expect(state.completed).toBe(true);
    expect(state.respawns).toBe(0);
  });
});
