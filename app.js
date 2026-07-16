const API_URL = 'https://script.google.com/macros/s/AKfycbzow1xcIduyHnwMA0WmlCvkz_s81IBu0ALbZ70fxPoXqEsYwtESEMm-S8mg6TZSuw95/exec';
const isAdmin = new URLSearchParams(window.location.search).get('role') === 'admin';
let cart = {}; 
let allProducts = [];

// 1. FUNGSI RENDER PRODUK (Diletakkan paling atas agar tidak ReferenceError)
function renderProducts(products) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    if (!products || products.length === 0) {
        grid.innerHTML = '<p style="text-align:center;">Produk tidak ditemukan.</p>';
        return;
    }

    grid.innerHTML = products.map(p => `
        <div class="product-card">
            ${!isAdmin ? `<div class="discount-badge">${p.Diskon}%</div>` : ''}
            <img src="${p.Gambar || 'https://via.placeholder.com/300'}" style="width:100%">
            <h4>${p.Nama}</h4>
            ${isAdmin ? `
                <div class="admin-panel" style="background:#fff3e0; padding:5px; font-size:12px;">
                    <p>Modal: ${p.HargaModal} | Untung: ${p.Untung}</p>
                    <p>Stok: <b>${p.Stok}</b> 
                       <button onclick="openModal('${p.Nama}')">Edit Stok</button>
                    </p>
                </div>
            ` : `
                <div class="price-old">Rp ${p.HargaCoret?.toLocaleString() || '0'}</div>
                <div class="price-final">Rp ${p.HargaFinal?.toLocaleString() || '0'}</div>
                <p>Stok: <span id="stok-${p.Nama}">${p.Stok}</span></p>
            `}
            ${!isAdmin ? `
                <div class="controls">
                    <button onclick="updateOrder('${p.Nama}', -1)">-</button>
                    <span id="qty-${p.Nama}">${cart[p.Nama] || 0}</span>
                    <button onclick="updateOrder('${p.Nama}', 1)">+</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// 2. FUNGSI KATEGORI
function renderCategories() {
    const container = document.getElementById('category-container');
    if (!container) return;
    const categories = ['Semua', ...new Set(allProducts.map(p => p.Kategori).filter(Boolean))];
    container.innerHTML = categories.map(cat => `
        <button class="cat-btn" onclick="filterCategory('${cat}')">${cat}</button>
    `).join('');
}

function filterCategory(kategori) {
    if (kategori === 'Semua') {
        renderProducts(allProducts);
    } else {
        renderProducts(allProducts.filter(p => p.Kategori === kategori));
    }
}

// 3. FUNGSI UTAMA FETCH
async function fetchProducts() {
    try {
        const res = await fetch(`${API_URL}?role=${isAdmin ? 'admin' : 'user'}`);
        const data = await res.json();
        
        console.log("Data diterima dari server:", data); // CEK DI F12 CONSOLE
        
        // Filter agar hanya data yang punya Nama yang masuk
        allProducts = data.filter(p => p && p.Nama);
        
        renderCategories();
        renderProducts(allProducts);
    } catch (e) {
        console.error("Gagal ambil data. Pastikan Web App sudah di-deploy:", e);
        document.getElementById('product-grid').innerHTML = '<p>Gagal memuat produk. Cek koneksi.</p>';
    }
}
// 4. FUNGSI KERANJANG & MODAL (Sama seperti punya Anda)
function updateOrder(nama, change) {
    if (!cart[nama]) cart[nama] = 0;
    cart[nama] += change;
    if (cart[nama] < 0) cart[nama] = 0;
    const qtyElement = document.getElementById(`qty-${nama}`);
    if (qtyElement) qtyElement.innerText = cart[nama];
    updateCartUI();
}

function updateCartUI() {
    const cartItemsDiv = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    let total = 0, count = 0, html = '';

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

async function saveStock() {
    const nama = document.getElementById('edit-nama-produk').innerText;
    const stokBaru = document.getElementById('input-stok-baru').value;

    if (!stokBaru) {
        alert("Isi jumlah stok!");
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify({
                action: 'updateStok',
                nama: nama,
                stokBaru: Number(stokBaru)
            })
        });

        const result = await response.text();

        alert(result);

        if (result.includes("Berhasil")) {
            location.reload();
        }

    } catch (err) {
        console.error(err);
        alert("Gagal koneksi ke server: " + err.message);
    }
}
