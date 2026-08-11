/**
 * The service worker, as a template the build fills in (ADR-054). Why a
 * template: the worker must precache the hashed bundles, whose names exist
 * only at build time — the old hand-written worker precached the legal pages
 * and left the game itself to luck. The build derives `CACHE_NAME` from the
 * bundle hash, so every deploy gets its own complete, atomic cache and
 * activating a version deletes every other.
 *
 * Deliberately NOT here: `skipWaiting()` at install. A new worker waits until
 * the player accepts the update (the banner, or «Controlla aggiornamenti» in
 * the menu) — nothing swaps out the game mid-session any more.
 */
const template = `// Generated at build time (ADR-054): do not edit in dist.
const CACHE_NAME = "varano-239-__BUILD_ID__";
const PRECACHE = __PRECACHE__;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "varano-skip-waiting") {
    self.skipWaiting();
  }
});

function cachePut(request, response) {
  const copy = response.clone();
  void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (
    request.method !== "GET" ||
    new URL(request.url).origin !== self.location.origin
  ) {
    return;
  }

  // ignoreVary everywhere: module scripts and stylesheets are requested
  // with CORS mode, and a Vary header from the static host would make the
  // cache miss its own entries — the offline boot then fails with the file
  // sitting right there in the cache.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => cachePut(request, response))
        .catch(() => caches.match("./", { ignoreVary: true })),
    );
    return;
  }

  event.respondWith(
    caches
      .match(request, { ignoreVary: true })
      .then(
        (cached) =>
          cached ??
          fetch(request).then((response) =>
            response.ok ? cachePut(request, response) : response,
          ),
      ),
  );
});
`;

/** Fills the template; pure, so the build step is unit-testable. */
export function renderServiceWorker(
  buildId: string,
  precache: readonly string[],
): string {
  return template
    .replace("__BUILD_ID__", buildId)
    .replace("__PRECACHE__", JSON.stringify(precache));
}
