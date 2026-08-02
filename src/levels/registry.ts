import type { AccessibilitySettings } from "../core/game-state";
import type { LevelNode, MessageKey } from "../core/model";
import {
  platformerMiniGame,
  type PlatformerViewConfig,
} from "./adapters/platformer";
import type { LevelAudioPort, MiniGameHandle } from "./contract";

export const campiLevelConfig = {
  worldWidth: 3200,
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
    { x: 0, width: 420 },
    { x: 470, width: 430 },
    { x: 960, width: 540 },
    { x: 1556, width: 594 },
    { x: 2215, width: 985 },
  ],
  platforms: [
    { x: 300, y: 118, width: 70 },
    { x: 560, y: 112, width: 64 },
    { x: 640, y: 84, width: 56 },
    { x: 1050, y: 120, width: 72 },
    { x: 1160, y: 92, width: 64 },
    { x: 1496, y: 116, width: 72 },
    { x: 1780, y: 110, width: 70 },
    { x: 1880, y: 82, width: 60 },
    { x: 2380, y: 118, width: 72 },
    { x: 2500, y: 96, width: 64 },
  ],
  pickups: [
    { id: "photo", x: 668, y: 66 },
    { id: "trace", x: 1910, y: 64 },
    { id: "water", x: 2532, y: 78 },
  ],
  checkpoints: [
    { id: "checkpoint-1", x: 990 },
    { id: "checkpoint-2", x: 2245 },
  ],
  finishX: 3080,
  objectiveKey: "core.message.level.objective",
  controlsKey: "core.message.level.controls",
  leftKey: "core.message.level.control.left",
  rightKey: "core.message.level.control.right",
  jumpKey: "core.message.level.control.jump",
  statusKeys: [
    "core.message.level.status.0",
    "core.message.level.status.1",
    "core.message.level.status.2",
    "core.message.level.status.3",
  ],
  finishStatusKey: "core.message.level.status.3",
  narrativeStartKey: "core.message.level.narrative.start",
  narrativePickupKeys: {
    photo: "core.message.level.narrative.pickup.photo",
    trace: "core.message.level.narrative.pickup.trace",
    water: "core.message.level.narrative.pickup.water",
  },
  narrativeCheckpointKey: "core.message.level.narrative.checkpoint",
  narrativeRespawnKey: "core.message.level.narrative.respawn",
  narrativeFinishKey: "core.message.level.narrative.finish",
} as const satisfies PlatformerViewConfig;

export const registeredLevelDescriptors = [
  {
    levelId: "core.level.campi-di-montichiari",
    configId: "core.level-config.campi-1",
    messageKeys: [
      campiLevelConfig.objectiveKey,
      campiLevelConfig.controlsKey,
      campiLevelConfig.leftKey,
      campiLevelConfig.rightKey,
      campiLevelConfig.jumpKey,
      ...campiLevelConfig.statusKeys,
      campiLevelConfig.finishStatusKey,
      campiLevelConfig.narrativeStartKey,
      ...Object.values(campiLevelConfig.narrativePickupKeys),
      campiLevelConfig.narrativeCheckpointKey,
      campiLevelConfig.narrativeRespawnKey,
      campiLevelConfig.narrativeFinishKey,
    ],
  },
] as const;

export interface MountRegisteredLevelOptions {
  readonly host: HTMLElement;
  readonly node: LevelNode;
  readonly settings: AccessibilitySettings;
  readonly message: (key: MessageKey) => string;
  readonly audio: LevelAudioPort;
  readonly onComplete: (score: number) => void;
  readonly onExit: () => void;
}

export function mountRegisteredLevel(
  options: MountRegisteredLevelOptions,
): MiniGameHandle | undefined {
  if (
    options.node.levelId !== "core.level.campi-di-montichiari" ||
    options.node.configId !== "core.level-config.campi-1"
  ) {
    return undefined;
  }

  return platformerMiniGame.mount(options.host, {
    levelId: options.node.levelId,
    configId: options.node.configId,
    config: campiLevelConfig,
    settings: options.settings,
    message: options.message,
    audio: options.audio,
    onComplete: options.onComplete,
    onExit: options.onExit,
  });
}
