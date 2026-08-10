/* =====================================================
   DUTA LED - APP.JS
   Google Sheet : jualled1
   Sheet        : PRODUK

   FITUR:
   - Google Sheet
   - Offline cache
   - Kategori
   - Pencarian
   - Keranjang multi produk
   - Tambah / kurang / hapus
   - Checkout WhatsApp
   - Diskon katalog
   - Diskon khusus 1-99% dari URL
   - Share WhatsApp
   - Share Facebook
   - Salin link produk
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
  "dutaled_produk_v3";

const CART_KEY =
  "dutaled_cart_v3";


/* =====================================================
   DATA
===================================================== */

let products = [];

let cart = [];

let currentCategory = "Semua";

let searchText = "";


/* =====================================================
   DISKON KHUSUS

   Contoh:

   https://dutaled.my.id/?promo=10
   https://dutaled.my.id/?promo=23
   https://dutaled.my.id/?promo=32
   https://dutaled.my.id/?promo=43

   Berlaku 1 - 99%
===================================================== */

let specialDiscount = 0;

let specialPromoCode = "";


function loadSpecialPromo() {

  const params =
    new URLSearchParams(
      window.location.search
    );


  const promo =
    (
      params.get("promo") || ""
    )
      .trim()
      .replace("%", "");


  const discount =
    Number(promo);


  if (
    Number.isFinite(discount) &&
    discount >= 1 &&
    discount <= 99
  ) {

    specialDiscount =
      discount;

    specialPromoCode =
      String(discount);

  } else {

    specialDiscount = 0;

    specialPromoCode = "";

  }

}


/* =====================================================
   ELEMENT
   PENTING:
   ELEMENT DIAMBIL SETELAH DOM READY
===================================================== */

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


/* =====================================================
   START
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  init
);


async function init() {

  /* Ambil elemen setelah HTML selesai */

  productGrid =
    document.getElementById(
      "productGrid"
    );

  categoryBar =
    document.getElementById(
      "categoryBar"
    );

  searchInput =
    document.getElementById(
      "searchInput"
    );

  loading =
    document.getElementById(
      "loading"
    );

  empty =
    document.getElementById(
      "empty"
    );

  status =
    document.getElementById(
      "status"
    );


  cartButton =
    document.getElementById(
      "cartButton"
    );

  cartOverlay =
    document.getElementById(
      "cartOverlay"
    );

  cartPanel =
    document.getElementById(
      "cartPanel"
    );

  cartClose =
    document.getElementById(
      "cartClose"
    );

  cartBox =
    document.getElementById(
      "cartBox"
    );

  cartCount =
    document.getElementById(
      "cartCount"
    );

  cartTotal =
    document.getElementById(
      "cartTotal"
    );

  checkoutButton =
    document.getElementById(
      "checkoutButton"
    );


  /* Diskon URL */

  loadSpecialPromo();


  /* Setup */

  setupLinks();

  setupSearch();

  setupPromoButton();

  setupCartButton();


  /* Keranjang */

  loadCart();

  renderCart();


  /* Loading */

  showLoading(true);


  /* =================================================
     CACHE
  ================================================= */

  const cached =
    loadCache();


  if (cached.length) {

    products =
      cached;

    renderCategories();

    renderProducts();

    showStatus(
      "Katalog tersimpan"
    );

  }


  /* =================================================
     GOOGLE SHEET
  ================================================= */

  try {

    const fresh =
      await loadFromGoogle();


    if (fresh.length) {

      products =
        fresh;

      saveCache(
        products
      );

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

  renderCart();

}


/* =====================================================
   GOOGLE SHEET
===================================================== */

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
      "Format data tidak valid"
    );

  }


  return rows
    .map(
      normalizeProduct
    )
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
      ) ||
      "Lainnya",


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
   HELPER
===================================================== */

function value(v) {

  if (
    v === null ||
    v === undefined
  ) {

    return "";

  }

  return String(
    v
  ).trim();

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
      .replace(
        /[^\d.-]/g,
        ""
      );


  return (
    Number(cleaned) ||
    0
  );

}


