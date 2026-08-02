import type { MessageKey } from "../../core/model";
import type { MiniGameHandle, MiniGamePort } from "../contract";
import {
  cameraX,
  createPlatformerState,
  stepPlatformer,
  type PlatformerConfig,
  type PlatformerEvents,
  type PlatformerState,
} from "../platformer-model";

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
}

interface MutableInput {
  left: boolean;
  right: boolean;
  jumpPressed: boolean;
  jumpHeld: boolean;
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

function keyDirection(key: string): "left" | "right" | "jump" | undefined {
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
    };
    let previousTime: number | undefined;
    let accumulator = 0;
    let animationFrame: number | undefined;
    let completionTimer: number | undefined;
    let running = true;
    let destroyed = false;
    let completionSent = false;
    let camera = 0;
    let runPhase = 0;
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
    controls.append(moveCluster, jumpButton);

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

    const drawBackground = (time: number): void => {
      const width = config.viewportWidth;
      const height = config.viewportHeight;
      context.fillStyle = palette.skyTop;
      context.fillRect(0, 0, width, 70);
      context.fillStyle = palette.skyMid;
      context.fillRect(0, 70, width, 45);
      context.fillStyle = palette.skyHorizon;
      context.fillRect(0, 115, width, height - 115);

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

      context.fillStyle = palette.hillFarSolid;
      const hillOffset = camera * 0.3;
      for (let index = -1; index < 5; index += 1) {
        const base = index * 150 - (hillOffset % 150);
        const hillHeight =
          26 + pseudoRandom(index + Math.floor(hillOffset / 150)) * 14;
        context.beginPath();
        context.arc(base + 75, 132, hillHeight + 42, Math.PI, 0);
        context.fill();
      }

      const cornOffset = camera * 0.6;
      context.fillStyle = palette.corn;
      context.fillRect(0, 128, width, config.floorY - 128 + 40);
      context.fillStyle = palette.cornLight;
      for (let index = -1; index < 46; index += 1) {
        const stalkX = index * 8 - (cornOffset % 8);
        const stalkHeight =
          10 + pseudoRandom(index + Math.floor(cornOffset / 8)) * 9;
        context.fillRect(
          Math.floor(stalkX),
          128 - Math.floor(stalkHeight),
          2,
          Math.floor(stalkHeight),
        );
      }
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

    const drawFinish = (time: number): void => {
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
      drawFinish(time);
      drawCheckpoints();
      drawGround();
      drawPlatforms();
      drawPickups(time);
      drawParticles();
      drawPlayer(time);
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
          const score = levelScore(state);
          completionTimer = view.setTimeout(() => {
            request.onComplete(score);
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
      event.preventDefault();
      ensureMusic();
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
