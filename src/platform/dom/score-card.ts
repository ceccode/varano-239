import type { MessageKey } from "../../core/model";

/**
 * Draws the shareable score card: a square pixel-art postcard of the run.
 * Everything is painted procedurally, so no image asset has to be shipped.
 */

export const scoreCardSize = 1080;

export interface ScoreCardData {
  readonly title: string;
  readonly subtitle: string;
  readonly roleName: string;
  readonly score: number;
  readonly clues: number;
  readonly totalClues: number;
  readonly seconds: number;
  readonly isRecord: boolean;
  readonly siteLabel: string;
  readonly message: (key: MessageKey) => string;
}

const palette = {
  skyTop: "#0a0f26",
  skyMid: "#10203f",
  horizon: "#1c3350",
  hills: "#132731",
  corn: "#0e2418",
  cornLight: "#173622",
  grass: "#2f7a42",
  grassLight: "#49a35c",
  dirt: "#3b2a1b",
  dirtDark: "#2a1d12",
  moon: "#f2eed7",
  moonShade: "#d9d4b4",
  star: "#e8ecff",
  accent: "#ffcf5a",
  text: "#f4f1df",
  muted: "#c8d1c9",
  bodyGreen: "#57b06b",
  bodyDark: "#2f7a42",
  belly: "#8ed49b",
  eye: "#101820",
  frame: "#08120e",
} as const;

const display = "ui-monospace, 'Cascadia Mono', monospace";
const body =
  "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function pseudoRandom(seed: number): number {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function drawSky(context: CanvasRenderingContext2D, size: number): void {
  const gradient = context.createLinearGradient(0, 0, 0, size * 0.72);
  gradient.addColorStop(0, palette.skyTop);
  gradient.addColorStop(0.6, palette.skyMid);
  gradient.addColorStop(1, palette.horizon);
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
}

function drawStars(context: CanvasRenderingContext2D, size: number): void {
  context.fillStyle = palette.star;
  for (let index = 0; index < 90; index += 1) {
    const x = Math.floor(pseudoRandom(index) * size);
    const y = Math.floor(pseudoRandom(index + 500) * size * 0.55);
    const pixel = pseudoRandom(index + 900) > 0.85 ? 8 : 5;
    context.fillRect(x, y, pixel, pixel);
  }
}

/** Sits in the clear sky on the right, clear of the centred title and stats. */
function drawMoon(context: CanvasRenderingContext2D, size: number): void {
  const x = size * 0.85;
  const y = size * 0.33;
  const radius = size * 0.048;
  context.fillStyle = palette.moon;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = palette.moonShade;
  context.fillRect(x - radius * 0.45, y - radius * 0.35, radius * 0.3, 10);
  context.fillRect(x + radius * 0.15, y + radius * 0.25, radius * 0.35, 10);
  context.fillRect(x - radius * 0.1, y + radius * 0.05, radius * 0.2, 8);
}

function drawLandscape(context: CanvasRenderingContext2D, size: number): void {
  const horizon = size * 0.7;

  context.fillStyle = palette.hills;
  for (let index = -1; index < 4; index += 1) {
    const centerX = index * size * 0.36 + size * 0.1;
    context.beginPath();
    context.arc(
      centerX,
      horizon + size * 0.02,
      size * (0.14 + pseudoRandom(index + 21) * 0.06),
      Math.PI,
      0,
    );
    context.fill();
  }

  context.fillStyle = palette.corn;
  context.fillRect(0, horizon, size, size - horizon);
  context.fillStyle = palette.cornLight;
  for (let x = 0; x < size; x += 26) {
    const stalkHeight = 34 + pseudoRandom(x) * 30;
    context.fillRect(x, horizon - stalkHeight, 7, stalkHeight);
  }

  const groundTop = size * 0.86;
  context.fillStyle = palette.dirt;
  context.fillRect(0, groundTop, size, size - groundTop);
  context.fillStyle = palette.dirtDark;
  for (let x = 0; x < size; x += 48) {
    context.fillRect(x + 12, groundTop + 34, 18, 10);
    context.fillRect(x + 30, groundTop + 62, 14, 10);
  }
  context.fillStyle = palette.grass;
  context.fillRect(0, groundTop - 10, size, 18);
  context.fillStyle = palette.grassLight;
  for (let x = 0; x < size; x += 20) {
    context.fillRect(x, groundTop - 16, 7, 7);
  }
}

