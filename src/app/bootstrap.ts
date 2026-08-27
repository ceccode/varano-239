import type { AnalyticsPort } from "../core/ports";
import { resolveMessage } from "../content/locales";
import type { Locale } from "../core/model";
import { applyUpdate, type ContainerLike } from "../platform/pwa/sw-update";
import type { SavePort } from "../core/ports";
import type { GameAudio } from "../platform/audio/chiptune-audio";
import type { BestScorePort } from "../platform/storage/best-score";
import type { LevelRecordsPort } from "../platform/storage/level-records";
import { renderBootstrapError } from "../platform/dom/render-app";
import { createGameController, type GameController } from "./controller";
import { appConfigForLocale } from "./config";

export interface BootstrapDependencies {
  readonly document: Document;
  readonly analytics: AnalyticsPort;
  readonly save: SavePort;
  readonly audio: GameAudio;
  readonly bestScore: BestScorePort;
  readonly levelRecords: LevelRecordsPort;
  readonly initialLocale?: Locale | undefined;
}

export function bootstrapApp({
  document,
  analytics,
  save,
  audio,
  bestScore,
  levelRecords,
  initialLocale = "it",
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
    levelRecords,
    initialLocale,
  });
}

/**
 * The update banner (ADR-054): appended to <body>, outside the mount, so the
 * controller's re-renders never remove it. Hidden until main.ts announces a
 * waiting worker; one tap accepts the update and the controllerchange
 * listener reloads.
 */
export function installUpdateBanner(
  document: Document,
  onAccept: () => void,
): HTMLButtonElement {
  const banner = document.createElement("button");
  banner.type = "button";
  banner.className = "update-banner";
  banner.hidden = true;
  const updateCopy = (): void => {
    const locale: Locale = document.documentElement.lang.startsWith("en")
      ? "en"
      : "it";
    banner.textContent = resolveMessage(locale, "core.message.ui.update.ready");
  };
  updateCopy();
  banner.addEventListener("click", () => {
    banner.disabled = true;
    onAccept();
  });
  document.defaultView?.addEventListener("varano-update-ready", () => {
    updateCopy();
    banner.hidden = false;
  });
  document.body.append(banner);
  return banner;
}

export function startApplication(dependencies: BootstrapDependencies): void {
  // Hides the static no-JS fallback while the game shell is available.
  dependencies.document.documentElement.classList.add("js");
  try {
    bootstrapApp(dependencies);
    installUpdateBanner(dependencies.document, () => {
      const container = dependencies.document.defaultView?.navigator
        .serviceWorker as ContainerLike | undefined;
      void container?.getRegistration().then((registration) => {
        if (registration !== undefined) {
          applyUpdate(registration);
        }
      });
    });
  } catch (error) {
    console.error("Application bootstrap failed.", error);
    dependencies.document.documentElement.classList.remove("js");
    renderBootstrapError(
      dependencies.document,
      appConfigForLocale(dependencies.initialLocale ?? "it").bootstrapError,
    );
  }
}
