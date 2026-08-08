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
    // The earned clue's perch (ADR-044): one of the three asks for a climb.
    { x: 2560, y: 68, width: 56 },
  ],
  pickups: [
    { id: "photo", x: 668, y: 66 },
    { id: "trace", x: 1910, y: 64 },
    { id: "water", x: 2588, y: 36 },
  ],
  checkpoints: [
    { id: "checkpoint-1", x: 990 },
    { id: "checkpoint-2", x: 2245 },
  ],
  finishX: 3080,
  cameo: {
    x: 1530,
    y: 100,
    kind: "tail",
    narrativeKey: "core.message.level.narrative.cameo",
  },
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
    // The earned clue's perch (ADR-044), above the two-step climb.
    { x: 2088, y: 62, width: 56 },
    { x: 2660, y: 100, width: 84 },
    { x: 2900, y: 112, width: 70 },
  ],
  pickups: [
    { id: "screenshot", x: 780, y: 72 },
    { id: "vocale", x: 1450, y: 68 },
    { id: "numero", x: 2116, y: 30 },
  ],
  checkpoints: [
    { id: "chat-checkpoint-1", x: 1240 },
    { id: "chat-checkpoint-2", x: 2500 },
  ],
  finishX: 3480,
  music: "chats",
  cameo: {
    x: 1620,
    y: 112,
    kind: "eyes",
    narrativeKey: "core.message.level2.narrative.cameo",
  },
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
 * «La zona interdetta» (ADR-045), third in story order: the sealed ditches
 * the same night as the photo. No ★ yet — the powers stay a level-3 debut —
 * but the level 2 sprint is available as comfort, and every water gap stays
 * within the reach of a plain jump.
 */
export const zonaLevelConfig = defineLevel({
  worldWidth: 3700,
  sprint: {
    holdSeconds: 0.9,
    maxSpeed: 235,
    acceleration: 620,
  },
  groundSegments: [
    // The gaps are the irrigation ditches, drawn as water (ADR-036).
    { x: 0, width: 540 },
    { x: 620, width: 640 },
    { x: 1345, width: 760 },
    { x: 2185, width: 1515 },
  ],
  platforms: [
    // Set piece 1: the ordinance ledge, then the crates over the first cage.
    // The crates end 140px before the ditch: even a sprinting walk-off lands
    // on the bank, never in the water.
    { x: 180, y: 118, width: 70 },
    { x: 280, y: 110, width: 120 },
    // Rhythm steps along the first ditch.
    { x: 700, y: 118, width: 64 },
    { x: 800, y: 112, width: 60 },
    { x: 1060, y: 118, width: 70 },
    // Set piece 2: the walkway over the search drone.
    { x: 1660, y: 110, width: 120 },
    // Set piece 3: crates over the Brigade operators, well clear of the
    // third ditch: a sprinting walk-off still lands on the bank.
    { x: 1820, y: 118, width: 70 },
    { x: 1900, y: 118, width: 70 },
    // Set piece 4: the second cage, with its untouched bait alongside.
    { x: 2280, y: 110, width: 120 },
    // The footprint's perch (ADR-044): the earned clue asks for a climb.
    { x: 2960, y: 112, width: 70 },
    { x: 3050, y: 84, width: 60 },
  ],
  obstacles: [
    {
      id: "gabbia-1",
      kind: "drone",
      x: 320,
      y: 124,
      width: 30,
      height: 26,
    },
    {
      id: "drone-ricerca",
      kind: "drone",
      x: 1700,
      y: 124,
      width: 30,
      height: 26,
    },
    {
      id: "operatore-1",
      kind: "onlooker",
      x: 1840,
      y: 128,
      width: 22,
      height: 26,
    },
    {
      id: "operatore-2",
      kind: "onlooker",
      x: 1920,
      y: 128,
      width: 22,
      height: 26,
    },
    {
      id: "gabbia-2",
      kind: "drone",
      x: 2320,
      y: 124,
      width: 30,
      height: 26,
    },
  ],
  obstacleLooks: { "gabbia-1": "cage", "gabbia-2": "cage" },
  // The floating walkway ferries across the second ditch (ADR-044); the gap
  // stays jumpable on its own.
  movingPlatforms: [
    {
      id: "passerella",
      x: 1260,
      y: 158,
      width: 40,
      axis: "x",
      range: 45,
      speed: 28,
    },
  ],
  pickups: [
    { id: "ordinanza", x: 215, y: 86 },
    { id: "esca", x: 2340, y: 78 },
    { id: "impronta", x: 3078, y: 52 },
  ],
  checkpoints: [
    { id: "zona-checkpoint-1", x: 640 },
    { id: "zona-checkpoint-2", x: 1400 },
    { id: "zona-checkpoint-3", x: 2200 },
  ],
  finishX: 3580,
  gapKind: "water",
  music: "redzone",
  cameo: {
    x: 1302,
    y: 158,
    kind: "eyes",
    narrativeKey: "core.message.zona.narrative.cameo",
  },
  // Deep night, an hour after the photo: the darkest sky of the game, the
  // reed beds of the ditches up close.
  backdrop: {
    sky: ["#060913", "#0b1428", "#142440"],
    night: true,
    far: "hills",
    near: "reeds",
  },
  objectiveKey: "core.message.zona.objective",
  controlsKey: "core.message.zona.controls",
  statusKeys: [
    "core.message.zona.status.0",
    "core.message.zona.status.1",
    "core.message.zona.status.2",
    "core.message.zona.status.3",
  ],
  finishStatusKey: "core.message.zona.status.3",
  narrativeStartKey: "core.message.zona.narrative.start",
  narrativePickupKeys: {
    ordinanza: "core.message.zona.narrative.pickup.ordinanza",
    esca: "core.message.zona.narrative.pickup.esca",
    impronta: "core.message.zona.narrative.pickup.impronta",
  },
  narrativeCheckpointKey: "core.message.zona.narrative.checkpoint",
  narrativeRespawnKey: "core.message.zona.narrative.respawn",
  narrativeFinishKey: "core.message.zona.narrative.finish",
  narrativeSprintKey: "core.message.zona.narrative.sprint",
});

