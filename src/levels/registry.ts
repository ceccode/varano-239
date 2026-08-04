import type { AccessibilitySettings } from "../core/game-state";
import type { LevelNode, MessageKey, Role } from "../core/model";
import {
  platformerMiniGame,
  type PlatformerViewConfig,
} from "./adapters/platformer";
import type { LevelAudioPort, LevelOutcome, MiniGameHandle } from "./contract";
import { defineLevel } from "./define-level";

export const campiLevelConfig = defineLevel({
  worldWidth: 3200,
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
  // 2:39 in the fields: exactly the colours shipped before ADR-033.
  backdrop: {
    sky: ["#0a0f26", "#10203f", "#1c3350"],
    night: true,
    far: "hills",
    near: "corn",
  },
  objectiveKey: "core.message.level.objective",
  controlsKey: "core.message.level.controls",
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
});

/**
 * Level 2 grants the run superpower (ADR-029): two of its gaps are wider than
 * a standing jump, so they can only be cleared while sprinting.
 */
export const chatLevelConfig = defineLevel({
  worldWidth: 3600,
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
  // 2:41 among the houses: still night, but the village is awake.
  backdrop: {
    sky: ["#0d1430", "#152a4c", "#24405e"],
    night: true,
    far: "rooftops",
    near: "hedges",
  },
  objectiveKey: "core.message.level2.objective",
  controlsKey: "core.message.level2.controls",
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
});

/**
 * Level 3 gates one superpower per role (ADR-031, ADR-032). Unlike level 2 its
 * geometry never *requires* a power: every gap is within the 117 px reach of a
 * plain jump and every blocking obstacle has a platform route above it, so all
 * four roles — and a player who never touches the button — can finish it.
 */
