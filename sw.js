const CACHE_NAME = "dutaled-v9";

const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./dynamic.css",
  "./checkout.css",
  "./order-status-shopee.css",
  "./product-poster.css",
  "./product-core-fix.css",
  "./universal-tools.css",
  "./bottom-nav.css?v=6",
  "./bottom-nav.js?v=3",
  "./pwa-install.css?v=2",
  "./app.js",
  "./seo.js",
  "./checkout.js?v=9",
  "./order-status-shopee.js",
  "./dynamic-home.js",
  "./product-poster.js",
  "./product-poster-connect.js",
  "./image-zoom-enhancer.js",
  "./product-core-fix.js",
  "./universal-tools.js",
  "./manifest.json",
  "./config.js",
  "./banner.json",
  "./wallet.js?v=2",
  "./wallet.css?v=2",
  "./mode-switcher.css?v=1",
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
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    try {
      const response = await fetch(request);
      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      if (cached) return cached;
      throw error;
    }
  })());
});
