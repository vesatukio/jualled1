"use strict";

/* =========================================================
DUTA LED - APP.JS
=========================================================

FITUR:
- API Google Sheet
- Cache lokal 30 menit
- Offline
- Produk berdasarkan ?id=
- Link unik setiap produk
- Kategori
- Pencarian
- Keranjang multi produk
- Tambah / kurang / hapus
- Checkout WhatsApp
- Diskon dari Sheet
- Promo ?promo=1-99
- 3 gambar produk
- Swipe gambar
- Klik gambar = zoom
- Klik lagi = kembali
- Share WhatsApp
- Share Facebook / Web Share
- Copy link produk
- Efek keranjang
- PWA
- Install PWA
- Shopee
- TikTok
- Lazada
========================================================= */


/* =========================================================
PENGATURAN
========================================================= */

const API_URL =
  "https://script.google.com/macros/s/AKfycbyr4eSauu1RneZIrwwPVBilx21kWNrauE9V40D17dmrntqTu4U3OGi4fafAYHXcd-A/exec";

const WHATSAPP = "6283157925577";

const FACEBOOK_URL = "#";
const TIKTOK_URL = "#";
const LOCATION_URL = "#";

const SHOPEE_URL = "ISI_LINK_SHOPEE";
const TIKTOK_SHOP_URL = "ISI_LINK_TIKTOK";
const LAZADA_URL = "ISI_LINK_LAZADA";

const CACHE_KEY = "dutaled_produk_v4";
const CART_KEY = "dutaled_cart_v4";

/* Cache berlaku 30 menit */
const CACHE_TIME = 1000 * 60 * 30;


/* =========================================================
DATA
========================================================= */

let products = [];
let cart = [];

let currentCategory = "Semua";
let searchText = "";

let specialDiscount = 0;
let specialPromoCode = "";

let selectedProductId = "";


/* =========================================================
ELEMENT
========================================================= */

let productGrid;
let categoryBar;
let searchInput;
let loading;
let empty;
let status;

let cartButton;
let cartOverlay;
let cartPanel;
let cartClose;
let cartBox;
let cartCount;
let cartTotal;
let checkoutButton;


/* =========================================================
START
========================================================= */

document.addEventListener("DOMContentLoaded", init);


async function init() {

  /* -----------------------------------------
  Ambil elemen HTML
  ----------------------------------------- */

  productGrid = document.getElementById("productGrid");
  categoryBar = document.getElementById("categoryBar");
  searchInput = document.getElementById("searchInput");
  loading = document.getElementById("loading");
  empty = document.getElementById("empty");
  status = document.getElementById("status");

  cartButton = document.getElementById("cartButton");
  cartOverlay = document.getElementById("cartOverlay");
  cartPanel = document.getElementById("cartPanel");
  cartClose = document.getElementById("cartClose");
  cartBox = document.getElementById("cartBox");
  cartCount = document.getElementById("cartCount");
  cartTotal = document.getElementById("cartTotal");
  checkoutButton = document.getElementById("checkoutButton");


  /* -----------------------------------------
  Baca URL
  ----------------------------------------- */

  loadSpecialPromo();
  loadSelectedProduct();


  /* -----------------------------------------
  Setup
  ----------------------------------------- */

  setupLinks();
  setupMarketplaceLinks();
  setupSearch();
  setupPromoButton();
  setupCartButton();


  /* -----------------------------------------
  Keranjang
  ----------------------------------------- */

  loadCart();
  renderCart();


  /* -----------------------------------------
  Loading
  ----------------------------------------- */

  showLoading(true);


  /* =====================================================
  LOAD CACHE TERLEBIH DAHULU
  ===================================================== */

  const cached = loadCache();

  if (cached.length) {

    products = cached;

    renderCategories();
    renderProducts();

    showStatus("Katalog tersimpan");

    showSelectedProduct();
  }


  /* =====================================================
  LOAD API
  ===================================================== */

  try {

    const fresh = await loadFromGoogle();

    if (fresh.length) {

      products = fresh;

      saveCache(products);

      renderCategories();
      renderProducts();

      showStatus("Katalog terbaru");

      showSelectedProduct();

    } else {

      if (!products.length) {

        showStatus("Produk belum tersedia");

      }

    }

  } catch (error) {

    console.warn(
      "Google Sheet tidak tersedia:",
      error
    );

    if (!products.length) {

      showStatus("Mode offline");

    }

  }


  showLoading(false);

  renderCart();
}


/* =========================================================
URL PRODUK
========================================================= */

