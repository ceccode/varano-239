// @vitest-environment jsdom

import { getByRole } from "@testing-library/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { bootstrapApp, startApplication } from "../../src/app/bootstrap";
import { appConfig } from "../../src/app/config";
import type { AnalyticsPort } from "../../src/core/ports";
import { renderBootstrapError } from "../../src/platform/dom/render-app";

describe("application bootstrap", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <h1>${appConfig.title}</h1>
      <main><div data-app-root></div></main>
    `;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the ready state and emits only the allowed page view", () => {
    const track = vi.fn<AnalyticsPort["track"]>();

    bootstrapApp({ document, analytics: { track } });

    expect(getByRole(document.body, "status").textContent).toBe(
      appConfig.shell.ready,
    );
    expect(track).toHaveBeenCalledOnce();
    expect(track).toHaveBeenCalledWith({ name: "page_view" });
  });

  it("keeps the shell usable when analytics fails", () => {
    const consoleWarning = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    const analytics = {
      track(): void {
        throw new Error("adapter unavailable");
      },
    } satisfies AnalyticsPort;

    bootstrapApp({ document, analytics });

    expect(getByRole(document.body, "status").textContent).toBe(
      appConfig.shell.ready,
    );
    expect(consoleWarning).toHaveBeenCalledOnce();
  });

  it("preserves static content and focuses an accessible bootstrap error", () => {
    document.querySelector("[data-app-root]")?.remove();
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const analytics = { track: vi.fn<AnalyticsPort["track"]>() };

    startApplication({ document, analytics });

    const alert = getByRole(document.body, "alert", {
      name: appConfig.bootstrapError.title,
    });
    expect(getByRole(document.body, "heading", { level: 1 }).textContent).toBe(
      appConfig.title,
    );
    expect(alert).toBe(document.activeElement);
    expect(alert.textContent).toContain(appConfig.bootstrapError.body);
    expect(document.body.textContent).not.toContain(
      "Missing [data-app-root] bootstrap mount.",
    );
    expect(consoleError).toHaveBeenCalledOnce();
    expect(analytics.track).not.toHaveBeenCalled();
  });

  it("can expose the bootstrap error even when the main landmark is missing", () => {
    document.body.replaceChildren();

    renderBootstrapError(document, appConfig.bootstrapError);

    expect(
      getByRole(document.body, "alert", {
        name: appConfig.bootstrapError.title,
      }),
    ).toBe(document.activeElement);
  });
});
