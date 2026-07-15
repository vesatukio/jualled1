const API_URL = "https://script.google.com/macros/s/AKfycbwLtAJsbkYAKsx9M1fUJu-eXR2-hMTp7cl2SZrprvGJ0_ql6BWkm9pM-9EBNHXDABGblA/exec";
let dataGlobal = [];
let cart = JSON.parse(localStorage.getItem('cart')) || {};

// 1. Load Data
async function loadProduk() {
    try {
        const res = await fetch(API_URL);
        dataGlobal = await res.json();
        renderProduk(dataGlobal);
        loadKategori(); // Panggil kategori setelah data ada
    } catch (err) { console.error("Error:", err); }
}

// 2. Render Produk (Versi Harga Coret)
function renderProduk(items) {
    const container = document.getElementById('product-list');
    container.innerHTML = items.map(p => `
        <div class="card">
            <img src="${p.gambar1}" loading="lazy">
            <div class="card-body">
                <h4>${p.nama}</h4>
                <span class="harga-asli">Rp ${p.hargaJual.toLocaleString()}</span>
                <span class="harga-diskon">Rp ${p.hargaSetelahDiskon.toLocaleString()}</span>
                <div class="qty-control">
                    <button onclick="updateQty('${p.id}', -1)">-</button>
                    <span>${cart[p.id] || 0}</span>
                    <button onclick="updateQty('${p.id}', 1)">+</button>
                </div>
            </div>
        </div>
    `).join('');
}

// 3. Update Kuantitas
function updateQty(id, delta) {
    cart[id] = (cart[id] || 0) + delta;
    if (cart[id] <= 0) delete cart[id];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderProduk(dataGlobal);
}

// 4. Update Angka di Keranjang
function updateCartCount() {
    const count = Object.values(cart).reduce((a, b) => a + b, 0);
    document.getElementById('cart-count').innerText = count;
}

// 5. Load Kategori
function loadKategori() {
    const kategori = [...new Set(dataGlobal.map(p => p.kategori))];
    const container = document.getElementById('kategori-list');
    if(!container) return;
    container.innerHTML = kategori.map(k => 
        `<button onclick="filterProduk('${k}')">${k}</button>`
    ).join('');
}

// 6. Filter & Search
function filterProduk(kategori) {
    const filtered = dataGlobal.filter(p => p.kategori === kategori);
    renderProduk(filtered);
}

document.getElementById('search').addEventListener('input', (e) => {
    const filtered = dataGlobal.filter(p => p.nama.toLowerCase().includes(e.target.value.toLowerCase()));
    renderProduk(filtered);
});

// Admin Akses
function aksesAdmin() {
    const password = prompt("Masukkan Password Admin:");
    if (password === "admin123") {
        window.location.href = "https://docs.google.com/spreadsheets/d/1234567890/edit"; // Ganti ID
    }
}

// Jalankan
loadProduk();
updateCartCount();
