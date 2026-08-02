// Offline cache for VARANO 2:39. Navigations are network-first so updates
// arrive as soon as the player is online; hashed assets are cache-first.
const CACHE_NAME = "varano-239-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(["./", "manifest.webmanifest"]))
      .then(() => self.skipWaiting()),
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

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => cachePut(request, response))
        .catch(() => caches.match("./")),
    );
    return;
  }

  event.respondWith(
    caches
      .match(request)
      .then(
        (cached) =>
          cached ??
          fetch(request).then((response) =>
            response.ok ? cachePut(request, response) : response,
          ),
      ),
  );
});
