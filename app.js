"use strict";

/* =========================================================
DUTA LED - APP.JS
========================================================= */

const API_URL = "https://script.google.com/macros/s/AKfycbyr4eSauu1RneZIrwwPVBilx21kWNrauE9V40D17dmrntqTu4U3OGi4fafAYHXcd-A/exec";
const WHATSAPP = "6283157925577";
const FACEBOOK_URL = "#";
const TIKTOK_URL = "#";
const LOCATION_URL = "#";
const SHOPEE_URL = "ISI_LINK_SHOPEE";
const TIKTOK_SHOP_URL = "ISI_LINK_TIKTOK";
const LAZADA_URL = "ISI_LINK_LAZADA";

/* Cache versi baru supaya stok lama tidak dipakai */
const CACHE_KEY = "dutaled_produk_v5";
const CART_KEY = "dutaled_cart_v4";
const CACHE_TIME = 1000 * 60 * 5;

let products = [];
let cart = [];
let currentCategory = "Semua";
let searchText = "";
let specialDiscount = 0;
let specialPromoCode = "";
let selectedProductId = "";
let productGrid, categoryBar, searchInput, loading, empty, status;
let cartButton, cartOverlay, cartPanel, cartClose, cartBox, cartCount, cartTotal, checkoutButton;

document.addEventListener("DOMContentLoaded", init);

async function init() {
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
  loadSpecialPromo();
  loadSelectedProduct();
  setupLinks();
  setupMarketplaceLinks();
  setupSearch();
  setupPromoButton();
  setupCartButton();
  loadCart();
  renderCart();
  showLoading(true);

  const cached = loadCache();
  if (cached.length) {
    products = cached;
    renderCategories();
    renderProducts();
    showStatus("Memuat stok terbaru...");
    showSelectedProduct();
  }

  try {
    const fresh = await loadFromGoogle();
    if (fresh.length) {
      products = fresh;
      saveCache(products);
      renderCategories();
      renderProducts();
      showStatus("Stok & katalog terbaru");
      showSelectedProduct();
    } else if (!products.length) {
      showStatus("Produk belum tersedia");
    }
  } catch (error) {
    console.warn("Google Sheet tidak tersedia:", error);
    if (!products.length) showStatus("Mode offline");
  }
  showLoading(false);
  renderCart();
}

function loadSelectedProduct() {
  const params = new URLSearchParams(window.location.search);
  selectedProductId = String(params.get("id") || "").trim();
}

function loadSpecialPromo() {
  const params = new URLSearchParams(window.location.search);
  const promo = String(params.get("promo") || "").trim().replace("%", "");
  const discount = Number(promo);
  if (Number.isFinite(discount) && discount >= 1 && discount <= 99) {
    specialDiscount = discount;
    specialPromoCode = String(discount);
  } else {
    specialDiscount = 0;
    specialPromoCode = "";
  }
}

async function loadFromGoogle() {
  const response = await fetch(API_URL + "?t=" + Date.now(), {method:"GET", cache:"no-store"});
  if (!response.ok) throw new Error("HTTP " + response.status);
  const data = await response.json();
  const rows = Array.isArray(data) ? data : data.data;
  if (!Array.isArray(rows)) throw new Error("Format data API tidak valid");
  return rows.map(normalizeProduct).filter(product => product.nama);
}

function normalizeProduct(row) {
  /* Semua kemungkinan nama kolom stok ditangani di sini. */
  const stokRaw = row.stok ?? row.Stok ?? row.STOK ?? row.stock ?? row.Stock ?? row.STOCK ??
    row["stok barang"] ?? row["Stok Barang"] ?? row["STOK BARANG"] ??
    row["jumlah stok"] ?? row["Jumlah Stok"] ?? row["JML STOK"] ??
    row.qty ?? row.Qty ?? row.quantity ?? row.Quantity ?? row.persediaan ?? row.Persediaan;

  return {
    id: value(row.ID ?? row.id ?? row.Id),
    nama: value(row.nama ?? row.Nama ?? row.NAMA),
    kategori: value(row.kategori ?? row.Kategori ?? row.KATEGORI) || "Lainnya",
    hargaModal: number(row["harga modal"] ?? row.hargaModal ?? row.HargaModal),
    laba: number(row.Laba ?? row.laba),
    hargaJual: number(row["harga jual"] ?? row.hargaJual ?? row.HargaJual),
    diskon: number(row.diskon ?? row.Diskon),
    hargaDiskon: number(row["harga diskon"] ?? row.hargaDiskon ?? row.HargaDiskon),
    stok: parseStock(stokRaw),
    deskripsi: value(row.deskripsi ?? row.Deskripsi ?? row.diskipsi),
    gambar1: value(row.gambar1 ?? row.Gambar1),
    gambar2: value(row.gambar2 ?? row.Gambar2),
    gambar3: value(row.gambar3 ?? row.Gambar3)
  };
}

function parseStock(v) {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function value(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}
function number(v) {
  if (v === null || v === undefined || v === "") return 0;
  return Number(String(v).replace(/[^\d.-]/g, "")) || 0;
}

/* Sisanya tetap memakai fungsi katalog/keranjang yang sudah ada sebelumnya. */
