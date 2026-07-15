const API_URL = "https://script.google.com/macros/s/AKfycbwdl_o7WZyyPaZHekAwqUYnoA1h29SGc_jLN-m9o2LV4jQVNXsUXO4Wi3aVymH1pj7G/exec";
let dataGlobal = [];
let cart = JSON.parse(localStorage.getItem('cart')) || {};

document.addEventListener('DOMContentLoaded', () => {
    loadProduk();
    updateCartCount();
});

async function loadProduk() {
    try {
        const res = await fetch(API_URL);
        dataGlobal = await res.json();
        localStorage.setItem('allProducts', JSON.stringify(dataGlobal)); 
        renderProduk(dataGlobal);
        loadKategori(); 
    } catch (err) { console.error("Error memuat data:", err); }
}

function renderProduk(items) {
    const container = document.getElementById('product-list');
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = "<p>Sedang memuat data atau belum ada produk tersedia.</p>";
        return;
    }

    container.innerHTML = items.map(p => `
        <div class="card">
            <img src="${p['Gambar 1'] || 'placeholder.jpg'}" loading="lazy">
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

function loadKategori() {
    const container = document.getElementById('kategori-list');
    if (!container) return;

    // Pastikan key kategori sesuai dengan header di Google Sheet
    const kategoriList = [...new Set(dataGlobal.map(p => p['Kategori']))];
    container.innerHTML = `<button onclick="renderProduk(dataGlobal)">Semua</button>` + 
        kategoriList.map(k => `<button onclick="filterProduk('${k}')">${k}</button>`).join('');
}

// Tambahkan sisa fungsi lainnya (updateQty, updateCartCount, filter, dll) seperti sebelumnya...