/**
 * «Tre identità» (ADR-045), fourth in story order: the versions laboratory,
 * the warehouse where the town manufactures its three species overnight. An
 * interior (like the castle keep) whose doorway reopens on the night sky
 * toward the hills. No quiz and no ★: the question lives in the interlude,
 * the powers stay a level-5 debut in story order.
 */
export const labLevelConfig = defineLevel({
  worldWidth: 3800,
  sprint: {
    holdSeconds: 0.9,
    maxSpeed: 235,
    acceleration: 620,
  },
  groundSegments: [
    // The gaps are the loading pits of the warehouse floor.
    { x: 0, width: 600 },
    { x: 680, width: 760 },
    { x: 1520, width: 900 },
    { x: 2500, width: 1300 },
  ],
  platforms: [
    // Set piece 1: the plaster-cast ledge under the first species sign, then
    // the crates over the night technician.
    { x: 315, y: 118, width: 70 },
    { x: 400, y: 118, width: 70 },
    // Steps into the projector cables, tripods above them.
    { x: 760, y: 118, width: 64 },
    { x: 900, y: 112, width: 60 },
    { x: 1030, y: 112, width: 60 },
    { x: 1150, y: 112, width: 60 },
    { x: 1250, y: 112, width: 60 },
    // Set piece 2: the shelving over the inventory drone, the crates over
    // the second technician, and the scales' ledge.
    { x: 1660, y: 110, width: 120 },
    { x: 1880, y: 118, width: 70 },
    { x: 2015, y: 110, width: 80 },
    // Set piece 3: tripods over the second cable run.
    { x: 2590, y: 112, width: 60 },
    { x: 2700, y: 112, width: 60 },
    // The CERTA sign's perch (ADR-044): the earned clue asks for a climb.
    { x: 3020, y: 112, width: 70 },
    { x: 3110, y: 84, width: 60 },
  ],
  obstacles: [
    {
      id: "tecnico-1",
      kind: "onlooker",
      x: 420,
      y: 128,
      width: 22,
      height: 26,
    },
    {
      id: "cavi-lab-1",
      kind: "cables",
      x: 1000,
      y: 134,
      width: 300,
      height: 20,
    },
    {
      id: "drone-inventario",
      kind: "drone",
      x: 1700,
      y: 124,
      width: 30,
      height: 26,
    },
    {
      id: "tecnico-2",
      kind: "onlooker",
      x: 1900,
      y: 128,
      width: 22,
      height: 26,
    },
    {
      id: "cavi-lab-2",
      kind: "cables",
      x: 2560,
      y: 134,
      width: 260,
      height: 20,
    },
  ],
  // The specimen conveyor shuttles across the second loading pit (ADR-044);
  // the pit stays jumpable on its own.
  movingPlatforms: [
    {
      id: "nastro",
      x: 1440,
      y: 158,
      width: 40,
      axis: "x",
      range: 40,
      speed: 26,
    },
  ],
  pickups: [
    { id: "calco", x: 350, y: 86 },
    { id: "bilancia", x: 2050, y: 78 },
    { id: "cartello", x: 3138, y: 52 },
  ],
  checkpoints: [
    { id: "lab-checkpoint-1", x: 700 },
    { id: "lab-checkpoint-2", x: 1550 },
    { id: "lab-checkpoint-3", x: 2520 },
  ],
  finishX: 3680,
  music: "lab",
  groundKind: "stone",
  platformKind: "stone",
  cameo: {
    x: 2300,
    y: 100,
    kind: "tail",
    narrativeKey: "core.message.lab.narrative.cameo",
  },
  // The second interior of the game (ADR-039 mechanics): warehouse greys
  // under the lamps, until the doorway at 3320 reopens on the night sky
  // toward the hills.
  backdrop: {
    sky: ["#1d2422", "#2b3530", "#3c4a42"],
    night: true,
    indoor: {
      skyFromX: 3320,
      sky: ["#0b1531", "#16294e", "#213c63"],
    },
    far: "arches",
    near: "torches",
  },
  objectiveKey: "core.message.lab.objective",
  controlsKey: "core.message.lab.controls",
  statusKeys: [
    "core.message.lab.status.0",
    "core.message.lab.status.1",
    "core.message.lab.status.2",
    "core.message.lab.status.3",
  ],
  finishStatusKey: "core.message.lab.status.3",
  narrativeStartKey: "core.message.lab.narrative.start",
  narrativePickupKeys: {
    calco: "core.message.lab.narrative.pickup.calco",
    bilancia: "core.message.lab.narrative.pickup.bilancia",
    cartello: "core.message.lab.narrative.pickup.cartello",
  },
  narrativeCheckpointKey: "core.message.lab.narrative.checkpoint",
  narrativeRespawnKey: "core.message.lab.narrative.respawn",
  narrativeFinishKey: "core.message.lab.narrative.finish",
  narrativeSprintKey: "core.message.lab.narrative.sprint",
});

