const CACHE_NAME = "dutaled-v2";

const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json"
];


/* =========================================
   INSTALL
========================================= */

self.addEventListener(
  "install",
  event => {

    event.waitUntil(

      caches
        .open(CACHE_NAME)
        .then(cache => {

          return cache.addAll(
            APP_FILES
          );

        })

    );

    self.skipWaiting();

  }
);


/* =========================================
   ACTIVATE
========================================= */

self.addEventListener(
  "activate",
  event => {

    event.waitUntil(

      caches.keys()
        .then(keys => {

          return Promise.all(

            keys
              .filter(
                key =>
                  key !== CACHE_NAME
              )
              .map(
                key =>
                  caches.delete(key)
              )

          );

        })

    );

    self.clients.claim();

  }
);


/* =========================================
   FETCH
========================================= */

self.addEventListener(
  "fetch",
  event => {

    const request =
      event.request;


    /*
      Jangan cache request
      Google Apps Script.
    */

    if (
      request.url.includes(
        "script.google.com"
      )
    ) {

      return;

    }


    /*
      Navigasi halaman:
      coba internet dulu,
      kalau gagal gunakan cache.
    */

    if (
      request.mode ===
      "navigate"
    ) {

      event.respondWith(

        fetch(request)
          .then(response => {

            const copy =
              response.clone();

            caches
              .open(CACHE_NAME)
              .then(cache => {

                cache.put(
                  request,
                  copy
                );

              });

            return response;

          })
          .catch(() => {

            return caches.match(
              "./index.html"
            );

          })

      );

      return;

    }


    /*
      CSS / JS / gambar:
      cache dulu,
      kemudian update dari internet.
    */

    event.respondWith(

      caches.match(request)
        .then(cached => {

          const network =
            fetch(request)
              .then(response => {

                if (
                  response &&
                  response.ok
                ) {

                  const copy =
                    response.clone();

                  caches
                    .open(
                      CACHE_NAME
                    )
                    .then(cache => {

                      cache.put(
                        request,
                        copy
                      );

                    });

                }

                return response;

              })
              .catch(
                () => cached
              );


          return cached ||
            network;

        })

    );

  }
);