export const superstarLevelConfig = defineLevel({
  worldWidth: 3900,
  groundSegments: [
    { x: 0, width: 620 },
    { x: 700, width: 700 },
    { x: 1490, width: 780 },
    { x: 2355, width: 1545 },
  ],
  platforms: [
    // Set piece 1: the roofs of the TV vans, over the queue of onlookers.
    { x: 770, y: 118, width: 70 },
    { x: 880, y: 118, width: 70 },
    { x: 990, y: 118, width: 70 },
    // Set piece 2: the tripods, over the cables.
    { x: 1580, y: 112, width: 60 },
    { x: 1690, y: 112, width: 60 },
    { x: 1800, y: 112, width: 60 },
    { x: 1910, y: 112, width: 60 },
    // Set piece 3: the scaffolding, over the troupe's drone. At y=110 it sits
    // 44px above the floor, inside the 48.8px reach of a plain jump.
    { x: 2540, y: 110, width: 120 },
    { x: 2700, y: 110, width: 70 },
    // Set piece 4: the press riser under the walls.
    { x: 3070, y: 118, width: 180 },
  ],
  obstacles: [
    {
      id: "curiosi-1",
      kind: "onlooker",
      x: 800,
      y: 128,
      width: 22,
      height: 26,
    },
    {
      id: "curiosi-2",
      kind: "onlooker",
      x: 900,
      y: 128,
      width: 22,
      height: 26,
    },
    {
      id: "curiosi-3",
      kind: "onlooker",
      x: 1000,
      y: 128,
      width: 22,
      height: 26,
    },
    { id: "cavi", kind: "cables", x: 1560, y: 134, width: 420, height: 20 },
    { id: "drone-tv", kind: "drone", x: 2600, y: 124, width: 30, height: 26 },
    {
      id: "curiosi-4",
      kind: "onlooker",
      x: 3100,
      y: 128,
      width: 22,
      height: 26,
    },
    {
      id: "curiosi-5",
      kind: "onlooker",
      x: 3180,
      y: 128,
      width: 22,
      height: 26,
    },
  ],
  pickups: [
    { id: "pass", x: 915, y: 88 },
    { id: "microfono", x: 1720, y: 76 },
    { id: "poster", x: 2735, y: 72 },
  ],
  checkpoints: [
    { id: "superstar-checkpoint-1", x: 1500 },
    { id: "superstar-checkpoint-2", x: 2400 },
  ],
  finishX: 3780,
  finishKind: "walls",
  // Opening day: the one level in broad daylight, with the Castello in sight.
  backdrop: {
    sky: ["#3f8fc4", "#79bade", "#bcdcee"],
    night: false,
    far: "castle",
    near: "crowd",
  },
  objectiveKey: "core.message.level3.objective",
  controlsKey: "core.message.level3.controls",
  statusKeys: [
    "core.message.level3.status.0",
    "core.message.level3.status.1",
    "core.message.level3.status.2",
    "core.message.level3.status.3",
  ],
  finishStatusKey: "core.message.level3.status.3",
  narrativeStartKey: "core.message.level3.narrative.start",
  narrativePickupKeys: {
    pass: "core.message.level3.narrative.pickup.pass",
    microfono: "core.message.level3.narrative.pickup.microfono",
    poster: "core.message.level3.narrative.pickup.poster",
  },
  narrativeCheckpointKey: "core.message.level3.narrative.checkpoint",
  narrativeRespawnKey: "core.message.level3.narrative.respawn",
  narrativeFinishKey: "core.message.level3.narrative.finish",
  powersByRole: {
    varano: {
      power: {
        kind: "sprint",
        chargeSeconds: 0.4,
        maxSpeed: 235,
        acceleration: 620,
      },
      labelKey: "core.message.level3.power.varano.label",
      narrativeKey: "core.message.level3.power.varano.narrative",
    },
    hunter: {
      power: { kind: "scent", chargeSeconds: 0.4, radius: 52 },
      labelKey: "core.message.level3.power.hunter.label",
      narrativeKey: "core.message.level3.power.hunter.narrative",
    },
    guardian: {
      power: { kind: "call", chargeSeconds: 0.4, radius: 46 },
      labelKey: "core.message.level3.power.guardian.label",
      narrativeKey: "core.message.level3.power.guardian.narrative",
    },
    mayor: {
      power: {
        kind: "drone",
        chargeSeconds: 0.4,
        hoverSeconds: 2.2,
        liftSpeed: 62,
      },
      labelKey: "core.message.level3.power.mayor.label",
      narrativeKey: "core.message.level3.power.mayor.narrative",
    },
  },
});

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
    // Every role's power carries its own button label and narrative line, so a
    // missing one is a build error like any other level text.
    ...Object.values(config.powersByRole ?? {}).flatMap((entry) => [
      entry.labelKey,
      entry.narrativeKey,
    ]),
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
  "core.level.varano-superstar": {
    configId: "core.level-config.superstar-3",
    config: superstarLevelConfig,
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

/**
 * Every registered level with its configuration, so invariants can be asserted
 * over all of them at once instead of level by level.
 */
export const registeredLevels: readonly {
  readonly levelId: string;
  readonly configId: string;
  readonly config: PlatformerViewConfig;
}[] = Object.entries(levelConfigs).map(([levelId, entry]) => ({
  levelId,
  configId: entry.configId,
  config: entry.config,
}));

/**
 * The accessible name of the superpower a level grants to a role, or undefined
 * when that level grants none. The briefing card shows it before playing.
 */
export function levelPowerLabelKey(
  levelId: string,
  configId: string,
  role: Role,
): MessageKey | undefined {
  const entry = registeredLevels.find(
    (level) => level.levelId === levelId && level.configId === configId,
  );
  return entry?.config.powersByRole?.[role]?.labelKey;
}

export interface MountRegisteredLevelOptions {
  readonly host: HTMLElement;
  readonly node: LevelNode;
  readonly role: Role;
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

  // Role gating happens here, so the pure model only ever sees one power and
  // stays testable without a role (ADR-031).
  const registered: PlatformerViewConfig = entry.config;
  const granted = registered.powersByRole?.[options.role];
  const config: PlatformerViewConfig =
    granted === undefined
      ? registered
      : { ...registered, power: granted.power };

  return platformerMiniGame.mount(options.host, {
    levelId: options.node.levelId,
    configId: options.node.configId,
    config,
    role: options.role,
    settings: options.settings,
    message: options.message,
    audio: options.audio,
    onComplete: options.onComplete,
    onExit: options.onExit,
  });
}
