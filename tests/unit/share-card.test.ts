// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { shareScoreCard } from "../../src/platform/dom/share-card";

const request = {
  text: "Ho fatto 1730 punti",
  fileName: "varano-239-punteggio.png",
};

function setNavigator(name: string, value: unknown): void {
  Object.defineProperty(window.navigator, name, {
    configurable: true,
    value,
  });
}

function withBlob(): void {
  HTMLCanvasElement.prototype.toBlob = vi.fn((callback: BlobCallback) => {
    callback(new Blob(["png"], { type: "image/png" }));
  });
}

function withoutBlob(): void {
  HTMLCanvasElement.prototype.toBlob =
    undefined as unknown as HTMLCanvasElement["toBlob"];
}

function canvas(): HTMLCanvasElement {
  return document.createElement("canvas");
}

describe("score card sharing", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    setNavigator("share", undefined);
    setNavigator("canShare", undefined);
    setNavigator("clipboard", undefined);
    withBlob();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("downloads the image when Web Share is unavailable", async () => {
    const created = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:x");
    const revoked = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined);
    const clicks: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicks.push(this.download);
    });

    const outcome = await shareScoreCard(window, {
      ...request,
      canvas: canvas(),
    });

    expect(outcome).toBe("downloaded");
    expect(created).toHaveBeenCalledOnce();
    expect(clicks).toEqual([request.fileName]);
    // The temporary link is removed straight away.
    expect(document.querySelector("a")).toBeNull();
    await vi.waitFor(() => {
      expect(revoked).toHaveBeenCalledOnce();
    });
  });

  it("reports a deliberate cancellation without falling back", async () => {
    const abort = new Error("cancelled");
    abort.name = "AbortError";
    setNavigator("canShare", () => true);
    setNavigator(
      "share",
      vi.fn(() => Promise.reject(abort)),
    );
    const created = vi.spyOn(URL, "createObjectURL");

    const outcome = await shareScoreCard(window, {
      ...request,
      canvas: canvas(),
    });

    expect(outcome).toBe("cancelled");
    expect(created).not.toHaveBeenCalled();
  });

  it("falls back to the download when sharing fails for another reason", async () => {
    setNavigator("canShare", () => true);
    setNavigator(
      "share",
      vi.fn(() => Promise.reject(new Error("no target"))),
    );
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:x");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      () => undefined,
    );

    await expect(
      shareScoreCard(window, { ...request, canvas: canvas() }),
    ).resolves.toBe("downloaded");
  });

  it("gives up when neither an image nor the clipboard is available", async () => {
    withoutBlob();
    await expect(
      shareScoreCard(window, { ...request, canvas: canvas() }),
    ).resolves.toBe("unavailable");

    setNavigator("clipboard", {
      writeText: vi.fn(() => Promise.reject(new Error("denied"))),
    });
    await expect(
      shareScoreCard(window, { ...request, canvas: canvas() }),
    ).resolves.toBe("unavailable");
  });

  it("survives a canvas that cannot produce a blob", async () => {
    HTMLCanvasElement.prototype.toBlob = vi.fn(() => {
      throw new Error("tainted canvas");
    });
    setNavigator("clipboard", { writeText: vi.fn(() => Promise.resolve()) });

    await expect(
      shareScoreCard(window, { ...request, canvas: canvas() }),
    ).resolves.toBe("copied");
  });
});
