/* =====================================================
   DUTA LED - APP.JS
   Google Sheet : jualled1
   Sheet        : PRODUK
   ===================================================== */

"use strict";


/* =====================================================
   PENGATURAN
===================================================== */

const API_URL =
  "https://script.google.com/macros/s/AKfycbyr4eSauu1RneZIrwwPVBilx21kWNrauE9V40D17dmrntqTu4U3OGi4fafAYHXcd-A/exec";

const WHATSAPP =
  "6283157925577";

const FACEBOOK_URL =
  "#";

const TIKTOK_URL =
  "#";

const LOCATION_URL =
  "#";

const CACHE_KEY =
  "dutaled_produk_v1";


/* =====================================================
   DATA
===================================================== */

let products = [];

let currentCategory = "Semua";

let searchText = "";


/* =====================================================
   ELEMENT
===================================================== */

const productGrid =
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


/* =====================================================
   START
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  init
);


async function init() {

  setupLinks();

  setupSearch();

  setupPromoButton();

  showLoading(true);


  /* Coba cache dulu */

  const cached =
    loadCache();


  if (cached.length) {

    products = cached;

    renderCategories();

    renderProducts();

    showStatus(
      "Katalog tersimpan"
    );

    showLoading(false);

  }


  /* Ambil data terbaru */

  try {

    const fresh =
      await loadFromGoogle();

    if (fresh.length) {

      products = fresh;

      saveCache(products);

      renderCategories();

      renderProducts();

      showStatus(
        "Katalog terbaru"
      );

    }

  } catch (error) {

    console.warn(
      "Google Sheet tidak tersedia:",
      error
    );


    if (!products.length) {

      showStatus(
        "Mode offline"
      );

    }

  }


  showLoading(false);

}


/* =====================================================
   LOAD GOOGLE SHEET
===================================================== */

async function loadFromGoogle() {

  const response =
    await fetch(
      API_URL + "?t=" + Date.now(),
      {
        method: "GET",
        cache: "no-store"
      }
    );


  if (!response.ok) {

    throw new Error(
      "HTTP " +
      response.status
    );

  }


  const data =
    await response.json();


  /*
     Apps Script bisa mengembalikan:

     [
       {...},
       {...}
     ]

     atau:

     {
       data: [...]
     }
  */

  let rows =
    Array.isArray(data)
      ? data
      : data.data;


  if (!Array.isArray(rows)) {

    throw new Error(
      "Format data tidak valid"
    );

  }


  return rows
    .map(normalizeProduct)
    .filter(
      product =>
        product.nama
    );

}


/* =====================================================
   NORMALISASI PRODUK
===================================================== */

function normalizeProduct(row) {

  return {

    id:
      value(
        row.ID ??
        row.id
      ),

    nama:
      value(
        row.nama ??
        row.Nama
      ),

    kategori:
      value(
        row.kategori ??
        row.Kategori
      ) || "Lainnya",


    /*
      HARGA MODAL DAN LABA
      sengaja tetap dibaca bila ada,
      tetapi TIDAK ditampilkan.
    */

    hargaModal:
      number(
        row["harga modal"] ??
        row.hargaModal
      ),

    laba:
      number(
        row.Laba ??
        row.laba
      ),


    hargaJual:
      number(
        row["harga jual"] ??
        row.hargaJual
      ),

    diskon:
      number(
        row.diskon
      ),

    hargaDiskon:
      number(
        row["harga diskon"] ??
        row.hargaDiskon
      ),

    deskripsi:
      value(
        row.diskipsi ??
        row.deskripsi ??
        row.deskripsi
      ),

    gambar1:
      value(
        row.gambar1
      ),

    gambar2:
      value(
        row.gambar2
      ),

    gambar3:
      value(
        row.gambar3
      )

  };

}


/* =====================================================
   HELPER DATA
===================================================== */

function value(v) {

  if (
    v === null ||
    v === undefined
  ) {
    return "";
  }

  return String(v).trim();

}


function number(v) {

  if (
    v === null ||
    v === undefined ||
    v === ""
  ) {
    return 0;
  }


  const cleaned =
    String(v)
      .replace(/[^\d.-]/g, "");


  return (
    Number(cleaned) || 0
  );

}


/* =====================================================
   KATEGORI
===================================================== */

function renderCategories() {

  if (!categoryBar) return;


  const categories = [
    "Semua"
  ];


  products.forEach(
    product => {

      const category =
        product.kategori.trim();


      if (
        category &&
        !categories.includes(
          category
        )
      ) {

        categories.push(
          category
        );

      }

    }
  );


  categoryBar.innerHTML = "";


  categories.forEach(
    category => {

      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";

      button.className =
        "category-button";


      if (
        category ===
        currentCategory
      ) {

        button.classList.add(
          "active"
        );

      }


      button.textContent =
        category;


      button.addEventListener(
        "click",
        () => {

          currentCategory =
            category;

          renderCategories();

          renderProducts();

        }
      );


      categoryBar.appendChild(
        button
      );

    }
  );

}


