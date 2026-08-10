const API_URL =
  "https://script.google.com/macros/s/AKfycbyr4eSauu1RneZIrwwPVBilx21kWNrauE9V40D17dmrntqTu4U3OGi4fafAYHXcd-A/exec";


const WHATSAPP =
  "6283157925577";


const FACEBOOK_URL = "#";
const TIKTOK_URL = "#";
const LOCATION_URL = "#";


const CACHE_KEY =
  "dutaled_produk_v4";


let products = [];

let selectedCategory = "Semua";


const grid =
  document.getElementById(
    "productGrid"
  );

const categoryBar =
  document.getElementById(
    "categoryBar"
  );

const searchInput =
  document.getElementById(
    "searchInput"
  );

const loading =
  document.getElementById(
    "loading"
  );

const empty =
  document.getElementById(
    "empty"
  );

const status =
  document.getElementById(
    "status"
  );


document.addEventListener(
  "DOMContentLoaded",
  init
);


function init() {

  setupLinks();

  loadProducts();

  registerSW();

}


function setupLinks() {

  const message =
    "Halo Duta LED, saya ingin bertanya tentang produk.";

  const link =
    whatsappLink(message);


  document.getElementById(
    "heroWA"
  ).href = link;


  document.getElementById(
    "contactWA"
  ).href = link;


  document.getElementById(
    "floatingWA"
  ).href = link;


  document.getElementById(
    "facebook"
  ).href = FACEBOOK_URL;


  document.getElementById(
    "tiktok"
  ).href = TIKTOK_URL;


  document.getElementById(
    "location"
  ).href = LOCATION_URL;


  document.getElementById(
    "year"
  ).textContent =
    new Date().getFullYear();

}


function whatsappLink(message) {

  return (
    "https://wa.me/" +
    WHATSAPP +
    "?text=" +
    encodeURIComponent(message)
  );

}


/* =========================================
   LOAD DATA
========================================= */

async function loadProducts() {

  const cache =
    getCache();


  if (cache.length) {

    products = cache;

    createCategories();

    filterProducts();

    hideLoading();

    setStatus(
      navigator.onLine
        ? "● Online • katalog tersimpan"
        : "● Offline • katalog tersimpan"
    );

  }


  if (
    !navigator.onLine
  ) {

    if (!cache.length) {
      showOffline();
    }

    return;

  }


  try {

    const response =
      await fetch(
        API_URL +
        "?action=produk&v=" +
        Date.now(),
        {
          cache: "no-store"
        }
      );


    if (!response.ok) {
      throw new Error(
        "API tidak merespons"
      );
    }


    const result =
      await response.json();


    if (
      !result.success ||
      !Array.isArray(result.data)
    ) {
      throw new Error(
        result.message ||
        "Data tidak valid"
      );
    }


    products =
      result.data;


    saveCache(
      products
    );


    createCategories();

    filterProducts();

    hideLoading();


    setStatus(
      "● Online • katalog terbaru"
    );


  } catch (error) {

    console.error(error);


    if (!products.length) {
      showError();
    }

  }

}


/* =========================================
   KATEGORI
========================================= */

function createCategories() {

  const categories =
    [
      ...new Set(

        products
          .map(
            product =>
              String(
                product.kategori || ""
              ).trim()
          )
          .filter(Boolean)

      )
    ];


  categories.sort(
    (a, b) =>
      a.localeCompare(
        b,
        "id"
      )
  );


  categoryBar.innerHTML = "";


  /*
   * SEMUA
   */

  categoryBar.appendChild(
    createCategoryButton(
      "Semua"
    )
  );


  /*
   * KATEGORI DARI SHEET
   */

  categories.forEach(
    category => {

      categoryBar.appendChild(
        createCategoryButton(
          category
        )
      );

    }
  );

}


function createCategoryButton(
  category
) {

  const button =
    document.createElement(
      "button"
    );


  button.type =
    "button";


  button.textContent =
    category;


  button.className =
    "category-button";


  if (
    category ===
    selectedCategory
  ) {

    button.classList.add(
      "active"
    );

  }


  button.addEventListener(
    "click",
    function() {

      selectedCategory =
        category;


      document
        .querySelectorAll(
          ".category-button"
        )
        .forEach(
          item =>
            item.classList.remove(
              "active"
            )
        );


      button.classList.add(
        "active"
      );


      filterProducts();

    }
  );


  return button;

}


/* =========================================
   FILTER
========================================= */

function filterProducts() {

  const keyword =
    searchInput.value
      .trim()
      .toLowerCase();


  let result =
    products;


  if (
    selectedCategory !==
    "Semua"
  ) {

    result =
      result.filter(
        product =>
          String(
            product.kategori || ""
          )
          .trim()
          .toLowerCase() ===
          selectedCategory
            .toLowerCase()
      );

  }


  if (keyword) {

    result =
      result.filter(
        product => {

          const name =
            String(
              product.nama || ""
            ).toLowerCase();


          const category =
            String(
              product.kategori || ""
            ).toLowerCase();


          const description =
            String(
              product.diskipsi || ""
            ).toLowerCase();


          return (
            name.includes(keyword) ||
            category.includes(keyword) ||
            description.includes(keyword)
          );

        }
      );

  }


  renderProducts(
    result
  );

}


