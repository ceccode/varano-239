import type { MessageKey, Role } from "../../core/model";
import type { LevelOutcome, MiniGameHandle, MiniGamePort } from "../contract";
import {
  cameraX,
  carDirectionAt,
  carPositionAt,
  createPlatformerState,
  movingPlatformAt,
  stepPlatformer,
  type PlatformerConfig,
  type PlatformerEvents,
  type PlatformerState,
  type PowerConfig,
} from "../platformer-model";

/** What one role's superpower needs beyond its physics: a label and a line. */
export interface LevelPowerEntry {
  readonly power: PowerConfig;
  readonly labelKey: MessageKey;
  readonly narrativeKey: MessageKey;
}

/**
 * The parallax layers as data (ADR-033), so levels stop looking alike and the
 * time of day matches the story: 2:39 is night, a public opening is not.
 */
export interface BackdropConfig {
  /** Sky bands from the top down to the horizon. */
  readonly sky: readonly [string, string, string];
  /** Stars and moon; false paints a daytime sky. */
  readonly night: boolean;
  /**
   * The interior variant (ADR-039): the sky bands read as stone and no star,
   * moon or sun is drawn. Past `skyFromX` the open sky returns — the one
   * stretch where the Varano sees it again, out on the tower roof.
   */
  readonly indoor?: {
    readonly skyFromX: number;
    /** The open sky's own bands beyond that point. */
    readonly sky: readonly [string, string, string];
  };
  readonly far: "hills" | "rooftops" | "castle" | "arches" | "none";
  readonly near:
    | "corn"
    | "hedges"
    | "crowd"
    | "torches"
    | "reeds"
    | "poplars"
    | "terraces"
    | "laundry"
    | "none";
}

/**
 * Interior costumes for obstacles (ADR-039), keyed by obstacle id: the same
 * physics as their kind, drawn as castle furniture or as one of Pina's AI
 * decoys. Purely visual, like `gapKind: "water"` (ADR-036).
 */
export type ObstacleLook = "portcullis" | "fake-varano" | "nutria" | "cage";

/** A patrol car drawn as something else: same triangle wave, new dress. */
export type CarLook = "robot";

/**
 * The Varano's cameo (ADR-044): a gentle, deterministic one-off apparition —
 * a tail or a pair of eyes — with its own narrative line. Pure presentation.
 */
export interface CameoConfig {
  readonly x: number;
  readonly y: number;
  readonly kind: "tail" | "eyes";
  readonly narrativeKey: MessageKey;
}

export interface PlatformerViewConfig extends PlatformerConfig {
  readonly objectiveKey: MessageKey;
  readonly controlsKey: MessageKey;
  readonly leftKey: MessageKey;
  readonly rightKey: MessageKey;
  readonly jumpKey: MessageKey;
  readonly statusKeys: readonly [
    MessageKey,
    MessageKey,
    MessageKey,
    MessageKey,
  ];
  readonly finishStatusKey: MessageKey;
  readonly narrativeStartKey: MessageKey;
  readonly narrativePickupKeys: Readonly<Record<string, MessageKey>>;
  readonly narrativeCheckpointKey: MessageKey;
  readonly narrativeRespawnKey: MessageKey;
  /** Only on levels with patrol cars: what the narrator says on a hit. */
  readonly narrativeCarHitKey?: MessageKey;
  readonly narrativeFinishKey: MessageKey;
  /** Only on levels that grant the sprint. */
  readonly narrativeSprintKey?: MessageKey;
  /** Only on levels that gate a superpower per role (ADR-031). */
  readonly powersByRole?: Readonly<Partial<Record<Role, LevelPowerEntry>>>;
  /** The level's own looping tune (ADR-042); the original loop when omitted. */
  readonly music?:
    | "fields"
    | "chats"
    | "redzone"
    | "lab"
    | "hills"
    | "versions"
    | "dawn"
    | "fanfare"
    | "sunset"
    | "keep";
  /** What the finish line looks like; reeds when omitted. */
  readonly finishKind?: "reeds" | "walls" | "sunstone";
  /**
   * What the gaps between ground segments look like; plain pits when omitted.
   * Purely visual: falling into water is the same fall as ADR-035, respawning
   * at the flag with every collected clue intact.
   */
  readonly gapKind?: "pit" | "water";
  /** What the ground and the platforms are made of; the fields when omitted. */
  readonly groundKind?: "grass" | "stone";
  readonly platformKind?: "hay" | "stone";
  /** Interior costumes by obstacle id (ADR-039); the kind's default otherwise. */
  readonly obstacleLooks?: Readonly<Record<string, ObstacleLook>>;
  /** Costumes by car id (ADR-039); the gadget van otherwise. */
  readonly carLooks?: Readonly<Record<string, CarLook>>;
  /** The level's one gentle apparition (ADR-044), if it has one. */
  readonly cameo?: CameoConfig;
  readonly backdrop: BackdropConfig;
}

interface MutableInput {
  left: boolean;
  right: boolean;
  jumpPressed: boolean;
  jumpHeld: boolean;
  powerHeld: boolean;
}

interface Particle {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  life: number;
  color: string;
}

const simulationStep = 1 / 120;

const palette = {
  skyTop: "#0a0f26",
  skyMid: "#10203f",
  skyHorizon: "#1c3350",
  star: "#e8ecff",
  moon: "#f2eed7",
  moonShade: "#d9d4b4",
  hillFar: "#13273156",
  hillFarSolid: "#132731",
  corn: "#0e2418",
  cornLight: "#173622",
  dirt: "#3b2a1b",
  dirtDark: "#2a1d12",
  grass: "#2f7a42",
  grassLight: "#49a35c",
  hay: "#c9973f",
  hayDark: "#8a6428",
  hayLight: "#e7c470",
  pickup: "#ffcf5a",
  pickupCore: "#fff4c4",
  pole: "#9aa4ad",
  flagIdle: "#ffcf5a",
  flagActive: "#7fe09a",
  reed: "#3f9b57",
  reedDark: "#1f5a31",
  reedHead: "#7a5230",
  poplar: "#1c4b2e",
  poplarDark: "#0f2c1a",
  poplarTrunk: "#33402f",
  terraceWall: "#8a7a63",
  terraceWallShade: "#5f523f",
  terraceGrass: "#4a6b3a",
  terraceVine: "#2f4a26",
  bodyGreen: "#57b06b",
  bodyDark: "#2f7a42",
  belly: "#8ed49b",
  eye: "#101820",
  tongue: "#e0705a",
  dust: "#c8d1c9",
  power: "#8fd0ff",
  powerRing: "#8fd0ff",
  crowd: "#b06a4a",
  crowdHead: "#e0b090",
  crowdCalm: "#4c6b57",
  cables: "#2b2f38",
  cableLine: "#565d6b",
  troupeDrone: "#cfd6e0",
  troupeDroneLight: "#ff6b6b",
  wall: "#5b5f6b",
  wallShade: "#3f434e",
  wallWindow: "#ffcf5a",
  sun: "#ffe9a8",
  cloud: "#eef4f8",
  roof: "#1b2a33",
  roofRidge: "#2b3d47",
  window: "#ffcf5a",
  hedge: "#12261a",
  hedgeLight: "#1d3b26",
  crowdFar: "#1a2230",
  crowdFarBody: "#2b3648",
  crowdFarHead: "#3d4a5c",
  castleFar: "#2a3340",
  castleFarShade: "#1b2129",
  water: "#1d4e63",
  waterLight: "#3a7d94",
  waterGlint: "#9fd4e4",
  carBody: "#c9463f",
  carShade: "#8f2f2b",
  carGlass: "#bfe0ef",
  carWheel: "#1a1d24",
  carHub: "#8b93a1",
  stoneFloor: "#4a4550",
  stoneFloorDark: "#37333f",
  stoneFloorLight: "#5d5766",
  stoneArch: "#2e2a36",
  stoneArchDark: "#231f2c",
  torchWood: "#6b4a2a",
  torchFlame: "#ffb347",
  torchFlameCore: "#ffe08a",
  portcullis: "#3a3f4a",
  portcullisLight: "#596170",
  fakeVarano: "#63c96f",
  fakeVaranoSeam: "#2f7a42",
  fakeVaranoDeflated: "#3d7a46",
  robotBody: "#9aa4b5",
  robotShade: "#6b7484",
  robotEye: "#ff6b6b",
  sunstone: "#e0b25c",
  sunstoneLight: "#f4d492",
} as const;

function createElement<K extends keyof HTMLElementTagNameMap>(
  document: Document,
  tagName: K,
  className: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tagName);
  node.className = className;
  return node;
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    // `summary` opens the menu's sections with Space; a dialog owns its own
    // keys entirely (ADR-050).
    target.closest(
      "button, a, input, select, textarea, summary, [role='dialog']",
    ) !== null
  );
}

type InputAction = "left" | "right" | "jump" | "power";

function keyDirection(key: string): InputAction | undefined {
  switch (key) {
    case "ArrowLeft":
    case "a":
    case "A":
      return "left";
    case "ArrowRight":
    case "d":
    case "D":
      return "right";
    case "ArrowUp":
    case "w":
    case "W":
    case " ":
      return "jump";
    // Held, never tapped, and clear of the arrows, WAD and the space bar.
    case "Shift":
    case "k":
    case "K":
      return "power";
    default:
      return undefined;
  }
}

