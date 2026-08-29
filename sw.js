const CACHE_NAME = "dutaled-v3";
const APP_FILES = [
  "./","./index.html","./style.css","./app.js","./seo.js","./checkout.js","./dynamic-home.js","./product-poster.js","./product-poster-connect.js","./image-zoom-enhancer.js","./universal-tools.js","./universal-tools.css","./product-poster.css","./checkout.css","./dynamic.css","./manifest.json","./config.js","./image/no-image.png","./image/icon-192.png","./image/icon-512.png"
];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_FILES).catch(()=>{})).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{if(event.request.method!=="GET")return;const u=new URL(event.request.url);if(u.origin!==location.origin)return;event.respondWith(caches.match(event.request).then(cached=>{const network=fetch(event.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE_NAME).then(c=>c.put(event.request,copy))}return r}).catch(()=>cached);return cached||network}))});
