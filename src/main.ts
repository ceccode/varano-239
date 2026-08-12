import { startApplication } from "./app/bootstrap";
import {
  reloadOnControllerChange,
  watchForWaitingWorker,
} from "./platform/pwa/sw-update";
import { GoatCounterAnalytics } from "./platform/analytics/goatcounter-analytics";
import { NoopAnalytics } from "./platform/analytics/noop-analytics";
import { ChiptuneAudio } from "./platform/audio/chiptune-audio";
import { LocalBestScore } from "./platform/storage/best-score";
import { LocalSave } from "./platform/storage/local-save";
import { LocalLevelRecords } from "./platform/storage/level-records";

// Analytics stay off unless an endpoint is configured for the build (ADR-025).
const analyticsEndpoint = (
  import.meta.env.VITE_GOATCOUNTER_ENDPOINT ?? ""
).trim();

startApplication({
  document,
  analytics:
    analyticsEndpoint === ""
      ? new NoopAnalytics()
      : new GoatCounterAnalytics(window, analyticsEndpoint),
  save: new LocalSave(window.localStorage),
  audio: new ChiptuneAudio(window, true, true),
  bestScore: new LocalBestScore(window.localStorage),
  levelRecords: new LocalLevelRecords(window.localStorage),
});

// The service worker is production-only: in dev it would cache Vite modules.
// A new version installs and WAITS (ADR-054): the page announces it with the
// banner, and the reload happens once, when the player accepts.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  const container = navigator.serviceWorker;
  reloadOnControllerChange(container, () => {
    window.location.reload();
  });
  window.addEventListener("load", () => {
    container
      .register("sw.js")
      .then((registration) => {
        watchForWaitingWorker(container, registration, () => {
          window.dispatchEvent(new CustomEvent("varano-update-ready"));
        });
      })
      .catch((error: unknown) => {
        console.warn("Service worker unavailable; continuing online.", error);
      });
  });
}