/**
 * «Acqua e impronte» (ADR-045), fifth in story order and the first of the Six
 * Hills: the ditches and the poplar rows on the way up, at the hour when the
 * sky starts to thin. The drone keeps finding warm shapes and they keep being
 * nutrias — six of them, and none is the Conte. Its interlude grants the first
 * two seals, so the level itself stays what every level is: a walk with three
 * clues on it. No ★: the powers are still a level-8 debut in story order.
 */
export const acquaLevelConfig = defineLevel({
  worldWidth: 3900,
  sprint: {
    holdSeconds: 0.9,
    maxSpeed: 235,
    acceleration: 620,
  },
  groundSegments: [
    // Three ditches, drawn as water (ADR-036), all inside a plain jump.
    { x: 0, width: 580 },
    { x: 668, width: 712 },
    { x: 1470, width: 830 },
    { x: 2385, width: 1515 },
  ],
  platforms: [
    // Set piece 1: the near bank, where the thermal photo was taken. The
    // climb ends 260px short of the first ditch, so even a sprinting walk-off
    // lands on the bank.
    { x: 150, y: 118, width: 70 },
    { x: 250, y: 92, width: 66 },
    // Set piece 2: the pole with the sack the wind keeps moving.
    { x: 720, y: 118, width: 64 },
    { x: 830, y: 110, width: 70 },
    // Set piece 3: the walkway over the thermal drone.
    { x: 1150, y: 110, width: 110 },
    // Rhythm steps after the raft's ditch.
    { x: 1560, y: 118, width: 64 },
    { x: 1680, y: 108, width: 60 },
    // Set piece 4: the boards over the nutria colony.
    { x: 1790, y: 112, width: 100 },
    { x: 1898, y: 104, width: 62 },
    // Set piece 5: the earned clue (ADR-044) asks for the level's one real
    // climb — three steps up the sluice, the highest perch of the long night.
    { x: 2480, y: 118, width: 70 },
    { x: 2570, y: 92, width: 64 },
    { x: 2660, y: 66, width: 56 },
  ],
  obstacles: [
    {
      id: "nutria-1",
      kind: "onlooker",
      x: 170,
      y: 128,
      width: 22,
      height: 26,
    },
    {
      id: "nutria-2",
      kind: "onlooker",
      x: 265,
      y: 128,
      width: 22,
      height: 26,
    },
    {
      id: "nutria-3",
      kind: "onlooker",
      x: 840,
      y: 128,
      width: 22,
      height: 26,
    },
    {
      id: "drone-termico",
      kind: "drone",
      x: 1180,
      y: 124,
      width: 30,
      height: 26,
    },
    {
      id: "nutria-4",
      kind: "onlooker",
      x: 1810,
      y: 128,
      width: 22,
      height: 26,
    },
    {
      id: "nutria-5",
      kind: "onlooker",
      x: 1860,
      y: 128,
      width: 22,
      height: 26,
    },
    {
      id: "nutria-6",
      kind: "onlooker",
      x: 1910,
      y: 128,
      width: 22,
      height: 26,
    },
  ],
  // Six warm shapes, six nutrias (ADR-045). The seventh creature the drone
  // keeps counting is Toni, and nobody has told him.
  obstacleLooks: {
    "nutria-1": "nutria",
    "nutria-2": "nutria",
    "nutria-3": "nutria",
    "nutria-4": "nutria",
    "nutria-5": "nutria",
    "nutria-6": "nutria",
  },
  // The raft crosses the second ditch, which stays jumpable on its own.
  movingPlatforms: [
    {
      id: "zattera",
      x: 1385,
      y: 158,
      width: 42,
      axis: "x",
      range: 42,
      speed: 24,
    },
  ],
  pickups: [
    { id: "foto", x: 283, y: 66 },
    { id: "sacco", x: 865, y: 78 },
    { id: "coda", x: 2688, y: 40 },
  ],
  checkpoints: [
    { id: "acqua-checkpoint-1", x: 700 },
    { id: "acqua-checkpoint-2", x: 1500 },
    { id: "acqua-checkpoint-3", x: 2420 },
  ],
  finishX: 3780,
  gapKind: "water",
  music: "hills",
  cameo: {
    x: 2342,
    y: 150,
    kind: "tail",
    narrativeKey: "core.message.acqua.narrative.cameo",
  },
  // Around four: still night, but the top of the sky has started to let go.
  // Poplar rows instead of the reed beds of the sealed zone.
  backdrop: {
    sky: ["#0d1a2e", "#1b3050", "#33506b"],
    night: true,
    far: "hills",
    near: "poplars",
  },
  objectiveKey: "core.message.acqua.objective",
  controlsKey: "core.message.acqua.controls",
  statusKeys: [
    "core.message.acqua.status.0",
    "core.message.acqua.status.1",
    "core.message.acqua.status.2",
    "core.message.acqua.status.3",
  ],
  finishStatusKey: "core.message.acqua.status.3",
  narrativeStartKey: "core.message.acqua.narrative.start",
  narrativePickupKeys: {
    foto: "core.message.acqua.narrative.pickup.foto",
    sacco: "core.message.acqua.narrative.pickup.sacco",
    coda: "core.message.acqua.narrative.pickup.coda",
  },
  narrativeCheckpointKey: "core.message.acqua.narrative.checkpoint",
  narrativeRespawnKey: "core.message.acqua.narrative.respawn",
  narrativeFinishKey: "core.message.acqua.narrative.finish",
  narrativeSprintKey: "core.message.acqua.narrative.sprint",
});

