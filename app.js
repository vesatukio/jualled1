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
        
        // Panggil fungsi untuk mengisi menu kategori
        setupCategories(products); 
        
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
// 4. Submit Order (VERSI RAPI)
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

    // Hitung total belanjaan murni (angka)
    const totalBelanja = cart.reduce((sum, item) => {
        const h = Number(item.Harga || item["Harga"] || 0);
        const d = Number(item.Diskon || item["Diskon"] || 0);
        return sum + (h - (h * d / 100));
    }, 0);

    // Payload yang disesuaikan untuk kolom F (harga_satuan) dan H (total_belanja)
    const payload = {
        action: "order",
        nama, wa, alamat,
        produk: Object.entries(groupedOrders).map(([n, j]) => `${n} (${j}x)`).join(", "),
        harga_satuan: document.getElementById("total").innerText.replace(/[^0-9]/g, ""), 
        total_belanja: Math.round(totalBelanja), 
        qty: cart.length
    };

    alert("Mengirim...");
    try {
        await fetch(API, { 
            method: "POST", 
            mode: "no-cors", 
            body: JSON.stringify(payload) 
        });
        alert("Pesanan berhasil!");
        cart = [];
        localStorage.removeItem("duta_cart");
        updateCart();
        document.getElementById('checkout-form').close();
    } catch (e) {
        alert("Gagal terhubung.");
    }
}
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
// Panggil fungsi ini setelah data berhasil dimuat di loadProducts()
function setupCategories(data) {
    const container = document.getElementById("categoryFilter");
    if (!container) return; // Mencegah error jika div tidak ditemukan

    // Mengambil kategori unik dan membersihkan spasi tambahan
    const categories = ["Semua", ...new Set(data.map(p => (p.Kategori || "").trim() || "Lainnya"))];
    
    container.innerHTML = categories.map(cat => 
        `<button onclick="filterProduct('${cat}')" class="${cat === 'Semua' ? 'active' : ''}">${cat}</button>`
    ).join("");
}

// Fungsi untuk memfilter produk
function filterProduct(kategori) {
    const filtered = kategori === 'Semua' 
        ? products 
        : products.filter(p => (p.Kategori || "").trim() === kategori);
    
    renderProducts(filtered);
    
    // Update tombol aktif
    document.querySelectorAll('.category-filter button').forEach(btn => {
        btn.classList.toggle('active', btn.innerText === kategori);
    });
}
// app.js

function searchProduct() {
    // 1. Ambil input
    let input = document.getElementById('search').value.toLowerCase();
    
    // 2. Filter data dari array 'products' yang sudah dimuat
    let filtered = products.filter(p => {
        // Pastikan nama barang tidak null sebelum melakukan toLowerCase
        const namaBarang = (p.Barang || "").toLowerCase();
        return namaBarang.includes(input);
    });
    
    // 3. Render ulang tampilan dengan hasil filter
    renderProducts(filtered);
    
    // 4. (Opsional) Hapus class 'active' dari semua tombol kategori 
    // agar tampilan bersih saat sedang mencari
    document.querySelectorAll('.category-filter button').forEach(btn => {
        btn.classList.remove('active');
    });
}
