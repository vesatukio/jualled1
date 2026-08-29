"use strict";

/* =========================================================
   DUTA LED - AFFILIATE GENERATOR
   Membaca sheet AFFILIATE melalui Google Apps Script API
   lalu otomatis membuat katalog affiliate di halaman utama.
========================================================= */

const AFFILIATE_API_URL =
  "https://script.google.com/macros/s/AKfycbyr4eSauu1RneZIrwwPVBilx21kWNrauE9V40D17dmrntqTu4U3OGi4fafAYHXcd-A/exec";

const AFFILIATE_CACHE_KEY = "dutaled_affiliate_v1";
const AFFILIATE_CACHE_TIME = 1000 * 60 * 30;

let affiliateProducts = [];
let affiliateCategory = "Semua";
let affiliateSearch = "";

(function startAffiliateGenerator() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAffiliateGenerator);
  } else {
    initAffiliateGenerator();
  }
})();

async function initAffiliateGenerator() {
  createAffiliateSection();

  const cached = loadAffiliateCache();
  if (cached.length) {
    affiliateProducts = cached;
    renderAffiliateCatalog();
  }

  try {
    const fresh = await loadAffiliateProducts();
    affiliateProducts = fresh;
    saveAffiliateCache(fresh);
    renderAffiliateCatalog();
  } catch (error) {
    console.warn("Affiliate API tidak tersedia:", error);
    if (!affiliateProducts.length) {
      showAffiliateMessage("Katalog affiliate belum tersedia.");
    }
  }
}

function createAffiliateSection() {
  if (document.getElementById("affiliateSection")) return;

  const section = document.createElement("section");
  section.id = "affiliateSection";
  section.className = "affiliate-section";
  section.innerHTML = `
    <div class="container">
      <div class="section-title center">
        <span class="eyebrow">REKOMENDASI</span>
        <h2>Produk Affiliate</h2>
        <p class="affiliate-subtitle">Pilihan produk dari marketplace yang bisa Anda beli langsung.</p>
      </div>

      <div class="affiliate-toolbar">
        <div class="affiliate-search">
          <span>🔍</span>
          <input id="affiliateSearch" type="search" placeholder="Cari produk affiliate..." autocomplete="off">
        </div>
        <div id="affiliateCategories" class="affiliate-categories"></div>
      </div>

      <div id="affiliateLoading" class="affiliate-loading">Memuat produk affiliate...</div>
      <div id="affiliateGrid" class="affiliate-grid"></div>
      <div id="affiliateEmpty" class="affiliate-empty hidden">Produk affiliate tidak ditemukan.</div>
    </div>
  `;

  const productsSection = document.getElementById("produk");
  if (productsSection) {
    productsSection.insertAdjacentElement("afterend", section);
  } else {
    document.body.prepend(section);
  }

  const input = document.getElementById("affiliateSearch");
  input?.addEventListener("input", event => {
    affiliateSearch = String(event.target.value || "").trim().toLowerCase();
    renderAffiliateCatalog();
  });
}

async function loadAffiliateProducts() {
  const response = await fetch(
    AFFILIATE_API_URL + "?action=affiliate&t=" + Date.now(),
    { method: "GET", cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("HTTP " + response.status);
  }

  const json = await response.json();
  const rows = Array.isArray(json) ? json : json.data;

  if (!Array.isArray(rows)) {
    throw new Error("Format data AFFILIATE tidak valid");
  }

  return rows
    .map(normalizeAffiliateProduct)
    .filter(product =>
      product.nama &&
      product.linkAffiliate &&
      product.aktif === "YA" &&
      product.affiliate === "YA"
    );
}

function normalizeAffiliateProduct(row) {
  return {
    id: text(row.id ?? row.ID ?? row.Id),
    nama: text(row.nama ?? row.Nama ?? row.NAMA),
    kategori: text(row.kategori ?? row.Kategori ?? row.KATEGORI) || "Lainnya",
    harga: money(row.harga ?? row.Harga ?? row.HARGA),
    hargaCoret: money(row.hargaCoret ?? row["harga coret"] ?? row.HargaCoret),
    deskripsi: text(row.deskripsi ?? row.Deskripsi ?? row.DESKRIPSI),
    gambar: text(row.gambar ?? row.Gambar ?? row.GAMBAR),
    linkAffiliate: text(row.linkAffiliate ?? row.LinkAffiliate ?? row.LINKAFFILIATE),
    platform: text(row.platform ?? row.Platform ?? row.PLATFORM) || "Marketplace",
    affiliate: text(row.affiliate ?? row.Affiliate ?? row.AFFILIATE).toUpperCase(),
    aktif: text(row.aktif ?? row.Aktif ?? row.AKTIF).toUpperCase()
  };
}

function renderAffiliateCatalog() {
  const grid = document.getElementById("affiliateGrid");
  const loading = document.getElementById("affiliateLoading");
  const empty = document.getElementById("affiliateEmpty");
  if (!grid) return;

  loading?.classList.add("hidden");
  renderAffiliateCategories();

  const list = affiliateProducts.filter(product => {
    const categoryOK =
      affiliateCategory === "Semua" ||
      product.kategori.toLowerCase() === affiliateCategory.toLowerCase();

    const haystack = [product.nama, product.kategori, product.deskripsi]
      .join(" ")
      .toLowerCase();

    return categoryOK && (!affiliateSearch || haystack.includes(affiliateSearch));
  });

  grid.innerHTML = "";
  empty?.classList.toggle("hidden", list.length > 0);

  list.forEach(product => grid.appendChild(createAffiliateCard(product)));
}

function renderAffiliateCategories() {
  const bar = document.getElementById("affiliateCategories");
  if (!bar) return;

  const categories = ["Semua", ...new Set(
    affiliateProducts.map(product => product.kategori).filter(Boolean)
  )];

  bar.innerHTML = "";
  categories.forEach(category => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "affiliate-category" +
      (category === affiliateCategory ? " active" : "");
    button.textContent = category;
    button.addEventListener("click", () => {
      affiliateCategory = category;
      renderAffiliateCatalog();
    });
    bar.appendChild(button);
  });
}