/* =====================================================
   SEARCH
===================================================== */

function setupSearch() {

  if (!searchInput) return;


  searchInput.addEventListener(
    "input",
    event => {

      searchText =
        event.target.value
          .trim()
          .toLowerCase();


      renderProducts();

    }
  );

}


/* =====================================================
   FILTER PRODUK
===================================================== */

function getFilteredProducts() {

  return products.filter(
    product => {

      const categoryOK =
        currentCategory ===
        "Semua" ||
        product.kategori
          .toLowerCase() ===
        currentCategory
          .toLowerCase();


      const searchOK =
        !searchText ||
        product.nama
          .toLowerCase()
          .includes(searchText) ||
        product.kategori
          .toLowerCase()
          .includes(searchText) ||
        product.deskripsi
          .toLowerCase()
          .includes(searchText);


      return (
        categoryOK &&
        searchOK
      );

    }
  );

}


/* =====================================================
   RENDER PRODUK
===================================================== */

function renderProducts() {

  if (!productGrid) return;


  const list =
    getFilteredProducts();


  productGrid.innerHTML =
    "";


  if (!list.length) {

    empty?.classList.remove(
      "hidden"
    );

    return;

  }


  empty?.classList.add(
    "hidden"
  );


  list.forEach(
    product => {

      productGrid.appendChild(
        createProductCard(
          product
        )
      );

    }
  );

}


/* =====================================================
   CARD PRODUK
===================================================== */

function createProductCard(product) {

  const card = document.createElement("article");

  card.className = "product-card";

  const image =
    product.gambar1 ||
    product.gambar2 ||
    product.gambar3 ||
    "https://via.placeholder.com/500?text=Duta+LED";

  const hargaJual = product.hargaJual;
  const hargaDiskon = product.hargaDiskon;

  const hasDiscount =
    hargaDiskon > 0 &&
    hargaJual > 0 &&
    hargaDiskon < hargaJual;

  let discountHTML = "";

  if (hasDiscount) {

    let persen = product.diskon;

    if (!persen) {
      persen = Math.round(
        (1 - hargaDiskon / hargaJual) * 100
      );
    }

    discountHTML = `
      <span class="discount-badge">
        -${persen}%
      </span>
    `;
  }

  const priceHTML = hasDiscount

    ? `
      <div class="old-price">
        ${formatRupiah(hargaJual)}
      </div>

      <div class="price">
        ${formatRupiah(hargaDiskon)}
      </div>
    `

    : `
      <div class="price">
        ${formatRupiah(hargaJual)}
      </div>
    `;


  card.innerHTML = `

    <div class="product-image">

      <img
        src="${escapeHTML(image)}"
        alt="${escapeHTML(product.nama)}"
        loading="lazy"
        onerror="this.src='https://via.placeholder.com/500?text=Duta+LED'"
      >

      ${discountHTML}

    </div>


    <div class="product-info">

      <div class="product-name">
        ${escapeHTML(product.nama)}
      </div>

      ${priceHTML}


      <button
        type="button"
        class="buy-button"
      >
        🛒 Beli
      </button>


      <div class="product-share">

        <button
          type="button"
          class="share-wa"
          title="Bagikan ke WhatsApp"
        >
          💬
        </button>

        <button
          type="button"
          class="share-fb"
          title="Bagikan ke Facebook"
        >
          f
        </button>

        <button
          type="button"
          class="share-copy"
          title="Salin link produk"
        >
          🔗
        </button>

      </div>

    </div>

  `;


  /* =========================
     TOMBOL BELI
  ========================= */

  const buyButton =
    card.querySelector(".buy-button");

  buyButton.addEventListener(
    "click",
    () => {
      buyProduct(product);
    }
  );


  /* =========================
     SHARE WHATSAPP
  ========================= */

  const shareWA =
    card.querySelector(".share-wa");

  shareWA.addEventListener(
    "click",
    () => {

      const link =
        getProductLink(product);

      const message =
        `Halo Duta LED, saya ingin melihat produk ${product.nama}.\n\n${link}`;

      openWhatsApp(message);

    }
  );


  /* =========================
     SHARE FACEBOOK
  ========================= */

  const shareFB =
    card.querySelector(".share-fb");

  shareFB.addEventListener(
    "click",
    () => {

      const link =
        getProductLink(product);

      const facebookURL =
        "https://www.facebook.com/sharer/sharer.php?u=" +
        encodeURIComponent(link);

      window.open(
        facebookURL,
        "_blank",
        "width=600,height=500"
      );

    }
  );


  /* =========================
     SALIN LINK
  ========================= */

  const shareCopy =
    card.querySelector(".share-copy");

  shareCopy.addEventListener(
    "click",
    async () => {

      const link =
        getProductLink(product);

      try {

        await navigator.clipboard.writeText(
          link
        );

        shareCopy.textContent = "✓";

        setTimeout(() => {
          shareCopy.textContent = "🔗";
        }, 1500);

      } catch (error) {

        /* Fallback HP/browser lama */

        const textarea =
          document.createElement("textarea");

        textarea.value = link;

        document.body.appendChild(
          textarea
        );

        textarea.select();

        document.execCommand(
          "copy"
        );

        textarea.remove();

        shareCopy.textContent = "✓";

        setTimeout(() => {
          shareCopy.textContent = "🔗";
        }, 1500);

      }

    }
  );


  return card;
}


