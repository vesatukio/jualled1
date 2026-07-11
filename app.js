// 1. Registrasi Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW terdaftar:', reg.scope))
            .catch(err => console.log('SW gagal:', err));
    });
}

// 2. Logika PWA Install dengan proteksi elemen
let deferredPrompt;
const banner = document.getElementById('pwa-install-banner');
const btnInstall = document.getElementById('btnInstall');
const btnClose = document.getElementById('btnClose');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Cek apakah banner ada sebelum mengubah display
    if (banner && localStorage.getItem('pwa-install-closed') !== 'true') {
        banner.style.display = 'block';
    }
});

// Aksi klik Install dengan proteksi
if (btnInstall) {
    btnInstall.addEventListener('click', () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User menerima instalasi');
                }
                deferredPrompt = null;
                if (banner) banner.style.display = 'none';
            });
        }
    });
}

// Aksi klik Tutup dengan proteksi
if (btnClose) {
    btnClose.addEventListener('click', () => {
        if (banner) banner.style.display = 'none';
        localStorage.setItem('pwa-install-closed', 'true');
    });
}

// --- 2. DATA & TOKO ---
const API = "https://script.google.com/macros/s/AKfycbxO1ItQclyBRHKSRso9yDL7WMLowhP1cJHXNtXXEiA8uiBrZnBVYW_fq__nGCcCSES4/exec";
let products = [];
let cart = JSON.parse(localStorage.getItem("duta_cart") || "[]");

// Inisialisasi
loadProducts();
updateCart();

async function loadProducts() {
    try {
        const res = await fetch(API);
        products = await res.json();
        setupCategories(products);
        renderProducts(products);
    } catch (e) {
        console.error("Gagal memuat:", e);
    }
}

// --- 3. RENDERING & FILTERING ---
function renderProducts(data) {
    const container = document.getElementById("products");
    container.innerHTML = data.map((p, index) => {
        const harga = Number(p.Harga || p[" Harga"] || 0);
        const diskon = Number(p.Diskon || p[" Diskon"] || 0);
        const stok = Number(p.Stok || p[" Stok"] || 0);
        const isHabis = stok <= 0;
        const hargaFinal = Math.round(harga - (harga * diskon / 100));

        return `
            <div class="card">
                <div class="badge">-${diskon}%</div>
                <img class="slider" loading="lazy" src="${p.gambar1}">
                <div class="nama">${p.Barang}</div>
                <div class="price-old">Rp ${harga.toLocaleString("id-ID")}</div>
                <div class="price">Rp ${hargaFinal.toLocaleString("id-ID")}</div>
                <div class="stock" style="color: ${isHabis ? 'red' : '#666'}">Stok: ${isHabis ? 'Habis' : stok}</div>
                <div class="qty">
                    <button onclick="changeQty(${index}, -1)">-</button>
                    <input id="qty${index}" value="1" readonly>
                    <button onclick="changeQty(${index}, 1)">+</button>
                </div>
                ${isHabis ? `<button class="order-btn" style="background:#999" disabled>Stok Habis</button>` 
                          : `<button class="order-btn" onclick="addCart(${index})">📞 Klik Order</button>`}
            </div>`;
    }).join("");
}

function changeQty(index, delta) {
    let input = document.getElementById("qty" + index);
    let val = parseInt(input.value) + delta;
    if (val >= 1) input.value = val;
}

// --- 4. KERANJANG & ORDER ---
function addCart(index) {
    const qty = parseInt(document.getElementById("qty" + index).value);
    const stok = Number(products[index].Stok || products[index][" Stok"] || 0);
    if (qty <= stok) {
        for (let i = 0; i < qty; i++) cart.push(products[index]);
        updateCart();
        localStorage.setItem("duta_cart", JSON.stringify(cart));
        alert("Ditambahkan!");
    } else {
        alert("Stok tidak cukup!");
    }
}

function updateCart() {
    let total = cart.reduce((sum, item) => {
        const h = Number(item.Harga || item["Harga"] || 0);
        const d = Number(item.Diskon || item["Diskon"] || 0);
        return sum + (h - (h * d / 100));
    }, 0);
    
    document.getElementById("cartCount").innerText = cart.length;
    document.getElementById("total").innerText = "Rp " + Math.round(total).toLocaleString("id-ID");
}

async function submitOrder() {
    if (cart.length === 0) return alert("Keranjang kosong!");
    const payload = {
        action: "order",
        nama: document.getElementById('nama').value,
        wa: document.getElementById('wa').value,
        alamat: document.getElementById('alamat').value,
        total_belanja: document.getElementById("total").innerText
    };
    // ... sisa fungsi fetch post ke Google Sheet
    alert("Mengirim...");
    // Tambahkan logika fetch Anda di sini
}

function setupCategories(data) {
    const container = document.getElementById("categoryFilter");
    if (!container) return;
    const cats = ["Semua", ...new Set(data.map(p => (p.Kategori || "").trim() || "Lainnya"))];
    container.innerHTML = cats.map(c => `<button onclick="filterProduct('${c}')">${c}</button>`).join("");
}

function filterProduct(kategori) {
    renderProducts(kategori === 'Semua' ? products : products.filter(p => (p.Kategori || "").trim() === kategori));
}

function searchProduct() {
    const val = document.getElementById('search').value.toLowerCase();
    renderProducts(products.filter(p => (p.Barang || "").toLowerCase().includes(val)));
}
// Pastikan variabel isAdmin sudah didefinisikan di atas
const urlParams = new URLSearchParams(window.location.search);
const isAdmin = urlParams.get('admin') === 'true';

function renderProducts(data) {
    const container = document.getElementById("products");
    container.innerHTML = data.map((p, index) => {
        // Data dasar
        const hargaJual = Math.round(Number(p.Harga) - (Number(p.Harga) * Number(p.Diskon) / 100));
        
        // Data Admin (Hanya muncul jika ?admin=true)
        const modal = Number(p.HargaPokok || 0) + Number(p.HargaTambahan || 0);
        const margin = hargaJual - modal;
        
        const adminSection = isAdmin ? `
            <div style="background:#fff3cd; padding:8px; font-size:11px; border:1px solid #ffeeba; margin-bottom:5px;">
                <strong>Admin:</strong> Modal Rp${modal.toLocaleString()} | 
                <span style="color:${margin > 0 ? 'green' : 'red'}">Margin Rp${margin.toLocaleString()}</span>
            </div>` : '';

        return `
            <div class="card">
                ${adminSection}
                <img src="${p.gambar1}">
                <div class="nama">${p.Barang}</div>
                <div class="price">Rp ${hargaJual.toLocaleString()}</div>
                <button class="order-btn" onclick="addCart(${index})">📞 Order</button>
            </div>`;
    }).join("");
}
function showAdminDashboard() {
    const totalOmzet = cart.reduce((sum, item) => {
        const h = Number(item.Harga);
        const d = Number(item.Diskon);
        return sum + (h - (h * d / 100));
    }, 0);

    const totalModal = cart.reduce((sum, item) => {
        return sum + (Number(item.HargaPokok || 0) + Number(item.HargaTambahan || 0));
    }, 0);

    alert(`📊 REKAP KEUNTUNGAN
    -----------------------
    Total Omzet : Rp ${totalOmzet.toLocaleString()}
    Total Modal : Rp ${totalModal.toLocaleString()}
    -----------------------
    Bersih      : Rp ${(totalOmzet - totalModal).toLocaleString()}`);
}
