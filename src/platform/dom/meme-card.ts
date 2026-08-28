import { drawFrame, drawMoon, drawSky, drawStars, palette } from "./score-card";

/**
 * The completion meme card (ADR-049): the game's parting gift and its share
 * bait — a big pixel varano wearing the ending you earned. Painted entirely
 * in code like the score card, so no image asset ships; shared through the
 * same Web Share machinery. The one grave ending gets no meme: the tone rule
 * of AGENTS.md outranks virality.
 */

export const memeCardSize = 1080;

/** What the varano wears; each ending family that jokes maps to one. */
export type MemeAccessory =
  "crown" | "sunglasses" | "monocle" | "bowtie" | "mystery";

export interface MemeCardData {
  /** Small header line: the game and its LEGGENDA stamp, always on board. */
  readonly header: string;
  /** The meme line, drawn uppercase: the ending's own title. */
  readonly caption: string;
  readonly accessory: MemeAccessory;
  readonly siteLabel: string;
  /** The ending's numbered position, e.g. «FINALE 2/6» (FASE 4). */
  readonly endingLabel?: string;
  /** The role and clues line, e.g. «Custode · 8/10 indizi» (FASE 4). */
  readonly detailLine?: string;
}

/**
 * The big head, drawn on a chunky pixel grid: profile facing right, like the
 * in-game sprite but close up, so the accessory reads at feed size.
 */
function drawHead(
  context: CanvasRenderingContext2D,
  size: number,
): { eyeX: number; eyeY: number; pixel: number; top: number } {
  const pixel = Math.floor(size * 0.03);
  const originX = size * 0.2;
  const top = size * 0.3;

  // Skull and jaw, two green slabs with a lighter throat.
  context.fillStyle = palette.bodyGreen;
  context.fillRect(originX, top, 14 * pixel, 8 * pixel);
  context.fillRect(originX + 12 * pixel, top + 3 * pixel, 8 * pixel, 5 * pixel);
  context.fillStyle = palette.belly;
  context.fillRect(originX + pixel, top + 8 * pixel, 16 * pixel, 3 * pixel);
  // Snout tip and the mouth line.
  context.fillStyle = palette.bodyGreen;
  context.fillRect(originX + 18 * pixel, top + 5 * pixel, 3 * pixel, 3 * pixel);
  context.fillStyle = palette.bodyDark;
  context.fillRect(originX + 12 * pixel, top + 7 * pixel, 9 * pixel, pixel);
  // Scale marks along the skull.
  for (let index = 1; index < 11; index += 3) {
    context.fillRect(originX + index * pixel, top + pixel, pixel, pixel);
  }
  // The flicked tongue, forked.
  context.fillStyle = palette.tongue;
  context.fillRect(originX + 21 * pixel, top + 7 * pixel, 3 * pixel, pixel);
  context.fillRect(
    originX + 23 * pixel,
    top + 6 * pixel,
    pixel,
    Math.ceil(pixel / 2),
  );
  context.fillRect(
    originX + 23 * pixel,
    top + (7.5 - 0.5) * pixel + pixel,
    pixel,
    Math.ceil(pixel / 2),
  );

  // The eye: big, so the monocle and the sunglasses have something to sit on.
  const eyeX = originX + 10 * pixel;
  const eyeY = top + 3 * pixel;
  context.fillStyle = palette.text;
  context.fillRect(eyeX, eyeY, 3 * pixel, 3 * pixel);
  context.fillStyle = palette.eye;
  context.fillRect(eyeX + pixel, eyeY + pixel, pixel, pixel);

  return { eyeX, eyeY, pixel, top };
}

function drawCrown(
  context: CanvasRenderingContext2D,
  size: number,
  pixel: number,
  top: number,
): void {
  const baseX = size * 0.2 + 3 * pixel;
  const baseY = top - 3 * pixel;
  context.fillStyle = palette.accent;
  context.fillRect(baseX, baseY, 8 * pixel, 2 * pixel);
  for (const point of [0, 3, 6]) {
    context.fillRect(
      baseX + point * pixel,
      baseY - 2 * pixel,
      2 * pixel,
      2 * pixel,
    );
  }
  // Jewels, one per point.
  context.fillStyle = palette.tongue;
  context.fillRect(baseX + 3.5 * pixel, baseY + 0.5 * pixel, pixel, pixel);
}

function drawSunglasses(
  context: CanvasRenderingContext2D,
  eyeX: number,
  eyeY: number,
  pixel: number,
): void {
  context.fillStyle = palette.eye;
  // Lens over the eye, band running back across the skull.
  context.fillRect(eyeX - pixel, eyeY - pixel, 5 * pixel, 4 * pixel);
  context.fillRect(eyeX - 9 * pixel, eyeY, 8 * pixel, pixel);
  // The glint that sells it.
  context.fillStyle = palette.muted;
  context.fillRect(eyeX + 2 * pixel, eyeY, pixel, pixel);
}