function createAffiliateCard(product) {
  const card = document.createElement("article");
  card.className = "affiliate-card";

  const image = product.gambar || "image/no-image.png";
  const hasOldPrice = product.hargaCoret > product.harga;
  const discount = hasOldPrice
    ? Math.round((1 - product.harga / product.hargaCoret) * 100)
    : 0;

  const discountHTML = discount > 0
    ? `<span class="affiliate-discount">-${discount}%</span>`
    : "";

  const oldPriceHTML = hasOldPrice
    ? `<div class="affiliate-old-price">${formatRupiah(product.hargaCoret)}</div>`
    : "";

  card.innerHTML = `
    <a class="affiliate-image" href="${safeURL(product.linkAffiliate)}" target="_blank" rel="nofollow sponsored noopener">
      <img src="${safeAttr(image)}" alt="${safeAttr(product.nama)}" loading="lazy">
      ${discountHTML}
    </a>
    <div class="affiliate-info">
      <span class="affiliate-platform">${safeHTML(product.platform)}</span>
      <div class="affiliate-name">${safeHTML(product.nama)}</div>
      ${oldPriceHTML}
      <div class="affiliate-price">${formatRupiah(product.harga)}</div>
      <p class="affiliate-description">${safeHTML(product.deskripsi)}</p>
      <a class="affiliate-buy" href="${safeURL(product.linkAffiliate)}" target="_blank" rel="nofollow sponsored noopener">
        🛒 Beli di ${safeHTML(product.platform)}
      </a>
    </div>
  `;

  const img = card.querySelector("img");
  img?.addEventListener("error", () => {
    img.src = "image/no-image.png";
  }, { once: true });

  return card;
}

function showAffiliateMessage(message) {
  const loading = document.getElementById("affiliateLoading");
  if (loading) {
    loading.textContent = message;
    loading.classList.remove("hidden");
  }
}

function loadAffiliateCache() {
  try {
    const raw = localStorage.getItem(AFFILIATE_CACHE_KEY);
    if (!raw) return [];
    const cache = JSON.parse(raw);
    if (!cache || Date.now() - Number(cache.time) > AFFILIATE_CACHE_TIME) return [];
    return Array.isArray(cache.data) ? cache.data : [];
  } catch (_) {
    return [];
  }
}

function saveAffiliateCache(data) {
  try {
    localStorage.setItem(AFFILIATE_CACHE_KEY, JSON.stringify({
      time: Date.now(),
      data
    }));
  } catch (_) {}
}

function text(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function money(value) {
  if (value === null || value === undefined || value === "") return 0;
  return Number(String(value).replace(/[^\d.-]/g, "")) || 0;
}

function formatRupiah(value) {
  return "Rp" + new Intl.NumberFormat("id-ID").format(Number(value) || 0);
}

function safeHTML(value) {
  return text(value).replace(/[&<>\"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
}

function safeAttr(value) {
  return safeHTML(value);
}

function safeURL(value) {
  const url = text(value);
  try {
    const parsed = new URL(url, window.location.href);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return safeAttr(parsed.href);
    }
  } catch (_) {}
  return "#";
}
