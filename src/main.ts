import { startApplication } from "./app/bootstrap";
import { NoopAnalytics } from "./platform/analytics/noop-analytics";
import { ChiptuneAudio } from "./platform/audio/chiptune-audio";
import { LocalBestScore } from "./platform/storage/best-score";
import { LocalSave } from "./platform/storage/local-save";

startApplication({
  document,
  analytics: new NoopAnalytics(),
  save: new LocalSave(window.localStorage),
  audio: new ChiptuneAudio(window, true, true),
  bestScore: new LocalBestScore(window.localStorage),
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
});

// The service worker is production-only: in dev it would cache Vite modules.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((error: unknown) => {
      console.warn("Service worker unavailable; continuing online.", error);
    });
  });
}
