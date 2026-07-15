const API_URL = "https://script.google.com/macros/s/AKfycbwLtAJsbkYAKsx9M1fUJu-eXR2-hMTp7cl2SZrprvGJ0_ql6BWkm9pM-9EBNHXDABGblA/exec"; // Ganti dengan URL deployment Anda

async function loadProduk() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        renderProduk(data);
    } catch (err) {
        console.error("Gagal ambil data:", err);
    }
}

function renderProduk(items) {
    const container = document.getElementById('product-list');
    container.innerHTML = items.map(item => `
        <div class="card">
            <img src="${item.gambar1}" alt="${item.nama}">
            <h4>${item.nama}</h4>
            <p>Rp ${item.hargaSetelahDiskon.toLocaleString()}</p>
            <button class="btn-wa" onclick="hubungiWA('${item.nama}')">Beli via WA</button>
        </div>
    `).join('');
}

function hubungiWA(nama) {
    const waLink = `https://wa.me/628123456789?text=Halo DUTAKITA, saya mau pesan ${nama}`;
    window.open(waLink, '_blank');
}

loadProduk();
let cart = JSON.parse(localStorage.getItem('cart')) || {};

function renderProduk(items) {
    const container = document.getElementById('product-list');
    container.innerHTML = items.map(p => {
        let count = cart[p.id] || 0;
        return `
            <div class="card">
                <img src="${p.gambar1}" alt="${p.nama}">
                <h4>${p.nama}</h4>
                <p>Rp ${p.hargaSetelahDiskon.toLocaleString()}</p>
                <div class="qty-control">
                    <button onclick="updateQty('${p.id}', -1)">-</button>
                    <span>${count}</span>
                    <button onclick="updateQty('${p.id}', 1)">+</button>
                </div>
            </div>
        `;
    }).join('');
}

function updateQty(id, delta) {
    cart[id] = (cart[id] || 0) + delta;
    if (cart[id] <= 0) delete cart[id];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    // Re-render hanya list produk
    loadProduk(); 
}

function updateCartCount() {
    const count = Object.values(cart).reduce((a, b) => a + b, 0);
    document.getElementById('cart-count').innerText = count;
}

// Inisialisasi awal
updateCartCount();
