// 1. Inisialisasi Data & State
let dataGlobal = [];
let cart = JSON.parse(localStorage.getItem('cart')) || {};

// 2. Fetch Data dari Google Sheet (https://script.google.com/macros/s/AKfycbwLtAJsbkYAKsx9M1fUJu-eXR2-hMTp7cl2SZrprvGJ0_ql6BWkm9pM-9EBNHXDABGblA/exec)
const API_URL = "URL_APPS_SCRIPT_ANDA"; 

async function loadProduk() {
    try {
        const res = await fetch(API_URL);
        dataGlobal = await res.json();
        renderProduk(dataGlobal);
    } catch (err) {
        console.error("Gagal memuat produk:", err);
    }
}

// 3. Render Produk ke Layar
function renderProduk(items) {
    const container = document.getElementById('product-list');
    container.innerHTML = items.map(p => {
        const count = cart[p.id] || 0;
        return `
            <div class="card">
                <img src="${p.gambar1}" alt="${p.nama}" loading="lazy">
                <div class="card-body">
                    <h4>${p.nama}</h4>
                    <p>Rp ${parseInt(p.hargaSetelahDiskon).toLocaleString()}</p>
                    <div class="qty-control">
                        <button onclick="updateQty('${p.id}', -1)">-</button>
                        <span>${count}</span>
                        <button onclick="updateQty('${p.id}', 1)">+</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 4. Logika Keranjang
function updateQty(id, delta) {
    cart[id] = (cart[id] || 0) + delta;
    if (cart[id] <= 0) delete cart[id];
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderProduk(dataGlobal); // Refresh tampilan
}

function updateCartCount() {
    const total = Object.values(cart).reduce((a, b) => a + b, 0);
    document.getElementById('cart-count').innerText = total;
}

// 5. Pencarian & Filter
document.getElementById('search').addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase();
    const filtered = dataGlobal.filter(p => p.nama.toLowerCase().includes(keyword));
    renderProduk(filtered);
});

function filterProduk(kategori) {
    const filtered = kategori === 'Semua' 
        ? dataGlobal 
        : dataGlobal.filter(p => p.kategori === kategori);
    renderProduk(filtered);
}

// Jalankan
loadProduk();
updateCartCount();
