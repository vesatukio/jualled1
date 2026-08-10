/* =====================================================
   DUTA LED
   APP.JS
===================================================== */


/* =====================================================
   KONFIGURASI
===================================================== */

const API_URL =
  "https://script.google.com/macros/s/AKfycbyr4eSauu1RneZIrwwPVBilx21kWNrauE9V40D17dmrntqTu4U3OGi4fafAYHXcd-A/exec";


const WHATSAPP =
  "6283157925577";


/*
 * GANTI LINK DI BAWAH INI
 */

const FACEBOOK_URL = "#";

const TIKTOK_URL = "#";

const LOCATION_URL = "#";


/*
 * CACHE
 */

const CACHE_KEY =
  "dutaled_products_v3";


/* =====================================================
   ELEMENT
===================================================== */

const grid =
  document.getElementById(
    "productGrid"
  );

const loading =
  document.getElementById(
    "loading"
  );

const empty =
  document.getElementById(
    "emptyState"
  );

const search =
  document.getElementById(
    "searchInput"
  );

const status =
  document.getElementById(
    "connectionStatus"
  );


let products = [];


/* =====================================================
   INIT
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  init
);


function init() {

  setupLinks();

  updateStatus();

  loadProducts();

  registerServiceWorker();

}


/* =====================================================
   LINKS
===================================================== */

function setupLinks() {

  const message =
    "Halo Duta LED, saya ingin bertanya tentang produk.";

  const whatsapp =
    createWhatsappLink(
      message
    );


  document.getElementById(
    "heroWhatsapp"
  ).href = whatsapp;


  document.getElementById(
    "contactWhatsapp"
  ).href = whatsapp;


  document.getElementById(
    "floatingWhatsapp"
  ).href = whatsapp;


  document.getElementById(
    "facebookLink"
  ).href = FACEBOOK_URL;


  document.getElementById(
    "tiktokLink"
  ).href = TIKTOK_URL;


  document.getElementById(
    "locationLink"
  ).href = LOCATION_URL;


  document.getElementById(
    "year"
  ).textContent =
    new Date().getFullYear();

}


/* =====================================================
   WHATSAPP
===================================================== */

function createWhatsappLink(
  message
) {

  return (
    "https://wa.me/" +
    WHATSAPP +
    "?text=" +
    encodeURIComponent(message)
  );

}


function productWhatsapp(
  productName
) {

  return createWhatsappLink(
    `Halo Duta LED, saya ingin pesan ${productName}.`
  );

}


/* =====================================================
   STATUS INTERNET
===================================================== */

function updateStatus() {

  if (
    navigator.onLine
  ) {

    status.textContent =
      "● Online";

    status.className =
      "connection-status online";

  } else {

    status.textContent =
      "● Offline • menampilkan produk tersimpan";

    status.className =
      "connection-status offline";

  }

}


window.addEventListener(
  "online",
  () => {

    updateStatus();

    /*
     * Saat koneksi kembali,
     * update katalog otomatis.
     */

    loadOnlineProducts();

  }
);


window.addEventListener(
  "offline",
  updateStatus
);


/* =====================================================
   LOAD PRODUK
===================================================== */

async function loadProducts() {

  /*
   * Tampilkan cache dahulu.
   */

  const cached =
    getCachedProducts();


  if (
    cached.length
  ) {

    products =
      cached;

    renderProducts(
      products
    );

    hideLoading();

  }


  /*
   * Jika online,
   * ambil data terbaru.
   */

  if (
    navigator.onLine
  ) {

    await loadOnlineProducts();

  } else {

    if (
      !cached.length
    ) {

      showOfflineEmpty();

    }

  }

}


/* =====================================================
   ONLINE DATA
===================================================== */

async function loadOnlineProducts() {

  try {

    const response =
      await fetch(
        API_URL +
        "?action=produk&v=" +
        Date.now(),
        {
          method: "GET",
          cache: "no-store"
        }
      );


    if (
      !response.ok
    ) {

      throw new Error(
        "Server API tidak merespons."
      );

    }


    const result =
      await response.json();


    if (
      !result.success
    ) {

      throw new Error(
        result.message ||
        "API gagal."
      );

    }


    if (
      !Array.isArray(
        result.data
      )
    ) {

      throw new Error(
        "Format data produk salah."
      );

    }


    /*
     * Data terbaru.
     */

    products =
      result.data;


    /*
     * Simpan ke browser.
     */

    saveProducts(
      products
    );


    /*
     * Tampilkan.
     */

    renderProducts(
      products
    );


    hideLoading();

    updateStatus();


  } catch (error) {

    console.error(
      "API:",
      error
    );


    /*
     * Jika cache sudah ada,
     * tidak perlu mengganggu tampilan.
     */

    if (
      products.length
    ) {

      hideLoading();

      return;

    }


    showApiError();

  }

}


/* =====================================================
   CACHE
===================================================== */

function saveProducts(
  data
) {

  try {

    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify(data)
    );

  } catch (error) {

    console.warn(
      "Cache gagal:",
      error
    );

  }

}


function getCachedProducts() {

  try {

    const saved =
      localStorage.getItem(
        CACHE_KEY
      );


    if (
      !saved
    ) {

      return [];

    }


    const data =
      JSON.parse(saved);


    return Array.isArray(data)
      ? data
      : [];

  } catch (error) {

    return [];

  }

}


/* =====================================================
   RENDER PRODUK
===================================================== */

function renderProducts(
  data
) {

  grid.innerHTML = "";


  if (
    !data.length
  ) {

    empty.classList.remove(
      "hidden"
    );

    return;

  }


  empty.classList.add(
    "hidden"
  );


  data.forEach(
    (
      product,
      index
    ) => {

      grid.appendChild(
        createProductCard(
          product,
          index
        )
      );

    }
  );

}


