import {
  carPositionAt,
  createPlatformerState,
  stepPlatformer,
  type PlatformerConfig,
  type PlatformerState,
  type PowerConfig,
} from "../../../src/levels/platformer-model";

/**
 * Drives a level the way a competent player would: runs right, jumps at the
 * edge of a gap and before whatever still stands in the way, and holds the
 * power while approaching an obstacle — not pinned down for the whole level,
 * because the Mayor's drone needs ground contact to refuel. This is the proof
 * that matters for a level design: playable, not merely compiling.
 */
export function playthrough(
  config: PlatformerConfig,
  power: PowerConfig | undefined,
): PlatformerState {
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
    // Jump early enough to clear it, or to land on whatever platform route
    // carries the way above it.
    const beforeObstacle = standing.some(
      (obstacle) =>
        state.grounded &&
        playerRight >= obstacle.x - 34 &&
        state.x < obstacle.x,
    );
    const approaching = standing.some(
      (obstacle) => playerRight >= obstacle.x - 210 && state.x < obstacle.x,
    );
    // A patrol car close ahead gets hopped over (ADR-037): the arc of a plain
    // jump comfortably outlasts the crossing, so no frame-perfect timing.
    const carAhead = (levelConfig.cars ?? []).some((car) => {
      const carX = carPositionAt(car, state.elapsedSeconds);
      const distance = carX - playerRight;
      return state.grounded && distance < 56 && distance > -car.width;
    });
    const jump = atGapEdge || beforeObstacle || carAhead;

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