/**
 * «Il borgo delle versioni» (ADR-045), sixth in story order: the upper
 * village at night, awake behind its windows, with Ada's investigative
 * clothesline strung across the backdrop. Built against the "every level is
 * ditches and jumps" complaint (owner playtest note): the level is a choice
 * of routes — the street through the curiosi in dressing gowns, or the
 * rooftop line above them — plus the game's tallest climb so far and the
 * laundry basket on its pulley, the first vertical ride outside the castle.
 * The alleys are plain drops, not water: two water levels in a row already.
 */
export const borgoLevelConfig = defineLevel({
  worldWidth: 3800,
  sprint: {
    holdSeconds: 0.9,
    maxSpeed: 235,
    acceleration: 620,
  },
  groundSegments: [
    // Three alleys between the housefronts, all inside a plain jump.
    { x: 0, width: 700 },
    { x: 780, width: 910 },
    { x: 1770, width: 680 },
    { x: 2530, width: 1270 },
  ],
  platforms: [
    // Set piece 1: the first rooftop line. Street or roofs — the curiosi
    // below nudge (or get barged at full sprint), the roofs cost two jumps.
    { x: 180, y: 118, width: 70 },
    { x: 290, y: 96, width: 120 },
    { x: 430, y: 96, width: 110 },
    // Set piece 3: the second rooftop, over the one curioso who never sleeps.
    { x: 1180, y: 112, width: 90 },
    { x: 1300, y: 92, width: 100 },
    // Set piece 4: boards over the piazza, where the dressing gowns gather.
    { x: 1830, y: 112, width: 100 },
    { x: 1940, y: 104, width: 80 },
    // Set piece 5: the pulley courtyard — the tallest climb of the game so
    // far, three steps up to the meme's perch, with the basket alongside.
    { x: 2620, y: 118, width: 64 },
    { x: 2720, y: 88, width: 64 },
    { x: 2820, y: 56, width: 64 },
    // The last balcony before the finish.
    { x: 3230, y: 112, width: 90 },
  ],
  obstacles: [
    {
      id: "curioso-1",
      kind: "onlooker",
      x: 300,
      y: 128,
      width: 22,
      height: 26,
    },
    {
      id: "curioso-2",
      kind: "onlooker",
      x: 460,
      y: 128,
      width: 22,
      height: 26,
    },
    // Set piece 2: Ada's threads with the clippings, low across the street.
    // Cables kill the sprint (ADR-039): under the investigation, no barging.
    {
      id: "fili-ritagli",
      kind: "cables",
      x: 900,
      y: 134,
      width: 280,
      height: 20,
    },
    {
      id: "curioso-3",
      kind: "onlooker",
      x: 1320,
      y: 128,
      width: 22,
      height: 26,
    },
    {
      id: "vestaglia-1",
      kind: "onlooker",
      x: 1850,
      y: 128,
      width: 22,
      height: 26,
    },
    {
      id: "vestaglia-2",
      kind: "onlooker",
      x: 1900,
      y: 128,
      width: 22,
      height: 26,
    },
    {
      id: "vestaglia-3",
      kind: "onlooker",
      x: 1950,
      y: 128,
      width: 22,
      height: 26,
    },
    {
      id: "nottambulo",
      kind: "onlooker",
      x: 3250,
      y: 128,
      width: 22,
      height: 26,
    },
  ],
  // The laundry basket on its pulley (ADR-044): the scenic lift up to the
  // meme's perch. The three-step climb beside it keeps it optional.
  movingPlatforms: [
    {
      id: "cesta",
      x: 2904,
      y: 56,
      width: 40,
      axis: "y",
      range: 64,
      speed: 22,
    },
  ],
  pickups: [
    { id: "ritaglio", x: 340, y: 64 },
    { id: "filo", x: 1340, y: 60 },
    { id: "meme", x: 2850, y: 26 },
  ],
  checkpoints: [
    { id: "borgo-checkpoint-1", x: 820 },
    { id: "borgo-checkpoint-2", x: 1800 },
    { id: "borgo-checkpoint-3", x: 2560 },
  ],
  finishX: 3680,
  music: "versions",
  cameo: {
    x: 1120,
    y: 126,
    kind: "tail",
    narrativeKey: "core.message.borgo.narrative.cameo",
  },
  // Around five: a violet night with warm windows, nothing like the blue of
  // the ditches an hour earlier. Rooftops far, the clothesline up close.
  backdrop: {
    sky: ["#151226", "#241d44", "#3a2f63"],
    night: true,
    far: "rooftops",
    near: "laundry",
  },
  objectiveKey: "core.message.borgo.objective",
  controlsKey: "core.message.borgo.controls",
  statusKeys: [
    "core.message.borgo.status.0",
    "core.message.borgo.status.1",
    "core.message.borgo.status.2",
    "core.message.borgo.status.3",
  ],
  finishStatusKey: "core.message.borgo.status.3",
  narrativeStartKey: "core.message.borgo.narrative.start",
  narrativePickupKeys: {
    ritaglio: "core.message.borgo.narrative.pickup.ritaglio",
    filo: "core.message.borgo.narrative.pickup.filo",
    meme: "core.message.borgo.narrative.pickup.meme",
  },
  narrativeCheckpointKey: "core.message.borgo.narrative.checkpoint",
  narrativeRespawnKey: "core.message.borgo.narrative.respawn",
  narrativeFinishKey: "core.message.borgo.narrative.finish",
  narrativeSprintKey: "core.message.borgo.narrative.sprint",
});

