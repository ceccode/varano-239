import type { PlatformerViewConfig } from "./adapters/platformer";

/**
 * The feel of the game: identical in every level, so it is written once. A
 * level that changed these would play like a different game, which is why they
 * are defaults rather than per-level copy-paste (ADR-034).
 */
export const platformerDefaults = {
  // Three lives per attempt on every level (ADR-041): falls and vehicles cost
  // one; at zero the level restarts. Story progress is never lost.
  lives: 3,
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
  leftKey: "core.message.level.control.left",
  rightKey: "core.message.level.control.right",
  jumpKey: "core.message.level.control.jump",
} as const;

type LevelDefaults = typeof platformerDefaults;
type DefaultedKey = keyof LevelDefaults;

/**
 * What a level must state itself, plus the defaults it may override. The
 * overridable half is typed from `PlatformerViewConfig`, not from the defaults,
 * so a level can say `maxSpeed: 235` instead of being pinned to the literal.
 */
export type LevelDefinition = Omit<PlatformerViewConfig, DefaultedKey> &
  Partial<Pick<PlatformerViewConfig, DefaultedKey>>;

/**
 * How far a jump carries at the level's own top speed, and how high it climbs.
 * Level design tests use these instead of recomputing the physics by hand.
 */
export function jumpReach(config: PlatformerViewConfig): {
  readonly horizontal: number;
  readonly height: number;
} {
  const airtime = (2 * config.jumpSpeed) / config.gravity;
  return {
    horizontal: config.maxSpeed * airtime,
    height: (config.jumpSpeed * config.jumpSpeed) / (2 * config.gravity),
  };
}

/**
 * A `const` type parameter keeps the literal shape of what the level declares,
 * so tests can still reach `powersByRole.varano` without a null check.
 */
export function defineLevel<const T extends LevelDefinition>(
  definition: T,
): Omit<LevelDefaults, keyof T> & T {
  return { ...platformerDefaults, ...definition };
}
