const API_URL = 'https://script.google.com/macros/s/AKfycbzow1xcIduyHnwMA0WmlCvkz_s81IBu0ALbZ70fxPoXqEsYwtESEMm-S8mg6TZSuw95/exec';
const isAdmin = new URLSearchParams(window.location.search).get('role') === 'admin';
let cart = {}; 
let allProducts = [];

async function fetchProducts() {
    const res = await fetch(`${API_URL}?role=${isAdmin ? 'admin' : 'user'}`);
    allProducts = await res.json();
    renderProducts(allProducts);
}

function renderProducts(products) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = products.map(p => `
        <div class="product-card">
            ${!isAdmin ? `<div class="discount-badge">${p.Diskon}%</div>` : ''}
            <img src="${p.Gambar}" style="width:100%">
            <h4>${p.Nama}</h4>
            ${isAdmin ? `<p>Modal: ${p.HargaModal} | Untung: ${p.Untung}</p>` : `
                <div class="price-old">Rp ${p.HargaCoret ? p.HargaCoret.toLocaleString() : '0'}</div>
                <div class="price-final">Rp ${p.HargaFinal ? p.HargaFinal.toLocaleString() : '0'}</div>
            `}
            <p>Stok: <span id="stok-${p.Nama}">${p.Stok}</span></p>
            <div class="controls">
                <button onclick="updateOrder('${p.Nama}', -1)">-</button>
                <span id="qty-${p.Nama}">${cart[p.Nama] || 0}</span>
                <button onclick="updateOrder('${p.Nama}', 1)">+</button>
            </div>
        </div>
    `).join('');
}

function updateOrder(nama, change) {
    if (!cart[nama]) cart[nama] = 0;
    cart[nama] += change;
    if (cart[nama] < 0) cart[nama] = 0;
    
    // Update angka di kartu produk
    const qtyElement = document.getElementById(`qty-${nama}`);
    if (qtyElement) qtyElement.innerText = cart[nama];
    
    // PENTING: Panggil fungsi untuk update tampilan keranjang
    updateCartUI();
}

function updateCartUI() {
    const cartItemsDiv = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    let html = '';
    let total = 0;
    let count = 0;

    for (const [nama, qty] of Object.entries(cart)) {
        if (qty > 0) {
            const prod = allProducts.find(p => p.Nama === nama);
            if (prod) {
                html += `<p>${nama} x ${qty} = <b>Rp ${(prod.HargaFinal * qty).toLocaleString()}</b></p>`;
                total += (prod.HargaFinal * qty);
                count += qty;
            }
        }
    }
    
    if (cartItemsDiv) cartItemsDiv.innerHTML = html || '<p>Keranjang kosong</p>';
    if (document.getElementById('cart-total')) document.getElementById('cart-total').innerText = 'Total: Rp ' + total.toLocaleString();
    if (cartCount) cartCount.innerText = count;
}

function toggleCart() {
    const box = document.getElementById('cart-box');
    if (box) box.classList.toggle('hidden');
}

// Jalankan saat halaman dimuat
fetchProducts();
