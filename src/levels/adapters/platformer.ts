import type { MessageKey, Role } from "../../core/model";
import type { LevelOutcome, MiniGameHandle, MiniGamePort } from "../contract";
import {
  cameraX,
  createPlatformerState,
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
  readonly far: "hills" | "rooftops" | "castle" | "none";
  readonly near: "corn" | "hedges" | "crowd" | "none";
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
  readonly narrativeFinishKey: MessageKey;
  /** Only on levels that grant the sprint. */
  readonly narrativeSprintKey?: MessageKey;
  /** Only on levels that gate a superpower per role (ADR-031). */
  readonly powersByRole?: Readonly<Partial<Record<Role, LevelPowerEntry>>>;
  /** What the finish line looks like; reeds when omitted. */
  readonly finishKind?: "reeds" | "walls";
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
    target.closest("button, a, input, select, textarea") !== null
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
  const timeBonus = Math.max(0, 1500 - Math.round(state.elapsedSeconds * 10));
  const spillMalus = state.respawns * 50;
  return Math.max(0, clues + timeBonus - spillMalus);
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
    const particles: Particle[] = [];

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
        request.audio.startMusic();
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
      if (statusKey !== undefined) {
        status.textContent = request.message(statusKey);
      }
      host.dataset.collected = String(collected);
      host.dataset.playerX = String(Math.round(state.x));
      if (grantedPower !== undefined) {
        host.dataset.powerActive = String(state.powerActive);
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
        narrate(config.narrativeRespawnKey);
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
      if (events.finished) {
        request.audio.playEffect("finish");
        request.audio.stopMusic();
        spawnDust(14, palette.pickup);
        narrate(config.narrativeFinishKey);
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

    const drawSky = (time: number): void => {
      const width = config.viewportWidth;
      const height = config.viewportHeight;
      const [top, middle, horizon] = backdrop.sky;
      context.fillStyle = top;
      context.fillRect(0, 0, width, 70);
      context.fillStyle = middle;
      context.fillRect(0, 70, width, 45);
      context.fillStyle = horizon;
      context.fillRect(0, 115, width, height - 115);

      if (!backdrop.night) {
        // Daylight: a sun and a few slow clouds instead of stars and moon.
        const sunX = 262 - camera * 0.04;
        context.fillStyle = palette.sun;
        context.beginPath();
        context.arc(sunX, 30, 13, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = palette.cloud;
        for (let index = 0; index < 6; index += 1) {
          const cloudX =
            (pseudoRandom(index + 11) * config.worldWidth - camera * 0.1) %
            config.worldWidth;
          const drawX = ((cloudX % width) + width) % width;
          const cloudY = 18 + pseudoRandom(index + 60) * 46;
          const cloudWidth = 14 + Math.floor(pseudoRandom(index + 90) * 18);
          context.fillRect(
            Math.floor(drawX),
            Math.floor(cloudY),
            cloudWidth,
            3,
          );
          context.fillRect(
            Math.floor(drawX) + 4,
            Math.floor(cloudY) - 2,
            cloudWidth - 8,
            2,
          );
        }
        return;
      }

      context.fillStyle = palette.star;
      for (let index = 0; index < 70; index += 1) {
        const starX =
          (pseudoRandom(index) * config.worldWidth - camera * 0.12) %
          config.worldWidth;
        const drawX = ((starX % width) + width) % width;
        const starY = pseudoRandom(index + 200) * 88;
        if ((index + Math.floor(time * 1.6)) % 9 !== 0) {
          context.fillRect(Math.floor(drawX), Math.floor(starY), 1, 1);
        }
      }

      const moonX = 252 - camera * 0.05;
      context.fillStyle = palette.moon;
      context.beginPath();
      context.arc(moonX, 34, 15, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = palette.moonShade;
      context.fillRect(Math.floor(moonX) - 5, 28, 4, 3);
      context.fillRect(Math.floor(moonX) + 3, 38, 5, 3);
      context.fillRect(Math.floor(moonX) - 1, 33, 3, 2);
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

    const drawGround = (): void => {
      for (const segment of config.groundSegments) {
        const startX = Math.floor(segment.x - camera);
        const segmentWidth = Math.ceil(segment.width);
        if (startX > config.viewportWidth || startX + segmentWidth < 0) {
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
      for (const platform of config.platforms) {
        const startX = Math.floor(platform.x - camera);
        if (startX > config.viewportWidth || startX + platform.width < 0) {
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
      } else {
        drawReeds(time);
      }
      drawCheckpoints();
      drawGround();
      drawPlatforms();
      drawObstacles(time);
      drawPickups(time);
      drawParticles();
      drawPowerRing(time);
      drawPlayer(time);
      drawScentMarkers();
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
      if (action === undefined || isInteractiveTarget(event.target)) {
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
        if (animationFrame !== undefined) {
          view.cancelAnimationFrame(animationFrame);
        }
      },
      resume(): void {
        if (!running && !destroyed && !state.completed) {
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
