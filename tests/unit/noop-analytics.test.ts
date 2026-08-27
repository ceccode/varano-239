import { afterEach, describe, expect, it, vi } from "vitest";

import { NoopAnalytics } from "../../src/platform/analytics/noop-analytics";
import type { AnalyticsEvent } from "../../src/core/ports";

describe("NoopAnalytics", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("accepts the closed event set without making requests", () => {
    const fetchRequest = vi.spyOn(globalThis, "fetch");
    const analytics = new NoopAnalytics();

    const events: readonly AnalyticsEvent["name"][] = [
      "page_view",
      "game_start",
      "level_1_complete",
      "level_3_complete",
      "level_6_complete",
      "level_10_complete",
      "game_complete",
      "share_attempt",
      "replay_start",
    ];
    for (const name of events) {
      expect(analytics.track({ name })).toBeUndefined();
    }
    expect(fetchRequest).not.toHaveBeenCalled();
  });
});
