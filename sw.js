const CACHE_NAME = "dutaled-v2";

const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./affiliate-generator.js",
  "./manifest.json",
  "./image/no-image.png",
  "./image/icon-192.png",
  "./image/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

/*
  index.html belum perlu diubah manual.
  app.js digabung dengan affiliate-generator.js saat browser meminta app.js.
  Dengan begitu Affiliate Generator ikut dimuat tanpa mengganggu app.js lama.
*/
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.pathname.endsWith("/app.js")) {
    event.respondWith(loadCombinedApp(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request);
    })
  );
});

async function loadCombinedApp(request) {
  const cache = await caches.open(CACHE_NAME);

  let appResponse = await cache.match(request);
  if (!appResponse) {
    appResponse = await fetch(request);
  }

  let affiliateResponse = await cache.match("./affiliate-generator.js");
  if (!affiliateResponse) {
    affiliateResponse = await fetch(new URL("./affiliate-generator.js", request.url));
  }

  const appCode = await appResponse.text();
  const affiliateCode = await affiliateResponse.text();

  return new Response(
    appCode + "\n\n/* ===== DUTA LED AFFILIATE GENERATOR ===== */\n" + affiliateCode,
    {
      status: 200,
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-cache"
      }
    }
  );
}
