// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

import { GoatCounterAnalytics } from "../../src/platform/analytics/goatcounter-analytics";

const endpoint = "https://varano239.goatcounter.com/count";

interface CountVars {
  readonly path: string;
  readonly title: string;
  readonly referrer: string;
  readonly event?: boolean;
  readonly no_session?: boolean;
}

type TestWindow = Window &
  typeof globalThis & {
    goatcounter?: { count?: (vars: CountVars) => void } & Record<
      string,
      unknown
    >;
  };

function testWindow(): TestWindow {
  return window;
}

function loadedScript(): HTMLScriptElement | null {
  return document.querySelector<HTMLScriptElement>(
    'script[src="https://gc.zgo.at/count.js"]',
  );
}

/** Simulates count.js finishing its download and exposing its API. */
function resolveScript(calls: CountVars[]): void {
  const script = loadedScript();
  if (script === null) {
    throw new Error("count.js was never requested.");
  }
  testWindow().goatcounter = {
    ...testWindow().goatcounter,
    count: (vars: CountVars) => {
      calls.push(vars);
    },
  };
  script.dispatchEvent(new Event("load"));
}

function setNavigatorFlag(name: string, value: unknown): void {
  Object.defineProperty(window.navigator, name, {
    configurable: true,
    value,
  });
}

describe("GoatCounter analytics adapter", () => {
  beforeEach(() => {
    document.head.replaceChildren();
    delete testWindow().goatcounter;
    setNavigatorFlag("doNotTrack", null);
    setNavigatorFlag("globalPrivacyControl", undefined);
    Object.defineProperty(document, "referrer", {
      configurable: true,
      value: "",
    });
  });

  it("loads count.js once and reports a fixed visit path", () => {
    const calls: CountVars[] = [];
    const analytics = new GoatCounterAnalytics(window, endpoint);

    analytics.track({ name: "page_view" });
    const script = loadedScript();
    expect(script).not.toBeNull();
    expect(script?.async).toBe(true);
    expect(script?.dataset.goatcounter).toBe(endpoint);
    // count.js must not fire its own pageview or bind click handlers.
    expect(testWindow().goatcounter).toMatchObject({
      no_onload: true,
      no_events: true,
      endpoint,
    });
    expect(calls).toEqual([]);

    resolveScript(calls);
    expect(calls).toEqual([{ path: "/", title: "VARANO 2:39", referrer: "" }]);

    analytics.track({ name: "page_view" });
    expect(calls).toHaveLength(2);
    expect(
      document.querySelectorAll('script[src="https://gc.zgo.at/count.js"]'),
    ).toHaveLength(1);
  });

  it("counts every explicit game start as a session-less event", () => {
    const calls: CountVars[] = [];
    const analytics = new GoatCounterAnalytics(window, endpoint);

    analytics.track({ name: "game_start" });
    resolveScript(calls);
    analytics.track({ name: "game_start" });

    expect(calls).toEqual([
      {
        path: "game_start",
        title: "game_start",
        referrer: "",
        event: true,
        no_session: true,
      },
      {
        path: "game_start",
        title: "game_start",
        referrer: "",
        event: true,
        no_session: true,
      },
    ]);
  });

  it("reduces an external referrer to its origin and drops internal ones", () => {
    const calls: CountVars[] = [];
    Object.defineProperty(document, "referrer", {
      configurable: true,
      value: "https://www.facebook.com/groups/montichiari?post=12345",
    });
    const analytics = new GoatCounterAnalytics(window, endpoint);
    analytics.track({ name: "page_view" });
    resolveScript(calls);
    expect(calls[0]?.referrer).toBe("https://www.facebook.com");

    Object.defineProperty(document, "referrer", {
      configurable: true,
      value: `${window.location.origin}/index.html`,
    });
    analytics.track({ name: "page_view" });
    expect(calls[1]?.referrer).toBe("");
  });

  it("stays silent without an endpoint, with DNT or with GPC", () => {
    new GoatCounterAnalytics(window, "").track({ name: "page_view" });
    expect(loadedScript()).toBeNull();

    setNavigatorFlag("doNotTrack", "1");
    new GoatCounterAnalytics(window, endpoint).track({ name: "page_view" });
    expect(loadedScript()).toBeNull();

    setNavigatorFlag("doNotTrack", null);
    setNavigatorFlag("globalPrivacyControl", true);
    new GoatCounterAnalytics(window, endpoint).track({ name: "game_start" });
    expect(loadedScript()).toBeNull();
  });

  it("survives a blocked script and a throwing count()", () => {
    const analytics = new GoatCounterAnalytics(window, endpoint);
    analytics.track({ name: "page_view" });
    const script = loadedScript();
    script?.dispatchEvent(new Event("error"));

    const failing = vi.fn(() => {
      throw new Error("blocked");
    });
    testWindow().goatcounter = { count: failing };
    expect(() => {
      analytics.track({ name: "game_start" });
    }).not.toThrow();
    expect(failing).toHaveBeenCalledOnce();
  });
});
