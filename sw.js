const CACHE_NAME = "dutaled-v6";

const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./dynamic.css",
  "./checkout.css",
  "./product-poster.css",
  "./product-core-fix.css",
  "./universal-tools.css",
  "./app.js",
  "./seo.js",
  "./checkout.js",
  "./dynamic-home.js",
  "./product-poster.js",
  "./product-poster-connect.js",
  "./image-zoom-enhancer.js",
  "./product-core-fix.js",
  "./universal-tools.js",
  "./manifest.json",
  "./config.js",
  "./banner.json",
  "./image/no-image.png",
  "./image/icon-192.png",
  "./image/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  // Hanya GET dari domain website sendiri yang boleh masuk cache.
  // POST, termasuk penyimpanan produk ke Apps Script, dilewatkan normal.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);

    try {
      const response = await fetch(request);

      if (response && response.ok) {
        // Clone HARUS dibuat sebelum response body digunakan.
        const copy = response.clone();
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, copy);
      }

      return response;
    } catch (error) {
      if (cached) return cached;
      throw error;
    }
  })());
});