/* =====================================================
   LINK PRODUK
===================================================== */

function getProductLink(product) {

  const url =
    new URL(
      window.location.href
    );

  if (product.id) {

    url.searchParams.set(
      "id",
      product.id
    );

  }

  /*
    Hapus anchor agar link
    lebih bersih saat dibagikan.
  */

  url.hash = "";

  return url.toString();

}

/* =====================================================
   BELI PRODUK
===================================================== */

function buyProduct(
  product
) {

  const message =
    `Halo Duta LED, saya ingin pesan ${product.nama}.`;


  openWhatsApp(
    message
  );

}


/* =====================================================
   WHATSAPP
===================================================== */

function whatsappLink(
  message
) {

  return (
    "https://wa.me/" +
    WHATSAPP +
    "?text=" +
    encodeURIComponent(
      message
    )
  );

}


function openWhatsApp(
  message
) {

  window.open(
    whatsappLink(message),
    "_blank",
    "noopener"
  );

}


/* =====================================================
   LINK MENU
===================================================== */

function setupLinks() {

  const generalMessage =
    "Halo Duta LED, saya ingin bertanya tentang produk.";


  const generalWA =
    whatsappLink(
      generalMessage
    );


  const heroWA =
    document.getElementById(
      "heroWA"
    );

  const contactWA =
    document.getElementById(
      "contactWA"
    );

  const floatingWA =
    document.getElementById(
      "floatingWA"
    );

  const menuGrosir =
    document.getElementById(
      "menuGrosir"
    );

  const facebook =
    document.getElementById(
      "facebook"
    );

  const tiktok =
    document.getElementById(
      "tiktok"
    );

  const location =
    document.getElementById(
      "location"
    );


  if (heroWA)
    heroWA.href =
      generalWA;


  if (contactWA)
    contactWA.href =
      generalWA;


  if (floatingWA)
    floatingWA.href =
      generalWA;


  if (menuGrosir) {

    menuGrosir.href =
      whatsappLink(
        "Halo Duta LED, saya ingin bertanya harga grosir."
      );

  }


  if (facebook)
    facebook.href =
      FACEBOOK_URL;


  if (tiktok)
    tiktok.href =
      TIKTOK_URL;


  if (location)
    location.href =
      LOCATION_URL;

}


/* =====================================================
   MENU PROMO
   Menampilkan hanya produk diskon
===================================================== */

function setupPromoButton() {

  const button =
    document.getElementById(
      "menuPromo"
    );


  if (!button) return;


  button.addEventListener(
    "click",
    event => {

      event.preventDefault();


      searchText = "";


      if (searchInput)
        searchInput.value = "";


      currentCategory =
        "Semua";


      renderCategories();


      const promoProducts =
        products.filter(
          product =>
            product.hargaDiskon > 0 &&
            product.hargaJual > 0 &&
            product.hargaDiskon <
            product.hargaJual
        );


      productGrid.innerHTML =
        "";


      if (!promoProducts.length) {

        empty?.classList.remove(
          "hidden"
        );

      } else {

        empty?.classList.add(
          "hidden"
        );


        promoProducts.forEach(
          product => {

            productGrid.appendChild(
              createProductCard(
                product
              )
            );

          }
        );

      }


      document
        .getElementById("produk")
        ?.scrollIntoView({
          behavior: "smooth"
        });

    }
  );

}


/* =====================================================
   FORMAT RUPIAH
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
    value || 0
  );

}


/* =====================================================
   CACHE
===================================================== */

function saveCache(
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


function loadCache() {

  try {

    const data =
      localStorage.getItem(
        CACHE_KEY
      );


    if (!data)
      return [];


    const parsed =
      JSON.parse(data);


    return Array.isArray(parsed)
      ? parsed
      : [];

  } catch (error) {

    return [];

  }

}


/* =====================================================
   STATUS
===================================================== */

function showLoading(
  show
) {

  if (!loading) return;


  loading.style.display =
    show
      ? "block"
      : "none";

}


function showStatus(
  text
) {

  if (status)
    status.textContent =
      text;

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(
  value
) {

  return String(
    value ?? ""
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
