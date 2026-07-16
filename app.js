const API_URL = "https://script.google.com/macros/s/AKfycbwdl_o7WZyyPaZHekAwqUYnoA1h29SGc_jLN-m9o2LV4jQVNXsUXO4Wi3aVymH1pj7G/exec";
let dataGlobal = [];
let cart = JSON.parse(localStorage.getItem('cart')) || {};

// 1. Inisialisasi Saat Halaman Dimuat
document.addEventListener('DOMContentLoaded', () => {
    loadProduk();
    updateCartCount();
});

// 2. Mengambil Data dari Google Sheet
async function loadProduk() {
    try {
        const res = await fetch(API_URL);
        dataGlobal = await res.json();
        localStorage.setItem('allProducts', JSON.stringify(dataGlobal)); 
        renderProduk(dataGlobal);
        loadKategori(); 
    } catch (err) { 
        console.error("Error memuat data:", err); 
        const container = document.getElementById('product-list');
        if (container) container.innerHTML = "<p>Gagal memuat produk. Periksa koneksi atau URL API.</p>";
    }
}

// 3. Menampilkan Produk ke Layar
function renderProduk(items) {
    const container = document.getElementById('product-list');
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = "<p>Produk tidak ditemukan.</p>";
        return;
    }

    container.innerHTML = items.map(p => `
        <div class="card">
            <img src="${p['Gambar 1'] || 'placeholder.jpg'}" loading="lazy" alt="${p['Nama Barang']}">
            <div class="card-body">
                <h4>${p['Nama Barang']}</h4>
                <p>Harga: Rp ${parseInt(p['Harga Setelah Diskon'] || 0).toLocaleString()}</p>
                <p>Stok: ${p['Stok']} ${p['Satuan']}</p>
                <div class="qty-control">
                    <button onclick="updateQty('${p.ID}', -1)">-</button>
                    <span>${cart[p.ID] || 0}</span>
                    <button onclick="updateQty('${p.ID}', 1)">+</button>
                </div>
            </div>
        </div>
    `).join('');
}

// 4. Memuat Tombol Kategori
function loadKategori() {
    const container = document.getElementById('kategori-list');
    if (!container) return;

    const kategoriList = [...new Set(dataGlobal.map(p => p['Kategori']))];
    container.innerHTML = `<button onclick="renderProduk(dataGlobal)">Semua</button>` + 
        kategoriList.map(k => `<button onclick="filterProduk('${k}')">${k}</button>`).join('');
}

// 5. Fungsi Keranjang Belanja
function updateQty(id, delta) {
    cart[id] = (cart[id] || 0) + delta;
    if (cart[id] <= 0) delete cart[id];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderProduk(dataGlobal);
}

function updateCartCount() {
    const els = document.querySelectorAll('#cart-count');
    const total = Object.values(cart).reduce((a, b) => a + b, 0);
    els.forEach(el => el.innerText = total);
}

// 6. Pencarian & Filter
function filterProduk(kategori) {
    const filtered = dataGlobal.filter(p => p['Kategori'] === kategori);
    renderProduk(filtered);
}

const searchInput = document.getElementById('search');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value.toLowerCase();
        const filtered = dataGlobal.filter(p => 
            p['Nama Barang'].toLowerCase().includes(keyword)
        );
        renderProduk(filtered);
    });
}

// 7. Akses Admin
function aksesAdmin() {
    const password = prompt("Masukkan Password Admin:");
    if (password === "admin123") {
        window.location.href = "admin.html";
    }
}
