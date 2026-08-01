import type { AnalyticsPort } from "../core/ports";
import {
  renderBootstrapError,
  renderReadyStatus,
} from "../platform/dom/render-app";
import { appConfig } from "./config";

export interface BootstrapDependencies {
  readonly document: Document;
  readonly analytics: AnalyticsPort;
}

export function bootstrapApp({
  document,
  analytics,
}: BootstrapDependencies): void {
  const mount = document.querySelector<HTMLElement>("[data-app-root]");

  if (mount === null) {
    throw new Error("Missing [data-app-root] bootstrap mount.");
  }

  renderReadyStatus(document, mount, appConfig.shell.ready);

  try {
    analytics.track({ name: "page_view" });
  } catch (error) {
    console.warn(
      "Analytics adapter unavailable; continuing without tracking.",
      error,
    );
  }
}

export function startApplication(dependencies: BootstrapDependencies): void {
  try {
    bootstrapApp(dependencies);
  } catch (error) {
    console.error("Application bootstrap failed.", error);
    renderBootstrapError(dependencies.document, appConfig.bootstrapError);
  }
}
