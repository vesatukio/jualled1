const API_URL = 'https://script.google.com/macros/s/AKfycbzow1xcIduyHnwMA0WmlCvkz_s81IBu0ALbZ70fxPoXqEsYwtESEMm-S8mg6TZSuw95/exec';
const isAdmin = new URLSearchParams(window.location.search).get('role') === 'admin';
let cart = {}; // Menyimpan data pesanan

async function fetchProducts() {
    const res = await fetch(`${API_URL}?role=${isAdmin ? 'admin' : 'user'}`);
    const products = await res.json();
    renderProducts(products);
}

function renderProducts(products) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = products.map(p => `
        <div class="product-card">
            ${!isAdmin ? `<div class="discount-badge">${p.Diskon}%</div>` : ''}
            <img src="${p.Gambar}" style="width:100%">
            <h4>${p.Nama}</h4>
            ${isAdmin ? `<p>Modal: ${p.HargaModal} | Untung: ${p.Untung}</p>` : `
                <div class="price-old">Rp ${p.HargaCoret}</div>
                <div class="price-final">Rp ${p.HargaFinal}</div>
            `}
            <p>Stok: <span id="stok-${p.Nama}">${p.Stok}</span></p>
            <div class="controls">
                <button onclick="updateOrder('${p.Nama}', -1)">-</button>
                <span id="qty-${p.Nama}">0</span>
                <button onclick="updateOrder('${p.Nama}', 1)">+</button>
            </div>
        </div>
    `).join('');
}

function updateOrder(nama, change) {
    if (!cart[nama]) cart[nama] = 0;
    cart[nama] += change;
    if (cart[nama] < 0) cart[nama] = 0;
    
    // Update tampilan angka
    document.getElementById(`qty-${nama}`).innerText = cart[nama];
    console.log("Keranjang:", cart);
}

fetchProducts();
