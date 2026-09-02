/* DUTA LED - stok pada kartu produk */
(function () {
  "use strict";

  function parseStock(value) {
    if (value === null || value === undefined || value === "") return 0;
    const n = Number(String(value).replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }

  /* Tambahkan stok ke hasil normalisasi produk tanpa mengubah alur API utama. */
  if (typeof window.normalizeProduct === "function") {
    const originalNormalizeProduct = window.normalizeProduct;
    window.normalizeProduct = function (row) {
      const product = originalNormalizeProduct(row);
      product.stok = parseStock(
        row?.stok ?? row?.Stok ?? row?.STOK ?? row?.stock ?? row?.Stock ?? row?.STOCK
      );
      return product;
    };
  }

  function applyStock(card, product) {
    if (!card || !product) return card;

    const stok = parseStock(product.stok);
    card.dataset.stok = String(stok);

    const info = card.querySelector(".product-info");
    const price = card.querySelector(".price");
    const oldPrice = card.querySelector(".old-price");
    const buyButton = card.querySelector(".buy-button");

    if (!info || !price) return card;

    let stockStatus = info.querySelector(".stock-status");
    if (!stockStatus) {
      stockStatus = document.createElement("span");
      stockStatus.className = "stock-status";
    }

    if (stok <= 0) {
      stockStatus.className = "stock-status stock-empty";
      stockStatus.textContent = "HABIS";
      stockStatus.setAttribute("aria-label", "Stok habis");
      if (buyButton) {
        buyButton.disabled = true;
        buyButton.classList.add("is-sold-out");
        buyButton.textContent = "Stok Habis";
      }
    } else if (stok < 10) {
      stockStatus.className = "stock-status stock-low";
      stockStatus.textContent = `Stok tinggal ${stok}`;
      stockStatus.setAttribute("aria-label", `Stok tinggal ${stok}`);
      if (buyButton) {
        buyButton.disabled = false;
        buyButton.classList.remove("is-sold-out");
        buyButton.textContent = "🛒 + Keranjang";
      }
    } else {
      stockStatus.remove();
      if (buyButton) {
        buyButton.disabled = false;
        buyButton.classList.remove("is-sold-out");
        buyButton.textContent = "🛒 + Keranjang";
      }
      return card;
    }

    /* Posisi: harga coret — status stok — harga jual. */
    if (oldPrice) {
      oldPrice.insertAdjacentElement("afterend", stockStatus);
    } else {
      price.insertAdjacentElement("beforebegin", stockStatus);
    }

    return card;
  }

  /* Bungkus pembuat kartu sehingga stok ikut tampil setiap render. */
  if (typeof window.createProductCard === "function") {
    const originalCreateProductCard = window.createProductCard;
    window.createProductCard = function (product) {
      const card = originalCreateProductCard(product);
      return applyStock(card, product);
    };
  }
})();
