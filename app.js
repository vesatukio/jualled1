const API = "https://script.google.com/macros/s/AKfycbxO1ItQclyBRHKSRso9yDL7WMLowhP1cJHXNtXXEiA8uiBrZnBVYW_fq__nGCcCSES4/exec";
let products = [];
let cart = [];

// 1. Inisialisasi: Load data & Cart
loadProducts();
const saved = localStorage.getItem("duta_cart");
if (saved) {
    cart = JSON.parse(saved);
    updateCart();
}

async function loadProducts() {
    try {
        const res = await fetch(API);
        products = await res.json();
        renderProducts(products);
    } catch (e) {
        console.error("Gagal memuat produk:", e);
    }
}

// 2. Render Produk dengan logika Stok & Tombol
function renderProducts(data) {
    const container = document.getElementById("products");
    container.innerHTML = "";
    data.forEach((p, index) => {
        const harga = Number(p.Harga || p[" Harga"] || 0);
        const diskon = Number(p.Diskon || p[" Diskon"] || 0);
        const stok = Number(p.Stok || p[" Stok"] || 0);
        const isHabis = stok <= 0;

        const buttonHTML = isHabis 
            ? `<button class="order-btn" style="background:#999; cursor:not-allowed;" disabled>Stok Habis</button>`
            : `<button class="order-btn" onclick="addCart(${index})">📞 Klik Order</button>`;

        container.innerHTML += `
            <div class="card">
                <div class="badge">-${diskon}%</div>
                <img class="slider" loading="lazy" src="${p.gambar1}">
                <div class="nama">${p.Barang}</div>
                <div class="kategori">${p.Kategori}</div>
                <div class="price-old">Rp ${harga.toLocaleString("id-ID")}</div>
                <div class="price">Rp ${Math.round(harga - (harga * diskon / 100)).toLocaleString("id-ID")}</div>
                <div class="stock" style="color: ${isHabis ? 'red' : '#666'}">Stok : ${isHabis ? 'Habis' : stok}</div>
                <div class="qty">
                    <button onclick="minus(${index})">-</button>
                    <input id="qty${index}" value="1" readonly>
                    <button onclick="plus(${index})">+</button>
                </div>
                ${buttonHTML}
            </div>`;
    });
}

// 3. Fungsi Keranjang
function plus(id) { let qty = document.getElementById("qty" + id); qty.value = parseInt(qty.value) + 1; }
function minus(id) { let qty = document.getElementById("qty" + id); if (parseInt(qty.value) > 1) qty.value = parseInt(qty.value) - 1; }

function addCart(index) {
    const qty = parseInt(document.getElementById("qty" + index).value);
    const stok = Number(products[index].Stok || products[index][" Stok"] || 0);
    
    if (qty <= stok) {
        for (let i = 0; i < qty; i++) cart.push(products[index]);
        updateCart();
        localStorage.setItem("duta_cart", JSON.stringify(cart));
        alert("Ditambahkan ke keranjang!");
    } else {
        alert("Stok tidak cukup!");
    }
}

function updateCart() {
    let total = 0;
    cart.forEach(item => {
        const h = Number(item.Harga || item["Harga"] || 0);
        const d = Number(item.Diskon || item["Diskon"] || 0);
        total += (h - (h * d / 100));
    });
    if (document.getElementById("cartCount")) document.getElementById("cartCount").innerText = cart.length;
    if (document.getElementById("total")) document.getElementById("total").innerText = "Rp " + Math.round(total).toLocaleString("id-ID");
}

function resetCart() {
    if (confirm('Hapus semua isi keranjang?')) {
        cart = [];
        localStorage.removeItem("duta_cart");
        updateCart();
    }
}

// 4. Submit Order
async function submitOrder() {
    if (cart.length === 0) return alert("Keranjang kosong!");
    const nama = document.getElementById('nama').value;
    const wa = document.getElementById('wa').value;
    const alamat = document.getElementById('alamat').value;

    if (!nama || !wa || !alamat) return alert("Lengkapi data!");

    const groupedOrders = cart.reduce((acc, item) => {
        acc[item.Barang] = (acc[item.Barang] || 0) + 1;
        return acc;
    }, {});

    const payload = {
        action: "order",
        nama, wa, alamat,
        produk: Object.entries(groupedOrders).map(([n, j]) => `${n} (${j}x)`).join(", "),
        harga: document.getElementById("total").innerText,
        qty: cart.length
    };

    alert("Mengirim...");
    try {
        await fetch(API, { method: "POST", mode: "no-cors", body: JSON.stringify(payload) });
        alert("Pesanan berhasil!");
        cart = [];
        localStorage.removeItem("duta_cart");
        updateCart();
        document.getElementById('checkout-form').close();
    } catch (e) {
        alert("Gagal terhubung.");
    }
}
