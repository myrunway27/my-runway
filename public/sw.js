// MyRunway service worker. This build does not register it; it ships so devices
// still running the old cache-first worker pick up an update and stop serving a
// stale shell.
// Keeps the trip available with no signal once registered.
//
// Navigations are network-first on purpose. index.html names the hashed JS
// bundle, so serving a stale shell pins the device to an old build forever:
// the cache name never changes, so activate clears nothing, and a returning
// visitor never sees a deploy again. Network-first keeps the device current
// and still falls back to the cached shell when there is no signal.
// Hashed /assets/ files are immutable, so those stay cache-first.
//
// Bump VERSION on any change here: the byte change is what makes browsers
// install the new worker, and activate then drops every older cache.
const VERSION = "v3";
const CACHE = `myrunway-shell-${VERSION}`;
// Only files that exist in this build: addAll fails the whole install on any 404.
const PRECACHE = ["/", "/index.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || !req.url.startsWith(self.location.origin)) return;

  // The app shell: always try the network so a deploy actually lands, and keep
  // a fresh copy for the offline case.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("/index.html", copy));
          return res;
        })
        .catch(() => caches.match("/index.html").then((hit) => hit || caches.match("/")))
    );
    return;
  }

  // Hashed assets and icons: cache-first, filling the cache on a miss.
  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
    )
  );
});
