const API_URL = "https://script.google.com/macros/s/AKfycbwLtAJsbkYAKsx9M1fUJu-eXR2-hMTp7cl2SZrprvGJ0_ql6BWkm9pM-9EBNHXDABGblA/exec";
let dataGlobal = [];
let cart = JSON.parse(localStorage.getItem('cart')) || {};

// 1. Inisialisasi
document.addEventListener('DOMContentLoaded', () => {
    loadProduk();
    updateCartCount();
});

// 2. Load Data Utama
async function loadProduk() {
    try {
        const res = await fetch(API_URL);
        dataGlobal = await res.json();
        
        // Simpan ke localStorage agar bisa dibaca oleh halaman keranjang
        localStorage.setItem('allProducts', JSON.stringify(dataGlobal)); 
        
        renderProduk(dataGlobal);
        loadKategori(); 
    } catch (err) { console.error("Error memuat data:", err); }
}

// 3. Render Produk
function renderProduk(items) {
    const container = document.getElementById('product-list');
    if (!container) return;

    container.innerHTML = items.map(p => `
        <div class="card">
            <img src="${p.gambar1}" loading="lazy">
            <div class="card-body">
                <h4>${p.nama}</h4>
                <span class="harga-asli">Rp ${parseInt(p.hargaJual || 0).toLocaleString()}</span>
                <span class="harga-diskon">Rp ${parseInt(p.hargaSetelahDiskon || 0).toLocaleString()}</span>
                <div class="qty-control">
                    <button onclick="updateQty('${p.id}', -1)">-</button>
                    <span>${cart[p.id] || 0}</span>
                    <button onclick="updateQty('${p.id}', 1)">+</button>
                </div>
            </div>
        </div>
    `).join('');
}

// 4. Load Kategori
function loadKategori() {
    const container = document.getElementById('kategori-list');
    if (!container) return;

    const kategoriList = [...new Set(dataGlobal.map(p => p.kategori))];
    container.innerHTML = `<button onclick="renderProduk(dataGlobal)">Semua</button>` + 
        kategoriList.map(k => `<button onclick="filterProduk('${k}')">${k}</button>`).join('');
}

// 5. Update Keranjang
function updateQty(id, delta) {
    cart[id] = (cart[id] || 0) + delta;
    if (cart[id] <= 0) delete cart[id];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderProduk(dataGlobal);
}

function updateCartCount() {
    const el = document.getElementById('cart-count');
    if (el) el.innerText = Object.values(cart).reduce((a, b) => a + b, 0);
}

// 6. Filter & Search
function filterProduk(kategori) {
    const filtered = dataGlobal.filter(p => p.kategori === kategori);
    renderProduk(filtered);
}

document.getElementById('search').addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase();
    const filtered = dataGlobal.filter(p => p.nama.toLowerCase().includes(keyword));
    renderProduk(filtered);
});

// Admin
function aksesAdmin() {
    const password = prompt("Masukkan Password Admin:");
    if (password === "admin123") {
        window.location.href = "admin.html"; // Mengarah ke halaman admin lokal
    }
}
