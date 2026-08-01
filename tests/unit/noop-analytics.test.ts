import { afterEach, describe, expect, it, vi } from "vitest";

import { NoopAnalytics } from "../../src/platform/analytics/noop-analytics";

describe("NoopAnalytics", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("accepts the closed event set without making requests", () => {
    const fetchRequest = vi.spyOn(globalThis, "fetch");
    const analytics = new NoopAnalytics();

    expect(analytics.track({ name: "page_view" })).toBeUndefined();
    expect(analytics.track({ name: "game_start" })).toBeUndefined();
    expect(fetchRequest).not.toHaveBeenCalled();
  });
});
