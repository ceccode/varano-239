import type { AccessibilitySettings } from "../core/game-state";
import type { LevelNode, MessageKey } from "../core/model";
import {
  platformerMiniGame,
  type PlatformerViewConfig,
} from "./adapters/platformer";
import type { LevelAudioPort, LevelOutcome, MiniGameHandle } from "./contract";

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

/**
 * Level 2 grants the run superpower (ADR-029): two of its gaps are wider than
 * a standing jump, so they can only be cleared while sprinting.
 */
export const chatLevelConfig = {
  worldWidth: 3600,
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
  sprint: {
    holdSeconds: 0.9,
    maxSpeed: 235,
    acceleration: 620,
  },
  groundSegments: [
    { x: 0, width: 520 },
    { x: 610, width: 470 },
    { x: 1220, width: 480 },
    { x: 1795, width: 525 },
    { x: 2470, width: 1130 },
  ],
  platforms: [
    { x: 740, y: 112, width: 80 },
    { x: 1000, y: 118, width: 70 },
    { x: 1410, y: 108, width: 80 },
    { x: 1980, y: 116, width: 72 },
    { x: 2100, y: 90, width: 64 },
    { x: 2660, y: 100, width: 84 },
    { x: 2900, y: 112, width: 70 },
  ],
  pickups: [
    { id: "screenshot", x: 780, y: 72 },
    { id: "vocale", x: 1450, y: 68 },
    { id: "numero", x: 2700, y: 62 },
  ],
  checkpoints: [
    { id: "chat-checkpoint-1", x: 1240 },
    { id: "chat-checkpoint-2", x: 2500 },
  ],
  finishX: 3480,
  objectiveKey: "core.message.level2.objective",
  controlsKey: "core.message.level2.controls",
  leftKey: "core.message.level.control.left",
  rightKey: "core.message.level.control.right",
  jumpKey: "core.message.level.control.jump",
  statusKeys: [
    "core.message.level2.status.0",
    "core.message.level2.status.1",
    "core.message.level2.status.2",
    "core.message.level2.status.3",
  ],
  finishStatusKey: "core.message.level2.status.3",
  narrativeStartKey: "core.message.level2.narrative.start",
  narrativePickupKeys: {
    screenshot: "core.message.level2.narrative.pickup.screenshot",
    vocale: "core.message.level2.narrative.pickup.vocale",
    numero: "core.message.level2.narrative.pickup.numero",
  },
  narrativeCheckpointKey: "core.message.level2.narrative.checkpoint",
  narrativeRespawnKey: "core.message.level2.narrative.respawn",
  narrativeFinishKey: "core.message.level2.narrative.finish",
  narrativeSprintKey: "core.message.level2.narrative.sprint",
} as const satisfies PlatformerViewConfig;

function descriptorKeys(config: PlatformerViewConfig): readonly MessageKey[] {
  return [
    config.objectiveKey,
    config.controlsKey,
    config.leftKey,
    config.rightKey,
    config.jumpKey,
    ...config.statusKeys,
    config.finishStatusKey,
    config.narrativeStartKey,
    ...Object.values(config.narrativePickupKeys),
    config.narrativeCheckpointKey,
    config.narrativeRespawnKey,
    config.narrativeFinishKey,
    ...(config.narrativeSprintKey === undefined
      ? []
      : [config.narrativeSprintKey]),
  ];
}

const levelConfigs = {
  "core.level.campi-di-montichiari": {
    configId: "core.level-config.campi-1",
    config: campiLevelConfig,
  },
  "core.level.chat-di-paese": {
    configId: "core.level-config.chat-2",
    config: chatLevelConfig,
  },
} as const satisfies Readonly<
  Record<string, { configId: string; config: PlatformerViewConfig }>
>;

export const registeredLevelDescriptors = Object.entries(levelConfigs).map(
  ([levelId, entry]) => ({
    levelId,
    configId: entry.configId,
    messageKeys: descriptorKeys(entry.config),
  }),
);

export interface MountRegisteredLevelOptions {
  readonly host: HTMLElement;
  readonly node: LevelNode;
  readonly settings: AccessibilitySettings;
  readonly message: (key: MessageKey) => string;
  readonly audio: LevelAudioPort;
  readonly onComplete: (outcome: LevelOutcome) => void;
  readonly onExit: () => void;
}

export function mountRegisteredLevel(
  options: MountRegisteredLevelOptions,
): MiniGameHandle | undefined {
  const entry = Object.hasOwn(levelConfigs, options.node.levelId)
    ? levelConfigs[options.node.levelId as keyof typeof levelConfigs]
    : undefined;
  if (entry?.configId !== options.node.configId) {
    return undefined;
  }

  return platformerMiniGame.mount(options.host, {
    levelId: options.node.levelId,
    configId: options.node.configId,
    config: entry.config,
    settings: options.settings,
    message: options.message,
    audio: options.audio,
    onComplete: options.onComplete,
    onExit: options.onExit,
  });
}