function loadSelectedProduct() {

  const params =
    new URLSearchParams(
      window.location.search
    );

  selectedProductId =
    String(
      params.get("id") || ""
    ).trim();
}


/* =========================================================
PROMO URL
========================================================= */

function loadSpecialPromo() {

  const params =
    new URLSearchParams(
      window.location.search
    );

  const promo =
    String(
      params.get("promo") || ""
    )
      .trim()
      .replace("%", "");

  const discount = Number(promo);

  if (
    Number.isFinite(discount) &&
    discount >= 1 &&
    discount <= 99
  ) {

    specialDiscount = discount;

    specialPromoCode =
      String(discount);

  } else {

    specialDiscount = 0;

    specialPromoCode = "";

  }
}


/* =========================================================
GOOGLE SHEET / API
========================================================= */

async function loadFromGoogle() {

  const response =
    await fetch(
      API_URL +
      "?t=" +
      Date.now(),
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

  const rows =
    Array.isArray(data)
      ? data
      : data.data;

  if (!Array.isArray(rows)) {

    throw new Error(
      "Format data API tidak valid"
    );

  }

  return rows
    .map(normalizeProduct)
    .filter(
      product =>
        product.nama
    );
}


/* =========================================================
NORMALISASI PRODUK
========================================================= */

function normalizeProduct(row) {

  return {

    id:
      value(
        row.ID ??
        row.id ??
        row.Id
      ),

    nama:
      value(
        row.nama ??
        row.Nama ??
        row.NAMA
      ),

    kategori:
      value(
        row.kategori ??
        row.Kategori ??
        row.KATEGORI
      ) || "Lainnya",

    hargaModal:
      number(
        row["harga modal"] ??
        row.hargaModal ??
        row.HargaModal
      ),

    laba:
      number(
        row.Laba ??
        row.laba
      ),

    hargaJual:
      number(
        row["harga jual"] ??
        row.hargaJual ??
        row.HargaJual
      ),

    diskon:
      number(
        row.diskon ??
        row.Diskon
      ),

    hargaDiskon:
      number(
        row["harga diskon"] ??
        row.hargaDiskon ??
        row.HargaDiskon
      ),

    deskripsi:
      value(
        row.deskripsi ??
        row.Deskripsi ??
        row.diskipsi
      ),

    gambar1:
      value(
        row.gambar1 ??
        row.Gambar1
      ),

    gambar2:
      value(
        row.gambar2 ??
        row.Gambar2
      ),

    gambar3:
      value(
        row.gambar3 ??
        row.Gambar3
      )

  };
}


/* =========================================================
HELPER VALUE
========================================================= */

function value(v) {

  if (
    v === null ||
    v === undefined
  ) {

    return "";

  }

  return String(v).trim();
}


/* =========================================================
HELPER NUMBER
========================================================= */

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

  return Number(cleaned) || 0;
}


/* =========================================================
KATEGORI
========================================================= */

function renderCategories() {

  if (!categoryBar) {
    return;
  }

  const categories = ["Semua"];

  products.forEach(
    product => {

      const category =
        String(
          product.kategori || ""
        ).trim();

      if (
        category &&
        !categories.includes(category)
      ) {

        categories.push(category);

      }

    }
  );

  categoryBar.innerHTML = "";

  categories.forEach(
    category => {

      const button =
        document.createElement("button");

      button.type = "button";

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


/* =========================================================
SEARCH
========================================================= */

function setupSearch() {

  if (!searchInput) {
    return;
  }

  searchInput.addEventListener(
    "input",
    event => {

      searchText =
        String(
          event.target.value || ""
        )
          .trim()
          .toLowerCase();

      renderProducts();

    }
  );
}


/* =========================================================
FILTER
========================================================= */

function getFilteredProducts() {

  return products.filter(
    product => {

      const categoryOK =
        currentCategory === "Semua" ||
        String(
          product.kategori || ""
        )
          .toLowerCase() ===
        currentCategory.toLowerCase();

      const nama =
        String(
          product.nama || ""
        ).toLowerCase();

      const kategori =
        String(
          product.kategori || ""
        ).toLowerCase();

      const deskripsi =
        String(
          product.deskripsi || ""
        ).toLowerCase();

      const searchOK =
        !searchText ||
        nama.includes(searchText) ||
        kategori.includes(searchText) ||
        deskripsi.includes(searchText);

      return (
        categoryOK &&
        searchOK
      );

    }
  );
}


/* =========================================================
HARGA PRODUK
========================================================= */

function getProductPrice(product) {

  const hargaJual =
    Number(
      product.hargaJual
    ) || 0;


  /* PROMO URL */

  if (
    specialDiscount > 0 &&
    hargaJual > 0
  ) {

    return Math.round(
      hargaJual -
      (
        hargaJual *
        specialDiscount /
        100
      )
    );

  }


  /* DISKON SHEET */

  if (
    product.hargaDiskon > 0 &&
    product.hargaDiskon < hargaJual
  ) {

    return product.hargaDiskon;

  }

  return hargaJual;
}


/* =========================================================
RENDER PRODUK
========================================================= */

function renderProducts() {

  if (!productGrid) {
    return;
  }

  let list =
    getFilteredProducts();


  /* -----------------------------------------
  Jika URL ?id=123
  tampilkan produk tersebut saja
  ----------------------------------------- */

  if (selectedProductId) {

    const selected =
      products.find(
        product =>
          String(product.id) ===
          String(selectedProductId)
      );

    if (selected) {

      list = [selected];

    } else {

      list = [];

    }

  }


  productGrid.innerHTML = "";


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
        createProductCard(product)
      );

    }
  );
}


