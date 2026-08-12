// @vitest-environment jsdom

import { getByRole } from "@testing-library/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { bootstrapApp, startApplication } from "../../src/app/bootstrap";
import { appConfig } from "../../src/app/config";
import type { AnalyticsPort, SavePort } from "../../src/core/ports";
import { resolveItalianMessage } from "../../src/content/locales/it";
import { NoopGameAudio } from "../../src/platform/audio/chiptune-audio";
import type { BestScorePort } from "../../src/platform/storage/best-score";
import {
  mergeRecords,
  type LevelRecord,
  type LevelRecordsPort,
} from "../../src/platform/storage/level-records";
import { renderBootstrapError } from "../../src/platform/dom/render-app";
import { stubCanvasContext } from "./helpers/canvas-stub";

function createSave(): SavePort {
  return {
    load: vi.fn(() => undefined),
    save: vi.fn(),
    clear: vi.fn(),
  };
}

function createBestScore(): BestScorePort {
  return {
    load: vi.fn(() => undefined),
    save: vi.fn(),
    clear: vi.fn(),
  };
}

function createLevelRecords(): LevelRecordsPort {
  let records: Record<string, LevelRecord> = {};
  return {
    load: () => records,
    record: (levelId, result) => {
      records = {
        ...records,
        [levelId]: mergeRecords(records[levelId], result),
      };
    },
    clear: () => {
      records = {};
    },
  };
}

describe("application bootstrap", () => {
  beforeEach(() => {
    document.body.innerHTML = `<main data-app-root></main>`;
    stubCanvasContext();
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: vi.fn(() => 1),
    });
    Object.defineProperty(window, "cancelAnimationFrame", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("boots to the role selection and emits only the page view", () => {
    const track = vi.fn<AnalyticsPort["track"]>();

    const controller = bootstrapApp({
      document,
      analytics: { track },
      save: createSave(),
      audio: new NoopGameAudio(),
      bestScore: createBestScore(),
      levelRecords: createLevelRecords(),
    });

    expect(controller.getState().phase).toBe("title");
    expect(document.body.textContent).toContain(
      resolveItalianMessage("core.message.ui.role-select.heading"),
    );
    expect(document.body.textContent).toContain(
      resolveItalianMessage("core.message.ui.legend-banner"),
    );
    expect(track).toHaveBeenCalledOnce();
    expect(track).toHaveBeenCalledWith({ name: "page_view" });
  });

  it("keeps the game usable when analytics fails", () => {
    const consoleWarning = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    const analytics = {
      track(): void {
        throw new Error("adapter unavailable");
      },
    } satisfies AnalyticsPort;

    bootstrapApp({
      document,
      analytics,
      save: createSave(),
      audio: new NoopGameAudio(),
      bestScore: createBestScore(),
      levelRecords: createLevelRecords(),
    });

    expect(
      getByRole(document.body, "button", {
        name: new RegExp(
          `^${resolveItalianMessage("core.message.ui.role-select.varano.title")}`,
        ),
      }),
    ).toBeInstanceOf(HTMLElement);
    expect(consoleWarning).toHaveBeenCalledOnce();
  });

  it("preserves static content and focuses an accessible bootstrap error", () => {
    document.querySelector("[data-app-root]")?.remove();
    document.body.insertAdjacentHTML(
      "afterbegin",
      `<main><h1>${appConfig.title}</h1></main>`,
    );
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const analytics = { track: vi.fn<AnalyticsPort["track"]>() };

    startApplication({
      document,
      analytics,
      save: createSave(),
      audio: new NoopGameAudio(),
      bestScore: createBestScore(),
      levelRecords: createLevelRecords(),
    });

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