searchInput.addEventListener(
  "input",
  filterProducts
);


/* =========================================
   RENDER
========================================= */

function renderProducts(
  list
) {

  grid.innerHTML = "";


  if (!list.length) {

    empty.classList.remove(
      "hidden"
    );

    return;

  }


  empty.classList.add(
    "hidden"
  );


  list.forEach(
    (product, index) => {

      grid.appendChild(
        createCard(
          product,
          index
        )
      );

    }
  );

}


function createCard(
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
    placeholder();


  const price =
    Number(
      product.hargaJual
    ) || 0;


  const salePrice =
    Number(
      product.hargaDiskon
    ) || 0;


  const discount =
    Number(
      product.diskon
    ) || 0;


  const hasDiscount =
    salePrice > 0 &&
    salePrice < price;


  const finalPrice =
    hasDiscount
      ? salePrice
      : price;


  card.innerHTML = `

    <div class="product-image">

      ${
        hasDiscount
          ? `
            <span class="discount">
              -${discount || ""}%
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


    <div class="product-info">

      <span class="product-category">
        ${escapeHTML(
          product.kategori || "Produk"
        )}
      </span>


      <h3>
        ${escapeHTML(name)}
      </h3>


      ${
        product.diskipsi
          ? `
            <p>
              ${escapeHTML(
                product.diskipsi
              )}
            </p>
          `
          : ""
      }


      <div class="price">

        ${
          hasDiscount
            ? `
              <del>
                ${rupiah(price)}
              </del>
            `
            : ""
        }

        <strong>
          ${rupiah(finalPrice)}
        </strong>

      </div>


      <div class="card-buttons">

        <a
          class="buy"
          target="_blank"
          rel="noopener"
          href="${whatsappLink(
            `Halo Duta LED, saya ingin pesan ${name}.`
          )}"
        >
          💬 Beli
        </a>


        <button
          class="share"
          type="button"
        >
          ↗
        </button>

      </div>

    </div>

  `;


  card
    .querySelector(".share")
    .addEventListener(
      "click",
      () =>
        shareProduct(
          product
        )
    );


  return card;

}


/* =========================================
   SHARE
========================================= */

async function shareProduct(
  product
) {

  const name =
    product.nama ||
    "Produk Duta LED";


  const url =
    window.location.href;


  if (
    navigator.share
  ) {

    try {

      await navigator.share({

        title: name,

        text:
          `${name} - Duta LED`,

        url: url

      });

      return;

    } catch (e) {}

  }


  window.open(
    whatsappLink(
      `${name} - Duta LED\n${url}`
    ),
    "_blank"
  );

}


/* =========================================
   CACHE
========================================= */

function saveCache(data) {

  try {

    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify(data)
    );

  } catch (e) {

    console.warn(
      "Cache gagal",
      e
    );

  }

}


function getCache() {

  try {

    const data =
      localStorage.getItem(
        CACHE_KEY
      );


    if (!data) {
      return [];
    }


    const parsed =
      JSON.parse(data);


    return Array.isArray(parsed)
      ? parsed
      : [];

  } catch (e) {

    return [];

  }

}


/* =========================================
   STATUS
========================================= */

function setStatus(text) {

  status.textContent =
    text;


  status.className =
    "status";


  if (
    navigator.onLine
  ) {

    status.classList.add(
      "online"
    );

  } else {

    status.classList.add(
      "offline"
    );

  }

}


window.addEventListener(
  "online",
  function() {

    setStatus(
      "● Online • memperbarui katalog"
    );

    loadProducts();

  }
);


window.addEventListener(
  "offline",
  function() {

    setStatus(
      "● Offline • menggunakan cache"
    );

  }
);


/* =========================================
   UTILITAS
========================================= */

function rupiah(value) {

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


function escapeHTML(value) {

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


function placeholder() {

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


/* =========================================
   LOADING
========================================= */

function hideLoading() {

  loading.classList.add(
    "hidden"
  );

}


function showOffline() {

  loading.innerHTML = `
    <div class="offline-box">
      <strong>
        Belum ada katalog tersimpan
      </strong>
      <span>
        Buka halaman saat online
        terlebih dahulu.
      </span>
    </div>
  `;

}


function showError() {

  loading.innerHTML = `
    <div class="offline-box">
      <strong>
        Katalog belum dapat dimuat
      </strong>
      <span>
        Periksa koneksi atau Apps Script.
      </span>
    </div>
  `;

}


/* =========================================
   SERVICE WORKER
========================================= */

function registerSW() {

  if (
    "serviceWorker" in navigator
  ) {

    navigator.serviceWorker
      .register(
        "./sw.js"
      )
      .catch(
        console.error
      );

  }

}
