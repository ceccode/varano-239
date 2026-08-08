export interface GroundSegment {
  readonly x: number;
  readonly width: number;
}

export interface PlatformerPlatform {
  readonly x: number;
  readonly y: number;
  readonly width: number;
}

export interface PlatformerPickup {
  readonly id: string;
  readonly x: number;
  readonly y: number;
}

/**
 * A platform that shuttles along one axis (ADR-044): the same pure triangle
 * wave as the patrol cars (ADR-037), so the motion is deterministic and a
 * player standing on it is carried along. One-way like every platform.
 */
export interface MovingPlatform {
  readonly id: string;
  /** Base position; the offset sweeps from 0 to `range` and back. */
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly axis: "x" | "y";
  readonly range: number;
  readonly speed: number;
}

/** Where a moving platform is at a given moment. */
export function movingPlatformAt(
  mover: MovingPlatform,
  elapsedSeconds: number,
): PlatformerPlatform {
  if (mover.range <= 0) {
    return { x: mover.x, y: mover.y, width: mover.width };
  }
  const phase = (elapsedSeconds * mover.speed) % (2 * mover.range);
  const offset = phase <= mover.range ? phase : 2 * mover.range - phase;
  return {
    x: mover.x + (mover.axis === "x" ? offset : 0),
    y: mover.y + (mover.axis === "y" ? offset : 0),
    width: mover.width,
  };
}

/**
 * The legend star (ADR-044): an optional bonus worth score, collectible only
 * while the role superpower is engaged. Never a clue, never required.
 */
export interface BonusStar {
  readonly id: string;
  readonly x: number;
  readonly y: number;
}

export interface PlatformerCheckpoint {
  readonly id: string;
  readonly x: number;
}

/**
 * The run superpower: holding one direction on the ground charges a sprint,
 * so no extra on-screen button is needed on a phone.
 */
export interface SprintConfig {
  readonly holdSeconds: number;
  readonly maxSpeed: number;
  readonly acceleration: number;
}

/**
 * The role superpowers (ADR-031). All four are held, not tapped, and each one
 * answers a different dimension: speed, information, neutralisation, height.
 */
export type PowerConfig =
  | {
      readonly kind: "sprint";
      readonly chargeSeconds: number;
      readonly maxSpeed: number;
      readonly acceleration: number;
    }
  | {
      readonly kind: "scent";
      readonly chargeSeconds: number;
      readonly radius: number;
    }
  | {
      readonly kind: "call";
      readonly chargeSeconds: number;
      readonly radius: number;
    }
  | {
      readonly kind: "drone";
      readonly chargeSeconds: number;
      readonly hoverSeconds: number;
      readonly liftSpeed: number;
    };

export type PowerKind = PowerConfig["kind"];

/**
 * Non-lethal obstacles: they cost time, never health. There is no damage, no
 * life counter and no game over anywhere in this model.
 */
export type ObstacleKind = "onlooker" | "drone" | "cables";

