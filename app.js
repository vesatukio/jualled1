const API_URL = 'https://script.google.com/macros/s/AKfycbzow1xcIduyHnwMA0WmlCvkz_s81IBu0ALbZ70fxPoXqEsYwtESEMm-S8mg6TZSuw95/exec';
const isAdmin = new URLSearchParams(window.location.search).get('role') === 'admin';
let cart = JSON.parse(localStorage.getItem("cart")) || {}; 
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
                    <p>
    Modal: Rp ${Number(p.HargaModal).toLocaleString()} 
    | Untung: Rp ${Number(p.Untung).toLocaleString()}
</p>

<p>
    Total Modal: 
    <b>
    Rp ${(Number(p.HargaModal) * Number(p.Stok)).toLocaleString()}
    </b>
</p>

<p>
    Stok: <b>${p.Stok}</b>
    <button onclick="openModal('${p.Nama}')">
        Edit Stok
    </button>
</p>
                </div>
            ` : `
                <div class="price-old">Rp ${p.HargaCoret?.toLocaleString() || '0'}</div>
                <div class="price-final">Rp ${p.HargaFinal?.toLocaleString() || '0'}</div>
                <p>Stok: <span id="stok-${p.Nama}">${p.Stok}</span></p>
            `}
            ${!isAdmin ? `

<div class="controls">

<button onclick='updateOrder(${JSON.stringify(p.Nama)}, -1)'>
-
</button>


<span>
${cart[p.Nama] || 0}
</span>


<button onclick='updateOrder(${JSON.stringify(p.Nama)}, 1)'>
+
</button>

</div>

` : ''}


</div>

`;

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

        console.log(data);

        allProducts =
Array.isArray(data)
?
data
:
data.products || [];

        console.log("Jumlah produk:", allProducts.length);

        renderCategories();
        renderProducts(allProducts);

    } catch (err) {
        console.error(err);
    }
}
// 4. FUNGSI KERANJANG & MODAL (Sama seperti punya Anda)
function updateOrder(nama, change) {

    if (!cart[nama]) {
        cart[nama] = 0;
    }

    cart[nama] += change;


    if (cart[nama] <= 0) {
        delete cart[nama];
    }


    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );


    renderProducts(allProducts);

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
                html += `<p>${nama} x ${qty} = <b>Rp ${(Number(prod.HargaFinal) * qty).toLocaleString()}</b></p>`;
                total += (Number(prod.HargaFinal) * qty);
                count += qty;
            }
        }
    }
    if (cartItemsDiv) {
    cartItemsDiv.innerHTML = html || '<p>Keranjang kosong</p>';
}

const resetButton = document.getElementById("reset-cart-btn");

if (resetButton) {
    resetButton.style.display = html ? "block" : "none";
}
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
// =====================
// START APP
// =====================

document.addEventListener("DOMContentLoaded", () => {

    fetchProducts();

    updateCartUI();


    const search = document.getElementById("search");


    if (search) {

        search.addEventListener("input", function () {

            const keyword =
            this.value.toLowerCase();


            renderProducts(
                allProducts.filter(p =>
                    p.Nama
                    .toLowerCase()
                    .includes(keyword)
                )
            );

        });

    }

});
function toggleCart() {
    document.getElementById("cart-box").classList.toggle("hidden");
}
function openModal(nama) {
    document.getElementById("edit-nama-produk").innerText = nama;
    document.getElementById("input-stok-baru").value = "";

    document.getElementById("adminModal").classList.remove("hidden");
}

function closeModal() {
    document.getElementById("adminModal").classList.add("hidden");
}
function resetCart() {
    if (confirm("Hapus semua pesanan?")) {
        cart = {};
        updateCartUI();
        renderProducts(allProducts);
    }
}
