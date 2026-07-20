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

    grid.innerHTML = products.map(p => {

        const stokNum = Number(p.Stok) || 0;
        const isHabis = stokNum <= 0;

        return `
        <div class="product-card ${isHabis ? 'out-of-stock' : ''}">

            ${!isAdmin ? `<div class="discount-badge">${p.Diskon}%</div>` : ''}

            <img src="${p.Gambar || 'https://via.placeholder.com/300'}" style="width:100%">

            <h4>${p.Nama}</h4>

            ${isAdmin ? `

                <div class="admin-panel" style="background:#fff3e0;padding:5px;font-size:12px;">

                    <p>
                        Modal : Rp ${Number(p.HargaModal).toLocaleString()}
                        | Untung : Rp ${Number(p.Untung).toLocaleString()}
                    </p>

                    <p>
                        Total Modal :
                        <b>Rp ${(Number(p.HargaModal) * stokNum).toLocaleString()}</b>
                    </p>

                    <p>
                        Stok : <b>${stokNum}</b>

                        <button onclick="openModal('${p.Nama}')">
                            Edit Stok
                        </button>
                    </p>

                </div>

            ` : `

                <div class="price-old">
                    Rp ${(Number(p.HargaCoret) || 0).toLocaleString()}
                </div>

                <div class="price-final">
                    Rp ${(Number(p.HargaFinal) || 0).toLocaleString()}
                </div>

                <div class="stok-info">
    <span>Stok : ${stokNum}</span>
    ${isHabis ? '<span class="stok-habis">HABIS</span>' : ''}
</div>

                <div class="controls">

                    <button
                        onclick="updateOrder('${p.Nama}',-1)"
                        ${isHabis ? 'disabled' : ''}
                    >
                        -
                    </button>

                    <span id="qty-${p.Nama}">
                        ${cart[p.Nama] || 0}
                    </span>

                    <button
                        onclick="updateOrder('${p.Nama}',1)"
                        ${isHabis ? 'disabled' : ''}
                    >
                        +
                    </button>

                </div>

            `}

        </div>
        `;
    }).join('');
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

        console.log(data);

        allProducts = data;

        console.log("Jumlah produk:", allProducts.length);

        renderCategories();
        renderProducts(allProducts);

    } catch (err) {
        console.error(err);
    }
}
// 4. FUNGSI KERANJANG & MODAL (Sama seperti punya Anda)
function updateOrder(nama, change) {

    const prod = allProducts.find(p => p.Nama === nama);

    if (!prod) return;


    const stok = Number(prod.Stok) || 0;


    // stok kosong
    if (stok <= 0) {
        alert("Produk sedang habis.");
        return;
    }


    if (!cart[nama]) {
        cart[nama] = 0;
    }


    cart[nama] += change;


    if (cart[nama] < 0) {
        cart[nama] = 0;
    }


    // batas stok
    if (cart[nama] > stok) {

        cart[nama] = stok;

        alert("Jumlah melebihi stok tersedia.");

    }


    // simpan cart
    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );


    const qty = document.getElementById(`qty-${nama}`);

    if(qty){
        qty.innerText = cart[nama];
    }


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
                total += Number(prod.HargaFinal) * qty;
                count += qty;
            }
        }
    }
    if (cartItemsDiv) {
    cartItemsDiv.innerHTML = html || '<p>Keranjang kosong</p>';
}

const resetButton = document.getElementById("reset-cart-btn");

if (resetButton) {

    resetButton.style.display =
        count > 0 ? "block" : "none";

}
    if (document.getElementById('cart-total')) document.getElementById('cart-total').innerText = 'Total: Rp ' + total.toLocaleString();
    if (cartCount) {

    cartCount.innerText = count;


    cartCount.classList.remove(
        "cart-bounce"
    );

    void cartCount.offsetWidth;


    if(count > 0){

        cartCount.classList.add(
            "cart-bounce"
        );

    }

}



const cartIcon =
document.querySelector(".cart-icon");


if(cartIcon && count > 0){

    cartIcon.classList.remove(
        "cart-shake"
    );

    void cartIcon.offsetWidth;


    cartIcon.classList.add(
        "cart-shake"
    );

}


const cartIcon = document.querySelector(".cart-icon");

if(cartIcon && count > 0){

    cartIcon.classList.remove("cart-shake");

    void cartIcon.offsetWidth;

    cartIcon.classList.add("cart-shake");

}
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

    const search = document.getElementById("search");

    if (search) {
        search.addEventListener("input", function () {
            const keyword = this.value.toLowerCase();

            renderProducts(
                allProducts.filter(p =>
                    p.Nama.toLowerCase().includes(keyword)
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

    if(confirm("Hapus semua pesanan?")){


        cart = {};


        localStorage.removeItem(
            "cart"
        );


        updateCartUI();


        renderProducts(
            allProducts
        );

    }

}
