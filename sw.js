const CACHE_NAME = 'dutakita-v1';
const assets = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  'https://raw.githubusercontent.com/vesatukio/jualled1/main/icon-192.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(assets)));
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
