// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";

import { renderServiceWorker } from "../../src/platform/pwa/sw-template";
import {
  applyUpdate,
  checkForUpdates,
  reloadOnControllerChange,
  watchForWaitingWorker,
  type ContainerLike,
  type RegistrationLike,
  type WorkerLike,
} from "../../src/platform/pwa/sw-update";
import { installUpdateBanner } from "../../src/app/bootstrap";
import { resolveItalianMessage } from "../../src/content/locales/it";

/** A registration the tests can steer. */
function fakeRegistration(
  overrides: Partial<{
    waiting: RegistrationLike["waiting"];
    installing: WorkerLike | null;
  }> = {},
): {
  registration: RegistrationLike;
  fireUpdateFound: () => void;
  update: ReturnType<typeof vi.fn>;
} {
  let updateFound: (() => void) | undefined;
  const update = vi.fn(() => Promise.resolve());
  const registration: RegistrationLike = {
    waiting: overrides.waiting ?? null,
    installing: overrides.installing ?? null,
    addEventListener: (_type, listener) => {
      updateFound = listener;
    },
    update,
  };
  return {
    registration,
    fireUpdateFound: () => {
      updateFound?.();
    },
    update,
  };
}

function fakeContainer(
  overrides: Partial<{
    controller: unknown;
    registration: RegistrationLike | undefined;
  }> = {},
): {
  container: ContainerLike;
  fireControllerChange: () => void;
} {
  let controllerChange: (() => void) | undefined;
  const container: ContainerLike = {
    controller: "controller" in overrides ? overrides.controller : {},
    addEventListener: (_type, listener) => {
      controllerChange = listener;
    },
    getRegistration: () => Promise.resolve(overrides.registration),
  };
  return {
    container,
    fireControllerChange: () => {
      controllerChange?.();
    },
  };
}

describe("service worker template (ADR-054)", () => {
  it("fills the cache name and the precache list, and never skips on install", () => {
    const source = renderServiceWorker("abc123", [
      "./",
      "assets/index-abc123.js",
    ]);
    expect(source).toContain('const CACHE_NAME = "varano-239-abc123"');
    expect(source).toContain('"assets/index-abc123.js"');
    expect(source).not.toContain("__BUILD_ID__");
    expect(source).not.toContain("__PRECACHE__");
    // The update waits for the player: skipWaiting only answers the message.
    const installBlock = source.slice(
      source.indexOf('addEventListener("install"'),
      source.indexOf('addEventListener("activate"'),
    );
    expect(installBlock).not.toContain("skipWaiting");
    expect(source).toContain("varano-skip-waiting");
    expect(source).toContain(
      'navigationPath.endsWith("/en/") ? "./en/" : "./"',
    );
  });
});

describe("service worker updates (ADR-054)", () => {
  it("announces a worker already waiting, but never the very first install", () => {
    const onReady = vi.fn();
    const waiting = { postMessage: vi.fn() };
    const { registration } = fakeRegistration({ waiting });
    const { container } = fakeContainer();
    watchForWaitingWorker(container, registration, onReady);
    expect(onReady).toHaveBeenCalledWith(registration);

    // First install: no controller yet, so no banner for a brand-new player.
    const first = fakeContainer({ controller: null });
    const fresh = fakeRegistration({ waiting });
    const onFirst = vi.fn();
    watchForWaitingWorker(first.container, fresh.registration, onFirst);
    expect(onFirst).not.toHaveBeenCalled();
  });

  it("announces an update that lands mid-session", () => {
    const onReady = vi.fn();
    let stateListener: (() => void) | undefined;
    const worker: WorkerLike = {
      state: "installed",
      addEventListener: (_type, listener) => {
        stateListener = listener;
      },
    };
    const { registration, fireUpdateFound } = fakeRegistration({
      installing: worker,
    });
    const { container } = fakeContainer();
    watchForWaitingWorker(container, registration, onReady);
    fireUpdateFound();
    stateListener?.();
    expect(onReady).toHaveBeenCalled();
  });

  it("applies the update by messaging the waiting worker", () => {
    const postMessage = vi.fn();
    const { registration } = fakeRegistration({ waiting: { postMessage } });
    applyUpdate(registration);
    expect(postMessage).toHaveBeenCalledWith("varano-skip-waiting");
  });

  it("reloads exactly once when the new worker takes control", () => {
    const reload = vi.fn();
    const { container, fireControllerChange } = fakeContainer();
    reloadOnControllerChange(container, reload);
    fireControllerChange();
    fireControllerChange();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("never reloads on the first claim of a brand-new visitor", () => {
    // clients.claim() fires controllerchange on the very first install too:
    // reloading there would refresh every first visit for no reason.
    const reload = vi.fn();
    const { container, fireControllerChange } = fakeContainer({
      controller: null,
    });
    reloadOnControllerChange(container, reload);
    fireControllerChange();
    expect(reload).not.toHaveBeenCalled();
    // A real update after that first claim still reloads.
    fireControllerChange();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("checks for updates on request, applying a pending one", async () => {
    const postMessage = vi.fn();
    const { registration, update } = fakeRegistration({
      waiting: { postMessage },
    });
    const { container } = fakeContainer({ registration });
    expect(await checkForUpdates(container)).toBe("pending");
    expect(update).toHaveBeenCalled();
    expect(postMessage).toHaveBeenCalledWith("varano-skip-waiting");

    const current = fakeRegistration();
    const upToDate = fakeContainer({ registration: current.registration });
    expect(await checkForUpdates(upToDate.container)).toBe("none");

    const unregistered = fakeContainer({ registration: undefined });
    expect(await checkForUpdates(unregistered.container)).toBe("none");
  });
});

describe("the update banner (ADR-054)", () => {
  it("hides until the update is ready, then accepts on one tap", () => {
    document.body.replaceChildren();
    const onAccept = vi.fn();
    const banner = installUpdateBanner(document, onAccept);
    expect(banner.hidden).toBe(true);
    expect(banner.textContent).toBe(
      resolveItalianMessage("core.message.ui.update.ready"),
    );

    window.dispatchEvent(new CustomEvent("varano-update-ready"));
    expect(banner.hidden).toBe(false);

    banner.click();
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(banner.disabled).toBe(true);
  });
});
