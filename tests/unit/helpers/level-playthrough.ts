import {
  carDirectionAt,
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
    // Patrol cars (ADR-037), read like a player reads them. Head on and away
    // from its turnaround, a car gets hopped over: the arc of a plain jump
    // comfortably outlasts the crossing. A car fleeing in the same direction
    // is never jumped — no arc outruns it — so the player tails it from a
    // distance. And nobody walks into the patrol corridor while the car is
    // coming AT the entrance: they wait just outside until it turns.
    const carsNearby = (levelConfig.cars ?? []).map((car) => ({
      minX: car.minX,
      carX: carPositionAt(car, state.elapsedSeconds),
      towardPlayer: carDirectionAt(car, state.elapsedSeconds) === "left",
      width: car.width,
    }));
    const carAhead = carsNearby.some(
      (car) =>
        state.grounded &&
        car.towardPlayer &&
        playerRight > car.minX + 20 &&
        car.carX - playerRight < 56 &&
        car.carX - playerRight > -car.width,
    );
    const tailingCar = carsNearby.some(
      (car) =>
        !car.towardPlayer &&
        car.carX - playerRight < 40 &&
        car.carX - playerRight > -car.width,
    );
    const waitAtEnvelope = carsNearby.some(
      (car) =>
        car.towardPlayer &&
        car.carX > playerRight &&
        playerRight >= car.minX - 46 &&
        playerRight < car.minX,
    );
    const jump = atGapEdge || beforeObstacle || carAhead;

    const result = stepPlatformer(
      state,
      {
        left: false,
        right: !tailingCar && !waitAtEnvelope,
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
