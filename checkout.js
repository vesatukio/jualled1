"use strict";

/* DUTA LED - CHECKOUT LOKAL */
(function () {
  const CART_KEY = "dutaled_cart_v4";
  const WHATSAPP = "6283157925577";

  function rupiah(n) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "ID", maximumFractionDigits: 0 }).format(Number(n) || 0);
  }

  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]") || []; }
    catch (_) { return []; }
  }

  function getPrice(item) {
    return Number(item.hargaTampil ?? item.hargaDiskon ?? item.hargaJual ?? item.harga ?? 0) || 0;
  }

  function totalCart(cart) {
    return cart.reduce((sum, item) => sum + getPrice(item) * (Number(item.qty) || 1), 0);
  }

  function closeCheckout() {
    document.getElementById("checkoutModal")?.classList.remove("show");
    document.body.classList.remove("checkout-open");
  }

  function openCheckout() {
    const cart = getCart();
    if (!cart.length) {
      alert("Keranjang masih kosong.");
      return;
    }
    renderSummary();
    document.getElementById("checkoutModal")?.classList.add("show");
    document.body.classList.add("checkout-open");
  }

  function renderSummary() {
    const cart = getCart();
    const box = document.getElementById("checkoutItems");
    const total = totalCart(cart);
    if (!box) return;
    box.innerHTML = cart.map(item => {
      const qty = Number(item.qty) || 1;
      return `<div class="checkout-item"><div><strong>${escapeHTML(item.nama || "Produk")}</strong><small>${qty} × ${rupiah(getPrice(item))}</small></div><b>${rupiah(getPrice(item) * qty)}</b></div>`;
    }).join("");
    document.getElementById("checkoutSubtotal").textContent = rupiah(total);
    document.getElementById("checkoutGrandTotal").textContent = rupiah(total);
  }

  function escapeHTML(v) {
    return String(v).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  }

  function submitOrder(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const cart = getCart();
    const total = totalCart(cart);
    const orderNo = "DL" + Date.now().toString().slice(-8);
    const data = new FormData(form);
    const lines = cart.map((item, i) => `${i + 1}. ${item.nama || "Produk"} (${Number(item.qty) || 1} x ${rupiah(getPrice(item))}) = ${rupiah(getPrice(item) * (Number(item.qty) || 1))}`);
    const message = [
      "*PESANAN BARU DUTA LED*",
      `No. Pesanan: ${orderNo}`,
      "",
      "*Data Pembeli*",
      `Nama: ${data.get("nama")}`,
      `WhatsApp: ${data.get("wa")}`,
      `Alamat: ${data.get("alamat")}`,
      `Kota/Kecamatan: ${data.get("kota")}`,
      "",
      "*Pesanan*",
      ...lines,
      "",
      `Subtotal: ${rupiah(total)}`,
      "Ongkir: dikonfirmasi admin",
      `Pembayaran: ${data.get("pembayaran")}`,
      `Pengiriman: ${data.get("pengiriman")}`,
      "",
      "Mohon konfirmasi total dan instruksi pembayaran."
    ].join("\n");

    localStorage.setItem("dutaled_last_order", JSON.stringify({ orderNo, createdAt: new Date().toISOString(), customer: Object.fromEntries(data.entries()), cart, total, status: "menunggu_konfirmasi" }));
    window.open("https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(message), "_blank", "noopener");
    closeCheckout();
  }

  document.addEventListener("DOMContentLoaded", function () {
    const oldButton = document.getElementById("checkoutButton");
    if (oldButton) {
      oldButton.textContent = "Checkout & Isi Data";
      oldButton.addEventListener("click", function (e) { e.preventDefault(); openCheckout(); });
    }

    document.body.insertAdjacentHTML("beforeend", `
      <div id="checkoutModal" class="checkout-modal" aria-hidden="true">
        <div class="checkout-backdrop" data-checkout-close></div>
        <section class="checkout-dialog" role="dialog" aria-modal="true" aria-label="Checkout Duta LED">
          <header><div><small>CHECKOUT AMAN</small><h2>Selesaikan Pesanan</h2></div><button type="button" class="checkout-x" data-checkout-close>×</button></header>
          <form id="checkoutForm">
            <div class="checkout-grid">
              <div class="checkout-form-side">
                <h3>Data Pembeli</h3>
                <label>Nama lengkap<input name="nama" required autocomplete="name" placeholder="Nama penerima"></label>
                <label>Nomor WhatsApp<input name="wa" required inputmode="tel" autocomplete="tel" placeholder="08xxxxxxxxxx"></label>
                <label>Alamat lengkap<textarea name="alamat" required placeholder="Desa, jalan, nomor rumah"></textarea></label>
                <label>Kota / Kecamatan<input name="kota" required placeholder="Contoh: Subah, Batang"></label>
                <h3>Pengiriman</h3>
                <select name="pengiriman"><option>JNE / J&T (konfirmasi admin)</option><option>SiCepat (konfirmasi admin)</option><option>POS Indonesia (konfirmasi admin)</option><option>Ambil di toko</option></select>
                <h3>Pembayaran</h3>
                <select name="pembayaran"><option>Transfer Bank / QRIS - konfirmasi admin</option><option>Transfer BRI - konfirmasi admin</option><option>Pembayaran melalui WhatsApp</option></select>
              </div>
              <aside class="checkout-summary"><h3>Ringkasan Pesanan</h3><div id="checkoutItems"></div><div class="checkout-total"><span>Subtotal</span><b id="checkoutSubtotal">Rp0</b></div><p>Ongkir akan dikonfirmasi sebelum pembayaran.</p><div class="checkout-grand"><span>Total sementara</span><strong id="checkoutGrandTotal">Rp0</strong></div><button type="submit" class="checkout-submit">Lanjut Konfirmasi Pesanan</button><small>Data dikirim ke WhatsApp Duta LED untuk konfirmasi stok, ongkir, dan pembayaran.</small></aside>
            </div>
          </form>
        </section>
      </div>`);

    document.querySelectorAll("[data-checkout-close]").forEach(el => el.addEventListener("click", closeCheckout));
    document.getElementById("checkoutForm")?.addEventListener("submit", submitOrder);
  });
})();