/**
 * The four role superpowers (ADR-031). One tuning, shared by every level that
 * grants them: a player who learned a power keeps exactly that power, and the
 * copy belongs to the role, not to a level (ADR-036).
 */
export const roleSuperpowers = {
  varano: {
    power: {
      kind: "sprint",
      chargeSeconds: 0.4,
      maxSpeed: 235,
      acceleration: 620,
    },
    labelKey: "core.message.power.varano.label",
    narrativeKey: "core.message.power.varano.narrative",
  },
  hunter: {
    power: { kind: "scent", chargeSeconds: 0.4, radius: 52 },
    labelKey: "core.message.power.hunter.label",
    narrativeKey: "core.message.power.hunter.narrative",
  },
  guardian: {
    power: { kind: "call", chargeSeconds: 0.4, radius: 46 },
    labelKey: "core.message.power.guardian.label",
    narrativeKey: "core.message.power.guardian.narrative",
  },
  mayor: {
    power: {
      kind: "drone",
      chargeSeconds: 0.4,
      hoverSeconds: 2.2,
      liftSpeed: 62,
    },
    labelKey: "core.message.power.mayor.label",
    narrativeKey: "core.message.power.mayor.narrative",
  },
} as const;

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
  music: "fanfare",
  bonus: { id: "stella-superstar", x: 2570, y: 88 },
  cameo: {
    x: 2790,
    y: 100,
    kind: "tail",
    narrativeKey: "core.message.level3.narrative.cameo",
  },
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
  powersByRole: roleSuperpowers,
});

