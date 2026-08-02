import { defineConfig, loadEnv, type Plugin } from "vite";

import { appConfig } from "./src/app/config.ts";

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
  const replacements = new Map<string, string>([
    ["%APP_CSP%", contentSecurityPolicy(analyticsEndpoint)],
    ["%APP_TITLE%", appConfig.title],
    ["%APP_SUBTITLE%", appConfig.subtitle],
    ["%APP_META_DESCRIPTION%", appConfig.metaDescription],
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
    transformIndexHtml(html) {
      let transformedHtml = html;

      for (const [placeholder, message] of replacements) {
        transformedHtml = transformedHtml.replaceAll(
          placeholder,
          escapeHtml(message),
        );
      }

      return transformedHtml;
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
    plugins: [appShellCopyPlugin(analyticsEndpoint)],
  };
});
