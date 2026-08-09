import type { AnalyticsPort } from "../core/ports";
import type { SavePort } from "../core/ports";
import type { GameAudio } from "../platform/audio/chiptune-audio";
import type { BestScorePort } from "../platform/storage/best-score";
import { renderBootstrapError } from "../platform/dom/render-app";
import { createGameController, type GameController } from "./controller";
import { appConfig } from "./config";

export interface BootstrapDependencies {
  readonly document: Document;
  readonly analytics: AnalyticsPort;
  readonly save: SavePort;
  readonly audio: GameAudio;
  readonly bestScore: BestScorePort;
}

export function bootstrapApp({
  document,
  analytics,
  save,
  audio,
  bestScore,
}: BootstrapDependencies): GameController {
  const mount = document.querySelector<HTMLElement>("[data-app-root]");

  if (mount === null) {
    throw new Error("Missing application bootstrap mount.");
  }

  try {
    analytics.track({ name: "page_view" });
  } catch (error) {
    console.warn(
      "Analytics adapter unavailable; continuing without tracking.",
      error,
    );
  }

  return createGameController({
    document,
    mount,
    analytics,
    save,
    audio,
    bestScore,
  });
}

export function startApplication(dependencies: BootstrapDependencies): void {
  // Hides the static no-JS fallback while the game shell is available.
  dependencies.document.documentElement.classList.add("js");
  try {
    bootstrapApp(dependencies);
  } catch (error) {
    console.error("Application bootstrap failed.", error);
    dependencies.document.documentElement.classList.remove("js");
    renderBootstrapError(dependencies.document, appConfig.bootstrapError);
  }
}
