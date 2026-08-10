const CACHE_NAME = "dutaled-v1";

const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./sw.js"
];


self.addEventListener(
  "install",
  event => {

    event.waitUntil(

      caches.open(CACHE_NAME)
        .then(cache =>
          cache.addAll(FILES)
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
        .then(keys =>
          Promise.all(

            keys
              .filter(
                key =>
                  key !== CACHE_NAME
              )
              .map(
                key =>
                  caches.delete(key)
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

    /*
      Untuk halaman dan file website:
      cache dulu, lalu gunakan internet
      bila tersedia.
    */

    if(
      event.request.method !== "GET"
    ){

      return;

    }


    const url =
      new URL(
        event.request.url
      );


    /*
      API Google Apps Script
      jangan dimasukkan ke cache Service Worker.

      Data produk sudah ditangani
      oleh localStorage di index.html.
    */

    if(
      url.hostname.includes(
        "script.google.com"
      )
    ){

      return;

    }


    event.respondWith(

      caches.match(
        event.request
      )
      .then(
        cached => {

          if(cached){

            return cached;

          }


          return fetch(
            event.request
          )
          .then(response => {

            if(
              !response ||
              response.status !== 200
            ){

              return response;

            }


            const clone =
              response.clone();


            caches.open(
              CACHE_NAME
            )
            .then(
              cache =>
                cache.put(
                  event.request,
                  clone
                )
            );


            return response;

          });

        }
      )

    );

  }
);