/* =====================================================
   KATEGORI
===================================================== */

function renderCategories() {

  if (!categoryBar)
    return;


  const categories =
    [
      "Semua"
    ];


  products.forEach(
    product => {

      const category =
        product.kategori
          .trim();


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


  categoryBar.innerHTML =
    "";


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

  if (!searchInput)
    return;


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
   FILTER
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
          .includes(
            searchText
          ) ||

        product.kategori
          .toLowerCase()
          .includes(
            searchText
          ) ||

        product.deskripsi
          .toLowerCase()
          .includes(
            searchText
          );


      return (
        categoryOK &&
        searchOK
      );

    }
  );

}


/* =====================================================
   HARGA PRODUK

   Pelanggan biasa:
   harga diskon dari Sheet

   Pelanggan khusus:
   harga jual dikurangi promo URL
===================================================== */

function getProductPrice(
  product
) {

  const hargaJual =
    Number(
      product.hargaJual
    ) || 0;


  /* PROMO KHUSUS */

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
    product.hargaDiskon <
    hargaJual
  ) {

    return product.hargaDiskon;

  }


  return hargaJual;

}


/* =====================================================
   RENDER PRODUK
===================================================== */

function renderProducts() {

  if (!productGrid)
    return;


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


  /* =================================================
     3 GAMBAR PRODUK
  ================================================= */

  const images = [
    product.gambar1,
    product.gambar2,
    product.gambar3
  ].filter(img =>
    img &&
    String(img).trim()
  );

  if (!images.length) {
    images.push("image/no-image.png");
  }


  /* =================================================
     HARGA
  ================================================= */

  const hargaJual =
    Number(product.hargaJual) || 0;

  const hargaTampil =
    getProductPrice(product);


  /* =================================================
     DISKON
  ================================================= */

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
        product.diskon;

      if (!persen) {

        persen =
          Math.round(
            (
              1 -
              product.hargaDiskon /
              hargaJual
            ) * 100
          );

      }

      discountHTML = `
        <span class="discount-badge">
          -${persen}%
        </span>
      `;

    }

  }


  /* =================================================
     HARGA HTML
  ================================================= */

  let priceHTML = "";

  if (hargaTampil < hargaJual) {

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


  /* =================================================
     GALERI
  ================================================= */

  card.innerHTML = `

    <div class="product-image">

      <div class="product-gallery">

        <div class="gallery-track">

          ${images.map((img, index) => `

            <div class="gallery-slide">

              <img
                src="${escapeHTML(img)}"
                alt="${escapeHTML(product.nama)}"
                loading="lazy"
                draggable="false"
                onerror="
                  this.onerror=null;
                  this.src='image/no-image.png';
                "
              >

            </div>

          `).join("")}

        </div>


        ${
          images.length > 1
          ? `

            <div class="gallery-dots">

              ${images.map((_, index) => `

                <span
                  class="gallery-dot ${
                    index === 0
                      ? "active"
                      : ""
                  }"
                ></span>

              `).join("")}

            </div>

          `
          : ""
        }


        ${discountHTML}

      </div>

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
          title="Bagikan Facebook"
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


  /* =================================================
     GALERI
  ================================================= */

  setupProductGallery(card);


  /* =================================================
     KERANJANG
  ================================================= */

  const buyButton =
    card.querySelector(".buy-button");

  buyButton.addEventListener(
    "click",
    () => {

      addToCart(product);

    }
  );


  /* =================================================
     SHARE WHATSAPP
  ================================================= */

  const shareWA =
    card.querySelector(".share-wa");

  shareWA.addEventListener(
    "click",
    () => {

      const link =
        getProductLink(product);

      const message =
        `Halo Duta LED, saya tertarik dengan produk:\n\n` +
        `${product.nama}\n\n` +
        `${link}`;

      openWhatsApp(message);

    }
  );


  /* =================================================
     SHARE FACEBOOK
  ================================================= */

  const shareFB =
    card.querySelector(".share-fb");

  shareFB.addEventListener(
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


      if (navigator.share) {

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
              "Share dibatalkan:",
              error
            );

          }

        }

        return;

      }


      try {

        await navigator.clipboard.writeText(
          text
        );

        alert(
          "Nama, harga, dan link produk sudah disalin."
        );

      } catch {

        alert(text);

      }

    }
  );


  /* =================================================
     COPY LINK
  ================================================= */

  const shareCopy =
    card.querySelector(
      ".share-copy"
    );

  shareCopy.addEventListener(
    "click",
    async () => {

      const link =
        getProductLink(product);


      try {

        await navigator.clipboard.writeText(
          link
        );

      } catch {

        const textarea =
          document.createElement(
            "textarea"
          );

        textarea.value =
          link;

        document.body.appendChild(
          textarea
        );

        textarea.select();

        document.execCommand(
          "copy"
        );

        textarea.remove();

      }


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
function setupProductGallery(card) {

  const gallery =
    card.querySelector(
      ".product-gallery"
    );

  if (!gallery)
    return;


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


  if (slides.length <= 1)
    return;


  let current = 0;

  let startX = 0;


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


  /* ==========================================
     SWIPE MULAI
  ========================================== */

  gallery.addEventListener(
    "touchstart",
    event => {

      startX =
        event.touches[0].clientX;

    },
    {
      passive: true
    }
  );


  /* ==========================================
     SWIPE SELESAI
  ========================================== */

  gallery.addEventListener(
    "touchend",
    event => {

      const endX =
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


  /* ==========================================
     KLIK FOTO
  ========================================== */

  slides.forEach(
    (slide, index) => {

      const img =
        slide.querySelector(
          "img"
        );

      if (!img)
        return;


      img.addEventListener(
        "click",
        event => {

          event.stopPropagation();


          const imageList =
            Array.from(
              slides
            )
            .map(
              slide =>
                slide.querySelector(
                  "img"
                )?.src
            )
            .filter(Boolean);


          openImageZoom(
            imageList,
            index
          );

        }
      );

    }
  );

}

  /* =================================================
     TOMBOL KERANJANG
  ================================================= */

  const buyButton =
    card.querySelector(
      ".buy-button"
    );


  buyButton.addEventListener(
    "click",
    () => {

      addToCart(
        product
      );

    }
  );


  /* =================================================
     SHARE WHATSAPP
  ================================================= */

  const shareWA =
    card.querySelector(
      ".share-wa"
    );


  shareWA.addEventListener(
    "click",
    () => {

      const link =
        getProductLink(
          product
        );


      const message =
        `Halo Duta LED, saya tertarik dengan produk:\n\n` +
        `${product.nama}\n\n` +
        `${link}`;


      openWhatsApp(
        message
      );

    }
  );


  /* =================================================
     SHARE FACEBOOK
  ================================================= */

  const shareFB =
    card.querySelector(
      ".share-fb"
    );


  shareFB.addEventListener("click", async () => {

  const link = getProductLink(product);
  const harga = getProductPrice(product);

  const text =
    `${product.nama}\n` +
    `${formatRupiah(harga)}\n` +
    `${link}`;

  if (navigator.share) {

    try {

      await navigator.share({
        title: product.nama,
        text: text,
        url: link
      });

    } catch (error) {

      if (error.name !== "AbortError") {
        console.warn("Share dibatalkan:", error);
      }

    }

    return;
  }

  // Jika browser tidak mendukung Web Share
  await navigator.clipboard.writeText(text);

  alert(
    "Nama, harga, dan link produk sudah disalin.\n\n" +
    text
  );

});

  /* =================================================
     COPY LINK
  ================================================= */

  const shareCopy =
    card.querySelector(
      ".share-copy"
    );


  shareCopy.addEventListener(
    "click",
    async () => {

      const link =
        getProductLink(
          product
        );


      try {

        await navigator.clipboard.writeText(
          link
        );

      } catch {

        const textarea =
          document.createElement(
            "textarea"
          );


        textarea.value =
          link;


        document.body.appendChild(
          textarea
        );


        textarea.select();


        document.execCommand(
          "copy"
        );


        textarea.remove();

      }


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


/* =====================================================
   LINK PRODUK

   Contoh hasil:

   https://dutaled.my.id/?id=123

   Jika promo:

   https://dutaled.my.id/?id=123&promo=32
===================================================== */

function getProductLink(
  product
) {

  const url =
    new URL(
      window.location.href
    );


  url.search = "";


  if (product.id) {

    url.searchParams.set(
      "id",
      product.id
    );

  }


  if (
    specialDiscount > 0
  ) {

    url.searchParams.set(
      "promo",
      specialPromoCode
    );

  }


  url.hash =
    "";


  return url.toString();

}


/* =====================================================
   KERANJANG BUTTON
===================================================== */

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


/* =====================================================
   BUKA KERANJANG
===================================================== */

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


/* =====================================================
   TUTUP KERANJANG
===================================================== */

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


/* =====================================================
TAMBAH KERANJANG
===================================================== */

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

      qty:
        1

    });

  }

  saveCart();

  renderCart();

  /* ==========================================
     EFEK GOYANG KERANJANG
  ========================================== */

  shakeCart();

  /* ==========================================
     PESAN
  ========================================== */

  showCartMessage(
    product.nama
  );

}


/* =====================================================
TAMBAH JUMLAH
===================================================== */

function increaseCart(id) {

  const item =
    cart.find(
      item =>
        String(item.id) ===
        String(id)
    );

  if (!item)
    return;

  item.qty += 1;

  saveCart();

  renderCart();

}


/* =====================================================
KURANGI JUMLAH
===================================================== */

function decreaseCart(id) {

  const item =
    cart.find(
      item =>
        String(item.id) ===
        String(id)
    );

  if (!item)
    return;

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


/* =====================================================
HAPUS
===================================================== */

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


/* =====================================================
HARGA KERANJANG
===================================================== */

function getCartPrice(item) {

  const hargaJual =
    Number(
      item.harga
    ) || 0;


  /* ==========================================
     PROMO KHUSUS DARI URL
  ========================================== */

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


  /* ==========================================
     DISKON NORMAL GOOGLE SHEET
  ========================================== */

  if (
    item.hargaDiskon > 0 &&
    item.hargaDiskon <
    hargaJual
  ) {

    return item.hargaDiskon;

  }


  return hargaJual;

}

/* =====================================================
   RENDER KERANJANG
===================================================== */

function renderCart() {

  if (!cartBox)
    return;


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
    cart.map(
      item => {

        const harga =
          getCartPrice(
            item
          );


        const subtotal =
          harga *
          item.qty;


        return `

          <div
            class="cart-item"
          >

            <div
              class="cart-item-info"
            >

              <strong>
                ${escapeHTML(
                  item.nama
                )}
              </strong>

              <span>
                ${formatRupiah(
                  harga
                )}
              </span>

            </div>


            <div
              class="cart-controls"
            >

              <button
                type="button"
                class="qty-button"
                data-action="minus"
                data-id="${escapeHTML(
                  item.id
                )}"
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
                data-id="${escapeHTML(
                  item.id
                )}"
              >
                +
              </button>


              <button
                type="button"
                class="cart-remove"
                data-action="remove"
                data-id="${escapeHTML(
                  item.id
                )}"
              >
                ×
              </button>

            </div>


            <div
              class="cart-subtotal"
            >
              ${formatRupiah(
                subtotal
              )}
            </div>

          </div>

        `;

      }
    )
    .join("");


  /* Tombol + - x */

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
              action ===
              "plus"
            ) {

              increaseCart(
                id
              );

            }


            if (
              action ===
              "minus"
            ) {

              decreaseCart(
                id
              );

            }


            if (
              action ===
              "remove"
            ) {

              removeCart(
                id
              );

            }

          }
        );

      }
    );


  updateCartTotal();

}


/* =====================================================
   TOTAL
===================================================== */

function getCartTotal() {

  return cart.reduce(
    (
      total,
      item
    ) => {

      return (
        total +
        (
          getCartPrice(
            item
          ) *
          item.qty
        )
      );

    },
    0
  );

}


/* =====================================================
   JUMLAH
===================================================== */

function getCartCount() {

  return cart.reduce(
    (
      total,
      item
    ) => {

      return (
        total +
        item.qty
      );

    },
    0
  );

}


/* =====================================================
   UPDATE TOTAL
===================================================== */

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
      formatRupiah(
        total
      );

  }

}


/* =====================================================
   CHECKOUT WHATSAPP
===================================================== */

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
    (
      item,
      index
    ) => {

      const harga =
        getCartPrice(
          item
        );


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


  openWhatsApp(
    message
  );

}


/* =====================================================
   SIMPAN KERANJANG
===================================================== */

function saveCart() {

  try {

    localStorage.setItem(
      CART_KEY,
      JSON.stringify(
        cart
      )
    );

  } catch (error) {

    console.warn(
      "Keranjang gagal disimpan:",
      error
    );

  }

}


/* =====================================================
   LOAD KERANJANG
===================================================== */

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
      JSON.parse(
        data
      );


    cart =
      Array.isArray(
        parsed
      )
        ? parsed
        : [];

  } catch {

    cart = [];

  }

}


/* =====================================================
   PESAN MASUK KERANJANG
===================================================== */

function showCartMessage(
  productName
) {

  const old =
    document.querySelector(
      ".cart-toast"
    );


  if (old)
    old.remove();


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
    whatsappLink(
      message
    ),
    "_blank"
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
===================================================== */

function setupPromoButton() {

  const button =
    document.getElementById(
      "menuPromo"
    );


  if (!button)
    return;


  button.addEventListener(
    "click",
    event => {

      event.preventDefault();


      searchText =
        "";


      if (searchInput)
        searchInput.value =
          "";


      currentCategory =
        "Semua";


      renderCategories();


      const promoProducts =
        products.filter(
          product => {

            return (
              product.hargaDiskon >
                0 &&

              product.hargaJual >
                0 &&

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
          behavior:
            "smooth"
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
      style:
        "currency",

      currency:
        "IDR",

      maximumFractionDigits:
        0
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
      JSON.stringify(
        data
      )
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
      JSON.parse(
        data
      );


    return Array.isArray(
      parsed
    )
      ? parsed
      : [];

  } catch {

    return [];

  }

}


/* =====================================================
   LOADING
===================================================== */

function showLoading(
  show
) {

  if (!loading)
    return;


  loading.style.display =
    show
      ? "block"
      : "none";

}


/* =====================================================
   STATUS
===================================================== */

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
/* =====================================================
   EFEK GOYANG KERANJANG
===================================================== */

function shakeCart() {

  const cartButton =
    document.getElementById("cartButton") ||
    document.querySelector(".cart-button") ||
    document.querySelector(".cart-icon") ||
    document.querySelector("[data-cart]");

  const cartCount =
    document.getElementById("cartCount");

  /* Goyangkan tombol keranjang */

  if (cartButton) {

    cartButton.classList.remove(
      "cart-shake"
    );

    /* restart animasi */
    void cartButton.offsetWidth;

    cartButton.classList.add(
      "cart-shake"
    );

    setTimeout(() => {

      cartButton.classList.remove(
        "cart-shake"
      );

    }, 600);

  }

  /* Efek angka jumlah */

  if (cartCount) {

    cartCount.classList.remove(
      "cart-count-pop"
    );

    void cartCount.offsetWidth;

    cartCount.classList.add(
      "cart-count-pop"
    );

    setTimeout(() => {

      cartCount.classList.remove(
        "cart-count-pop"
      );

    }, 250);

  }

}
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
    >

  `;


  document.body.appendChild(
    overlay
  );


  const image =
    overlay.querySelector(
      ".zoom-image"
    );


  /* ==========================================
     KLIK FOTO = ZOOM / KEMBALI
  ========================================== */

  image.addEventListener(
    "click",
    event => {

      event.stopPropagation();


      image.classList.toggle(
        "zoomed"
      );

    }
  );


  /* ==========================================
     KLIK LUAR = TUTUP
  ========================================== */

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

}
