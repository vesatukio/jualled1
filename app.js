const API_URL = "https://script.google.com/macros/s/AKfycbwLtAJsbkYAKsx9M1fUJu-eXR2-hMTp7cl2SZrprvGJ0_ql6BWkm9pM-9EBNHXDABGblA/exec";
let dataGlobal = [];
let cart = JSON.parse(localStorage.getItem('cart')) || {};

async function loadProduk() {
    try {
        const res = await fetch(API_URL);
        dataGlobal = await res.json();
        renderProduk(dataGlobal);
    } catch (err) { console.error("Error:", err); }
}

function renderProduk(items) {
    const container = document.getElementById('product-list');
    container.innerHTML = items.map(p => `
        <div class="card">
            <img src="${p.gambar1}" alt="${p.nama}">
            <h4>${p.nama}</h4>
            <p>Rp ${p.hargaSetelahDiskon.toLocaleString()}</p>
            <div class="qty-control">
                <button onclick="updateQty('${p.id}', -1)">-</button>
                <span>${cart[p.id] || 0}</span>
                <button onclick="updateQty('${p.id}', 1)">+</button>
            </div>
        </div>
    `).join('');
}

function updateQty(id, delta) {
    cart[id] = (cart[id] || 0) + delta;
    if (cart[id] <= 0) delete cart[id];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderProduk(dataGlobal);
}

function updateCartCount() {
    document.getElementById('cart-count').innerText = Object.values(cart).reduce((a, b) => a + b, 0);
}

// Inisialisasi
loadProduk();
updateCartCount();

// Search
document.getElementById('search').addEventListener('input', (e) => {
    const filtered = dataGlobal.filter(p => p.nama.toLowerCase().includes(e.target.value.toLowerCase()));
    renderProduk(filtered);
});