export interface PlatformerObstacle {
  readonly id: string;
  readonly kind: ObstacleKind;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * A vehicle shuttling back and forth on the ground (ADR-037). Touching it is
 * the ADR-035 fall in another costume: back to the flag, clues intact — never
 * damage, never a life lost, never a game over. It must always be jumpable.
 */
export interface PatrolCar {
  readonly id: string;
  /** Leftmost and rightmost x the car's left edge reaches. */
  readonly minX: number;
  readonly maxX: number;
  readonly width: number;
  readonly height: number;
  readonly speed: number;
}

/**
 * Where a car is at a given moment: a triangle wave over elapsed time, so the
 * motion is pure and deterministic — no clock, no randomness (AGENTS.md).
 */
export function carPositionAt(car: PatrolCar, elapsedSeconds: number): number {
  const range = car.maxX - car.minX;
  if (range <= 0) {
    return car.minX;
  }
  const phase = (elapsedSeconds * car.speed) % (2 * range);
  return car.minX + (phase <= range ? phase : 2 * range - phase);
}

/** Which way the car is facing, for the renderer. */
export function carDirectionAt(
  car: PatrolCar,
  elapsedSeconds: number,
): "left" | "right" {
  const range = car.maxX - car.minX;
  if (range <= 0) {
    return "right";
  }
  const phase = (elapsedSeconds * car.speed) % (2 * range);
  return phase <= range ? "right" : "left";
}

export interface PlatformerConfig {
  readonly worldWidth: number;
  readonly worldHeight: number;
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly floorY: number;
  readonly playerWidth: number;
  readonly playerHeight: number;
  readonly maxSpeed: number;
  readonly groundAcceleration: number;
  readonly groundDeceleration: number;
  readonly airAcceleration: number;
  readonly gravity: number;
  readonly jumpSpeed: number;
  readonly jumpCutFactor: number;
  readonly terminalFallSpeed: number;
  readonly coyoteSeconds: number;
  readonly jumpBufferSeconds: number;
  readonly groundSegments: readonly GroundSegment[];
  readonly platforms: readonly PlatformerPlatform[];
  readonly pickups: readonly PlatformerPickup[];
  readonly checkpoints: readonly PlatformerCheckpoint[];
  readonly finishX: number;
  /**
   * Lives per attempt (ADR-041): a fall or a vehicle hit costs one; at zero
   * the run is over and the level restarts from scratch. Omitted means
   * unlimited — the pre-ADR-041 behaviour, kept for focused tests.
   */
  readonly lives?: number;
  /** Omitted on levels that do not grant the sprint. */
  readonly sprint?: SprintConfig;
  /** Omitted on levels without a role superpower; resolved per role by the registry. */
  readonly power?: PowerConfig;
  /** Omitted on levels without obstacles. */
  readonly obstacles?: readonly PlatformerObstacle[];
  /** Omitted on levels without patrol cars (ADR-037). */
  readonly cars?: readonly PatrolCar[];
  /** Omitted on levels without moving platforms (ADR-044). */
  readonly movingPlatforms?: readonly MovingPlatform[];
  /** Omitted on levels without a legend star (ADR-044). */
  readonly bonus?: BonusStar;
}

export interface PlatformerInput {
  readonly left: boolean;
  readonly right: boolean;
  readonly jumpPressed: boolean;
  readonly jumpHeld: boolean;
  /** Optional so levels and tests without a power stay unchanged. */
  readonly powerHeld?: boolean;
}

export interface PlatformerState {
  readonly x: number;
  readonly y: number;
  readonly velocityX: number;
  readonly velocityY: number;
  readonly grounded: boolean;
  readonly facing: "left" | "right";
  readonly coyoteRemaining: number;
  readonly jumpBufferRemaining: number;
  readonly jumpCutAvailable: boolean;
  readonly collectedIds: readonly string[];
  readonly activeCheckpointId: string | undefined;
  readonly respawns: number;
  readonly elapsedSeconds: number;
  readonly completed: boolean;
  /** Lives left in this attempt; infinite when the config sets no limit. */
  readonly livesRemaining: number;
  /** True once the last life is gone (ADR-041): the attempt is over. */
  readonly gameOver: boolean;
  /** The legend star, once grabbed with the power engaged (ADR-044). */
  readonly bonusCollected: boolean;
  /** Seconds of uninterrupted running in the same direction. */
  readonly sprintCharge: number;
  readonly sprinting: boolean;
  /** Seconds the power button has been held without interruption. */
  readonly powerCharge: number;
  readonly powerActive: boolean;
  /** Remaining hover seconds; refills on the ground. */
  readonly droneFuel: number;
  /** Obstacles the scent opened for good. */
  readonly openedObstacleIds: readonly string[];
  /** Obstacles the call is calming right now; momentary, recomputed each step. */
  readonly calmedObstacleIds: readonly string[];
}

export interface PlatformerEvents {
  readonly jumped: boolean;
  readonly landed: boolean;
  readonly collectedIds: readonly string[];
  readonly checkpointId: string | undefined;
  readonly respawned: boolean;
  readonly finished: boolean;
  /** The last life just went (ADR-041): no respawn, the attempt ends here. */
  readonly gameOver: boolean;
  /** The legend star just collected (ADR-044). */
  readonly bonusCollected: boolean;
  readonly sprintStarted: boolean;
  readonly powerStarted: boolean;
  readonly openedObstacleIds: readonly string[];
  /** Bumped into a solid obstacle: worth a sound, never a penalty. */
  readonly blocked: boolean;
  /**
   * Onlookers a sprint is passing straight through right now (ADR-032). The
   * pass-through is design — a full sprint barges past a crowd — but without
   * a visible reaction it reads as a collision bug, so it is an event.
   */
  readonly bargedObstacleIds: readonly string[];
  /** The respawn was a patrol car, so the narrator can tell that story. */
  readonly carHit: boolean;
}

export interface PlatformerStepResult {
  readonly state: PlatformerState;
  readonly events: PlatformerEvents;
}

const pickupRadius = 18;
const fallRespawnMargin = 26;
/** How hard an onlooker nudges you back. Enough to cost time, never to hurt. */
const onlookerPushSpeed = 95;
/** Cables and tripods slow you down and make a sprint impossible. */
const cablesSpeedFactor = 0.45;

const noEvents: PlatformerEvents = {
  jumped: false,
  landed: false,
  collectedIds: [],
  checkpointId: undefined,
  respawned: false,
  finished: false,
  gameOver: false,
  bonusCollected: false,
  sprintStarted: false,
  powerStarted: false,
  openedObstacleIds: [],
  blocked: false,
  bargedObstacleIds: [],
  carHit: false,
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function overlapsHorizontally(
  x: number,
  width: number,
  regionX: number,
  regionWidth: number,
): boolean {
  return x + width > regionX && x < regionX + regionWidth;
}

function overlapsVertically(
  y: number,
  height: number,
  regionY: number,
  regionHeight: number,
): boolean {
  return y + height > regionY && y < regionY + regionHeight;
}

function initialDroneFuel(config: PlatformerConfig): number {
  return config.power?.kind === "drone" ? config.power.hoverSeconds : 0;
}

/** Distance from the player box to an obstacle box, zero while overlapping. */
function obstacleDistance(
  state: PlatformerState,
  config: PlatformerConfig,
  obstacle: PlatformerObstacle,
): number {
  const centerX = state.x + config.playerWidth / 2;
  const centerY = state.y + config.playerHeight / 2;
  return Math.hypot(
    centerX - clamp(centerX, obstacle.x, obstacle.x + obstacle.width),
    centerY - clamp(centerY, obstacle.y, obstacle.y + obstacle.height),
  );
}

interface ObstacleContact {
  readonly x: number;
  readonly velocityX: number;
  readonly blocked: boolean;
  readonly bargedIds: readonly string[];
}

/**
 * Pushes the player out of the obstacles that still stand in the way. A sprint
 * carries the Varano straight through a crowd; nothing carries anyone through
 * the troupe's drone, which is why every set piece also has a route above it.
 */
function resolveObstacleContacts(
  config: PlatformerConfig,
  obstacles: readonly PlatformerObstacle[],
  proposedX: number,
  y: number,
  velocityX: number,
  sprinting: boolean,
): ObstacleContact {
  let x = proposedX;
  let nextVelocityX = velocityX;
  let blocked = false;
  const bargedIds: string[] = [];

  for (const obstacle of obstacles) {
    if (
      obstacle.kind === "cables" ||
      !overlapsVertically(
        y,
        config.playerHeight,
        obstacle.y,
        obstacle.height,
      ) ||
      !overlapsHorizontally(x, config.playerWidth, obstacle.x, obstacle.width)
    ) {
      continue;
    }

    if (obstacle.kind === "onlooker" && sprinting) {
      // The barge itself: no contact resolved, but the pass-through is
      // reported so the presentation can react to it.
      bargedIds.push(obstacle.id);
      continue;
    }

    const fromLeft =
      x + config.playerWidth / 2 < obstacle.x + obstacle.width / 2;
    x = fromLeft
      ? obstacle.x - config.playerWidth
      : obstacle.x + obstacle.width;
    if (obstacle.kind === "onlooker") {
      nextVelocityX = fromLeft ? -onlookerPushSpeed : onlookerPushSpeed;
    } else {
      nextVelocityX = 0;
      blocked = true;
    }
  }

  return { x, velocityX: nextVelocityX, blocked, bargedIds };
}

export function createPlatformerState(
  config: PlatformerConfig,
): PlatformerState {
  return {
    x: 14,
    y: config.floorY - config.playerHeight,
    velocityX: 0,
    velocityY: 0,
    grounded: true,
    facing: "right",
    coyoteRemaining: config.coyoteSeconds,
    jumpBufferRemaining: 0,
    jumpCutAvailable: false,
    collectedIds: [],
    activeCheckpointId: undefined,
    respawns: 0,
    elapsedSeconds: 0,
    completed: false,
    livesRemaining: config.lives ?? Number.POSITIVE_INFINITY,
    gameOver: false,
    bonusCollected: false,
    sprintCharge: 0,
    sprinting: false,
    powerCharge: 0,
    powerActive: false,
    droneFuel: initialDroneFuel(config),
    openedObstacleIds: [],
    calmedObstacleIds: [],
  };
}

function respawnX(state: PlatformerState, config: PlatformerConfig): number {
  const checkpoint = config.checkpoints.find(
    (candidate) => candidate.id === state.activeCheckpointId,
  );
  return checkpoint?.x ?? 14;
}

function groundTopAt(
  config: PlatformerConfig,
  x: number,
  width: number,
): number | undefined {
  return config.groundSegments.some((segment) =>
    overlapsHorizontally(x, width, segment.x, segment.width),
  )
    ? config.floorY
    : undefined;
}

function landingPlatform(
  platforms: readonly PlatformerPlatform[],
  playerWidth: number,
  previousBottom: number,
  nextBottom: number,
  x: number,
): PlatformerPlatform | undefined {
  return platforms
    .filter(
      (platform) =>
        overlapsHorizontally(x, playerWidth, platform.x, platform.width) &&
        previousBottom <= platform.y &&
        nextBottom >= platform.y,
    )
    .sort((left, right) => left.y - right.y)[0];
}

function collectPickups(
  state: PlatformerState,
  config: PlatformerConfig,
): readonly string[] {
  const centerX = state.x + config.playerWidth / 2;
  const centerY = state.y + config.playerHeight / 2;

  return config.pickups
    .filter(
      (pickup) =>
        !state.collectedIds.includes(pickup.id) &&
        Math.hypot(centerX - pickup.x, centerY - pickup.y) <= pickupRadius,
    )
    .map((pickup) => pickup.id);
}

function reachedCheckpoint(
  state: PlatformerState,
  config: PlatformerConfig,
): PlatformerCheckpoint | undefined {
  const activeIndex = config.checkpoints.findIndex(
    (candidate) => candidate.id === state.activeCheckpointId,
  );

  return config.checkpoints
    .filter((candidate, index) => index > activeIndex && state.x >= candidate.x)
    .at(-1);
}

export function stepPlatformer(
  state: PlatformerState,
  input: PlatformerInput,
  deltaSeconds: number,
  config: PlatformerConfig,
): PlatformerStepResult {
  if (state.completed || state.gameOver) {
    return { state, events: noEvents };
  }

  const delta = clamp(deltaSeconds, 0, 0.05);
  const direction = Number(input.right) - Number(input.left);

  // The power is held, never tapped, so it behaves the same on a keyboard and
  // under a thumb. Releasing it discharges the whole thing (ADR-031).
  const power = config.power;
  const powerCharge =
    power !== undefined && input.powerHeld === true
      ? state.powerCharge + delta
      : 0;
  // The drone also needs fuel left in the tank.
  const powerActive =
    power !== undefined &&
    powerCharge >= power.chargeSeconds &&
    (power.kind !== "drone" || state.droneFuel > 0);
  const powerStarted = powerActive && !state.powerActive;

  const obstacles = config.obstacles ?? [];
  // The call calms whatever is nearby for as long as it is held…
  const callRadius =
    power?.kind === "call" && powerActive ? power.radius : undefined;
  const calmedObstacleIds =
    callRadius === undefined
      ? []
      : obstacles
          .filter(
            (obstacle) =>
              obstacleDistance(state, config, obstacle) <= callRadius,
          )
          .map((obstacle) => obstacle.id);
  // …while the scent finds a gap in a crowd once and for all.
  const scentRadius =
    power?.kind === "scent" && powerActive ? power.radius : undefined;
  const newlyOpenedIds =
    scentRadius === undefined
      ? []
      : obstacles
          .filter(
            (obstacle) =>
              obstacle.kind === "onlooker" &&
              !state.openedObstacleIds.includes(obstacle.id) &&
              obstacleDistance(state, config, obstacle) <= scentRadius,
          )
          .map((obstacle) => obstacle.id);
  const openedObstacleIds = [...state.openedObstacleIds, ...newlyOpenedIds];
  const standingObstacles = obstacles.filter(
    (obstacle) =>
      !openedObstacleIds.includes(obstacle.id) &&
      !calmedObstacleIds.includes(obstacle.id),
  );

  // Cables cap the speed and make a sprint impossible: this is the set piece
  // where raw speed is not the answer.
  const insideCables = standingObstacles.some(
    (obstacle) =>
      obstacle.kind === "cables" &&
      overlapsHorizontally(
        state.x,
        config.playerWidth,
        obstacle.x,
        obstacle.width,
      ) &&
      overlapsVertically(
        state.y,
        config.playerHeight,
        obstacle.y,
        obstacle.height,
      ),
  );

  // The sprint charges only while running one way; turning or stopping resets
  // it. Once charged it survives a jump, so gaps can be cleared at full speed.
  const sprint = config.sprint;
  const keepsCharging =
    sprint !== undefined &&
    !insideCables &&
    direction !== 0 &&
    (direction < 0 ? "left" : "right") === state.facing;
  const sprintCharge = keepsCharging ? state.sprintCharge + delta : 0;
  const sprintPower =
    power?.kind === "sprint" && powerActive && !insideCables
      ? power
      : undefined;
  const sprintingFromHold =
    sprint !== undefined && sprintCharge >= sprint.holdSeconds;
  const sprinting = sprintingFromHold || sprintPower !== undefined;
  const sprintStarted = sprinting && !state.sprinting;

  const sprintSpeed =
    sprintPower?.maxSpeed ?? (sprintingFromHold ? sprint.maxSpeed : undefined);
  const sprintAcceleration =
    sprintPower?.acceleration ??
    (sprintingFromHold ? sprint.acceleration : undefined);

  const maxSpeed = insideCables
    ? config.maxSpeed * cablesSpeedFactor
    : (sprintSpeed ?? config.maxSpeed);
  const groundAcceleration = sprintAcceleration ?? config.groundAcceleration;

  const acceleration = state.grounded
    ? groundAcceleration
    : config.airAcceleration;
  const targetSpeed = direction * maxSpeed;
  let velocityX = state.velocityX;
  if (direction !== 0) {
    const step = acceleration * delta;
    velocityX =
      velocityX < targetSpeed
        ? Math.min(velocityX + step, targetSpeed)
        : Math.max(velocityX - step, targetSpeed);
  } else {
    const step = config.groundDeceleration * delta;
    velocityX =
      velocityX > 0
        ? Math.max(0, velocityX - step)
        : Math.min(0, velocityX + step);
  }

  // A moving platform carries whoever stands on it (ADR-044): the player's
  // base position shifts by the platform's own travel over this step, so an
  // elevator lifts you and a raft ferries you.
  const elapsedAfter = state.elapsedSeconds + delta;
  let carryX = 0;
  let carryY = 0;
  if (state.grounded) {
    for (const mover of config.movingPlatforms ?? []) {
      const before = movingPlatformAt(mover, state.elapsedSeconds);
      if (
        overlapsHorizontally(
          state.x,
          config.playerWidth,
          before.x,
          before.width,
        ) &&
        Math.abs(state.y + config.playerHeight - before.y) < 1.5
      ) {
        const after = movingPlatformAt(mover, elapsedAfter);
        carryX = after.x - before.x;
        carryY = after.y - before.y;
        break;
      }
    }
  }

  const contact = resolveObstacleContacts(
    config,
    standingObstacles,
    clamp(
      state.x + carryX + velocityX * delta,
      0,
      config.worldWidth - config.playerWidth,
    ),
    state.y,
    velocityX,
    sprinting,
  );
  const nextX = clamp(contact.x, 0, config.worldWidth - config.playerWidth);
  velocityX = contact.velocityX;

  const jumpBufferRemaining = input.jumpPressed
    ? config.jumpBufferSeconds
    : Math.max(0, state.jumpBufferRemaining - delta);
  const coyoteRemaining = state.grounded
    ? config.coyoteSeconds
    : Math.max(0, state.coyoteRemaining - delta);

  const startsJump = jumpBufferRemaining > 0 && coyoteRemaining > 0;
  let velocityY = startsJump
    ? -config.jumpSpeed
    : state.velocityY + config.gravity * delta;
  let jumpCutAvailable = startsJump ? true : state.jumpCutAvailable;

  if (jumpCutAvailable && !input.jumpHeld && velocityY < 0) {
    velocityY *= config.jumpCutFactor;
    jumpCutAvailable = false;
  }

  // The drone of the fictional Borgocoda: a slow, fuel-limited lift, so the
  // Mayor passes above an obstacle instead of through it.
  const droneLifting = power?.kind === "drone" && powerActive;
  if (droneLifting) {
    velocityY = -power.liftSpeed;
    jumpCutAvailable = false;
  }

  velocityY = Math.min(velocityY, config.terminalFallSpeed);

  const baseY = state.y + carryY;
  const proposedY = baseY + velocityY * delta;
  const previousBottom = baseY + config.playerHeight;
  const proposedBottom = proposedY + config.playerHeight;

  // Moving platforms land like static ones, at wherever they are right now.
  const platformsNow =
    config.movingPlatforms === undefined
      ? config.platforms
      : [
          ...config.platforms,
          ...config.movingPlatforms.map((mover) =>
            movingPlatformAt(mover, elapsedAfter),
          ),
        ];
  const platform =
    velocityY > 0
      ? landingPlatform(
          platformsNow,
          config.playerWidth,
          previousBottom,
          proposedBottom,
          nextX,
        )
      : undefined;
  const groundTop =
    velocityY > 0 ? groundTopAt(config, nextX, config.playerWidth) : undefined;
  // The ground is crossed from above, like a platform: without this a player
  // who has already fallen past the floor gets scooped up the moment they
  // overlap the far side of a gap, which turned narrow gaps into free bridges.
  const landsOnGround =
    groundTop !== undefined &&
    previousBottom <= groundTop &&
    proposedBottom >= groundTop;

  let nextY = proposedY;
  let grounded = false;
  if (platform !== undefined && (!landsOnGround || platform.y <= groundTop)) {
    nextY = platform.y - config.playerHeight;
    grounded = true;
  } else if (landsOnGround) {
    nextY = groundTop - config.playerHeight;
    grounded = true;
  }

  const landed = grounded && !state.grounded;

  let next: PlatformerState = {
    ...state,
    x: nextX,
    y: nextY,
    velocityX,
    velocityY: grounded ? 0 : velocityY,
    grounded,
    facing: direction < 0 ? "left" : direction > 0 ? "right" : state.facing,
    coyoteRemaining: startsJump ? 0 : coyoteRemaining,
    jumpBufferRemaining: startsJump ? 0 : jumpBufferRemaining,
    jumpCutAvailable: grounded ? false : jumpCutAvailable,
    elapsedSeconds: state.elapsedSeconds + delta,
    sprintCharge,
    sprinting,
    powerCharge,
    powerActive,
    droneFuel: droneLifting
      ? Math.max(0, state.droneFuel - delta)
      : grounded
        ? initialDroneFuel(config)
        : state.droneFuel,
    openedObstacleIds,
    calmedObstacleIds,
  };

  // The soft respawn of ADR-018/035: back to the flag, clues and everything
  // the scent found intact; sprint and power have to be charged again. Since
  // ADR-041 it also costs one of the attempt's lives.
  const respawnedState = (current: PlatformerState): PlatformerState => ({
    ...current,
    x: respawnX(current, config),
    y: config.floorY - config.playerHeight,
    velocityX: 0,
    velocityY: 0,
    grounded: true,
    coyoteRemaining: config.coyoteSeconds,
    jumpBufferRemaining: 0,
    jumpCutAvailable: false,
    respawns: current.respawns + 1,
    livesRemaining: current.livesRemaining - 1,
    sprintCharge: 0,
    sprinting: false,
    powerCharge: 0,
    powerActive: false,
    droneFuel: initialDroneFuel(config),
    calmedObstacleIds: [],
  });

  // On the last life there is no flag to come back to (ADR-041): the attempt
  // ends and the adapter offers a fresh start or the usual skip.
  const knockedOutState = (current: PlatformerState): PlatformerState => ({
    ...current,
    livesRemaining: current.livesRemaining - 1,
    gameOver: true,
    velocityX: 0,
    velocityY: 0,
  });
  const lastLife = next.livesRemaining <= 1;

  let respawned = false;
  let gameOver = false;
  if (next.y > config.worldHeight + fallRespawnMargin) {
    if (lastLife) {
      gameOver = true;
      next = knockedOutState(next);
    } else {
      respawned = true;
      next = respawnedState(next);
    }
  }

  // A patrol car is the same fall in another costume (ADR-037): touching it
  // costs a life like any fall. Jumping clears it — the cars are lower than a
  // jump by design, and the tests hold that line.
  let carHit = false;
  if (!respawned && !gameOver) {
    const hit = (config.cars ?? []).some((car) => {
      const carX = carPositionAt(car, next.elapsedSeconds);
      const carY = config.floorY - car.height;
      return (
        overlapsHorizontally(next.x, config.playerWidth, carX, car.width) &&
        overlapsVertically(next.y, config.playerHeight, carY, car.height)
      );
    });
    if (hit) {
      carHit = true;
      if (lastLife) {
        gameOver = true;
        next = knockedOutState(next);
      } else {
        respawned = true;
        next = respawnedState(next);
      }
    }
  }

  const collectedNow = gameOver ? [] : collectPickups(next, config);
  if (collectedNow.length > 0) {
    next = {
      ...next,
      collectedIds: [...next.collectedIds, ...collectedNow],
    };
  }

  // The legend star (ADR-044): only a hand with the power engaged can take
  // it. Optional by contract — never a clue, never needed to finish.
  const bonus = config.bonus;
  let bonusCollected = false;
  if (
    bonus !== undefined &&
    !gameOver &&
    !next.bonusCollected &&
    next.powerActive &&
    Math.hypot(
      next.x + config.playerWidth / 2 - bonus.x,
      next.y + config.playerHeight / 2 - bonus.y,
    ) <=
      pickupRadius + 4
  ) {
    next = { ...next, bonusCollected: true };
    bonusCollected = true;
  }

  const checkpoint = gameOver ? undefined : reachedCheckpoint(next, config);
  if (checkpoint !== undefined) {
    next = { ...next, activeCheckpointId: checkpoint.id };
  }

  const finished =
    !gameOver && next.grounded && next.x + config.playerWidth >= config.finishX;
  if (finished) {
    next = { ...next, completed: true, velocityX: 0 };
  }

  return {
    state: next,
    events: {
      jumped: startsJump,
      landed,
      collectedIds: collectedNow,
      checkpointId: checkpoint?.id,
      respawned,
      finished,
      gameOver,
      bonusCollected,
      sprintStarted: sprintStarted && !respawned && !gameOver,
      powerStarted: powerStarted && !respawned && !gameOver,
      openedObstacleIds: newlyOpenedIds,
      blocked: contact.blocked,
      bargedObstacleIds: contact.bargedIds,
      carHit,
    },
  };
}

export function cameraX(
  state: PlatformerState,
  config: PlatformerConfig,
): number {
  const lookAhead = state.facing === "right" ? 0.38 : 0.62;
  return clamp(
    state.x - config.viewportWidth * lookAhead + config.playerWidth / 2,
    0,
    config.worldWidth - config.viewportWidth,
  );
}
