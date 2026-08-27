import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { defineConfig, loadEnv, type Plugin } from "vite";

import { appConfig } from "./src/app/config.ts";
import { renderServiceWorker } from "./src/platform/pwa/sw-template.ts";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/**
 * The policy stays as tight as possible: the analytics hosts are added only
 * when an endpoint is configured, so local and test builds keep 'self' only.
 */
function contentSecurityPolicy(analyticsEndpoint: string): string {
  const scriptHosts = ["'self'"];
  const beaconHosts = ["'self'"];

  if (analyticsEndpoint !== "") {
    scriptHosts.push("https://gc.zgo.at");
    beaconHosts.push(new URL(analyticsEndpoint).origin);
  }

  return [
    "default-src 'self'",
    `script-src ${scriptHosts.join(" ")}`,
    "style-src 'self'",
    `img-src 'self' data: ${beaconHosts.slice(1).join(" ")}`.trim(),
    `connect-src ${beaconHosts.join(" ")}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

function appShellCopyPlugin(analyticsEndpoint: string): Plugin {
  let isBuild = false;

  const replacements = new Map<string, string>([
    ["%APP_CSP%", contentSecurityPolicy(analyticsEndpoint)],
    ["%APP_TITLE%", appConfig.title],
    ["%APP_SUBTITLE%", appConfig.subtitle],
    ["%APP_META_DESCRIPTION%", appConfig.metaDescription],
    ["%APP_CANONICAL_URL%", appConfig.canonicalUrl],
    ["%APP_SOCIAL_IMAGE_URL%", appConfig.socialImageUrl],
    ["%APP_SOCIAL_IMAGE_ALT%", appConfig.socialImageAlt],
    ["%APP_SKIP_LINK%", appConfig.shell.skipLink],
    ["%APP_AGE_LABEL%", appConfig.shell.ageLabel],
    ["%APP_NAVIGATION_LABEL%", appConfig.shell.navigationLabel],
    ["%APP_SOURCES_LINK%", appConfig.shell.sourcesLink],
    ["%APP_STATUS_TITLE%", appConfig.shell.statusTitle],
    ["%APP_DESCRIPTION%", appConfig.shell.description],
    ["%APP_SAFETY_TITLE%", appConfig.shell.safetyTitle],
    ["%APP_SAFETY_BODY%", appConfig.shell.safetyBody],
    ["%APP_SOURCES_TITLE%", appConfig.shell.sourcesTitle],
    ["%APP_SOURCES_BODY%", appConfig.shell.sourcesBody],
    ["%APP_SOURCES_DOCUMENT_LINK%", appConfig.shell.sourcesDocumentLink],
  ]);

  return {
    name: "varano-app-shell-copy",
    configResolved(config) {
      isBuild = config.command === "build";
    },
    transformIndexHtml(html) {
      let transformedHtml = html;

      for (const [placeholder, message] of replacements) {
        transformedHtml = transformedHtml.replaceAll(
          placeholder,
          escapeHtml(message),
        );
      }

      // In the dev server the build plugin never runs: the version reads
      // «dev», which is exactly what it is. In a build the placeholder must
      // survive until writeBundle, where the real id exists (ADR-054).
      return isBuild
        ? transformedHtml
        : transformedHtml.replaceAll("%APP_BUILD_ID%", "dev");
    },
  };
}

/**
 * Builds sw.js from the template (ADR-054): the precache list carries the
 * real hashed bundles and the cache name carries the build id, so every
 * deploy ships an atomic offline copy and cleans up the previous one. The
 * same id lands in the page's meta tag as the visible version.
 */
function serviceWorkerPlugin(): Plugin {
  let buildId = "dev";

  return {
    name: "varano-service-worker",
    apply: "build",
    generateBundle(_options, bundle) {
      const hashedAssets = Object.keys(bundle).filter((fileName) =>
        fileName.startsWith("assets/"),
      );
      const entry = hashedAssets.find((fileName) => fileName.endsWith(".js"));
      const match = entry === undefined ? null : /-([\w-]+)\.js$/.exec(entry);
      buildId = match?.[1] ?? "dev";
      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: renderServiceWorker(buildId, [
          "./",
          "manifest.webmanifest",
          "privacy.html",
          "termini.html",
          "legal.css",
          "icons/icon-192.png",
          "icons/icon-512.png",
          "icons/apple-touch-icon.png",
          ...hashedAssets,
        ]),
      });
    },
    writeBundle(options) {
      // The html asset is emitted by Vite's own plugin with no ordering
      // guarantee against this one: stamping the file on disk is the one
      // deterministic moment (ADR-054).
      const outputDir = options.dir ?? "dist";
      const indexPath = join(outputDir, "index.html");
      writeFileSync(
        indexPath,
        readFileSync(indexPath, "utf8").replaceAll("%APP_BUILD_ID%", buildId),
      );
    },
  };
}

function normalizeBasePath(value: string | undefined): string {
  if (value === undefined || value.trim() === "" || value === "/") {
    return "/";
  }

  const trimmedValue = value.trim();

  if (
    trimmedValue.includes("://") ||
    trimmedValue.includes("?") ||
    trimmedValue.includes("#")
  ) {
    throw new Error("VITE_BASE_PATH must be a root-relative path.");
  }

  const withLeadingSlash = trimmedValue.startsWith("/")
    ? trimmedValue
    : `/${trimmedValue}`;

  return withLeadingSlash.endsWith("/")
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
}

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), "VITE_");
  const analyticsEndpoint = (
    environment.VITE_GOATCOUNTER_ENDPOINT ?? ""
  ).trim();

  return {
    base: normalizeBasePath(environment.VITE_BASE_PATH),
    plugins: [appShellCopyPlugin(analyticsEndpoint), serviceWorkerPlugin()],
  };
});
