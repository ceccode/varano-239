// Rasterizes the hand-authored brand SVGs in /marketing into PNGs.
// Usage: node scripts/render-brand-assets.mjs
// Requires a Chromium install for Playwright (npx playwright install chromium).

import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const marketingDir = fileURLToPath(new URL("../marketing", import.meta.url));

const targets = [
  {
    svg: "logo.svg",
    png: "logo.png",
    width: 760,
    height: 200,
    transparent: true,
  },
  {
    svg: "cover-landscape.svg",
    png: "cover-landscape.png",
    width: 1280,
    height: 720,
    transparent: false,
  },
  {
    svg: "cover-square.svg",
    png: "cover-square.png",
    width: 1200,
    height: 1200,
    transparent: false,
  },
  {
    svg: "cover-portrait.svg",
    png: "cover-portrait.png",
    width: 1080,
    height: 1350,
    transparent: false,
  },
  {
    svg: "og-image.svg",
    png: "og-image.png",
    width: 1200,
    height: 630,
    transparent: false,
  },
];

mkdirSync(marketingDir, { recursive: true });

const browser = await chromium.launch();
try {
  for (const target of targets) {
    const svg = readFileSync(`${marketingDir}/${target.svg}`, "utf8");
    const page = await browser.newPage({
      viewport: { width: target.width, height: target.height },
    });
    await page.setContent(svg);
    await page.screenshot({
      path: `${marketingDir}/${target.png}`,
      omitBackground: target.transparent,
    });
    await page.close();
    console.log(`written ${target.png} (${target.width}x${target.height})`);
  }
} finally {
  await browser.close();
}
