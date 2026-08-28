// Captures marketing screenshots, a gameplay GIF and short videos from the
// real running game, driving it exactly like the end-to-end tests.
// Usage: node scripts/capture-gameplay-assets.mjs
// Requires: a build (run `npm run build` first if dist/ is missing), Playwright
// Chromium, and ffmpeg on PATH.

import { chromium } from "playwright";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const marketingDir = fileURLToPath(new URL("../marketing", import.meta.url));
const port = 4173;
const base = `http://127.0.0.1:${port}/`;
const viewport = { width: 1280, height: 720 };

// Visible copy, matched as substrings so typographic apostrophes never matter.
const ROLE = "Il Varano";
const SKIP = "Salta il livello";
const CONTINUE = "Continua";
const PROTECT = "Lascia libero il passaggio";
const CORRIDOR = "Apri il corridoio";
const MEME = "Condividi la card";
const INTERLUDES = [
  "Richiama il numero", // c01 — le chat di paese
  "Fotografa tutto", // c05 — la zona interdetta
  "Pubblica il dubbio", // c06 — tre identità
  "Segui la coda", // c07 — acqua e impronte
  "Riordina prima i fatti", // c08 — il borgo delle versioni
  "Metti in sicurezza", // c09 — il colle di San Pancrazio
  "Consegna la registrazione", // c02 — varano superstar
  "la serratura", // c03 — il parco del Castello
];

async function click(page, name) {
  const button = page.getByRole("button", { name }).first();
  await button.waitFor({ state: "visible", timeout: 30_000 });
  await button.click();
}

async function ensureServer() {
  if (
    !existsSync(fileURLToPath(new URL("../dist/index.html", import.meta.url)))
  ) {
    console.log("dist missing: running npm run build…");
    const build = spawnSync("npm", ["run", "build"], { stdio: "inherit" });
    if (build.status !== 0) {
      throw new Error("build failed");
    }
  }
  const server = spawn(
    "npm",
    ["run", "preview", "--", "--host", "127.0.0.1", "--port", String(port)],
    { stdio: "ignore" },
  );
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(base);
      if (response.ok) {
        return server;
      }
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  server.kill();
  throw new Error("preview server did not come up");
}

async function run(page, milliseconds) {
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(milliseconds);
  await page.keyboard.up("ArrowRight");
}

mkdirSync(marketingDir, { recursive: true });

const server = await ensureServer();
const browser = await chromium.launch();
try {
  // ── Screenshots ──────────────────────────────────────────────────────────
  const page = await browser.newPage({ viewport });
  await page.goto(base);
  await page.waitForLoadState("networkidle");
  await page.screenshot({
    path: `${marketingDir}/screenshot-role-selection.png`,
  });

  await click(page, ROLE);
  await page.waitForTimeout(800);
  await run(page, 1200);
  await page.screenshot({ path: `${marketingDir}/screenshot-gameplay-1.png` });

  // A jump, mid-air, for a second gameplay frame.
  await page.keyboard.down("ArrowRight");
  await page.keyboard.press("ArrowUp");
  await page.waitForTimeout(260);
  await page.screenshot({ path: `${marketingDir}/screenshot-gameplay-2.png` });
  await page.keyboard.up("ArrowRight");

  await click(page, SKIP);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${marketingDir}/screenshot-narrative.png` });
  await click(page, CONTINUE);
  await click(page, PROTECT);

  for (const choice of INTERLUDES) {
    await click(page, SKIP);
    await click(page, CONTINUE);
    await click(page, choice);
  }
  // c04 — dentro il Castello: no interlude, hands over to the confrontation.
  await click(page, SKIP);
  await click(page, CONTINUE);

  await click(page, CORRIDOR);
  await page
    .getByRole("button", { name: MEME })
    .first()
    .waitFor({ timeout: 30_000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${marketingDir}/screenshot-ending.png` });

  const cardDataUrl = await page.evaluate(() => {
    const canvas = document.querySelector("canvas.score-card");
    return canvas instanceof HTMLCanvasElement
      ? canvas.toDataURL("image/png")
      : null;
  });
  if (cardDataUrl !== null) {
    writeFileSync(
      `${marketingDir}/share-card.png`,
      Buffer.from(
        cardDataUrl.replace(/^data:image\/png;base64,/, ""),
        "base64",
      ),
    );
    console.log("written share-card.png (1080x1080 meme card)");
  }
  await page.close();

  // ── GIF + video, recorded from a fresh level 1 run ───────────────────────
  const videoDir = fileURLToPath(
    new URL("../.vite/marketing-video", import.meta.url),
  );
  mkdirSync(videoDir, { recursive: true });
  const recordContext = await browser.newContext({
    viewport,
    recordVideo: { dir: videoDir, size: viewport },
  });
  const recordPage = await recordContext.newPage();
  await recordPage.goto(base);
  await recordPage.waitForLoadState("networkidle");
  await click(recordPage, ROLE);
  await recordPage.waitForTimeout(500);

  await recordPage.keyboard.down("ArrowRight");
  const jumpTimer = setInterval(() => {
    void recordPage.keyboard.press("ArrowUp").catch(() => undefined);
  }, 1400);
  await recordPage.waitForTimeout(32_000);
  clearInterval(jumpTimer);
  await recordPage.keyboard.up("ArrowRight");
  await recordContext.close();

  const webm = readdirSync(videoDir).find((name) => name.endsWith(".webm"));
  if (webm === undefined) {
    throw new Error("no recorded video produced");
  }
  const clip = `${videoDir}/${webm}`;
  console.log(`recorded ${webm}`);

  const ffmpeg = (args) =>
    spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], {
      stdio: "inherit",
    });

  ffmpeg([
    "-i",
    clip,
    "-t",
    "15",
    "-vf",
    "scale=1280:-2:flags=lanczos",
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "23",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-an",
    `${marketingDir}/gameplay-15s.mp4`,
  ]);
  console.log("written gameplay-15s.mp4");

  ffmpeg([
    "-i",
    clip,
    "-t",
    "30",
    "-vf",
    "scale=1280:-2:flags=lanczos",
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "23",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-an",
    `${marketingDir}/gameplay-30s.mp4`,
  ]);
  console.log("written gameplay-30s.mp4");

  ffmpeg([
    "-ss",
    "0.5",
    "-t",
    "8",
    "-i",
    clip,
    "-vf",
    "fps=15,scale=640:-1:flags=lanczos,palettegen=max_colors=128",
    `${videoDir}/palette.png`,
  ]);
  ffmpeg([
    "-ss",
    "0.5",
    "-t",
    "8",
    "-i",
    clip,
    "-i",
    `${videoDir}/palette.png`,
    "-lavfi",
    "fps=15,scale=640:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5",
    "-loop",
    "0",
    `${marketingDir}/gameplay.gif`,
  ]);
  console.log("written gameplay.gif");
} finally {
  await browser.close();
  server.kill();
}
