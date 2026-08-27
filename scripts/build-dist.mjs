#!/usr/bin/env node
/**
 * Builds the distributable web zip (FASE 8 of the launch plan):
 *
 *   npm run dist
 *
 * What it does, in order:
 *   1. builds the game with a relative base («./») and no service worker;
 *   2. fails if the artifact leaks absolute asset paths or PWA artifacts;
 *   3. packages `dist-dist/` into `varano239-web.zip`, index.html at the root.
 *
 * The zip is meant for portals that host the game in an iframe (itch.io first):
 * relative asset references work from any mounting path, the service worker is
 * skipped because portal iframes cannot register one, and no runtime code
 * depends on the production domains.
 */
import { execFileSync } from "node:child_process";
import {
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const viteBin = join(root, "node_modules", ".bin", "vite");
const outDir = join(root, "dist-dist");
const zipPath = join(root, "varano239-web.zip");

if (!existsSync(viteBin)) {
  console.error("Dependencies not installed. Run `npm ci` first.");
  process.exit(1);
}

function hasZip() {
  try {
    execFileSync("zip", ["-v"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

// 1. Clean and build with the distribution environment.
for (const target of [outDir, zipPath]) {
  rmSync(target, { recursive: true, force: true });
}
console.log("→ Building with relative base ./ and no service worker…");
execFileSync(viteBin, ["build"], {
  cwd: root,
  env: {
    ...process.env,
    VITE_BASE_PATH: "./",
    VITE_NO_SW: "1",
    VITE_OUT_DIR: outDir,
  },
  stdio: "inherit",
});

// 2. Verify the artifact.
const failures = [];
if (existsSync(join(outDir, "sw.js"))) {
  failures.push("unexpected sw.js in the distributable build");
}

for (const htmlFile of ["index.html", join("en", "index.html")]) {
  const html = readFileSync(join(outDir, htmlFile), "utf8");
  const absolute = html.match(/(?:src|href|poster)="\//g);
  if (absolute) {
    failures.push(`absolute reference in ${htmlFile}: ${absolute[0]}`);
  }
  // A resource is loaded from an external origin only through src/srcset (or a
  // non-metadata <link rel>). Canonical/hreflang meta tags and <a> hyperlinks
  // (e.g. the GitHub sources link) intentionally stay absolute: they are not
  // dependencies of the zip.
  const externalSrc = html.match(/(?:src|srcset|poster)="https:[^"]*"/g);
  if (externalSrc) {
    failures.push(
      `${htmlFile} loads a resource from an external origin: ${externalSrc[0]}`,
    );
  }
  const linkTags = html.match(/<link\b[^>]*>/g) ?? [];
  for (const tag of linkTags) {
    const href = /href="([^"]*)"/.exec(tag)?.[1] ?? "";
    const rel = /rel="([^"]*)"/.exec(tag)?.[1] ?? "";
    if (
      href.startsWith("https://") &&
      !["canonical", "alternate", "author", "license"].includes(rel)
    ) {
      failures.push(
        `${htmlFile} <link rel="${rel}" href="${href}"> loads an external resource`,
      );
    }
  }
}

// The runtime bundle must not load anything from the production domains and a
// build should not fetch remote resources at runtime at all.
const jsFiles = readdirSync(join(outDir, "assets"), {
  recursive: true,
}).filter((name) => name.endsWith(".js"));
for (const name of jsFiles) {
  const code = readFileSync(join(outDir, "assets", name), "utf8");
  if (code.includes("varano239.it")) {
    failures.push(`runtime reference to a production domain in ${name}`);
  }
  if (/fetch\(\s*["'`](?:https?:|\/)/.test(code)) {
    failures.push(`runtime fetch to an absolute URL in ${name}`);
  }
}
const cssFiles = readdirSync(join(outDir, "assets"), {
  recursive: true,
}).filter((name) => name.endsWith(".css"));
for (const name of cssFiles) {
  const code = readFileSync(join(outDir, "assets", name), "utf8");
  if (/url\(\s*["']?https?:/.test(code)) {
    failures.push(`css loads a remote resource in ${name}`);
  }
}

if (failures.length > 0) {
  console.error("Distributable build check failed:");
  for (const failure of failures) {
    console.error(`  ✗ ${failure}`);
  }
  process.exit(1);
}
console.log("  ✓ no service worker, no absolute paths, no domain dependence");

// 3. Package the zip with index.html at the root.
if (!hasZip()) {
  console.error("`zip` is not available on this system.");
  process.exit(1);
}
execFileSync("zip", ["-r", "-q", zipPath, "."], { cwd: outDir });
const zipSize = statSync(zipPath).size;
const entries = [];
for (const name of readdirSync(outDir, { recursive: true }).sort()) {
  entries.push(name);
}

console.log("→ varano239-web.zip");
console.log(`  ${(zipSize / 1024).toFixed(1)} KB · ${entries.length} files`);
for (const name of entries.slice(0, 40)) {
  console.log(`  · ${name}`);
}
if (entries.length > 40) {
  console.log(`  … and ${entries.length - 40} more`);
}