/* =========================================================
CARD PRODUK
========================================================= */

function createProductCard(product) {

  const card =
    document.createElement("article");

  card.className =
    "product-card";


  /* -----------------------------------------
  3 GAMBAR
  ----------------------------------------- */

  const images = [
    product.gambar1,
    product.gambar2,
    product.gambar3
  ]
    .map(
      img =>
        String(img || "").trim()
    )
    .filter(Boolean);


  if (!images.length) {

    images.push(
      "image/no-image.png"
    );

  }


  /* -----------------------------------------
  HARGA
  ----------------------------------------- */

  const hargaJual =
    Number(
      product.hargaJual
    ) || 0;

  const hargaTampil =
    getProductPrice(product);


  /* -----------------------------------------
  DISKON
  ----------------------------------------- */

  let discountHTML = "";

  if (
    specialDiscount > 0 &&
    hargaTampil < hargaJual
  ) {

    discountHTML = `
      <span class="discount-badge">
        -${specialDiscount}%
      </span>
    `;

  } else {

    const hasDiscount =
      product.hargaDiskon > 0 &&
      hargaJual > 0 &&
      product.hargaDiskon < hargaJual;

    if (hasDiscount) {

      let persen =
        Number(product.diskon) || 0;

      if (!persen) {

        persen =
          Math.round(
            (
              1 -
              product.hargaDiskon /
              hargaJual
            ) *
            100
          );

      }

      discountHTML = `
        <span class="discount-badge">
          -${persen}%
        </span>
      `;

    }

  }


  /* -----------------------------------------
  HARGA HTML
  ----------------------------------------- */

  let priceHTML = "";

  if (
    hargaTampil < hargaJual
  ) {

    priceHTML = `
      <div class="old-price">
        ${formatRupiah(hargaJual)}
      </div>

      <div class="price">
        ${formatRupiah(hargaTampil)}
      </div>
    `;

  } else {

    priceHTML = `
      <div class="price">
        ${formatRupiah(hargaJual)}
      </div>
    `;

  }


  /* -----------------------------------------
  CARD HTML
  ----------------------------------------- */

  card.innerHTML = `

    <div class="product-gallery">

      <div class="gallery-track">

        ${images
          .map(
            (img, index) => `

              <div class="gallery-slide">

                <img
                  src="${escapeHTML(img)}"
                  alt="${escapeHTML(product.nama)}"
                  loading="lazy"
                  draggable="false"
                  data-index="${index}"
                >

              </div>

            `
          )
          .join("")}

      </div>


      ${
        images.length > 1
          ? `

            <div class="gallery-dots">

              ${images
                .map(
                  (_, index) => `

                    <span
                      class="gallery-dot ${
                        index === 0
                          ? "active"
                          : ""
                      }"
                    ></span>

                  `
                )
                .join("")}

            </div>

          `
          : ""
      }


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
        🛒 + Keranjang
      </button>


      <div class="product-share">

        <button
          type="button"
          class="share-wa"
          title="Bagikan WhatsApp"
        >
          💬
        </button>


        <button
          type="button"
          class="share-fb"
          title="Bagikan"
        >
          f
        </button>


        <button
          type="button"
          class="share-copy"
          title="Salin link"
        >
          🔗
        </button>

      </div>

    </div>

  `;


  /* -----------------------------------------
  GALERI
  ----------------------------------------- */

  setupProductGallery(
    card,
    images
  );


  /* -----------------------------------------
  KERANJANG
  ----------------------------------------- */

  const buyButton =
    card.querySelector(
      ".buy-button"
    );

  buyButton?.addEventListener(
    "click",
    () => {

      addToCart(product);

    }
  );


  /* -----------------------------------------
  WHATSAPP
  ----------------------------------------- */

  const shareWA =
    card.querySelector(
      ".share-wa"
    );

  shareWA?.addEventListener(
    "click",
    () => {

      const link =
        getProductLink(product);

      const harga =
        getProductPrice(product);

      const message =
        `${product.nama}\n` +
        `${formatRupiah(harga)}\n` +
        `${link}`;

      openWhatsApp(message);

    }
  );


  /* -----------------------------------------
  SHARE
  ----------------------------------------- */

  const shareFB =
    card.querySelector(
      ".share-fb"
    );

  shareFB?.addEventListener(
    "click",
    async () => {

      const link =
        getProductLink(product);

      const harga =
        getProductPrice(product);

      const text =
        `${product.nama}\n` +
        `${formatRupiah(harga)}\n` +
        `${link}`;


      if (
        navigator.share
      ) {

        try {

          await navigator.share({

            title:
              product.nama,

            text:
              text,

            url:
              link

          });

        } catch (error) {

          if (
            error.name !==
            "AbortError"
          ) {

            console.warn(
              "Share error:",
              error
            );

          }

        }

        return;

      }


      try {

        await copyText(text);

        alert(
          "Nama, harga dan link produk sudah disalin."
        );

      } catch {

        alert(text);

      }

    }
  );


  /* -----------------------------------------
  COPY LINK
  ----------------------------------------- */

  const shareCopy =
    card.querySelector(
      ".share-copy"
    );

  shareCopy?.addEventListener(
    "click",
    async () => {

      const link =
        getProductLink(product);

      await copyText(link);

      shareCopy.textContent =
        "✓";

      setTimeout(
        () => {

          shareCopy.textContent =
            "🔗";

        },
        1500
      );

    }
  );


  return card;
}


