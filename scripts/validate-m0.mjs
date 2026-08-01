import { readFile, readdir } from "node:fs/promises";
import { URL } from "node:url";

const projectRoot = new URL("../", import.meta.url);
const packageManifest = JSON.parse(
  await readFile(new URL("package.json", projectRoot), "utf8"),
);
const runtimeDependencies = packageManifest.dependencies ?? {};

if (Object.keys(runtimeDependencies).length > 0) {
  throw new Error("M0 must not declare runtime dependencies.");
}

const contentDirectory = new URL("src/content/", projectRoot);
const allowedContentFiles = new Set([
  "dossier.ts",
  "locales/it.ts",
  "story-pack.ts",
]);
const contentFiles = (await readdir(contentDirectory, { recursive: true }))
  .filter((path) => path.endsWith(".ts"))
  .map((path) => path.replaceAll("\\", "/"))
  .sort();
const unexpectedContentFiles = contentFiles.filter(
  (path) => !allowedContentFiles.has(path),
);

if (unexpectedContentFiles.length > 0) {
  throw new Error(
    `M0 cannot include story content before validateContent exists: ${unexpectedContentFiles.join(", ")}`,
  );
}

console.log(
  "M0 validation passed: contracts compile, runtime dependencies and story content are absent.",
);
