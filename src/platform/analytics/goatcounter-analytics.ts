import type { AnalyticsEvent, AnalyticsPort } from "../../core/ports";

/**
 * Minimal GoatCounter adapter (ADR-009, ADR-025).
 *
 * It only ever reports two things: one aggregate visit and the explicit start
 * of a game. Paths and titles are fixed strings, so the dashboard can never
 * reveal the chosen role, the narrative path or any local setting. The referrer
 * is reduced to its origin, never the full URL.
 */

const scriptUrl = "https://gc.zgo.at/count.js";
const visitPath = "/";
const fixedTitle = "VARANO 2:39";
const gameStartEvent = "game_start";

interface GoatCounterVars {
  readonly path: string;
  readonly title: string;
  readonly referrer: string;
  readonly event?: boolean;
  readonly no_session?: boolean;
}

interface GoatCounterGlobal {
  no_onload?: boolean;
  no_events?: boolean;
  endpoint?: string;
  count?: (vars: GoatCounterVars) => void;
}

type GoatCounterWindow = Window &
  typeof globalThis & { goatcounter?: GoatCounterGlobal };

function refusesTracking(navigator: Navigator): boolean {
  const privacyControl = (
    navigator as Navigator & { globalPrivacyControl?: boolean }
  ).globalPrivacyControl;
  return navigator.doNotTrack === "1" || privacyControl === true;
}

/** Keeps the traffic source without ever sending a full URL or query string. */
function referrerOrigin(view: Window): string {
  const referrer = view.document.referrer;
  if (referrer === "") {
    return "";
  }
  try {
    const origin = new URL(referrer).origin;
    return origin === view.location.origin ? "" : origin;
  } catch {
    return "";
  }
}

export class GoatCounterAnalytics implements AnalyticsPort {
  private readonly view: GoatCounterWindow;
  private readonly endpoint: string;
  private readonly disabled: boolean;
  private queue: GoatCounterVars[] = [];
  private scriptRequested = false;

  constructor(view: Window & typeof globalThis, endpoint: string) {
    this.view = view;
    this.endpoint = endpoint;
    this.disabled = endpoint === "" || refusesTracking(view.navigator);
  }

  track(event: AnalyticsEvent): void {
    if (this.disabled) {
      return;
    }

    this.queue.push(
      event.name === "page_view"
        ? {
            path: visitPath,
            title: fixedTitle,
            referrer: referrerOrigin(this.view),
          }
        : {
            path: gameStartEvent,
            title: gameStartEvent,
            referrer: "",
            event: true,
            // Every explicit start counts, even several in one session.
            no_session: true,
          },
    );
    this.flush();
  }

  private flush(): void {
    const count = this.view.goatcounter?.count;
    if (count === undefined) {
      this.loadScript();
      return;
    }

    const queued = this.queue;
    this.queue = [];
    for (const vars of queued) {
      try {
        count(vars);
      } catch {
        // Analytics must never interrupt the game.
      }
    }
  }

  private loadScript(): void {
    if (this.scriptRequested) {
      return;
    }
    this.scriptRequested = true;

    // Configure count.js before it runs: no automatic pageview, no click
    // binding, and our own endpoint.
    this.view.goatcounter = {
      ...this.view.goatcounter,
      no_onload: true,
      no_events: true,
      endpoint: this.endpoint,
    };

    const script = this.view.document.createElement("script");
    script.async = true;
    script.src = scriptUrl;
    script.dataset.goatcounter = this.endpoint;
    script.addEventListener("load", () => {
      this.flush();
    });
    script.addEventListener("error", () => {
      // Offline or blocked by an extension: drop the queue and stay quiet.
      this.queue = [];
    });
    this.view.document.head.append(script);
  }
}