/* =========================================================
GALERI PRODUK
========================================================= */

function setupProductGallery(
  card,
  images
) {

  const gallery =
    card.querySelector(
      ".product-gallery"
    );

  if (!gallery) {
    return;
  }


  const track =
    gallery.querySelector(
      ".gallery-track"
    );

  const slides =
    gallery.querySelectorAll(
      ".gallery-slide"
    );

  const dots =
    gallery.querySelectorAll(
      ".gallery-dot"
    );


  if (
    !track ||
    !slides.length
  ) {

    return;

  }


  let current = 0;

  let startX = 0;
  let endX = 0;


  function showImage(index) {

    if (index < 0) {

      index =
        slides.length - 1;

    }

    if (
      index >=
      slides.length
    ) {

      index = 0;

    }

    current = index;


    track.style.transform =
      `translateX(-${current * 100}%)`;


    dots.forEach(
      (dot, i) => {

        dot.classList.toggle(
          "active",
          i === current
        );

      }
    );

  }


  gallery.addEventListener(
    "touchstart",
    event => {

      if (
        !event.touches.length
      ) {

        return;

      }

      startX =
        event.touches[0].clientX;

    },
    {
      passive: true
    }
  );


  gallery.addEventListener(
    "touchend",
    event => {

      if (
        !event.changedTouches.length
      ) {

        return;

      }

      endX =
        event.changedTouches[0].clientX;


      const difference =
        endX - startX;


      if (
        Math.abs(difference) < 40
      ) {

        return;

      }


      if (
        difference < 0
      ) {

        showImage(
          current + 1
        );

      } else {

        showImage(
          current - 1
        );

      }

    },
    {
      passive: true
    }
  );


  dots.forEach(
    (dot, index) => {

      dot.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          showImage(index);

        }
      );

    }
  );


  slides.forEach(
    (slide, index) => {

      const img =
        slide.querySelector(
          "img"
        );

      if (!img) {
        return;
      }


      img.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          openImageZoom(
            images,
            index
          );

        }
      );

    }
  );

}


/* =========================================================
ZOOM FOTO
========================================================= */

