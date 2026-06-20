const API = "https://script.google.com/macros/s/AKfycbxO1ItQclyBRHKSRso9yDL7WMLowhP1cJHXNtXXEiA8uiBrZnBVYW_fq__nGCcCSES4/exec";
let products = [];
let cart = [];

// Load data saat halaman dibuka
loadProducts();

async function loadProducts() {
    try {
        const res = await fetch(API);
        products = await res.json();
        renderProducts(products);
    } catch (e) {
        console.error("Gagal memuat produk:", e);
    }
}

function renderProducts(data) {
    const container = document.getElementById("products");
    container.innerHTML = "";
    
    data.forEach((p, index) => {
        const harga = Number(p.Harga || p[" Harga"] || 0);
        const diskon = Number(p.Diskon || p[" Diskon"] || 0);
        const stok = Number(p.Stok || p[" Stok"] || 0);
        const finalPrice = Math.round(harga - (harga * diskon / 100));
        
        const isHabis = stok <= 0;

        // Kita buat tombol sebagai variabel terpisah agar rapi
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
                <div class="price">Rp ${finalPrice.toLocaleString("id-ID")}</div>
                <div class="stock" style="color: ${isHabis ? 'red' : '#666'}">
                    Stok : ${isHabis ? 'Habis' : stok}
                </div>
                <div class="qty">
                    <button onclick="minus(${index})">-</button>
                    <input id="qty${index}" value="1" readonly>
                    <button onclick="plus(${index})">+</button>
                </div>
                ${buttonHTML}
            </div>`;
    });
}

function plus(id) {
    let qty = document.getElementById("qty" + id);
    qty.value = parseInt(qty.value) + 1;
}

function minus(id) {
    let qty = document.getElementById("qty" + id);
    if (parseInt(qty.value) > 1) qty.value = parseInt(qty.value) - 1;
}

function addCart(index) {
    const qty = parseInt(document.getElementById("qty" + index).value);
    for (let i = 0; i < qty; i++) {
        cart.push(products[index]);
    }
    updateCart();
    localStorage.setItem("duta_cart", JSON.stringify(cart));
}

function updateCart() {
    let total = 0;
    cart.forEach(item => {
        const harga = Number(item.Harga);
        const diskon = Number(item.Diskon);
        total += (harga - (harga * diskon / 100));
    });

    if (document.getElementById("cartCount")) document.getElementById("cartCount").innerText = cart.length;
    if (document.getElementById("total")) document.getElementById("total").innerText = "Rp " + Math.round(total).toLocaleString("id-ID");
}

function resetCart() {
    if (confirm('Hapus semua isi keranjang?')) {
        cart = [];
        localStorage.removeItem("duta_cart");
        updateCart();
        alert('Keranjang berhasil dikosongkan.');
    }
}

async function submitOrder() {
    if (cart.length === 0) return alert("Keranjang kosong!");
    
    const nama = document.getElementById('nama').value;
    const wa = document.getElementById('wa').value;
    const alamat = document.getElementById('alamat').value;

    if (!nama || !wa || !alamat) return alert("Lengkapi data Nama, WA, dan Alamat!");

    // Mengelompokkan item yang sama: "Nama Produk (Jumlahx)"
    const groupedOrders = cart.reduce((acc, item) => {
        acc[item.Barang] = (acc[item.Barang] || 0) + 1;
        return acc;
    }, {});

    const orderString = Object.entries(groupedOrders)
        .map(([nama, jumlah]) => `${nama} (${jumlah}x)`)
        .join(", ");

    const payload = {
        action: "order",
        nama: nama,
        wa: wa,
        alamat: alamat,
        produk: orderString,
        harga: cart.reduce((total, item) => total + Number(item.Harga), 0),
        qty: cart.length
    };

    alert("Mengirim pesanan...");

    try {
        await fetch(API, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify(payload)
        });
        
        alert("Pesanan berhasil dikirim!");
        cart = [];
        localStorage.removeItem("duta_cart");
        updateCart();
        document.getElementById('checkout-form').close();
    } catch (error) {
        console.error(error);
        alert("Gagal terhubung ke server.");
    }
}

// Inisialisasi awal
const saved = localStorage.getItem("duta_cart");
if (saved) {
    cart = JSON.parse(saved);
    updateCart();
}
// Di dalam loop renderProducts:
const stok = Number(p.Stok || p[" Stok"] || 0);
const isHabis = stok <= 0;

// ... pada bagian tombol:
<button 
    class="order-btn" 
    onclick="addCart(${index})" 
    ${isHabis ? 'disabled style="background:gray; cursor:not-allowed;"' : ''}>
    ${isHabis ? 'Stok Habis' : '📞 Klik Order'}
</button>