/**
 * Level 4, the castle park (ADR-036). Same guarantees as level 3 — every gap
 * within a plain jump, a platform route above every blocking obstacle — with
 * the moat as water: falling in is the ordinary ADR-035 fall, drawn wet.
 */
export const parcoLevelConfig = defineLevel({
  worldWidth: 4000,
  groundSegments: [
    { x: 0, width: 560 },
    { x: 645, width: 660 },
    { x: 1390, width: 810 },
    { x: 2288, width: 1712 },
  ],
  platforms: [
    // Set piece 1: statues over the queue at the gates.
    { x: 770, y: 118, width: 70 },
    { x: 865, y: 118, width: 70 },
    // Set piece 2: the pop-up bookshop crowd, crossed on the pergola tops.
    { x: 1540, y: 116, width: 70 },
    { x: 1630, y: 116, width: 70 },
    // The service door ledge.
    { x: 1900, y: 112, width: 80 },
    // Set piece 3: the kiosk roof, over the low-flying drone. At y=110 it sits
    // 44px above the floor, inside the 48.8px reach of a plain jump.
    { x: 2560, y: 110, width: 120 },
    // A viewpoint terrace before the keep.
    { x: 3100, y: 118, width: 140 },
  ],
  obstacles: [
    { id: "ressa-1", kind: "onlooker", x: 780, y: 128, width: 22, height: 26 },
    { id: "ressa-2", kind: "onlooker", x: 880, y: 128, width: 22, height: 26 },
    { id: "ressa-3", kind: "onlooker", x: 1560, y: 128, width: 22, height: 26 },
    { id: "ressa-4", kind: "onlooker", x: 1650, y: 128, width: 22, height: 26 },
    {
      id: "drone-basso",
      kind: "drone",
      x: 2600,
      y: 124,
      width: 30,
      height: 26,
    },
  ],
  // The gadget van shuttles along the last stretch (ADR-037). Its patrol stays
  // clear of the kiosk roof (ends at 2680) and passes under the terrace at
  // 3100/y118, so there is always a place to stand and let it go by.
  cars: [
    {
      id: "furgoncino-gadget",
      minX: 2750,
      maxX: 3324,
      width: 36,
      height: 20,
      speed: 55,
    },
  ],
  pickups: [
    { id: "badge", x: 800, y: 86 },
    { id: "porta", x: 1930, y: 78 },
    // The earned clue (ADR-044): right in the gadget van's patrol stretch.
    { id: "squame", x: 3050, y: 122 },
  ],
  checkpoints: [
    { id: "parco-checkpoint-1", x: 1420 },
    { id: "parco-checkpoint-2", x: 2310 },
  ],
  finishX: 3880,
  finishKind: "walls",
  gapKind: "water",
  music: "sunset",
  // The raft ferries across the third stretch of the moat (ADR-044); the gap
  // stays jumpable on its own, the raft is the scenic route.
  movingPlatforms: [
    {
      id: "zattera",
      x: 2200,
      y: 158,
      width: 40,
      axis: "x",
      range: 48,
      speed: 30,
    },
  ],
  bonus: { id: "stella-parco", x: 2620, y: 88 },
  cameo: {
    x: 1345,
    y: 158,
    kind: "eyes",
    narrativeKey: "core.message.level4.narrative.cameo",
  },
  // Late golden afternoon of opening day, the castle now looming.
  backdrop: {
    sky: ["#2e4a72", "#c4763f", "#e8b25c"],
    night: false,
    far: "castle",
    near: "hedges",
  },
  objectiveKey: "core.message.level4.objective",
  controlsKey: "core.message.level4.controls",
  statusKeys: [
    "core.message.level4.status.0",
    "core.message.level4.status.1",
    "core.message.level4.status.2",
    "core.message.level4.status.3",
  ],
  finishStatusKey: "core.message.level4.status.3",
  narrativeStartKey: "core.message.level4.narrative.start",
  narrativePickupKeys: {
    badge: "core.message.level4.narrative.pickup.badge",
    porta: "core.message.level4.narrative.pickup.porta",
    squame: "core.message.level4.narrative.pickup.squame",
  },
  narrativeCheckpointKey: "core.message.level4.narrative.checkpoint",
  narrativeRespawnKey: "core.message.level4.narrative.respawn",
  narrativeCarHitKey: "core.message.level4.narrative.car",
  narrativeFinishKey: "core.message.level4.narrative.finish",
  powersByRole: roleSuperpowers,
});

