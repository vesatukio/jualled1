const CACHE_NAME =
  "dutaled-static-v1";


const STATIC_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./sw.js"
];


self.addEventListener(
  "install",
  event => {

    event.waitUntil(

      caches.open(
        CACHE_NAME
      )
      .then(
        cache =>
          cache.addAll(
            STATIC_FILES
          )
      )

    );

    self.skipWaiting();

  }
);


self.addEventListener(
  "activate",
  event => {

    event.waitUntil(

      caches.keys()
        .then(
          keys =>
            Promise.all(

              keys
                .filter(
                  key =>
                    key !== CACHE_NAME
                )
                .map(
                  key =>
                    caches.delete(
                      key
                    )
                )

            )
        )

    );

    self.clients.claim();

  }
);


self.addEventListener(
  "fetch",
  event => {

    if (
      event.request.method !==
      "GET"
    ) {
      return;
    }


    const url =
      new URL(
        event.request.url
      );


    /*
     * Jangan cache API Apps Script.
     *
     * Data produk disimpan
     * oleh localStorage.
     */

    if (
      url.hostname.includes(
        "script.google.com"
      )
    ) {

      return;

    }


    event.respondWith(

      caches.match(
        event.request
      )
      .then(
        cached => {

          if (cached) {
            return cached;
          }


          return fetch(
            event.request
          )
          .then(
            response => {

              if (
                !response ||
                response.status !== 200
              ) {

                return response;

              }


              const copy =
                response.clone();


              caches.open(
                CACHE_NAME
              )
              .then(
                cache =>
                  cache.put(
                    event.request,
                    copy
                  )
              );


              return response;

            }
          );

        }
      )

    );

  }
);
