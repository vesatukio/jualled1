const CACHE_NAME = "dt-led-v2"; // Naikkan versi jika Anda update file

const urlsToCache = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// 1. Tahap Install: Simpan semua file ke cache
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("Caching files...");
      return cache.addAll(urlsToCache);
    })
  );
});

// 2. Tahap Activate: Hapus cache versi lama agar file selalu update
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log("Deleting old cache...");
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// 3. Tahap Fetch: Ambil dari cache, jika tidak ada baru ambil dari internet
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