function drawMonocle(
  context: CanvasRenderingContext2D,
  eyeX: number,
  eyeY: number,
  pixel: number,
): void {
  context.strokeStyle = palette.accent;
  context.lineWidth = Math.max(4, pixel / 2);
  context.strokeRect(eyeX - pixel, eyeY - pixel, 5 * pixel, 5 * pixel);
  // The chain, swinging down from the rim.
  context.fillStyle = palette.accent;
  for (let link = 0; link < 5; link += 1) {
    context.fillRect(
      eyeX - pixel - link * 0.4 * pixel,
      eyeY + (4 + link * 1.5) * pixel,
      Math.ceil(pixel / 2),
      Math.ceil(pixel / 2),
    );
  }
}

function drawBowtie(
  context: CanvasRenderingContext2D,
  size: number,
  pixel: number,
  top: number,
): void {
  const knotX = size * 0.2 + 2 * pixel;
  const knotY = top + 11 * pixel;
  context.fillStyle = palette.tongue;
  context.fillRect(knotX, knotY, pixel, pixel);
  context.fillRect(knotX - 2 * pixel, knotY - pixel, 2 * pixel, 3 * pixel);
  context.fillRect(knotX + pixel, knotY - pixel, 2 * pixel, 3 * pixel);
  // The satin highlight: a sovereign travels well dressed.
  context.fillStyle = palette.text;
  context.fillRect(
    knotX - pixel,
    knotY - 0.5 * pixel,
    Math.ceil(pixel / 2),
    pixel,
  );
}

/** «Una muta, forse»: no head at all — two eyes in the dark and the doubt. */
function drawMystery(context: CanvasRenderingContext2D, size: number): void {
  context.fillStyle = "rgb(8 18 14 / 78%)";
  context.fillRect(0, size * 0.24, size, size * 0.42);
  context.fillStyle = palette.accent;
  const eyeY = size * 0.42;
  for (const eyeX of [size * 0.38, size * 0.52]) {
    context.fillRect(eyeX, eyeY, size * 0.045, size * 0.03);
  }
  context.font = `800 ${String(Math.floor(size * 0.16))}px ui-monospace, monospace`;
  context.textAlign = "center";
  context.fillText("?", size * 0.72, size * 0.5);
}

export function drawMemeCard(
  canvas: HTMLCanvasElement,
  data: MemeCardData,
): HTMLCanvasElement {
  const size = memeCardSize;
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

  // Ground band under the portrait, so the head is not floating in the sky.
  context.fillStyle = palette.corn;
  context.fillRect(0, size * 0.66, size, size * 0.34);
  context.fillStyle = palette.grass;
  context.fillRect(0, size * 0.66, size, size * 0.02);

  if (data.accessory === "mystery") {
    drawMystery(context, size);
  } else {
    const head = drawHead(context, size);
    switch (data.accessory) {
      case "crown":
        drawCrown(context, size, head.pixel, head.top);
        break;
      case "sunglasses":
        drawSunglasses(context, head.eyeX, head.eyeY, head.pixel);
        break;
      case "monocle":
        drawMonocle(context, head.eyeX, head.eyeY, head.pixel);
        break;
      case "bowtie":
        drawBowtie(context, size, head.pixel, head.top);
        break;
    }
  }

  context.textAlign = "center";
  context.textBaseline = "alphabetic";

  // The LEGGENDA stamp travels with the image: shared out of context, the
  // card still says it is fiction.
  context.fillStyle = palette.muted;
  context.font = `700 38px ui-monospace, monospace`;
  context.fillText(data.header, size / 2, size * 0.12);

  // The numbered ending (FASE 4), small and bright, above the portrait.
  if (data.endingLabel !== undefined && data.endingLabel !== "") {
    context.fillStyle = palette.accent;
    context.font = `800 44px ui-monospace, monospace`;
    context.fillText(data.endingLabel, size / 2, size * 0.17);
  }

  // The meme line, in the meme voice: uppercase, loud, centred.
  const caption = data.caption.toUpperCase();
  const captionSize = caption.length > 18 ? 72 : 96;
  context.fillStyle = palette.accent;
  context.font = `800 ${String(captionSize)}px ui-monospace, monospace`;
  context.fillText(caption, size / 2, size * 0.8);

  // The role and clue count (FASE 4), the quiet fact under the joke.
  if (data.detailLine !== undefined && data.detailLine !== "") {
    context.fillStyle = palette.text;
    context.font = `700 40px ui-monospace, monospace`;
    context.fillText(data.detailLine, size / 2, size * 0.855);
  }

  context.fillStyle = "rgb(8 18 14 / 82%)";
  context.fillRect(46, size * 0.882, size - 92, size * 0.062);
  context.fillStyle = palette.text;
  context.font = `700 34px ui-monospace, monospace`;
  context.fillText(data.siteLabel, size / 2, size * 0.925);

  drawFrame(context, size);
  return canvas;
}