function pseudoRandom(seed: number): number {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

export function levelScore(state: PlatformerState): number {
  const clues = state.collectedIds.length * 300;
  // The legend star (ADR-044): a superpower's own reward, score only.
  const star = state.bonusCollected ? 500 : 0;
  const timeBonus = Math.max(0, 1500 - Math.round(state.elapsedSeconds * 10));
  const spillMalus = state.respawns * 50;
  return Math.max(0, clues + star + timeBonus - spillMalus);
}

export function levelOutcome(
  state: PlatformerState,
  config: PlatformerConfig,
): LevelOutcome {
  return {
    score: levelScore(state),
    clues: state.collectedIds.length,
    totalClues: config.pickups.length,
    seconds: Math.round(state.elapsedSeconds),
    respawns: state.respawns,
  };
}

export const platformerMiniGame: MiniGamePort<PlatformerViewConfig> = {
  mount(host, request): MiniGameHandle {
    const document = host.ownerDocument;
    const view = document.defaultView;
    if (view === null) {
      throw new Error("The platformer level requires a browser window.");
    }

    const config = request.config;
    let state = createPlatformerState(config);
    const input: MutableInput = {
      left: false,
      right: false,
      jumpPressed: false,
      jumpHeld: false,
      powerHeld: false,
    };
    const grantedPower = config.powersByRole?.[request.role];
    let previousTime: number | undefined;
    let accumulator = 0;
    let animationFrame: number | undefined;
    let completionTimer: number | undefined;
    let running = true;
    let destroyed = false;
    let completionSent = false;
    let camera = 0;
    let runPhase = 0;
    let wasBlocked = false;
    let lastStatusLine: string | undefined;
    let cameoTriggeredAt: number | undefined;
    const particles: Particle[] = [];
    // One dust burst per barged onlooker per contact: the model reports the
    // pass-through at simulation rate, the burst fires on the first step only.
    const bargingIds = new Set<string>();

    const instructions = createElement(document, "p", "arcade-instructions");
    instructions.id = "arcade-instructions";
    instructions.textContent = request.message(config.controlsKey);

    const narrative = createElement(document, "p", "arcade-narrative");
    narrative.setAttribute("aria-live", "polite");
    narrative.textContent = request.message(config.narrativeStartKey);

    const status = createElement(document, "p", "arcade-status");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");

    let musicStarted = false;
    const ensureMusic = (): void => {
      if (!musicStarted) {
        musicStarted = true;
        request.audio.startMusic(config.music);
      }
    };

    const viewport = createElement(document, "section", "arcade-viewport");
    viewport.tabIndex = 0;
    viewport.setAttribute("aria-describedby", instructions.id);
    viewport.setAttribute("aria-label", request.message(config.objectiveKey));

    const canvas = createElement(document, "canvas", "arcade-canvas");
    canvas.width = config.viewportWidth;
    canvas.height = config.viewportHeight;
    canvas.setAttribute("aria-hidden", "true");
    viewport.append(canvas);
    const context = canvas.getContext("2d");
    if (context === null) {
      throw new Error("The platformer level requires a 2D canvas context.");
    }
    context.imageSmoothingEnabled = false;

    const controls = createElement(document, "div", "arcade-controls");
    const moveCluster = createElement(document, "div", "arcade-move-cluster");
    const control = (
      key: MessageKey,
      symbol: string,
      className: string,
      press: () => void,
      release: () => void,
    ): HTMLButtonElement => {
      const button = createElement(
        document,
        "button",
        `arcade-control ${className}`,
      );
      button.type = "button";
      button.textContent = symbol;
      button.setAttribute("aria-label", request.message(key));
      const activate = (event: PointerEvent): void => {
        event.preventDefault();
        ensureMusic();
        try {
          button.setPointerCapture(event.pointerId);
        } catch {
          // Without capture the pointerup/pointercancel pair still releases.
        }
        press();
      };
      const deactivate = (): void => {
        release();
      };
      button.addEventListener("pointerdown", activate);
      button.addEventListener("pointerup", deactivate);
      button.addEventListener("pointercancel", deactivate);
      button.addEventListener("pointerleave", deactivate);
      return button;
    };
    moveCluster.append(
      control(
        config.leftKey,
        "◀",
        "arcade-control--left",
        () => {
          input.left = true;
        },
        () => {
          input.left = false;
        },
      ),
      control(
        config.rightKey,
        "▶",
        "arcade-control--right",
        () => {
          input.right = true;
        },
        () => {
          input.right = false;
        },
      ),
    );
    const jumpButton = control(
      config.jumpKey,
      "▲",
      "arcade-control--jump",
      () => {
        input.jumpPressed = true;
        input.jumpHeld = true;
      },
      () => {
        input.jumpHeld = false;
      },
    );
    // Directions on the left, actions on the right, in both orientations: in
    // landscape a centred power button would sit over the play area.
    const actionCluster = createElement(
      document,
      "div",
      "arcade-action-cluster",
    );
    // The power button appears only where a power exists, so the earlier levels
    // keep their wider direction buttons (ADR-031).
    if (grantedPower !== undefined) {
      actionCluster.append(
        control(
          grantedPower.labelKey,
          "★",
          "arcade-control--power",
          () => {
            input.powerHeld = true;
          },
          () => {
            input.powerHeld = false;
          },
        ),
      );
    }
    actionCluster.append(jumpButton);
    controls.append(moveCluster, actionCluster);

    host.append(viewport, narrative, status, controls, instructions);

    const updateStatus = (): void => {
      const collected = state.collectedIds.length;
      const statusKey =
        collected >= config.pickups.length
          ? config.finishStatusKey
          : config.statusKeys[collected];
      // «Liv. 3/10 ·» — the campaign position, computed upstream (ADR-045).
      const position =
        request.position === undefined
          ? ""
          : `${request.message("core.message.level.status.position", {
              index: request.position.index,
              total: request.position.total,
            })} `;
      const lives = Number.isFinite(state.livesRemaining)
        ? ` ${request.message("core.message.level.lives", { lives: state.livesRemaining })}`
        : "";
      // The status line is an `aria-live` region and this runs every frame.
      // Assigning `textContent` replaces the text node even when the string
      // is identical, so a screen reader was being handed the same sentence
      // sixty times a second (ADR-050). It changes on a clue, a life or the
      // level position — a handful of times per level.
      if (statusKey !== undefined) {
        const line = `${position}${request.message(statusKey)}${lives}`;
        if (line !== lastStatusLine) {
          lastStatusLine = line;
          status.textContent = line;
        }
      }
      // Same for the dataset: every write is a DOM attribute mutation, and
      // only the position genuinely changes while the player moves.
      const setData = (key: string, value: string): void => {
        if (host.dataset[key] !== value) {
          host.dataset[key] = value;
        }
      };
      setData("collected", String(collected));
      if (request.position !== undefined) {
        setData("levelIndex", String(request.position.index));
      }
      setData("playerX", String(Math.round(state.x)));
      setData("playerY", String(Math.round(state.y)));
      if (Number.isFinite(state.livesRemaining)) {
        setData("lives", String(state.livesRemaining));
      }
      if (grantedPower !== undefined) {
        setData("powerActive", String(state.powerActive));
      }
    };

    const spawnDust = (count: number, color: string): void => {
      for (let index = 0; index < count; index += 1) {
        particles.push({
          x: state.x + config.playerWidth / 2,
          y: state.y + config.playerHeight,
          velocityX:
            (pseudoRandom(state.elapsedSeconds * 97 + index) - 0.5) * 60,
          velocityY: -pseudoRandom(state.elapsedSeconds * 31 + index) * 46,
          life: 0.4,
          color,
        });
      }
    };

    const narrate = (key: MessageKey | undefined): void => {
      if (key !== undefined) {
        narrative.textContent = request.message(key);
      }
    };

    const handleEvents = (events: PlatformerEvents): void => {
      if (events.jumped) {
        request.audio.playEffect("jump");
        spawnDust(4, palette.dust);
      }
      if (events.landed) {
        spawnDust(5, palette.dust);
      }
      if (events.collectedIds.length > 0) {
        request.audio.playEffect("pickup");
        spawnDust(6, palette.pickup);
        const lastCollected =
          events.collectedIds[events.collectedIds.length - 1];
        if (lastCollected !== undefined) {
          narrate(config.narrativePickupKeys[lastCollected]);
        }
      }
      if (events.checkpointId !== undefined) {
        request.audio.playEffect("checkpoint");
        narrate(config.narrativeCheckpointKey);
      }
      if (events.respawned) {
        request.audio.playEffect("respawn");
        // A car hit tells its own joke; every other respawn tells the level's.
        narrate(
          events.carHit
            ? (config.narrativeCarHitKey ?? config.narrativeRespawnKey)
            : config.narrativeRespawnKey,
        );
      }
      if (events.sprintStarted) {
        request.audio.playEffect("sprint");
        spawnDust(8, palette.dust);
        narrate(config.narrativeSprintKey);
      }
      if (events.powerStarted) {
        request.audio.playEffect("power");
        spawnDust(8, palette.power);
        narrate(grantedPower?.narrativeKey);
      }
      if (events.openedObstacleIds.length > 0) {
        request.audio.playEffect("pickup");
        spawnDust(5, palette.power);
      }
      // Only the moment of the bump makes a sound: pushing against the drone
      // would otherwise retrigger it at simulation rate.
      if (events.blocked && !wasBlocked) {
        request.audio.playEffect("blocked");
      }
      wasBlocked = events.blocked;
      // A sprint barging through an onlooker (ADR-032) kicks up dust, or the
      // pass-through reads as a collision bug instead of a design.
      for (const bargedId of events.bargedObstacleIds) {
        if (!bargingIds.has(bargedId)) {
          spawnDust(6, palette.dust);
        }
      }
      bargingIds.clear();
      for (const bargedId of events.bargedObstacleIds) {
        bargingIds.add(bargedId);
      }
      if (events.finished) {
        request.audio.playEffect("finish");
        request.audio.stopMusic();
        spawnDust(14, palette.pickup);
        narrate(config.narrativeFinishKey);
      }
      if (events.bonusCollected) {
        request.audio.playEffect("power");
        spawnDust(10, palette.pickup);
        narrate("core.message.level.bonus");
      }
      if (events.gameOver) {
        // The last life is gone (ADR-041): the KO card takes over from here.
        request.audio.playEffect("respawn");
        request.audio.stopMusic();
      }
    };

    const simulate = (delta: number): void => {
      accumulator = Math.min(accumulator + delta, 0.25);
      while (accumulator >= simulationStep) {
        const result = stepPlatformer(state, input, simulationStep, config);
        state = result.state;
        input.jumpPressed = false;
        handleEvents(result.events);
        accumulator -= simulationStep;
        if (state.completed) {
          accumulator = 0;
          break;
        }
      }
      // The cameo fires once, when the player gets close (ADR-044).
      const cameo = config.cameo;
      if (
        cameo !== undefined &&
        cameoTriggeredAt === undefined &&
        state.x + config.playerWidth >= cameo.x - 90
      ) {
        cameoTriggeredAt = state.elapsedSeconds;
        narrate(cameo.narrativeKey);
      }
    };

    const updateParticles = (delta: number): void => {
      for (const particle of particles) {
        particle.x += particle.velocityX * delta;
        particle.y += particle.velocityY * delta;
        particle.velocityY += 220 * delta;
        particle.life -= delta;
      }
      particles.splice(
        0,
        particles.length,
        ...particles.filter((particle) => particle.life > 0),
      );
    };

    const backdrop = config.backdrop;

    /**
     * The screen x where the interior shell ends and the open sky begins
     * (ADR-039). The doorway is anchored to the world at 1:1, so walking out
     * onto the roof is a place, not an effect; without an interior the whole
     * viewport is outdoors.
     */
    const indoorSplitX = (): number => {
      const indoor = backdrop.indoor;
      if (indoor === undefined) {
        return config.viewportWidth;
      }
      return Math.max(
        0,
        Math.min(config.viewportWidth, Math.ceil(indoor.skyFromX - camera)),
      );
    };

    /** Stars twinkle and the moon hangs still, from `fromX` to the edge. */
    const drawStarsAndMoon = (time: number, fromX: number): void => {
      const width = config.viewportWidth;
      context.fillStyle = palette.star;
      for (let index = 0; index < 70; index += 1) {
        const starX =
          (pseudoRandom(index) * config.worldWidth - camera * 0.12) %
          config.worldWidth;
        const drawX = ((starX % width) + width) % width;
        const starY = pseudoRandom(index + 200) * 88;
        if (drawX >= fromX && (index + Math.floor(time * 1.6)) % 9 !== 0) {
          context.fillRect(Math.floor(drawX), Math.floor(starY), 1, 1);
        }
      }

      const moonX = 252 - camera * 0.05;
      if (moonX - 16 >= fromX) {
        context.fillStyle = palette.moon;
        context.beginPath();
        context.arc(moonX, 34, 15, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = palette.moonShade;
        context.fillRect(Math.floor(moonX) - 5, 28, 4, 3);
        context.fillRect(Math.floor(moonX) + 3, 38, 5, 3);
        context.fillRect(Math.floor(moonX) - 1, 33, 3, 2);
      }
    };

    /** Daylight: a sun and a few slow clouds instead of stars and moon. */
    const drawSunAndClouds = (fromX: number): void => {
      const width = config.viewportWidth;
      const sunX = 262 - camera * 0.04;
      if (sunX - 14 >= fromX) {
        context.fillStyle = palette.sun;
        context.beginPath();
        context.arc(sunX, 30, 13, 0, Math.PI * 2);
        context.fill();
      }
      context.fillStyle = palette.cloud;
      for (let index = 0; index < 6; index += 1) {
        const cloudX =
          (pseudoRandom(index + 11) * config.worldWidth - camera * 0.1) %
          config.worldWidth;
        const drawX = ((cloudX % width) + width) % width;
        if (drawX < fromX) {
          continue;
        }
        const cloudY = 18 + pseudoRandom(index + 60) * 46;
        const cloudWidth = 14 + Math.floor(pseudoRandom(index + 90) * 18);
        context.fillRect(Math.floor(drawX), Math.floor(cloudY), cloudWidth, 3);
        context.fillRect(
          Math.floor(drawX) + 4,
          Math.floor(cloudY) - 2,
          cloudWidth - 8,
          2,
        );
      }
    };

    const drawSky = (time: number): void => {
      const width = config.viewportWidth;
      const height = config.viewportHeight;
      const indoor = backdrop.indoor;

      if (indoor !== undefined) {
        const split = indoorSplitX();
        // The open sky first, where the doorway will reveal it…
        if (split < width) {
          const [top, middle, horizon] = indoor.sky;
          context.fillStyle = top;
          context.fillRect(split, 0, width - split, 70);
          context.fillStyle = middle;
          context.fillRect(split, 70, width - split, 45);
          context.fillStyle = horizon;
          context.fillRect(split, 115, width - split, height - 115);
          if (backdrop.night) {
            drawStarsAndMoon(time, split);
          } else {
            drawSunAndClouds(split);
          }
        }
        // …then the stone shell, floor to vault, up to the doorway jamb.
        if (split > 0) {
          const [vault, wallHigh, wallLow] = backdrop.sky;
          context.fillStyle = vault;
          context.fillRect(0, 0, split, 44);
          context.fillStyle = wallHigh;
          context.fillRect(0, 44, split, 60);
          context.fillStyle = wallLow;
          context.fillRect(0, 104, split, height - 104);
          if (split <= width) {
            context.fillStyle = palette.stoneArchDark;
            context.fillRect(split - 3, 0, 3, height);
          }
        }
        return;
      }

      const [top, middle, horizon] = backdrop.sky;
      context.fillStyle = top;
      context.fillRect(0, 0, width, 70);
      context.fillStyle = middle;
      context.fillRect(0, 70, width, 45);
      context.fillStyle = horizon;
      context.fillRect(0, 115, width, height - 115);

      if (!backdrop.night) {
        drawSunAndClouds(0);
        return;
      }

      drawStarsAndMoon(time, 0);
    };

    /** The distant layer, at 0.3x of the camera. */
    const drawFarLayer = (): void => {
      const offset = camera * 0.3;

      if (backdrop.far === "hills") {
        context.fillStyle = palette.hillFarSolid;
        for (let index = -1; index < 5; index += 1) {
          const base = index * 150 - (offset % 150);
          const hillHeight =
            26 + pseudoRandom(index + Math.floor(offset / 150)) * 14;
          context.beginPath();
          context.arc(base + 75, 132, hillHeight + 42, Math.PI, 0);
          context.fill();
        }
        return;
      }

      if (backdrop.far === "rooftops") {
        for (let index = -1; index < 8; index += 1) {
          const seed = index + Math.floor(offset / 74);
          const base = index * 74 - (offset % 74);
          const houseHeight = 30 + Math.floor(pseudoRandom(seed) * 22);
          const houseWidth = 44 + Math.floor(pseudoRandom(seed + 7) * 20);
          const top = 132 - houseHeight;
          context.fillStyle = palette.roof;
          context.fillRect(Math.floor(base), top, houseWidth, houseHeight);
          context.fillStyle = palette.roofRidge;
          context.fillRect(Math.floor(base), top, houseWidth, 2);
          // Lit windows: the village is awake at 2:41, and that is the point.
          context.fillStyle = palette.window;
          for (let wy = top + 7; wy < 128; wy += 11) {
            for (let wx = 5; wx < houseWidth - 5; wx += 12) {
              if (pseudoRandom(seed * 31 + wx + wy) > 0.45) {
                context.fillRect(Math.floor(base) + wx, wy, 3, 4);
              }
            }
          }
        }
        return;
      }

      if (backdrop.far === "arches") {
        // The far wall of the halls: stepped pixel arches and pillars, cut off
        // at the doorway where the roof begins.
        const cap = indoorSplitX();
        const capped = (x: number, y: number, w: number, h: number): void => {
          const end = Math.min(x + w, cap);
          if (end > x) {
            context.fillRect(x, y, end - x, h);
          }
        };
        for (let index = -1; index < 7; index += 1) {
          const seed = index + Math.floor(offset / 58);
          const base = Math.floor(index * 58 - (offset % 58));
          context.fillStyle = palette.stoneArch;
          capped(base + 12, 76, 30, 56);
          capped(base + 15, 70, 24, 6);
          capped(base + 19, 66, 16, 4);
          context.fillStyle = palette.stoneArchDark;
          capped(base + 4, 60, 3, 72);
          // Once in a while a slit window lets a blade of night in.
          if (pseudoRandom(seed + 5) > 0.7) {
            context.fillStyle = palette.moonShade;
            capped(base + 26, 84, 2, 10);
          }
        }
        return;
      }

      if (backdrop.far === "castle") {
        // The Castello on its rise: it shows where the level is heading.
        const base = 250 - offset * 0.5;
        context.fillStyle = palette.castleFar;
        context.fillRect(base, 74, 132, 58);
        for (let index = 0; index < 132; index += 16) {
          context.fillRect(base + index, 68, 9, 6);
        }
        for (const tower of [-16, 124]) {
          context.fillRect(base + tower, 52, 24, 80);
          for (let index = 0; index < 24; index += 12) {
            context.fillRect(base + tower + index, 46, 7, 6);
          }
        }
        context.fillStyle = palette.castleFarShade;
        context.fillRect(base, 74, 132, 2);
        context.fillRect(base + 60, 96, 5, 12);
      }
    };

    /** The near layer, at 0.6x of the camera. */
    const drawNearLayer = (time: number): void => {
      const width = config.viewportWidth;
      const offset = camera * 0.6;
      const bandHeight = config.floorY - 128 + 40;

      if (backdrop.near === "corn") {
        context.fillStyle = palette.corn;
        context.fillRect(0, 128, width, bandHeight);
        context.fillStyle = palette.cornLight;
        for (let index = -1; index < 46; index += 1) {
          const stalkX = index * 8 - (offset % 8);
          const stalkHeight =
            10 + pseudoRandom(index + Math.floor(offset / 8)) * 9;
          context.fillRect(
            Math.floor(stalkX),
            128 - Math.floor(stalkHeight),
            2,
            Math.floor(stalkHeight),
          );
        }
        return;
      }

      if (backdrop.near === "hedges") {
        context.fillStyle = palette.hedge;
        context.fillRect(0, 128, width, bandHeight);
        context.fillStyle = palette.hedgeLight;
        for (let index = -1; index < 24; index += 1) {
          const hedgeX = index * 16 - (offset % 16);
          const bump = 6 + pseudoRandom(index + Math.floor(offset / 16)) * 5;
          context.fillRect(
            Math.floor(hedgeX),
            128 - Math.floor(bump),
            14,
            Math.floor(bump),
          );
        }
        return;
      }

      if (backdrop.near === "reeds") {
        // The reed beds along the ditches (ADR-045): tall swaying canes with
        // their seed heads, denser than the corn.
        context.fillStyle = palette.reedDark;
        context.fillRect(0, 128, width, bandHeight);
        for (let index = -1; index < 56; index += 1) {
          const seed = index + Math.floor(offset / 6);
          const reedX = index * 6 - (offset % 6);
          const reedHeight = 12 + pseudoRandom(seed) * 12;
          const sway = Math.sin(time * 1.3 + index * 0.7) * 1.5;
          context.fillStyle = index % 3 === 0 ? palette.reed : palette.reedDark;
          context.fillRect(
            Math.floor(reedX + sway),
            128 - Math.floor(reedHeight),
            2,
            Math.floor(reedHeight),
          );
          if (pseudoRandom(seed + 9) > 0.6) {
            context.fillStyle = palette.reedHead;
            context.fillRect(
              Math.floor(reedX + sway) - 1,
              128 - Math.floor(reedHeight) - 4,
              3,
              5,
            );
          }
        }
        return;
      }

      if (backdrop.near === "poplars") {
        // The poplar rows along the irrigation ditches (ADR-045): tall, narrow
        // and far apart, so the water shows between one trunk and the next.
        // Their flame-shaped crowns lean together in the pre-dawn wind.
        context.fillStyle = palette.poplarDark;
        context.fillRect(0, 128, width, bandHeight);
        for (let index = -1; index < 12; index += 1) {
          const seed = index + Math.floor(offset / 34);
          const treeX = Math.floor(index * 34 - (offset % 34));
          const treeHeight = 34 + Math.floor(pseudoRandom(seed) * 18);
          const lean = Math.floor(Math.sin(time * 0.9 + index) * 2);
          const top = 128 - treeHeight;
          const crownHeight = Math.floor(treeHeight * 0.62);
          context.fillStyle = palette.poplarTrunk;
          context.fillRect(treeX + 3, top + 8, 2, treeHeight - 8);
          context.fillStyle = palette.poplar;
          context.fillRect(treeX + lean + 2, top, 4, 10);
          context.fillRect(treeX + 1, top + 8, 6, crownHeight);
          // A darker seam down the middle: two trees deep, not one flat bar.
          context.fillStyle = palette.poplarDark;
          context.fillRect(treeX + 2, top + 8, 2, crownHeight);
        }
        return;
      }

      if (backdrop.near === "terraces") {
        // The dry-stone terraces of the last hill (ADR-045): stepped walls
        // climbing to the right, with vine stakes on every level. The band
        // rises with the slope instead of running flat like every other one.
        for (let index = -1; index < 10; index += 1) {
          const seed = index + Math.floor(offset / 40);
          const stepX = Math.floor(index * 40 - (offset % 40));
          // Four steps repeating, so the hill keeps climbing without ever
          // walking off the top of the viewport.
          const tier = ((index % 4) + 4) % 4;
          const top = 128 - tier * 9;
          context.fillStyle = palette.terraceGrass;
          context.fillRect(stepX, top, 40, bandHeight);
          context.fillStyle = palette.terraceWall;
          context.fillRect(stepX, top, 40, 5);
          context.fillStyle = palette.terraceWallShade;
          context.fillRect(stepX, top + 5, 40, 2);
          // Vine stakes along the terrace, leaning into the dawn wind.
          context.fillStyle = palette.terraceVine;
          for (let stake = 0; stake < 3; stake += 1) {
            const stakeX = stepX + 6 + stake * 13;
            const height = 7 + Math.floor(pseudoRandom(seed * 3 + stake) * 5);
            const lean = Math.floor(Math.sin(time * 0.8 + stake + index) * 1);
            context.fillRect(stakeX + lean, top - height, 2, height);
          }
        }
        return;
      }

      if (backdrop.near === "laundry") {
        // Ada's investigative clothesline (ADR-045): posts, a sagging line,
        // and a row of sheets and clippings pinned side by side.
        context.fillStyle = palette.hedge;
        context.fillRect(0, 128, width, bandHeight);
        context.fillStyle = palette.cableLine;
        for (let index = -1; index < 8; index += 1) {
          const spanX = index * 58 - (offset % 58);
          for (let along = 0; along < 58; along += 4) {
            const sag = Math.sin((along / 58) * Math.PI) * 3;
            context.fillRect(
              Math.floor(spanX + along),
              Math.floor(104 + sag),
              3,
              1,
            );
          }
          // The post between spans.
          context.fillStyle = palette.torchWood;
          context.fillRect(Math.floor(spanX), 104, 2, 24);
          context.fillStyle = palette.cableLine;
          // Sheets and clippings pinned along the span, gently swinging.
          for (let item = 0; item < 3; item += 1) {
            const seed = index * 7 + item;
            const itemX = spanX + 10 + item * 15;
            const swing = Math.sin(time * 1.8 + seed) * 1.5;
            const isClipping = pseudoRandom(seed + 21) > 0.55;
            context.fillStyle = isClipping ? palette.cloud : palette.belly;
            context.fillRect(
              Math.floor(itemX + swing),
              107,
              isClipping ? 6 : 10,
              isClipping ? 8 : 12,
            );
            if (isClipping) {
              context.fillStyle = palette.cables;
              context.fillRect(Math.floor(itemX + swing) + 1, 109, 4, 1);
              context.fillRect(Math.floor(itemX + swing) + 1, 112, 4, 1);
            }
          }
        }
        return;
      }

      if (backdrop.near === "torches") {
        // Skirting of the near wall, with brackets and flames that flicker
        // deterministically: elapsed time in, same flame out.
        const cap = indoorSplitX();
        const skirtWidth = Math.min(cap, width);
        if (skirtWidth > 0) {
          context.fillStyle = palette.stoneArchDark;
          context.fillRect(0, 128, skirtWidth, bandHeight);
        }
        for (let index = -1; index < 8; index += 1) {
          const torchX = Math.floor(index * 52 - (offset % 52));
          if (torchX < -6 || torchX + 5 > cap) {
            continue;
          }
          context.fillStyle = palette.torchWood;
          context.fillRect(torchX, 112, 3, 12);
          const flick = Math.floor(
            pseudoRandom(index + Math.floor(time * 9)) * 3,
          );
          context.fillStyle = palette.torchFlame;
          context.fillRect(torchX - 1, 103 - flick, 5, 9 + flick);
          context.fillStyle = palette.torchFlameCore;
          context.fillRect(torchX, 106, 3, 4);
        }
        return;
      }

      if (backdrop.near === "crowd") {
        context.fillStyle = palette.crowdFar;
        context.fillRect(0, 128, width, bandHeight);
        // Irregular widths, heights and overlap: evenly spaced bars of the same
        // size read as a picket fence, not as a crowd.
        for (let index = -2; index < 44; index += 1) {
          const seed = index + Math.floor(offset / 9);
          const jitter = pseudoRandom(seed + 41) * 5;
          const bodyX = index * 9 - (offset % 9) + jitter;
          const bodyWidth = 7 + Math.floor(pseudoRandom(seed + 17) * 4);
          const bodyHeight = 9 + Math.floor(pseudoRandom(seed) * 13);
          const bob = Math.sin(time * 1.6 + index) * 1.2;
          const top = Math.floor(128 - bodyHeight + bob);

          context.fillStyle = palette.crowdFarBody;
          context.fillRect(Math.floor(bodyX), top + 4, bodyWidth, bodyHeight);
          context.fillStyle = palette.crowdFarHead;
          const headWidth = Math.max(4, bodyWidth - 3);
          context.fillRect(
            Math.floor(bodyX) + 1,
            top,
            headWidth,
            Math.min(5, headWidth),
          );
          // Every so often a raised phone: everyone is filming.
          if (pseudoRandom(seed + 3) > 0.72) {
            context.fillStyle = palette.cables;
            context.fillRect(Math.floor(bodyX) + bodyWidth - 1, top - 5, 2, 5);
          }
        }
      }
    };

    const drawBackground = (time: number): void => {
      drawSky(time);
      drawFarLayer();
      drawNearLayer(time);
    };

    /**
     * The gadget van (ADR-037): the one thing in the level that moves on its
     * own, with an inflatable varano strapped to the dashboard as merchandise.
     */
    const drawCars = (time: number): void => {
      for (const car of config.cars ?? []) {
        const carX = Math.floor(carPositionAt(car, time) - camera);
        if (carX > config.viewportWidth || carX + car.width < 0) {
          continue;
        }
        const carY = config.floorY - car.height;
        const facing = carDirectionAt(car, time);

        context.save();
        if (facing === "left") {
          context.translate(carX + car.width / 2, 0);
          context.scale(-1, 1);
          context.translate(-(carX + car.width / 2), 0);
        }

        if (config.carLooks?.[car.id] === "robot") {
          // Pina's patrol robot (ADR-039): same triangle wave as the gadget
          // van, dressed as a watchful little machine. Physics untouched.
          context.fillStyle = palette.robotBody;
          context.fillRect(carX + 2, carY + 4, car.width - 4, car.height - 8);
          context.fillRect(carX + 6, carY, car.width - 16, 5);
          context.fillStyle = palette.robotShade;
          context.fillRect(carX + 2, carY + car.height - 6, car.width - 4, 2);
          // The scanning eye sweeps; its light blinks on the antenna.
          const sweep = Math.floor((Math.sin(time * 3) + 1) * 3);
          context.fillStyle = palette.robotEye;
          context.fillRect(carX + 8 + sweep, carY + 1, 3, 3);
          context.fillStyle = palette.cables;
          context.fillRect(carX + car.width - 12, carY - 5, 1, 5);
          if (Math.floor(time * 4) % 2 === 0) {
            context.fillStyle = palette.robotEye;
            context.fillRect(carX + car.width - 13, carY - 7, 3, 2);
          }
          // Treads instead of wheels.
          context.fillStyle = palette.carWheel;
          context.fillRect(carX + 2, carY + car.height - 4, car.width - 4, 4);
          context.fillStyle = palette.carHub;
          const roll = Math.floor(time * 12) % 6;
          for (let index = roll; index < car.width - 6; index += 6) {
            context.fillRect(carX + 3 + index, carY + car.height - 3, 2, 2);
          }
          context.restore();
          continue;
        }

        // Body, cabin and windshield, drawn facing right.
        context.fillStyle = palette.carBody;
        context.fillRect(carX, carY + 6, car.width, car.height - 10);
        context.fillRect(carX + 4, carY + 1, car.width - 14, 6);
        context.fillStyle = palette.carShade;
        context.fillRect(carX, carY + car.height - 5, car.width, 1);
        context.fillStyle = palette.carGlass;
        context.fillRect(carX + car.width - 12, carY + 2, 7, 5);

        // The inflatable varano on the dashboard: it bobs, because of course
        // it does. Googly eye included.
        const bob = Math.floor(Math.sin(time * 6) * 1.5);
        context.fillStyle = palette.bodyGreen;
        context.fillRect(carX + car.width - 11, carY - 5 + bob, 8, 6);
        context.fillRect(carX + car.width - 4, carY - 3 + bob, 3, 3);
        context.fillStyle = palette.eye;
        context.fillRect(carX + car.width - 5, carY - 4 + bob, 1, 1);

        // Wheels, spinning hubs and a puff of dust behind.
        context.fillStyle = palette.carWheel;
        context.fillRect(carX + 4, carY + car.height - 4, 5, 4);
        context.fillRect(carX + car.width - 9, carY + car.height - 4, 5, 4);
        context.fillStyle = palette.carHub;
        const spin = Math.floor(time * 10) % 2;
        context.fillRect(carX + 5 + spin, carY + car.height - 3, 2, 2);
        context.fillRect(
          carX + car.width - 8 + spin,
          carY + car.height - 3,
          2,
          2,
        );
        context.fillStyle = palette.dust;
        context.fillRect(carX - 3, carY + car.height - 3, 2, 1);
        context.fillRect(carX - 6, carY + car.height - 2, 2, 1);

        context.restore();
      }
    };

    /** The moat: animated water in the gaps between ground segments. */
    const drawWater = (time: number): void => {
      if (config.gapKind !== "water") {
        return;
      }
      const segments = [...config.groundSegments].sort((a, b) => a.x - b.x);
      const surfaceY = config.floorY + 8;
      for (let index = 0; index < segments.length - 1; index += 1) {
        const current = segments[index];
        const following = segments[index + 1];
        if (current === undefined || following === undefined) {
          continue;
        }
        const gapStart = current.x + current.width;
        const startX = Math.floor(gapStart - camera);
        const gapWidth = Math.ceil(following.x - gapStart);
        if (startX > config.viewportWidth || startX + gapWidth < 0) {
          continue;
        }
        context.fillStyle = palette.water;
        context.fillRect(
          startX,
          surfaceY,
          gapWidth,
          config.viewportHeight - surfaceY,
        );
        // Two rows of drifting ripples plus the odd glint.
        context.fillStyle = palette.waterLight;
        for (let ripple = 0; ripple < gapWidth; ripple += 10) {
          const sway = Math.sin(time * 2 + (gapStart + ripple) * 0.2) * 1.5;
          context.fillRect(startX + ripple + Math.floor(sway), surfaceY, 6, 1);
          context.fillRect(
            startX + ((ripple + 5) % gapWidth),
            surfaceY + 5 + Math.floor(-sway),
            4,
            1,
          );
        }
        context.fillStyle = palette.waterGlint;
        const glintX = Math.floor(
          (time * 14 + gapStart) % Math.max(1, gapWidth - 3),
        );
        context.fillRect(startX + glintX, surfaceY + 1, 3, 1);
      }
    };

    const drawGround = (): void => {
      const stone = config.groundKind === "stone";
      for (const segment of config.groundSegments) {
        const startX = Math.floor(segment.x - camera);
        const segmentWidth = Math.ceil(segment.width);
        if (startX > config.viewportWidth || startX + segmentWidth < 0) {
          continue;
        }
        if (stone) {
          // Flagstone floors: slabs in a running bond, worn light on top.
          context.fillStyle = palette.stoneFloor;
          context.fillRect(
            startX,
            config.floorY,
            segmentWidth,
            config.viewportHeight - config.floorY,
          );
          context.fillStyle = palette.stoneFloorDark;
          for (
            let row = config.floorY + 6;
            row < config.viewportHeight;
            row += 8
          ) {
            context.fillRect(startX, row, segmentWidth, 1);
            const shift = ((row - config.floorY) / 8) % 2 === 0 ? 0 : 8;
            for (let joint = shift; joint < segmentWidth; joint += 16) {
              context.fillRect(startX + joint, row - 8, 1, 8);
            }
          }
          context.fillStyle = palette.stoneFloorLight;
          context.fillRect(startX, config.floorY - 2, segmentWidth, 3);
          continue;
        }
        context.fillStyle = palette.dirt;
        context.fillRect(
          startX,
          config.floorY,
          segmentWidth,
          config.viewportHeight - config.floorY,
        );
        context.fillStyle = palette.dirtDark;
        for (let index = 0; index < segmentWidth; index += 14) {
          context.fillRect(startX + index + 4, config.floorY + 9, 5, 3);
          context.fillRect(startX + index + 9, config.floorY + 17, 4, 3);
        }
        context.fillStyle = palette.grass;
        context.fillRect(startX, config.floorY - 2, segmentWidth, 5);
        context.fillStyle = palette.grassLight;
        for (let index = 0; index < segmentWidth; index += 6) {
          context.fillRect(startX + index, config.floorY - 3, 2, 2);
        }
      }
    };

    const drawPlatforms = (): void => {
      const stone = config.platformKind === "stone";
      for (const platform of config.platforms) {
        const startX = Math.floor(platform.x - camera);
        if (startX > config.viewportWidth || startX + platform.width < 0) {
          continue;
        }
        if (stone) {
          // Stone ledges and steps instead of hay bales.
          context.fillStyle = palette.stoneFloor;
          context.fillRect(startX, platform.y, platform.width, 8);
          context.fillStyle = palette.stoneFloorDark;
          context.fillRect(startX, platform.y + 6, platform.width, 2);
          for (let index = 10; index < platform.width; index += 14) {
            context.fillRect(startX + index, platform.y + 2, 1, 4);
          }
          context.fillStyle = palette.stoneFloorLight;
          context.fillRect(startX, platform.y, platform.width, 1);
          continue;
        }
        context.fillStyle = palette.hay;
        context.fillRect(startX, platform.y, platform.width, 8);
        context.fillStyle = palette.hayDark;
        context.fillRect(startX, platform.y + 6, platform.width, 2);
        for (let index = 8; index < platform.width; index += 12) {
          context.fillRect(startX + index, platform.y + 1, 1, 5);
        }
        context.fillStyle = palette.hayLight;
        context.fillRect(startX, platform.y, platform.width, 1);
      }
    };

    /** Moving platforms (ADR-044): a slab with its rope or its wake. */
    const drawMovingPlatforms = (time: number): void => {
      const stone = config.platformKind === "stone";
      for (const mover of config.movingPlatforms ?? []) {
        const position = movingPlatformAt(mover, time);
        const startX = Math.floor(position.x - camera);
        const startY = Math.floor(position.y);
        if (startX > config.viewportWidth || startX + position.width < 0) {
          continue;
        }
        context.fillStyle = stone ? palette.stoneFloor : palette.hay;
        context.fillRect(startX, startY, position.width, 8);
        context.fillStyle = stone ? palette.stoneFloorDark : palette.hayDark;
        context.fillRect(startX, startY + 6, position.width, 2);
        context.fillStyle = stone ? palette.stoneFloorLight : palette.hayLight;
        context.fillRect(startX, startY, position.width, 1);
        if (mover.axis === "y") {
          // The hoist rope, so an elevator reads as an elevator.
          context.fillStyle = palette.cableLine;
          const ropeX = startX + Math.floor(position.width / 2);
          context.fillRect(ropeX, 0, 1, startY);
        } else {
          // A small wake behind a ferrying raft.
          context.fillStyle = palette.waterGlint;
          context.fillRect(startX - 3, startY + 4, 2, 1);
          context.fillRect(startX + position.width + 1, startY + 4, 2, 1);
        }
      }
    };

    /**
     * The legend star (ADR-044): a ghost until the superpower is engaged,
     * bright while it is — the ★ button's own reward.
     */
    const drawBonus = (time: number): void => {
      const bonus = config.bonus;
      if (bonus === undefined || state.bonusCollected) {
        return;
      }
      const drawX = Math.floor(bonus.x - camera);
      if (drawX > config.viewportWidth + 10 || drawX < -10) {
        return;
      }
      const float = Math.sin(time * 2.4) * 2;
      const drawY = Math.floor(bonus.y + float);
      const lit = state.powerActive;
      context.globalAlpha = lit ? 1 : 0.35;
      context.fillStyle = lit ? palette.pickupCore : palette.power;
      // A chunky pixel star.
      context.fillRect(drawX - 1, drawY - 4, 2, 8);
      context.fillRect(drawX - 4, drawY - 1, 8, 2);
      context.fillRect(drawX - 2, drawY - 2, 4, 4);
      if (lit) {
        context.fillStyle = palette.pickup;
        const sparkle = Math.floor(time * 6) % 2;
        context.fillRect(drawX - 6 + sparkle, drawY - 6, 1, 1);
        context.fillRect(drawX + 5 - sparkle, drawY + 5, 1, 1);
      }
      context.globalAlpha = 1;
    };

    /** The cameo (ADR-044): a tail or two eyes, once, then gone. */
    const drawCameo = (time: number): void => {
      const cameo = config.cameo;
      if (cameo === undefined || cameoTriggeredAt === undefined) {
        return;
      }
      const age = time - cameoTriggeredAt;
      if (age > 1.8) {
        return;
      }
      const drawX = Math.floor(cameo.x - camera);
      if (drawX > config.viewportWidth + 20 || drawX < -20) {
        return;
      }
      // Peek in, hold, slip away: 0..1 over the apparition's life.
      const peek =
        age < 0.5 ? age / 0.5 : age > 1.3 ? Math.max(0, (1.8 - age) / 0.5) : 1;

      if (cameo.kind === "eyes") {
        const blink = Math.floor(time * 3) % 5 === 0;
        if (!blink) {
          context.fillStyle = palette.wallWindow;
          context.globalAlpha = peek;
          context.fillRect(drawX - 4, Math.floor(cameo.y), 3, 3);
          context.fillRect(drawX + 2, Math.floor(cameo.y), 3, 3);
          context.fillStyle = palette.eye;
          context.fillRect(drawX - 3, Math.floor(cameo.y) + 1, 1, 1);
          context.fillRect(drawX + 3, Math.floor(cameo.y) + 1, 1, 1);
          context.globalAlpha = 1;
        }
        return;
      }

      // The tail, rising from behind the scenery and swaying.
      const rise = Math.floor(14 * peek);
      context.fillStyle = palette.bodyGreen;
      for (let index = 0; index < rise; index += 1) {
        const sway = Math.sin(time * 5 + index * 0.6) * 2;
        context.fillRect(
          drawX + Math.floor(sway) + Math.floor(index * 0.4),
          Math.floor(cameo.y) - index,
          3,
          2,
        );
      }
      context.fillStyle = palette.bodyDark;
      if (rise > 3) {
        context.fillRect(drawX + 1, Math.floor(cameo.y) - rise + 2, 2, 2);
      }
    };

    const drawCheckpoints = (): void => {
      for (const checkpoint of config.checkpoints) {
        const poleX = Math.floor(checkpoint.x - camera);
        if (poleX > config.viewportWidth || poleX < -12) {
          continue;
        }
        const active = state.activeCheckpointId === checkpoint.id;
        context.fillStyle = palette.pole;
        context.fillRect(poleX, config.floorY - 30, 2, 30);
        context.fillStyle = active ? palette.flagActive : palette.flagIdle;
        context.beginPath();
        context.moveTo(poleX + 2, config.floorY - 30);
        context.lineTo(poleX + 13, config.floorY - 26);
        context.lineTo(poleX + 2, config.floorY - 22);
        context.closePath();
        context.fill();
      }
    };

    const drawPickups = (time: number): void => {
      config.pickups.forEach((pickup, index) => {
        if (state.collectedIds.includes(pickup.id)) {
          return;
        }
        const drawX = Math.floor(pickup.x - camera);
        if (drawX > config.viewportWidth + 10 || drawX < -10) {
          return;
        }
        const float = Math.sin(time * 3 + index * 1.7) * 2.5;
        const drawY = Math.floor(pickup.y + float);
        context.fillStyle = "#ffcf5a33";
        context.fillRect(drawX - 5, drawY - 5, 10, 10);
        context.fillStyle = palette.pickup;
        context.fillRect(drawX - 3, drawY - 3, 6, 6);
        context.fillStyle = palette.pickupCore;
        context.fillRect(drawX - 1, drawY - 2, 2, 3);
      });
    };

    /** The walls of the Castello Bonoris: the goal of level 3, not a reed bed. */
    const drawWalls = (): void => {
      const baseX = Math.floor(config.finishX - camera);
      if (baseX > config.viewportWidth + 80 || baseX < -140) {
        return;
      }
      const top = 52;
      const width = 120;
      context.fillStyle = palette.wallShade;
      context.fillRect(baseX, top, width, config.floorY - top);
      context.fillStyle = palette.wall;
      context.fillRect(baseX, top, width - 6, config.floorY - top);
      // Crenellations.
      for (let index = 0; index < width - 6; index += 14) {
        context.fillRect(baseX + index, top - 6, 8, 6);
      }
      context.fillStyle = palette.wallShade;
      for (let row = top + 12; row < config.floorY; row += 12) {
        context.fillRect(baseX, row, width - 6, 1);
      }
      // A narrow window, and the tower behind.
      context.fillStyle = palette.wallWindow;
      context.fillRect(baseX + 28, top + 20, 4, 10);
      context.fillRect(baseX + 74, top + 34, 4, 10);
      context.fillStyle = palette.wall;
      context.fillRect(baseX + width - 34, top - 22, 26, 22);
      for (let index = 0; index < 26; index += 12) {
        context.fillRect(baseX + width - 34 + index, top - 28, 7, 6);
      }
    };

    /**
     * The sun-warmed stone above the battlements: the goal of the climb, kept
     * warm for its Count even under the moon (ADR-039).
     */
    const drawSunstone = (time: number): void => {
      const baseX = Math.floor(config.finishX - camera);
      if (baseX > config.viewportWidth + 60 || baseX < -60) {
        return;
      }
      // A merlon on each side, so the slab reads as the top of the tower.
      context.fillStyle = palette.wallShade;
      context.fillRect(baseX - 14, config.floorY - 16, 8, 16);
      context.fillRect(baseX + 40, config.floorY - 16, 8, 16);
      context.fillStyle = palette.sunstone;
      context.fillRect(baseX, config.floorY - 10, 34, 10);
      context.fillStyle = palette.sunstoneLight;
      context.fillRect(baseX + 2, config.floorY - 12, 30, 3);
      // Heat shimmer: a few slow sparks rising off the warm stone.
      for (let index = 0; index < 3; index += 1) {
        const sparkPhase = (time * 0.6 + index * 0.33) % 1;
        const sparkX = baseX + 5 + index * 11;
        const sparkY = config.floorY - 14 - Math.floor(sparkPhase * 12);
        if ((Math.floor(time * 3) + index) % 3 !== 0) {
          context.fillStyle = palette.sunstoneLight;
          context.fillRect(sparkX, sparkY, 1, 1);
        }
      }
    };

    const drawReeds = (time: number): void => {
      const baseX = Math.floor(config.finishX - camera);
      if (baseX > config.viewportWidth + 60 || baseX < -80) {
        return;
      }
      for (let index = 0; index < 14; index += 1) {
        const reedX = baseX + index * 5 + Math.floor(pseudoRandom(index) * 3);
        const reedHeight = 26 + Math.floor(pseudoRandom(index + 40) * 16);
        const sway = Math.sin(time * 1.4 + index) * 1.5;
        context.fillStyle = index % 3 === 0 ? palette.reedDark : palette.reed;
        context.fillRect(
          reedX + Math.floor(sway),
          config.floorY - reedHeight,
          2,
          reedHeight,
        );
        if (index % 2 === 0) {
          context.fillStyle = palette.reedHead;
          context.fillRect(
            reedX + Math.floor(sway) - 1,
            config.floorY - reedHeight - 6,
            4,
            7,
          );
        }
      }
    };

    /**
     * The obstacles read differently when neutralised, so a player without
     * sound or without colour perception still sees the power working.
     */
    const drawObstacles = (time: number): void => {
      for (const obstacle of config.obstacles ?? []) {
        const drawX = Math.floor(obstacle.x - camera);
        if (drawX > config.viewportWidth || drawX + obstacle.width < 0) {
          continue;
        }
        const opened = state.openedObstacleIds.includes(obstacle.id);
        const calmed = state.calmedObstacleIds.includes(obstacle.id);
        const inert = opened || calmed;
        const look = config.obstacleLooks?.[obstacle.id];

        if (look === "portcullis") {
          // A half-lowered portcullis (ADR-039): the solid block of the drone
          // kind dressed as castle iron. Calmed, it hangs raised and open.
          const lift = inert ? 12 : 0;
          context.fillStyle = palette.stoneArchDark;
          context.fillRect(
            drawX - 2,
            obstacle.y - 8 - lift,
            obstacle.width + 4,
            4,
          );
          context.fillStyle = palette.portcullis;
          for (let bar = 1; bar < obstacle.width; bar += 5) {
            context.fillRect(
              drawX + bar,
              obstacle.y - 4 - lift,
              2,
              obstacle.height + 4 - lift,
            );
          }
          context.fillStyle = palette.portcullisLight;
          context.fillRect(drawX, obstacle.y + 2 - lift, obstacle.width, 1);
          context.fillRect(
            drawX,
            obstacle.y + obstacle.height - 6 - lift,
            obstacle.width,
            1,
          );
          continue;
        }

        if (look === "cage") {
          // A capture cage with its bait untouched (ADR-045): the solid block
          // of the drone kind as a mesh box. Calmed, its door swings open.
          context.fillStyle = palette.portcullis;
          context.fillRect(drawX, obstacle.y, obstacle.width, 2);
          context.fillRect(
            drawX,
            obstacle.y + obstacle.height - 2,
            obstacle.width,
            2,
          );
          for (let bar = 0; bar <= obstacle.width - 2; bar += 6) {
            context.fillRect(drawX + bar, obstacle.y, 2, obstacle.height);
          }
          if (inert) {
            // The door flung open against the side.
            context.fillStyle = palette.portcullisLight;
            context.fillRect(drawX - 6, obstacle.y + 2, 6, 2);
          }
          // The bait: a small pale lump, famously ignored.
          context.fillStyle = palette.pickupCore;
          context.fillRect(
            drawX + Math.floor(obstacle.width / 2) - 1,
            obstacle.y + obstacle.height - 5,
            3,
            3,
          );
          continue;
        }

        if (look === "nutria") {
          // One of the six warm shapes the drone keeps finding (ADR-045): a
          // round little nutria. Calm ones sit down and mind their business.
          const bodyY = obstacle.y + obstacle.height - 12;
          const waddle = inert ? 0 : Math.floor(Math.sin(time * 6 + drawX) * 1);
          context.fillStyle = palette.reedHead;
          context.fillRect(
            drawX + 2,
            bodyY + waddle,
            obstacle.width - 4,
            10 - (inert ? 2 : 0),
          );
          // Head, ear and the two famous teeth.
          context.fillRect(
            drawX + obstacle.width - 8,
            bodyY - 4 + waddle,
            8,
            7,
          );
          context.fillStyle = palette.eye;
          context.fillRect(
            drawX + obstacle.width - 3,
            bodyY - 2 + waddle,
            1,
            1,
          );
          context.fillStyle = palette.pickupCore;
          context.fillRect(
            drawX + obstacle.width - 3,
            bodyY + 2 + waddle,
            2,
            2,
          );
          // The bald tail, trailing.
          context.fillStyle = palette.crowdHead;
          context.fillRect(drawX - 5, bodyY + 6 + waddle, 8, 2);
          continue;
        }

        if (look === "fake-varano") {
          // One of Pina's AI decoys: an inflatable varano with two tails and a
          // visible seam — the AI never gets the real one right. Deflated when
          // a power sees through it.
          if (inert) {
            context.fillStyle = palette.fakeVaranoDeflated;
            context.fillRect(
              drawX,
              obstacle.y + obstacle.height - 4,
              obstacle.width,
              4,
            );
            context.fillRect(drawX - 5, obstacle.y + obstacle.height - 2, 6, 2);
            continue;
          }
          const wobble = Math.floor(Math.sin(time * 5 + obstacle.x) * 1.5);
          const bodyY = obstacle.y + 6 + wobble;
          context.fillStyle = palette.fakeVarano;
          context.fillRect(
            drawX + 1,
            bodyY,
            obstacle.width - 2,
            obstacle.height - 8,
          );
          // Two tails, because of course it has two tails.
          context.fillRect(drawX - 6, bodyY + 4, 7, 3);
          context.fillRect(drawX - 5, bodyY + 9, 6, 3);
          // The seam and the valve.
          context.fillStyle = palette.fakeVaranoSeam;
          context.fillRect(
            drawX + Math.floor(obstacle.width / 2),
            bodyY,
            1,
            obstacle.height - 8,
          );
          context.fillRect(drawX + 3, bodyY + obstacle.height - 10, 2, 2);
          // A googly eye, far too big.
          context.fillStyle = palette.pickupCore;
          context.fillRect(drawX + obstacle.width - 8, bodyY + 2, 5, 5);
          context.fillStyle = palette.eye;
          context.fillRect(
            drawX + obstacle.width - 6 + (Math.floor(time * 2) % 2),
            bodyY + 4,
            2,
            2,
          );
          continue;
        }

        if (obstacle.kind === "cables") {
          context.fillStyle = palette.cables;
          context.fillRect(
            drawX,
            obstacle.y + obstacle.height - 3,
            obstacle.width,
            3,
          );
          // Cables sag along the ground and tripods stand sparsely: it must read
          // as a tangle you wade through, never as a fence that blocks.
          const base = obstacle.y + obstacle.height;
          context.fillStyle = palette.cableLine;
          for (let index = 0; index < obstacle.width; index += 8) {
            const sag = inert ? 0 : Math.sin(index * 0.55) * 2;
            context.fillRect(drawX + index, Math.floor(base - 4 + sag), 7, 1);
            context.fillRect(
              drawX + index + 3,
              Math.floor(base - 7 - sag),
              6,
              1,
            );
          }
          context.fillStyle = palette.cables;
          for (let index = 20; index < obstacle.width - 10; index += 78) {
            const legX = drawX + index;
            const top = obstacle.y - 8;
            context.fillRect(legX, top, 1, 10);
            context.fillRect(legX - 3, top + 10, 3, 1);
            context.fillRect(legX + 2, top + 10, 3, 1);
            // A camera on top, so a tripod is obviously a tripod.
            context.fillRect(legX - 2, top - 3, 6, 3);
          }
          continue;
        }

        if (obstacle.kind === "drone") {
          const hover = inert ? 0 : Math.sin(time * 4) * 2;
          const bodyY = Math.floor(obstacle.y + hover);
          context.fillStyle = palette.troupeDrone;
          context.fillRect(drawX + 2, bodyY + 4, obstacle.width - 4, 5);
          // Landed drones stop spinning and drop their light.
          context.fillRect(
            drawX,
            inert ? bodyY + 9 : bodyY + 1,
            obstacle.width,
            1,
          );
          if (!inert) {
            context.fillStyle = palette.troupeDroneLight;
            context.fillRect(
              drawX + Math.floor(obstacle.width / 2) - 1,
              bodyY + 6,
              2,
              2,
            );
          }
          continue;
        }

        // Onlookers: a queue of backs and phones. Calm or distracted ones face
        // away and leave a visible gap.
        const bodyHeight = obstacle.height - 6;
        context.fillStyle = inert ? palette.crowdCalm : palette.crowd;
        context.fillRect(
          drawX + 2,
          obstacle.y + 6,
          obstacle.width - 4,
          bodyHeight,
        );
        context.fillStyle = palette.crowdHead;
        context.fillRect(drawX + 4, obstacle.y, obstacle.width - 8, 6);
        if (!inert) {
          // A raised phone, because everyone is filming.
          context.fillStyle = palette.cables;
          context.fillRect(drawX + obstacle.width - 5, obstacle.y - 4, 3, 5);
        }
      }
    };

    /** The ring makes the scent and the call legible without audio. */
    const drawPowerRing = (time: number): void => {
      const power = config.power;
      if (
        power === undefined ||
        !state.powerActive ||
        (power.kind !== "scent" && power.kind !== "call")
      ) {
        return;
      }
      const centerX = Math.floor(state.x + config.playerWidth / 2 - camera);
      const centerY = Math.floor(state.y + config.playerHeight / 2);
      const pulse = (Math.sin(time * 5) + 1) / 2;
      context.strokeStyle = palette.powerRing;
      context.lineWidth = 1;
      for (const scale of [0.55, 0.8, 1]) {
        context.globalAlpha = 0.25 + 0.35 * pulse * scale;
        context.beginPath();
        context.arc(centerX, centerY, power.radius * scale, 0, Math.PI * 2);
        context.stroke();
      }
      context.globalAlpha = 1;
    };

    /**
     * With the scent held, uncollected clues get an arrow at the screen edge:
     * the power is information, so it has to be readable on screen.
     */
    const drawScentMarkers = (): void => {
      if (config.power?.kind !== "scent" || !state.powerActive) {
        return;
      }
      for (const pickup of config.pickups) {
        if (state.collectedIds.includes(pickup.id)) {
          continue;
        }
        const drawX = pickup.x - camera;
        const onScreen = drawX >= 0 && drawX <= config.viewportWidth;
        const markerX = onScreen
          ? Math.floor(drawX)
          : drawX < 0
            ? 3
            : config.viewportWidth - 5;
        context.fillStyle = palette.power;
        context.fillRect(markerX - 1, 4, 3, 3);
        if (!onScreen) {
          context.fillRect(markerX - 1, 8, 3, 1);
        }
      }
    };

    const drawPlayer = (time: number): void => {
      const drawX = Math.floor(state.x - camera);
      const drawY = Math.floor(state.y);
      const width = config.playerWidth;
      const height = config.playerHeight;
      const moving = Math.abs(state.velocityX) > 12;
      if (moving && state.grounded) {
        runPhase = (runPhase + Math.abs(state.velocityX) * 0.0022) % 1;
      }
      const legLift = moving && state.grounded ? (runPhase < 0.5 ? 1 : 0) : 0;
      const airborne = !state.grounded;

      context.save();
      if (state.facing === "left") {
        context.translate(drawX + width / 2, 0);
        context.scale(-1, 1);
        context.translate(-(drawX + width / 2), 0);
      }

      // The Borgocoda drone: rotor above the head plus a fuel bar, so the limit
      // is visible and not just felt.
      if (config.power?.kind === "drone" && state.powerActive) {
        const rotorSpan = Math.floor(6 + Math.sin(time * 30) * 3);
        context.fillStyle = palette.troupeDrone;
        context.fillRect(
          drawX + width / 2 - rotorSpan,
          drawY - 7,
          rotorSpan * 2,
          1,
        );
        context.fillRect(drawX + Math.floor(width / 2), drawY - 6, 1, 4);
        const fuel = state.droneFuel / config.power.hoverSeconds;
        context.fillStyle = palette.cables;
        context.fillRect(drawX + 2, drawY - 4, width - 4, 2);
        context.fillStyle = palette.power;
        context.fillRect(
          drawX + 2,
          drawY - 4,
          Math.round((width - 4) * fuel),
          2,
        );
      }

      // Speed lines trailing behind the sprint.
      if (state.sprinting) {
        context.fillStyle = palette.dust;
        for (let index = 0; index < 4; index += 1) {
          const offset = ((time * 260 + index * 13) % 26) + 4;
          context.fillRect(
            drawX - offset,
            drawY + 3 + ((index * 4) % height),
            Math.floor(6 + index),
            1,
          );
        }
      }

      context.fillStyle = palette.bodyDark;
      const tailBase = drawY + height - 6;
      for (let index = 0; index < 8; index += 1) {
        const wave = Math.sin(time * 6 + index * 0.9) * (moving ? 1.4 : 0.6);
        context.fillRect(
          drawX - 8 + index,
          Math.floor(tailBase + wave - index * 0.28),
          2,
          2,
        );
      }

      context.fillStyle = palette.bodyGreen;
      context.fillRect(drawX + 1, drawY + 4, width - 8, height - 8);
      context.fillStyle = palette.belly;
      context.fillRect(drawX + 2, drawY + height - 5, width - 10, 2);
      context.fillStyle = palette.bodyDark;
      for (let index = 3; index < width - 9; index += 4) {
        context.fillRect(drawX + index, drawY + 4, 1, 2);
      }

      context.fillStyle = palette.bodyGreen;
      context.fillRect(drawX + width - 9, drawY + 2, 8, 6);
      context.fillRect(drawX + width - 4, drawY + 4, 4, 4);
      context.fillStyle = palette.eye;
      context.fillRect(drawX + width - 5, drawY + 3, 2, 2);
      if (Math.floor(time * 0.8) % 4 === 0 && Math.floor(time * 10) % 8 < 2) {
        context.fillStyle = palette.tongue;
        context.fillRect(drawX + width, drawY + 6, 3, 1);
      }

      context.fillStyle = palette.bodyDark;
      const frontLegY = drawY + height - 4 - (airborne ? 1 : legLift);
      const backLegY = drawY + height - 4 - (airborne ? 1 : 1 - legLift);
      context.fillRect(drawX + 3, backLegY, 2, 4);
      context.fillRect(drawX + 8, frontLegY, 2, 4);
      context.fillRect(drawX + width - 13, backLegY, 2, 4);
      context.fillRect(drawX + width - 8, frontLegY, 2, 4);

      context.restore();
    };

    const drawParticles = (): void => {
      for (const particle of particles) {
        context.fillStyle = particle.color;
        const size = particle.life > 0.2 ? 2 : 1;
        context.fillRect(
          Math.floor(particle.x - camera),
          Math.floor(particle.y),
          size,
          size,
        );
      }
    };

    const draw = (): void => {
      const time = state.elapsedSeconds;
      drawBackground(time);
      if (config.finishKind === "walls") {
        drawWalls();
      } else if (config.finishKind === "sunstone") {
        drawSunstone(time);
      } else {
        drawReeds(time);
      }
      drawCheckpoints();
      drawWater(time);
      drawGround();
      drawPlatforms();
      drawMovingPlatforms(time);
      drawCameo(time);
      drawObstacles(time);
      drawCars(time);
      drawPickups(time);
      drawBonus(time);
      drawParticles();
      drawPowerRing(time);
      drawPlayer(time);
      drawScentMarkers();
      drawLives();
    };

    /** Pixel hearts in the corner, so the stake is readable at a glance. */
    const drawLives = (): void => {
      if (!Number.isFinite(state.livesRemaining)) {
        return;
      }
      context.fillStyle = palette.robotEye;
      for (let index = 0; index < state.livesRemaining; index += 1) {
        const heartX = 5 + index * 9;
        context.fillRect(heartX, 5, 2, 2);
        context.fillRect(heartX + 3, 5, 2, 2);
        context.fillRect(heartX, 7, 5, 2);
        context.fillRect(heartX + 1, 9, 3, 1);
        context.fillRect(heartX + 2, 10, 1, 1);
      }
    };

    let gameOverCard: HTMLElement | undefined;

    /**
     * «Riprova il livello» (ADR-041): a fresh attempt in place. Session state
     * only — like a resume (ADR-018), nothing of the story is touched.
     */
    const restartAttempt = (): void => {
      state = createPlatformerState(config);
      particles.length = 0;
      accumulator = 0;
      previousTime = undefined;
      wasBlocked = false;
      bargingIds.clear();
      input.left = false;
      input.right = false;
      input.jumpPressed = false;
      input.jumpHeld = false;
      input.powerHeld = false;
      // The next gesture restarts the music from the top.
      musicStarted = false;
      cameoTriggeredAt = undefined;
      gameOverCard?.remove();
      gameOverCard = undefined;
      narrative.textContent = request.message(config.narrativeStartKey);
      camera = cameraX(state, config);
      draw();
      updateStatus();
      running = true;
      animationFrame = view.requestAnimationFrame(frame);
      viewport.focus();
    };

    /**
     * The KO card (ADR-041): an arcade game over inside the frame — no gore,
     * no lost story progress, and the usual skip stays available.
     */
    const showGameOver = (): void => {
      if (gameOverCard !== undefined) {
        return;
      }
      const card = createElement(document, "section", "arcade-gameover");
      card.setAttribute("role", "dialog");
      card.setAttribute("aria-modal", "true");
      const title = createElement(document, "h2", "arcade-gameover__title");
      title.id = "arcade-gameover-heading";
      title.textContent = request.message("core.message.level.gameover.title");
      card.setAttribute("aria-labelledby", title.id);
      const body = createElement(document, "p", "arcade-gameover__body");
      body.textContent = request.message("core.message.level.gameover.body");
      const actions = createElement(
        document,
        "div",
        "arcade-gameover__actions",
      );
      const retry = createElement(document, "button", "arcade-gameover__retry");
      retry.type = "button";
      retry.textContent = request.message("core.message.level.gameover.retry");
      retry.addEventListener("click", restartAttempt);
      const skip = createElement(document, "button", "arcade-gameover__skip");
      skip.type = "button";
      skip.textContent = request.message("core.message.level.skip");
      skip.addEventListener("click", () => {
        request.onExit();
      });
      actions.append(retry, skip);
      card.append(title, body, actions);
      viewport.append(card);
      gameOverCard = card;
      retry.focus();
    };

    const frame = (timestamp: number): void => {
      if (!running || destroyed) {
        return;
      }
      const delta =
        previousTime === undefined ? 0 : (timestamp - previousTime) / 1000;
      previousTime = timestamp;

      simulate(delta);
      updateParticles(Math.min(delta, 0.05));
      const targetCamera = cameraX(state, config);
      camera += (targetCamera - camera) * Math.min(1, delta * 7);
      if (Math.abs(targetCamera - camera) < 0.4) {
        camera = targetCamera;
      }
      draw();
      updateStatus();

      if (state.gameOver) {
        running = false;
        showGameOver();
        return;
      }

      if (state.completed) {
        running = false;
        if (!completionSent) {
          completionSent = true;
          const outcome = levelOutcome(state, config);
          completionTimer = view.setTimeout(() => {
            request.onComplete(outcome);
          }, 700);
        }
        return;
      }
      animationFrame = view.requestAnimationFrame(frame);
    };

    const onKeyDown = (event: KeyboardEvent): void => {
      const action = keyDirection(event.key);
      // While the level is paused the keys belong to whatever is on top of
      // it (ADR-050). The level used to swallow Space and the arrows with
      // the menu open, so `<summary>` could not be toggled and the menu
      // could not be scrolled — and the buffered jump fired on resume.
      if (
        !running ||
        action === undefined ||
        isInteractiveTarget(event.target)
      ) {
        return;
      }
      ensureMusic();
      if (action === "power") {
        // No preventDefault on Shift: it must keep working for Shift+Tab.
        input.powerHeld = true;
        return;
      }
      event.preventDefault();
      if (action === "jump") {
        if (!event.repeat) {
          input.jumpPressed = true;
        }
        input.jumpHeld = true;
      } else {
        input[action] = true;
      }
    };
    const onKeyUp = (event: KeyboardEvent): void => {
      const action = keyDirection(event.key);
      if (action === undefined) {
        return;
      }
      if (action === "jump") {
        input.jumpHeld = false;
      } else if (action === "power") {
        input.powerHeld = false;
      } else {
        input[action] = false;
      }
    };
    view.addEventListener("keydown", onKeyDown);
    view.addEventListener("keyup", onKeyUp);

    camera = cameraX(state, config);
    draw();
    updateStatus();
    animationFrame = view.requestAnimationFrame(frame);

    return {
      pause(): void {
        running = false;
        previousTime = undefined;
        // Drop whatever was held: a direction still pressed when the menu
        // opened would otherwise keep running on resume (ADR-050).
        input.left = false;
        input.right = false;
        input.jumpPressed = false;
        input.jumpHeld = false;
        input.powerHeld = false;
        if (animationFrame !== undefined) {
          view.cancelAnimationFrame(animationFrame);
        }
      },
      resume(): void {
        if (!running && !destroyed && !state.completed && !state.gameOver) {
          running = true;
          previousTime = undefined;
          animationFrame = view.requestAnimationFrame(frame);
        }
      },
      destroy(): void {
        destroyed = true;
        running = false;
        if (animationFrame !== undefined) {
          view.cancelAnimationFrame(animationFrame);
        }
        if (completionTimer !== undefined) {
          view.clearTimeout(completionTimer);
        }
        view.removeEventListener("keydown", onKeyDown);
        view.removeEventListener("keyup", onKeyUp);
        request.audio.stopMusic();
      },
    };
  },
};