function openImageZoom(
  images,
  startIndex = 0
) {

  let current =
    startIndex;


  const overlay =
    document.createElement(
      "div"
    );

  overlay.className =
    "image-zoom-overlay";


  overlay.innerHTML = `

    <img
      class="zoom-image"
      src="${escapeHTML(images[current])}"
      draggable="false"
      alt="Zoom produk"
    >

  `;


  document.body.appendChild(
    overlay
  );


  const image =
    overlay.querySelector(
      ".zoom-image"
    );


  if (!image) {

    overlay.remove();

    return;

  }


  image.addEventListener(
    "click",
    event => {

      event.stopPropagation();

      image.classList.toggle(
        "zoomed"
      );

    }
  );


  overlay.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        overlay
      ) {

        overlay.remove();

      }

    }
  );


  function escHandler(event) {

    if (
      event.key ===
      "Escape"
    ) {

      overlay.remove();

      document.removeEventListener(
        "keydown",
        escHandler
      );

    }

  }


  document.addEventListener(
    "keydown",
    escHandler
  );

}


/* =========================================================
LINK PRODUK UNIK
========================================================= */

function getProductLink(product) {

  const url =
    new URL(
      window.location.href
    );


  url.search = "";


  if (product.id) {

    url.searchParams.set(
      "id",
      String(product.id)
    );

  }


  if (
    specialDiscount > 0
  ) {

    url.searchParams.set(
      "promo",
      String(specialDiscount)
    );

  }


  url.hash = "";

  return url.toString();
}


/* =========================================================
TAMPILKAN PRODUK DARI LINK
========================================================= */

function showSelectedProduct() {

  if (!selectedProductId) {
    return;
  }


  const product =
    products.find(
      item =>
        String(item.id) ===
        String(selectedProductId)
    );


  if (!product) {
    return;
  }


  renderProducts();


  setTimeout(
    () => {

      const card =
        productGrid?.querySelector(
          ".product-card"
        );


      if (card) {

        card.scrollIntoView({

          behavior: "smooth",

          block: "start"

        });

      }

    },
    150
  );


  showStatus(
    "Produk: " +
    product.nama
  );
}


/* =========================================================
KERANJANG BUTTON
========================================================= */

function setupCartButton() {

  if (cartButton) {

    cartButton.addEventListener(
      "click",
      openCart
    );

  }


  if (cartClose) {

    cartClose.addEventListener(
      "click",
      closeCart
    );

  }


  if (cartOverlay) {

    cartOverlay.addEventListener(
      "click",
      closeCart
    );

  }


  if (checkoutButton) {

    checkoutButton.addEventListener(
      "click",
      checkoutWhatsApp
    );

  }

}


/* =========================================================
BUKA KERANJANG
========================================================= */

function openCart() {

  cartPanel?.classList.add(
    "show"
  );

  cartOverlay?.classList.remove(
    "hidden"
  );

  document.body.classList.add(
    "cart-open"
  );

}


/* =========================================================
TUTUP KERANJANG
========================================================= */

function closeCart() {

  cartPanel?.classList.remove(
    "show"
  );

  cartOverlay?.classList.add(
    "hidden"
  );

  document.body.classList.remove(
    "cart-open"
  );

}


/* =========================================================
TAMBAH KERANJANG
========================================================= */

function addToCart(product) {

  const existing =
    cart.find(
      item =>
        String(item.id) ===
        String(product.id)
    );


  if (existing) {

    existing.qty += 1;

  } else {

    cart.push({

      id:
        product.id,

      nama:
        product.nama,

      harga:
        Number(
          product.hargaJual
        ) || 0,

      hargaDiskon:
        Number(
          product.hargaDiskon
        ) || 0,

      diskon:
        Number(
          product.diskon
        ) || 0,

      qty: 1

    });

  }


  saveCart();

  renderCart();

  shakeCart();

  showCartMessage(
    product.nama
  );

}


/* =========================================================
TAMBAH JUMLAH
========================================================= */

function increaseCart(id) {

  const item =
    cart.find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!item) {
    return;
  }


  item.qty += 1;

  saveCart();

  renderCart();

}


/* =========================================================
KURANG
========================================================= */

function decreaseCart(id) {

  const item =
    cart.find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!item) {
    return;
  }


  item.qty -= 1;


  if (
    item.qty <= 0
  ) {

    cart =
      cart.filter(
        item =>
          String(item.id) !==
          String(id)
      );

  }


  saveCart();

  renderCart();

}


/* =========================================================
HAPUS
========================================================= */

function removeCart(id) {

  cart =
    cart.filter(
      item =>
        String(item.id) !==
        String(id)
    );


  saveCart();

  renderCart();

}


/* =========================================================
HARGA KERANJANG
========================================================= */