/** The same silhouette as the in-game sprite, painted with chunky pixels. */
function drawVarano(
  context: CanvasRenderingContext2D,
  originX: number,
  baseY: number,
  pixel: number,
): void {
  const width = 24 * pixel;
  const height = 14 * pixel;
  const top = baseY - height;

  context.fillStyle = palette.bodyDark;
  for (let index = 0; index < 8; index += 1) {
    context.fillRect(
      originX - (8 - index) * pixel,
      top + height - 6 * pixel - index * 0.2 * pixel,
      pixel,
      pixel,
    );
  }

  context.fillStyle = palette.bodyGreen;
  context.fillRect(
    originX + pixel,
    top + 4 * pixel,
    width - 8 * pixel,
    height - 8 * pixel,
  );
  context.fillStyle = palette.belly;
  context.fillRect(
    originX + 2 * pixel,
    top + height - 5 * pixel,
    width - 10 * pixel,
    2 * pixel,
  );
  context.fillStyle = palette.bodyDark;
  for (let index = 3; index < 15; index += 4) {
    context.fillRect(
      originX + index * pixel,
      top + 4 * pixel,
      pixel,
      2 * pixel,
    );
  }

  context.fillStyle = palette.bodyGreen;
  context.fillRect(
    originX + width - 9 * pixel,
    top + 2 * pixel,
    8 * pixel,
    6 * pixel,
  );
  context.fillRect(
    originX + width - 4 * pixel,
    top + 4 * pixel,
    4 * pixel,
    4 * pixel,
  );
  context.fillStyle = palette.eye;
  context.fillRect(
    originX + width - 5 * pixel,
    top + 3 * pixel,
    2 * pixel,
    2 * pixel,
  );

  context.fillStyle = palette.bodyDark;
  for (const legX of [3, 8, width / pixel - 13, width / pixel - 8]) {
    context.fillRect(
      originX + legX * pixel,
      baseY - 4 * pixel,
      2 * pixel,
      4 * pixel,
    );
  }
}

function drawFrame(context: CanvasRenderingContext2D, size: number): void {
  context.strokeStyle = palette.frame;
  context.lineWidth = 28;
  context.strokeRect(14, 14, size - 28, size - 28);
  context.strokeStyle = palette.accent;
  context.lineWidth = 10;
  context.strokeRect(33, 33, size - 66, size - 66);
}

function drawStat(
  context: CanvasRenderingContext2D,
  centerX: number,
  y: number,
  label: string,
  value: string,
): void {
  context.textAlign = "center";
  context.fillStyle = palette.muted;
  context.font = `700 34px ${display}`;
  context.fillText(label, centerX, y);
  context.fillStyle = palette.text;
  context.font = `800 62px ${display}`;
  context.fillText(value, centerX, y + 66);
}

export function drawScoreCard(
  canvas: HTMLCanvasElement,
  data: ScoreCardData,
): HTMLCanvasElement {
  const size = scoreCardSize;
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (context === null) {
    return canvas;
  }

  context.imageSmoothingEnabled = false;
  drawSky(context, size);
  drawStars(context, size);
  drawMoon(context, size);
  drawLandscape(context, size);
  drawVarano(context, size * 0.07, size * 0.868, 11);

  context.textAlign = "center";
  context.textBaseline = "alphabetic";

  context.fillStyle = palette.accent;
  context.font = `800 116px ${display}`;
  context.fillText(data.title, size / 2, size * 0.17);

  context.fillStyle = palette.muted;
  context.font = `500 40px ${body}`;
  context.fillText(data.subtitle, size / 2, size * 0.225);

  context.fillStyle = palette.text;
  context.font = `700 44px ${body}`;
  context.fillText(data.roleName, size / 2, size * 0.315);

  context.fillStyle = palette.accent;
  context.font = `800 190px ${display}`;
  context.fillText(String(data.score), size / 2, size * 0.475);
  context.fillStyle = palette.muted;
  context.font = `700 40px ${display}`;
  context.fillText(
    data.message("core.message.ui.card.score"),
    size / 2,
    size * 0.52,
  );

  const statsY = size * 0.6;
  drawStat(
    context,
    size * 0.32,
    statsY,
    data.message("core.message.ui.card.clues"),
    `${String(data.clues)}/${String(data.totalClues)}`,
  );
  drawStat(
    context,
    size * 0.68,
    statsY,
    data.message("core.message.ui.card.time"),
    `${String(data.seconds)}s`,
  );

  if (data.isRecord) {
    context.fillStyle = palette.accent;
    context.font = `800 46px ${display}`;
    context.fillText(
      data.message("core.message.ui.card.record"),
      size / 2,
      size * 0.715,
    );
  }

  // A dark plate keeps the footer legible over the ground pixels.
  context.fillStyle = "rgb(8 18 14 / 82%)";
  context.fillRect(46, size * 0.882, size - 92, size * 0.078);
  context.fillStyle = palette.text;
  context.font = `700 32px ${display}`;
  context.fillText(
    data.message("core.message.ui.card.level"),
    size / 2,
    size * 0.917,
  );
  context.fillStyle = palette.accent;
  context.font = `700 30px ${display}`;
  context.fillText(data.siteLabel, size / 2, size * 0.953);

  drawFrame(context, size);
  return canvas;
}
