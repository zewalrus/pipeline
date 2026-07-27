/* Bump VERSION on every deploy — it wipes the old cache and forces a refresh.
   Strategy is network-first on purpose: you always get the newest file when
   online, and the cache only steps in when there's no connection. */
const VERSION = "pipeline-2026-07-27a";

const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

/* Firebase traffic must never be cached — stale auth or data is worse than none. */
const LIVE = /(^|\.)(firestore|identitytoolkit|securetoken|firebaseinstallations|firebaseremoteconfig)\.googleapis\.com$|firebaseio\.com$|firebaseapp\.com$/;

/* Fonts and the Firebase SDK are safe to keep so the app opens offline. */
const KEEPABLE = h =>
  h === self.location.hostname ||
  h === "fonts.googleapis.com" ||
  h === "fonts.gstatic.com" ||
  h === "www.gstatic.com";

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(VERSION).then(c => Promise.all(
      SHELL.map(u => c.add(u).catch(() => {}))
    ))
  );
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  let url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.protocol !== "http:" && url.protocol !== "https:") return;
  if (LIVE.test(url.hostname)) return;

  e.respondWith((async () => {
    try {
      const fresh = await fetch(req);
      if (fresh && (fresh.ok || fresh.type === "opaque") && KEEPABLE(url.hostname)) {
        const c = await caches.open(VERSION);
        c.put(req, fresh.clone()).catch(() => {});
      }
      return fresh;
    } catch (err) {
      const hit = await caches.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === "navigate") {
        const shell = await caches.match("./index.html");
        if (shell) return shell;
      }
      throw err;
    }
  })());
});