/**
 * Level 5, the climb inside the castle (ADR-039). The only level with no sky:
 * stone, torches and Pina's AI decoys — inflatable varani the AI got wrong,
 * watch drones, a patrol robot on the gadget van's mechanics (ADR-037). The
 * sky returns only past the tower doorway, out on the roof. Same guarantees
 * as levels 3-4: every gap within a plain jump, a platform route above every
 * blocking obstacle, finishable by every role without ever touching ★.
 */
export const castelloLevelConfig = defineLevel({
  worldWidth: 4200,
  groundSegments: [
    // The stairwell voids between segments are the level's gaps (ADR-035).
    { x: 0, width: 620 },
    { x: 700, width: 640 },
    { x: 1420, width: 860 },
    { x: 2360, width: 1840 },
  ],
  platforms: [
    // Set piece 1: the entrance hall — the ledger ledge, then the guided
    // tour's crates over the half-lowered portcullis. The last stretch before
    // the first stairwell stays clear, like in every level.
    { x: 180, y: 118, width: 70 },
    { x: 340, y: 110, width: 120 },
    // Set piece 2: the grand staircase, with a gallery over the watch drone.
    { x: 760, y: 118, width: 64 },
    { x: 870, y: 112, width: 60 },
    { x: 970, y: 110, width: 120 },
    { x: 1150, y: 118, width: 70 },
    // Set piece 3: the exhibition halls — tripods over the projector cables,
    // crates over the inflatable decoys, the ledge by the open safe.
    { x: 1530, y: 112, width: 60 },
    { x: 1650, y: 112, width: 60 },
    { x: 1770, y: 112, width: 60 },
    { x: 1880, y: 118, width: 70 },
    { x: 1970, y: 118, width: 70 },
    { x: 2070, y: 114, width: 70 },
    // Set piece 4: the long corridor — the window seat inside the robot's
    // patrol, so waiting it out is always an option (ADR-037).
    { x: 2650, y: 118, width: 120 },
    { x: 3040, y: 118, width: 70 },
    // The tower: the phone ledge and the landing over the last watch drone.
    { x: 3200, y: 112, width: 70 },
    { x: 3360, y: 110, width: 120 },
    // The roof, under the open sky again.
    { x: 3700, y: 118, width: 70 },
    { x: 3850, y: 118, width: 70 },
  ],
  obstacles: [
    {
      id: "saracinesca",
      kind: "drone",
      x: 380,
      y: 124,
      width: 30,
      height: 26,
    },
    {
      id: "drone-scalone",
      kind: "drone",
      x: 1010,
      y: 124,
      width: 30,
      height: 26,
    },
    {
      id: "cavi-proiettori",
      kind: "cables",
      x: 1500,
      y: 134,
      width: 320,
      height: 20,
    },
    {
      id: "gonfiabile-1",
      kind: "onlooker",
      x: 1900,
      y: 128,
      width: 22,
      height: 26,
    },
    {
      id: "gonfiabile-2",
      kind: "onlooker",
      x: 1990,
      y: 128,
      width: 22,
      height: 26,
    },
    {
      id: "gonfiabile-3",
      kind: "onlooker",
      x: 3060,
      y: 128,
      width: 22,
      height: 26,
    },
    {
      id: "drone-torre",
      kind: "drone",
      x: 3400,
      y: 124,
      width: 30,
      height: 26,
    },
  ],
  // The patrol robot shuttles along the corridor (ADR-037 mechanics, ADR-039
  // costume): always jumpable, with the window seat at 2650/y118 inside its
  // range, and it stops well short of the tower and the finish.
  cars: [
    {
      id: "robot-pattuglia",
      minX: 2450,
      maxX: 2950,
      width: 30,
      // Low and flat, like the cleaning robot it is: a plain jump clears it
      // with margin even against its own approach speed.
      height: 14,
      speed: 55,
    },
  ],
  obstacleLooks: {
    saracinesca: "portcullis",
    "gonfiabile-1": "fake-varano",
    "gonfiabile-2": "fake-varano",
    "gonfiabile-3": "fake-varano",
  },
  carLooks: { "robot-pattuglia": "robot" },
  pickups: [
    { id: "registro", x: 215, y: 86 },
    { id: "bozza", x: 2105, y: 82 },
    { id: "telefono", x: 3235, y: 80 },
  ],
  checkpoints: [
    { id: "castello-checkpoint-1", x: 1180 },
    { id: "castello-checkpoint-2", x: 2200 },
    { id: "castello-checkpoint-3", x: 2390 },
  ],
  finishX: 4080,
  finishKind: "sunstone",
  music: "keep",
  // The dumbwaiter rides over the second stairwell (ADR-044); the gap stays
  // jumpable on its own.
  movingPlatforms: [
    {
      id: "montacarichi",
      x: 1345,
      y: 110,
      width: 70,
      axis: "y",
      range: 34,
      speed: 28,
    },
  ],
  bonus: { id: "stella-castello", x: 2710, y: 94 },
  cameo: {
    x: 1200,
    y: 76,
    kind: "eyes",
    narrativeKey: "core.message.level5.narrative.cameo",
  },
  groundKind: "stone",
  platformKind: "stone",
  // The one level without a sky (ADR-039): stone vaults until the doorway at
  // 3600, then the 2:39 night of the following day — the sky the story
  // started under, seen again from the top.
  backdrop: {
    sky: ["#211d2b", "#322d3c", "#443f4e"],
    night: true,
    indoor: {
      skyFromX: 3600,
      sky: ["#0a1233", "#142a52", "#1f3d66"],
    },
    far: "arches",
    near: "torches",
  },
  objectiveKey: "core.message.level5.objective",
  controlsKey: "core.message.level5.controls",
  statusKeys: [
    "core.message.level5.status.0",
    "core.message.level5.status.1",
    "core.message.level5.status.2",
    "core.message.level5.status.3",
  ],
  finishStatusKey: "core.message.level5.status.3",
  narrativeStartKey: "core.message.level5.narrative.start",
  narrativePickupKeys: {
    registro: "core.message.level5.narrative.pickup.registro",
    bozza: "core.message.level5.narrative.pickup.bozza",
    telefono: "core.message.level5.narrative.pickup.telefono",
  },
  narrativeCheckpointKey: "core.message.level5.narrative.checkpoint",
  narrativeRespawnKey: "core.message.level5.narrative.respawn",
  narrativeCarHitKey: "core.message.level5.narrative.robot",
  narrativeFinishKey: "core.message.level5.narrative.finish",
  powersByRole: roleSuperpowers,
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
    ...(config.narrativeCarHitKey === undefined
      ? []
      : [config.narrativeCarHitKey]),
    ...(config.cameo === undefined ? [] : [config.cameo.narrativeKey]),
    // The legend star's line is shared chrome, validated where it is used.
    ...(config.bonus === undefined ? [] : ["core.message.level.bonus"]),
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
  "core.level.parco-del-castello": {
    configId: "core.level-config.parco-4",
    config: parcoLevelConfig,
  },
  "core.level.dentro-il-castello": {
    configId: "core.level-config.castello-5",
    config: castelloLevelConfig,
  },
  "core.level.zona-interdetta": {
    configId: "core.level-config.zona-6",
    config: zonaLevelConfig,
  },
  "core.level.tre-identita": {
    configId: "core.level-config.lab-7",
    config: labLevelConfig,
  },
  "core.level.acqua-e-impronte": {
    configId: "core.level-config.acqua-8",
    config: acquaLevelConfig,
  },
  "core.level.borgo-delle-versioni": {
    configId: "core.level-config.borgo-9",
    config: borgoLevelConfig,
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
  /** The level's place in the campaign, shown next to the lives (ADR-045). */
  readonly position?: { readonly index: number; readonly total: number };
  readonly settings: AccessibilitySettings;
  readonly message: (
    key: MessageKey,
    values?: Readonly<Record<string, string | number>>,
  ) => string;
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
    ...(options.position === undefined ? {} : { position: options.position }),
    settings: options.settings,
    message: options.message,
    audio: options.audio,
    onComplete: options.onComplete,
    onExit: options.onExit,
  });
}