function getCartPrice(item) {

  const hargaJual =
    Number(item.harga) || 0;


  if (
    specialDiscount > 0
  ) {

    return Math.round(
      hargaJual -
      (
        hargaJual *
        specialDiscount /
        100
      )
    );

  }


  if (
    item.hargaDiskon > 0 &&
    item.hargaDiskon < hargaJual
  ) {

    return item.hargaDiskon;

  }


  return hargaJual;
}


/* =========================================================
RENDER CART
========================================================= */

function renderCart() {

  if (!cartBox) {
    return;
  }


  if (!cart.length) {

    cartBox.innerHTML = `

      <div class="cart-empty">
        🛒 Keranjang masih kosong
      </div>

    `;


    updateCartTotal();

    return;

  }


  cartBox.innerHTML =
    cart
      .map(
        item => {

          const harga =
            getCartPrice(item);


          const subtotal =
            harga *
            item.qty;


          return `

            <div class="cart-item">

              <div class="cart-item-info">

                <strong>
                  ${escapeHTML(item.nama)}
                </strong>

                <span>
                  ${formatRupiah(harga)}
                </span>

              </div>


              <div class="cart-controls">

                <button
                  type="button"
                  class="qty-button"
                  data-action="minus"
                  data-id="${escapeHTML(item.id)}"
                >
                  −
                </button>


                <strong>
                  ${item.qty}
                </strong>


                <button
                  type="button"
                  class="qty-button"
                  data-action="plus"
                  data-id="${escapeHTML(item.id)}"
                >
                  +
                </button>


                <button
                  type="button"
                  class="cart-remove"
                  data-action="remove"
                  data-id="${escapeHTML(item.id)}"
                >
                  ×
                </button>

              </div>


              <div class="cart-subtotal">
                ${formatRupiah(subtotal)}
              </div>

            </div>

          `;

        }
      )
      .join("");


  cartBox
    .querySelectorAll(
      "[data-action]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const id =
              button.dataset.id;

            const action =
              button.dataset.action;


            if (
              action === "plus"
            ) {

              increaseCart(id);

            }


            if (
              action === "minus"
            ) {

              decreaseCart(id);

            }


            if (
              action === "remove"
            ) {

              removeCart(id);

            }

          }
        );

      }
    );


  updateCartTotal();

}


/* =========================================================
TOTAL
========================================================= */

function getCartTotal() {

  return cart.reduce(
    (total, item) => {

      return (
        total +
        (
          getCartPrice(item) *
          item.qty
        )
      );

    },
    0
  );

}


/* =========================================================
JUMLAH CART
========================================================= */

function getCartCount() {

  return cart.reduce(
    (total, item) => {

      return (
        total +
        item.qty
      );

    },
    0
  );

}


/* =========================================================
UPDATE TOTAL
========================================================= */

function updateCartTotal() {

  const total =
    getCartTotal();

  const count =
    getCartCount();


  if (cartCount) {

    cartCount.textContent =
      count;

  }


  if (cartTotal) {

    cartTotal.textContent =
      formatRupiah(total);

  }

}


/* =========================================================
CHECKOUT WHATSAPP
========================================================= */

function checkoutWhatsApp() {

  if (!cart.length) {

    alert(
      "Keranjang masih kosong."
    );

    return;

  }


  let message =
    "Halo Duta LED, saya ingin pesan:\n\n";


  cart.forEach(
    (item, index) => {

      const harga =
        getCartPrice(item);


      const subtotal =
        harga *
        item.qty;


      message +=
        `${index + 1}. ${item.nama}\n`;

      message +=
        `   ${item.qty} x ${formatRupiah(harga)} = ${formatRupiah(subtotal)}\n\n`;

    }
  );


  message +=
    `TOTAL: ${formatRupiah(
      getCartTotal()
    )}`;


  if (
    specialDiscount > 0
  ) {

    message +=
      `\n\nDiskon khusus: ${specialDiscount}%`;

  }


  openWhatsApp(message);

}


/* =========================================================
SAVE CART
========================================================= */

function saveCart() {

  try {

    localStorage.setItem(
      CART_KEY,
      JSON.stringify(cart)
    );

  } catch (error) {

    console.warn(
      "Keranjang gagal disimpan:",
      error
    );

  }

}


/* =========================================================
LOAD CART
========================================================= */

function loadCart() {

  try {

    const data =
      localStorage.getItem(
        CART_KEY
      );


    if (!data) {

      cart = [];

      return;

    }


    const parsed =
      JSON.parse(data);


    cart =
      Array.isArray(parsed)
        ? parsed
        : [];

  } catch {

    cart = [];

  }

}


/* =========================================================
CART MESSAGE
========================================================= */

