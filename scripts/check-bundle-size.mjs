// The bundle-size gate (ADR-052): the 150 KB gzip budget of QUALITY.md was
// prose nobody checked. This makes a tighter ceiling part of `npm run check`,
// with the same zero-dependency approach as generate-icons.mjs.
//
// The JavaScript ceiling covers the Italian entry (~57 KB) plus the English
// catalogue chunk (~18 KB), loaded only on /en/ (ADR-060). The combined gate
// stays far under the documented 150 KB budget and catches a dependency or
// asset slipping into either route.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const distDir = new URL("../dist/assets/", import.meta.url).pathname;
const ceilings = new Map([
  [".js", 80_000],
  [".css", 10_000],
]);

let files;
try {
  files = readdirSync(distDir);
} catch {
  console.error(
    "check-bundle-size: dist/assets missing — run the build first.",
  );
  process.exit(1);
}

const totals = new Map();
const rows = [];
for (const file of files) {
  const extension = file.slice(file.lastIndexOf("."));
  if (!ceilings.has(extension)) {
    continue;
  }
  const gzipped = gzipSync(readFileSync(join(distDir, file))).length;
  totals.set(extension, (totals.get(extension) ?? 0) + gzipped);
  rows.push(`  ${file}: ${String(gzipped)} B gzip`);
}

console.log("Bundle sizes (gzip):");
for (const row of rows) {
  console.log(row);
}

let failed = false;
for (const [extension, ceiling] of ceilings) {
  const total = totals.get(extension) ?? 0;
  const verdict = total <= ceiling ? "ok" : "OVER BUDGET";
  console.log(
    `  total ${extension}: ${String(total)} B of ${String(ceiling)} B — ${verdict}`,
  );
  if (total > ceiling) {
    failed = true;
  }
}

if (failed) {
  console.error(
    "check-bundle-size: over budget. If the growth is intentional, raise the ceiling here and say why in the PR.",
  );
  process.exit(1);
}
