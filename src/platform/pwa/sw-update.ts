/**
 * The update side of ADR-054: the worker waits, the player decides. This
 * module owns the whole conversation — spotting a waiting worker, telling
 * the page, applying the update on request and reloading exactly once when
 * the new worker takes control.
 */

/** The narrow slice of ServiceWorkerRegistration this module reads. */
export interface RegistrationLike {
  readonly waiting: { postMessage: (message: unknown) => void } | null;
  readonly installing: WorkerLike | null;
  readonly addEventListener: (
    type: "updatefound",
    listener: () => void,
  ) => void;
  readonly update: () => Promise<unknown>;
}

export interface WorkerLike {
  readonly state: string;
  readonly addEventListener: (
    type: "statechange",
    listener: () => void,
  ) => void;
}

export interface ContainerLike {
  readonly controller: unknown;
  readonly addEventListener: (
    type: "controllerchange",
    listener: () => void,
  ) => void;
  readonly getRegistration: () => Promise<RegistrationLike | undefined>;
}

/** Tells the waiting worker to take over; `controllerchange` then reloads. */
export function applyUpdate(registration: RegistrationLike): void {
  registration.waiting?.postMessage("varano-skip-waiting");
}

/**
 * Calls `onReady` when a new worker sits installed and waiting — right away
 * if one is already there, or when an update lands during the session. The
 * `container.controller` guard skips the very first install: that one is not
 * an update, and announcing it would greet every new player with a banner.
 */
export function watchForWaitingWorker(
  container: ContainerLike,
  registration: RegistrationLike,
  onReady: (registration: RegistrationLike) => void,
): void {
  if (registration.waiting !== null && container.controller !== null) {
    onReady(registration);
    return;
  }
  registration.addEventListener("updatefound", () => {
    const worker = registration.installing;
    worker?.addEventListener("statechange", () => {
      if (worker.state === "installed" && container.controller !== null) {
        onReady(registration);
      }
    });
  });
}

/**
 * Reloads once — never in a loop — when a NEW worker takes control. The
 * first `clients.claim()` of a brand-new visitor also fires
 * `controllerchange`: that is not an update, and reloading there would give
 * every first visit a spurious refresh (the e2e suite caught exactly this).
 * The listener arms itself only once a controller exists.
 */
export function reloadOnControllerChange(
  container: ContainerLike,
  reload: () => void,
): void {
  let armed = container.controller !== null;
  let reloaded = false;
  container.addEventListener("controllerchange", () => {
    if (!armed) {
      armed = true;
      return;
    }
    if (!reloaded) {
      reloaded = true;
      reload();
    }
  });
}

/**
 * «Controlla aggiornamenti» (owner request, ADR-054): asks the browser to
 * re-fetch the worker now. `pending` means a new version is installed and
 * about to take over; `none` means this is already the latest.
 */
export async function checkForUpdates(
  container: ContainerLike,
): Promise<"pending" | "none"> {
  const registration = await container.getRegistration();
  if (registration === undefined) {
    return "none";
  }
  try {
    await registration.update();
  } catch {
    // Offline or unreachable: nothing new, nothing broken.
  }
  if (registration.waiting !== null) {
    applyUpdate(registration);
    return "pending";
  }
  return "none";
}