function showCartMessage(
  productName
) {

  const old =
    document.querySelector(
      ".cart-toast"
    );


  if (old) {
    old.remove();
  }


  const toast =
    document.createElement(
      "div"
    );


  toast.className =
    "cart-toast";


  toast.textContent =
    "✓ " +
    productName +
    " masuk keranjang";


  document.body.appendChild(
    toast
  );


  setTimeout(
    () => {

      toast.remove();

    },
    1800
  );

}


/* =========================================================
WHATSAPP
========================================================= */

function whatsappLink(message) {

  return (
    "https://wa.me/" +
    WHATSAPP +
    "?text=" +
    encodeURIComponent(message)
  );

}


function openWhatsApp(message) {

  window.open(
    whatsappLink(message),
    "_blank"
  );

}


/* =========================================================
COPY TEXT
========================================================= */

async function copyText(text) {

  try {

    if (
      navigator.clipboard &&
      window.isSecureContext
    ) {

      await navigator.clipboard.writeText(
        text
      );

      return;

    }


    throw new Error(
      "Clipboard API tidak tersedia"
    );

  } catch {

    const textarea =
      document.createElement(
        "textarea"
      );


    textarea.value =
      text;


    textarea.style.position =
      "fixed";


    textarea.style.opacity =
      "0";


    document.body.appendChild(
      textarea
    );


    textarea.focus();

    textarea.select();


    document.execCommand(
      "copy"
    );


    textarea.remove();

  }

}


/* =========================================================
LINK MENU
========================================================= */

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


  if (heroWA) {

    heroWA.href =
      generalWA;

  }


  if (contactWA) {

    contactWA.href =
      generalWA;

  }


  if (floatingWA) {

    floatingWA.href =
      generalWA;

  }


  if (menuGrosir) {

    menuGrosir.href =
      whatsappLink(
        "Halo Duta LED, saya ingin bertanya harga grosir."
      );

  }


  if (facebook) {

    facebook.href =
      FACEBOOK_URL;

  }


  if (tiktok) {

    tiktok.href =
      TIKTOK_URL;

  }


  if (location) {

    location.href =
      LOCATION_URL;

  }

}


/* =========================================================
MARKETPLACE
========================================================= */

function setupMarketplaceLinks() {

  const shopee =
    document.getElementById(
      "shopee"
    );


  const tiktok =
    document.getElementById(
      "tiktok"
    );


  const lazada =
    document.getElementById(
      "lazada"
    );


  if (shopee) {

    shopee.href =
      SHOPEE_URL;

  }


  if (tiktok) {

    tiktok.href =
      TIKTOK_SHOP_URL;

  }


  if (lazada) {

    lazada.href =
      LAZADA_URL;

  }

}


/* =========================================================
MENU PROMO
========================================================= */

