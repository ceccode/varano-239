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

export interface PlatformerCheckpoint {
  readonly id: string;
  readonly x: number;
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
}

export interface PlatformerInput {
  readonly left: boolean;
  readonly right: boolean;
  readonly jumpPressed: boolean;
  readonly jumpHeld: boolean;
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
}

export interface PlatformerEvents {
  readonly jumped: boolean;
  readonly landed: boolean;
  readonly collectedIds: readonly string[];
  readonly checkpointId: string | undefined;
  readonly respawned: boolean;
  readonly finished: boolean;
}

export interface PlatformerStepResult {
  readonly state: PlatformerState;
  readonly events: PlatformerEvents;
}

const pickupRadius = 18;
const fallRespawnMargin = 26;

const noEvents: PlatformerEvents = {
  jumped: false,
  landed: false,
  collectedIds: [],
  checkpointId: undefined,
  respawned: false,
  finished: false,
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
  config: PlatformerConfig,
  previousBottom: number,
  nextBottom: number,
  x: number,
): PlatformerPlatform | undefined {
  return config.platforms
    .filter(
      (platform) =>
        overlapsHorizontally(
          x,
          config.playerWidth,
          platform.x,
          platform.width,
        ) &&
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
  if (state.completed) {
    return { state, events: noEvents };
  }

  const delta = clamp(deltaSeconds, 0, 0.05);
  const direction = Number(input.right) - Number(input.left);

  const acceleration = state.grounded
    ? config.groundAcceleration
    : config.airAcceleration;
  const targetSpeed = direction * config.maxSpeed;
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

  const nextX = clamp(
    state.x + velocityX * delta,
    0,
    config.worldWidth - config.playerWidth,
  );

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

  velocityY = Math.min(velocityY, config.terminalFallSpeed);

  const proposedY = state.y + velocityY * delta;
  const previousBottom = state.y + config.playerHeight;
  const proposedBottom = proposedY + config.playerHeight;

  const platform =
    velocityY > 0
      ? landingPlatform(config, previousBottom, proposedBottom, nextX)
      : undefined;
  const groundTop =
    velocityY > 0 ? groundTopAt(config, nextX, config.playerWidth) : undefined;
  const landsOnGround = groundTop !== undefined && proposedBottom >= groundTop;

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
  };

  let respawned = false;
  if (next.y > config.worldHeight + fallRespawnMargin) {
    const safeX = respawnX(next, config);
    next = {
      ...next,
      x: safeX,
      y: config.floorY - config.playerHeight,
      velocityX: 0,
      velocityY: 0,
      grounded: true,
      coyoteRemaining: config.coyoteSeconds,
      jumpBufferRemaining: 0,
      jumpCutAvailable: false,
      respawns: next.respawns + 1,
    };
    respawned = true;
  }

  const collectedNow = collectPickups(next, config);
  if (collectedNow.length > 0) {
    next = {
      ...next,
      collectedIds: [...next.collectedIds, ...collectedNow],
    };
  }

  const checkpoint = reachedCheckpoint(next, config);
  if (checkpoint !== undefined) {
    next = { ...next, activeCheckpointId: checkpoint.id };
  }

  const finished =
    next.grounded && next.x + config.playerWidth >= config.finishX;
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
