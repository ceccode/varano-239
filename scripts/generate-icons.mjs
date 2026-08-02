// Generates the PWA icons from a 16x16 pixel-art grid, without dependencies.
// Usage: node scripts/generate-icons.mjs

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

const palette = {
  ".": [10, 15, 38, 255], // night sky
  O: [242, 238, 215, 255], // moon
  G: [87, 176, 107, 255], // varano
  E: [16, 24, 32, 255], // eye
  D: [47, 122, 66, 255], // legs
  g: [47, 122, 66, 255], // grass
  b: [59, 42, 27, 255], // dirt
};

const art = [
  "................",
  "............OO..",
  "...........OOOO.",
  "...........OOOO.",
  "............OO..",
  "................",
  "................",
  "............GG..",
  "..GGGGGGGGGGGGG.",
  ".GGGGGGGGGGGGGG.",
  "GG.GGGGGGGGGGEG.",
  "...GGGGGGGGGGGG.",
  "...D.D.....D.D..",
  "gggggggggggggggg",
  "bbbbbbbbbbbbbbbb",
  "bbbbbbbbbbbbbbbb",
];

const crcTable = new Uint32Array(256).map((_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(size) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0; // filter: none
    const gridY = Math.min(15, Math.floor((y * 16) / size));
    const row = art[gridY];
    for (let x = 0; x < size; x += 1) {
      const gridX = Math.min(15, Math.floor((x * 16) / size));
      const color = palette[row[gridX]] ?? palette["."];
      const offset = rowStart + 1 + x * 4;
      raw[offset] = color[0];
      raw[offset + 1] = color[1];
      raw[offset + 2] = color[2];
      raw[offset + 3] = color[3];
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // color type: RGBA
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync(new URL("../public/icons/", import.meta.url), { recursive: true });
for (const [name, size] of [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-touch-icon.png", 180],
]) {
  const file = new URL(`../public/icons/${name}`, import.meta.url);
  writeFileSync(file, encodePng(size));
  console.log(`written ${name} (${size}x${size})`);
}