/* =====================================================
   PRODUCT CARD
===================================================== */

function createProductCard(
  product,
  index
) {

  const card =
    document.createElement(
      "article"
    );


  card.className =
    "product-card";


  const name =
    product.nama ||
    "Produk";


  const image =
    product.gambar1 ||
    product.gambar2 ||
    product.gambar3 ||
    createPlaceholder();


  const price =
    Number(
      product.hargaJual
    ) || 0;


  const discountPrice =
    Number(
      product.hargaDiskon
    ) || 0;


  const hasDiscount =
    discountPrice > 0 &&
    discountPrice < price;


  let discount =
    Number(
      product.diskon
    ) || 0;


  if (
    hasDiscount &&
    !discount &&
    price
  ) {

    discount =
      Math.round(
        (
          (price - discountPrice) /
          price
        ) * 100
      );

  }


  card.innerHTML = `

    <div class="product-image">

      ${
        hasDiscount
          ? `
            <span class="discount-badge">
              -${discount}%
            </span>
          `
          : ""
      }


      <img
        src="${escapeHTML(image)}"
        alt="${escapeHTML(name)}"
        loading="${
          index < 4
            ? "eager"
            : "lazy"
        }"
      >

    </div>


    <div class="product-content">

      <h3>
        ${escapeHTML(name)}
      </h3>


      ${
        product.diskipsi
          ? `
            <p class="product-description">
              ${escapeHTML(
                product.diskipsi
              )}
            </p>
          `
          : ""
      }


      <div class="product-price">

        ${
          hasDiscount
            ? `
              <span class="old-price">
                ${formatRupiah(price)}
              </span>

              <strong>
                ${formatRupiah(
                  discountPrice
                )}
              </strong>
            `
            : `
              <strong>
                ${formatRupiah(price)}
              </strong>
            `
        }

      </div>


      <div class="product-buttons">

        <a
          href="${productWhatsapp(name)}"
          target="_blank"
          rel="noopener"
          class="buy-button"
        >
          💬 Beli
        </a>


        <button
          type="button"
          class="share-button"
          aria-label="Bagikan produk"
        >
          ↗
        </button>

      </div>

    </div>

  `;


  const shareButton =
    card.querySelector(
      ".share-button"
    );


  shareButton.addEventListener(
    "click",
    () =>
      shareProduct(
        product
      )
  );


  return card;

}


/* =====================================================
   FORMAT HARGA
===================================================== */

function formatRupiah(
  value
) {

  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }
  ).format(
    Number(value) || 0
  );

}


/* =====================================================
   SEARCH
===================================================== */

search.addEventListener(
  "input",
  function () {

    const keyword =
      this.value
        .trim()
        .toLowerCase();


    if (
      !keyword
    ) {

      renderProducts(
        products
      );

      return;

    }


    const result =
      products.filter(
        product =>
          String(
            product.nama || ""
          )
          .toLowerCase()
          .includes(
            keyword
          )
      );


    renderProducts(
      result
    );

  }
);


/* =====================================================
   SHARE
===================================================== */

async function shareProduct(
  product
) {

  const name =
    product.nama ||
    "Produk Duta LED";


  const url =
    window.location.origin +
    window.location.pathname;


  const text =
    `${name} - Duta LED`;


  /*
   * HP modern
   */

  if (
    navigator.share
  ) {

    try {

      await navigator.share({

        title: name,

        text: text,

        url: url

      });

      return;

    } catch (error) {

      /*
       * User membatalkan share.
       */

    }

  }


  /*
   * Fallback WhatsApp
   */

  const wa =
    createWhatsappLink(
      `${text}\n${url}`
    );


  window.open(
    wa,
    "_blank",
    "noopener"
  );

}


/* =====================================================
   PLACEHOLDER
===================================================== */

function createPlaceholder() {

  return (
    "data:image/svg+xml," +
    encodeURIComponent(`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 500 500"
      >
        <rect
          width="500"
          height="500"
          fill="#f5f5f5"
        />

        <text
          x="250"
          y="250"
          text-anchor="middle"
          dominant-baseline="middle"
          font-family="Arial"
          font-size="32"
          fill="#999"
        >
          Duta LED
        </text>

      </svg>
    `)
  );

}


/* =====================================================
   SECURITY
===================================================== */

function escapeHTML(
  value
) {

  return String(
    value || ""
  )
  .replace(
    /&/g,
    "&amp;"
  )
  .replace(
    /</g,
    "&lt;"
  )
  .replace(
    />/g,
    "&gt;"
  )
  .replace(
    /"/g,
    "&quot;"
  )
  .replace(
    /'/g,
    "&#039;"
  );

}


/* =====================================================
   LOADING
===================================================== */

function hideLoading() {

  loading.classList.add(
    "hidden"
  );

}


function showOfflineEmpty() {

  loading.innerHTML = `
    <div class="offline-message">
      <strong>Belum ada katalog tersimpan.</strong>
      <span>
        Buka halaman saat online
        untuk memuat produk.
      </span>
    </div>
  `;

}


function showApiError() {

  loading.innerHTML = `
    <div class="offline-message">
      <strong>
        Katalog belum dapat dimuat.
      </strong>

      <span>
        Periksa koneksi internet
        atau Apps Script.
      </span>
    </div>
  `;

}


/* =====================================================
   SERVICE WORKER
===================================================== */

function registerServiceWorker() {

  if (
    "serviceWorker" in navigator
  ) {

    window.addEventListener(
      "load",
      function () {

        navigator.serviceWorker
          .register(
            "./sw.js"
          )
          .catch(
            error =>
              console.warn(
                "SW:",
                error
              )
          );

      }
    );

  }

}