function setupPromoButton() {

  const button =
    document.getElementById(
      "menuPromo"
    );


  if (!button) {
    return;
  }


  button.addEventListener(
    "click",
    event => {

      event.preventDefault();


      selectedProductId = "";

      searchText = "";


      if (searchInput) {

        searchInput.value = "";

      }


      currentCategory =
        "Semua";


      renderCategories();


      const promoProducts =
        products.filter(
          product => {

            return (
              product.hargaDiskon > 0 &&
              product.hargaJual > 0 &&
              product.hargaDiskon <
              product.hargaJual
            );

          }
        );


      if (productGrid) {

        productGrid.innerHTML =
          "";

      }


      if (
        !promoProducts.length
      ) {

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
        .getElementById(
          "produk"
        )
        ?.scrollIntoView({
          behavior: "smooth"
        });

    }
  );

}


/* =========================================================
FORMAT RUPIAH
========================================================= */

function formatRupiah(value) {

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


/* =========================================================
CACHE
========================================================= */

/*
  CACHE BARU

  Format:

  {
    time: 123456789,
    data: [...]
  }

  Cache lama berupa:

  [...]

  tetap bisa dibaca.
*/


function saveCache(data) {

  try {

    const cacheData = {

      time: Date.now(),

      data: data

    };


    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify(cacheData)
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

    const raw =
      localStorage.getItem(
        CACHE_KEY
      );


    if (!raw) {

      return [];

    }


    const parsed =
      JSON.parse(raw);


    /*
     * Cache format baru
     */

    if (
      parsed &&
      Array.isArray(
        parsed.data
      )
    ) {

      /*
       * Cek umur cache
       */

      if (
        parsed.time &&
        (
          Date.now() -
          Number(parsed.time)
        ) > CACHE_TIME
      ) {

        console.log(
          "Cache sudah lebih dari 30 menit"
        );

        /*
         * Cache tetap dikembalikan
         * agar produk langsung tampil.
         *
         * API akan memperbarui
         * setelahnya.
         */

        return parsed.data;

      }


      return parsed.data;

    }


    /*
     * Kompatibel dengan
     * cache versi lama
     */

    if (
      Array.isArray(parsed)
    ) {

      return parsed;

    }


    return [];

  } catch (error) {

    console.warn(
      "Cache tidak valid:",
      error
    );

    return [];

  }

}


/* =========================================================
LOADING
========================================================= */

function showLoading(show) {

  if (!loading) {
    return;
  }


  loading.style.display =
    show
      ? "block"
      : "none";

}


/* =========================================================
STATUS
========================================================= */

function showStatus(text) {

  if (status) {

    status.textContent =
      text;

  }

}


/* =========================================================
ESCAPE HTML
========================================================= */

function escapeHTML(value) {

  return String(
    value ?? ""
  )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =========================================================
EFEK GOYANG KERANJANG
========================================================= */

function shakeCart() {

  const button =
    document.getElementById(
      "cartButton"
    ) ||
    document.querySelector(
      ".cart-button"
    ) ||
    document.querySelector(
      ".cart-icon"
    ) ||
    document.querySelector(
      "[data-cart]"
    );


  const count =
    document.getElementById(
      "cartCount"
    );


  if (button) {

    button.classList.remove(
      "cart-shake"
    );


    void button.offsetWidth;


    button.classList.add(
      "cart-shake"
    );


    setTimeout(
      () => {

        button.classList.remove(
          "cart-shake"
        );

      },
      600
    );

  }


  if (count) {

    count.classList.remove(
      "cart-count-pop"
    );


    void count.offsetWidth;


    count.classList.add(
      "cart-count-pop"
    );


    setTimeout(
      () => {

        count.classList.remove(
          "cart-count-pop"
        );

      },
      300
    );

  }

}


/* =====================================================
PWA - DUTA LED
===================================================== */

if (
  "serviceWorker" in
  navigator
) {

  window.addEventListener(
    "load",
    function () {

      navigator.serviceWorker
        .register("./sw.js")
        .then(
          function (registration) {

            console.log(
              "Duta LED PWA aktif:",
              registration.scope
            );

          }
        )
        .catch(
          function (error) {

            console.error(
              "Duta LED PWA gagal:",
              error
            );

          }
        );

    }
  );

}


/* =====================================================
INSTALL PROMPT
===================================================== */

let deferredPrompt = null;


window.addEventListener(
  "beforeinstallprompt",
  function (event) {

    event.preventDefault();

    deferredPrompt = event;


    const installPWA =
      document.getElementById(
        "installPWA"
      );


    /*
     * Jangan tampilkan jika
     * sudah pernah ditutup
     */

    if (
      localStorage.getItem(
        "dutaled_install_closed"
      ) !== "1"
    ) {

      if (installPWA) {

        installPWA.classList.remove(
          "hidden"
        );

      }

    }

  }
);


/* =========================================================
INSTALL BUTTON
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    const installPWA =
      document.getElementById(
        "installPWA"
      );


    const installButton =
      document.getElementById(
        "installButton"
      );


    const installClose =
      document.getElementById(
        "installClose"
      );


    if (installButton) {

      installButton.addEventListener(
        "click",
        async function () {

          if (!deferredPrompt) {

            return;

          }


          deferredPrompt.prompt();


          const result =
            await deferredPrompt.userChoice;


          console.log(
            "Install Duta LED:",
            result.outcome
          );


          deferredPrompt = null;


          if (installPWA) {

            installPWA.classList.add(
              "hidden"
            );

          }

        }
      );

    }


    if (installClose) {

      installClose.addEventListener(
        "click",
        function () {

          localStorage.setItem(
            "dutaled_install_closed",
            "1"
          );


          if (installPWA) {

            installPWA.classList.add(
              "hidden"
            );

          }

        }
      );

    }

  }
);


/* =========================================================
PWA INSTALLED
========================================================= */

window.addEventListener(
  "appinstalled",
  function () {

    console.log(
      "Duta LED berhasil di-install"
    );


    localStorage.setItem(
      "dutaled_installed",
      "1"
    );


    const installPWA =
      document.getElementById(
        "installPWA"
      );


    if (installPWA) {

      installPWA.classList.add(
        "hidden"
      );

    }


    deferredPrompt = null;

  }
);
