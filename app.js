// ==========================================
// 1. REGISTRASI SERVICE WORKER & PWA INSTALL
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW terdaftar:', reg.scope))
            .catch(err => console.log('SW gagal:', err));
    });
}

let deferredPrompt;
const banner = document.getElementById('pwa-install-banner');
const btnInstall = document.getElementById('btnInstall');
const btnClose = document.getElementById('btnClose');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (banner && localStorage.getItem('pwa-install-closed') !== 'true') {
        banner.style.display = 'block';
    }
});

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

if (btnClose) {
    btnClose.addEventListener('click', () => {
        if (banner) banner.style.display = 'none';
        localStorage.setItem('pwa-install-closed', 'true');
    });
}

// ==========================================
// 2. KONFIGURASI DATA & MODUL UTAMA
// ==========================================
const API = "https://script.google.com/macros/s/AKfycbxO1ItQclyBRHKSRso9yDL7WMLowhP1cJHXNtXXEiA8uiBrZnBVYW_fq__nGCcCSES4/exec";
let products = [];
let cart = JSON.parse(localStorage.getItem("duta_cart") || "[]");

// Deteksi Mode Admin (?admin=true)
const urlParams = new URLSearchParams(window.location.search);
const isAdmin = urlParams.get('admin') === 'true';

// Jalankan inisialisasi aplikasi
loadProducts();
updateCart();

async function loadProducts() {
    try {
        const res = await fetch(API);
        products = await res.json();
        setupCategories(products);
        renderProducts(products);
    } catch (e) {
        console.error("Gagal memuat data produk:", e);
    }
}

function calculateProductPrice(p) {
    // Kita cek semua variasi penulisan yang mungkin ada di data JSON Anda
    const pokok = Number(
        p.HargaPokok || 
        p["HargaPokok"] || 
        p["harga pokok"] || 
        p["Harga Pokok"] || 0
    );

    const tambahan = Number(
        p.HargaTambahan || 
        p["HargaTambahan"] || 
        p["harga tambahan"] || 
        p["Harga Tambahan"] || 0
    );

    const diskon = Number(p.Diskon || p[" Diskon"] || p["Diskon"] || 0);
    const modalTotal = pokok + tambahan;

    // Debugging: Buka Inspect Element > Console untuk melihat apa yang terbaca
    console.log("Barang:", p.Barang, "| Pokok Terbaca:", pokok, "| Tambahan Terbaca:", tambahan);

    let hargaDasar = Number(p.Harga || p[" Harga"] || p["Harga"] || 0);
    
    // RUMUS OTOMATIS: Gunakan modal jika tersedia
    if (modalTotal > 0) {
        hargaDasar = modalTotal * 1.20; 
    }

    const hargaFinal = Math.round(hargaDasar - (hargaDasar * diskon / 100));
    const isRugi = modalTotal > 0 && hargaFinal < modalTotal;

    return { hargaDasar, hargaFinal, modalTotal, diskon, isRugi };
}

// ==========================================
// 4. RENDERING & FILTERING KATALOG
// ==========================================
function renderProducts(data) {
    const container = document.getElementById("products");
    if (!container) return;

    container.innerHTML = data.map((p, index) => {
        const stok = Number(p.Stok || p[" Stok"] || p["Stok"] || 0);
        const isHabis = stok <= 0;
        
        // Dapatkan kalkulasi harga terpadu
        const infoHarga = calculateProductPrice(p);

        // Render Tampilan Admin khusus jika link mengandung ?admin=true
        const adminSection = isAdmin ? `
            <div style="background:#fff3cd; padding:6px; font-size:11px; border:1px solid #ffeeba; margin-bottom:8px; border-radius:5px; text-align:left; color:#333;">
                <strong>Admin Info:</strong><br>
                • Modal: Rp ${infoHarga.modalTotal.toLocaleString("id-ID")}<br>
                • Untung Bersih: <span style="color:${infoHarga.hargaFinal - infoHarga.modalTotal > 0 ? 'green' : 'red'}; font-weight:bold;">
                    Rp ${(infoHarga.hargaFinal - infoHarga.modalTotal).toLocaleString("id-ID")}
                </span>
            </div>` : '';

        // Tampilan label diskon jika ada diskon
        const diskonBadge = infoHarga.diskon > 0 ? `<div class="badge">-${infoHarga.diskon}%</div>` : '';
        
        // Tampilan harga coret (lama) jika ada diskon
        const oldPriceDisplay = infoHarga.diskon > 0 ? `<div class="price-old">Rp ${infoHarga.hargaDasar.toLocaleString("id-ID")}</div>` : '';

        // Proteksi peringatan teks jika set harga rugi/di bawah modal
        const priceDisplay = infoHarga.isRugi 
            ? `<div style="color:red; font-weight:bold; font-size:14px; margin: 4px 0;">⚠️ HARGA RUGI: Rp ${infoHarga.hargaFinal.toLocaleString("id-ID")}</div>`
            : `<div class="price">Rp ${infoHarga.hargaFinal.toLocaleString("id-ID")}</div>`;

        return `
            <div class="card">
                ${diskonBadge}
                ${adminSection}
                <img class="slider" loading="lazy" src="${p.gambar1}" alt="${p.Barang}">
                <div class="nama">${p.Barang}</div>
                ${oldPriceDisplay}
                ${priceDisplay}
                <div class="stock" style="color: ${isHabis ? 'red' : '#666'}">Stok: ${isHabis ? 'Habis' : stok}</div>
                
                <div class="qty">
                    <button onclick="changeQty(${index}, -1)">-</button>
                    <input id="qty${index}" value="1" readonly>
                    <button onclick="changeQty(${index}, 1)">+</button>
                </div>
                
                ${isHabis 
                    ? `<button class="order-btn" style="background:#999" disabled>Stok Habis</button>` 
                    : `<button class="order-btn" onclick="addCart(${index})">📞 Klik Order</button>`
                }
            </div>`;
    }).join("");
}

function changeQty(index, delta) {
    let input = document.getElementById("qty" + index);
    if (input) {
        let val = parseInt(input.value) + delta;
        if (val >= 1) input.value = val;
    }
}

// ==========================================
// 5. MANAJEMEN KERANJANG & DASHBOARD ADMIN
// ==========================================
function addCart(index) {
    const qtyInput = document.getElementById("qty" + index);
    const qty = qtyInput ? parseInt(qtyInput.value) : 1;
    const stok = Number(products[index].Stok || products[index][" Stok"] || 0);
    
    if (qty <= stok) {
        for (let i = 0; i < qty; i++) {
            cart.push(products[index]);
        }
        updateCart();
        localStorage.setItem("duta_cart", JSON.stringify(cart));
        alert("Produk berhasil ditambahkan ke keranjang!");
    } else {
        alert("Stok tidak mencukupi!");
    }
}

function updateCart() {
    let total = cart.reduce((sum, item) => {
        const infoHarga = calculateProductPrice(item);
        return sum + infoHarga.hargaFinal;
    }, 0);
    
    const countEl = document.getElementById("cartCount");
    const totalEl = document.getElementById("total");
    
    if (countEl) countEl.innerText = cart.length;
    if (totalEl) totalEl.innerText = "Rp " + Math.round(total).toLocaleString("id-ID");
}

function resetCart() {
    if (confirm("Kosongkan keranjang belanjaan?")) {
        cart = [];
        localStorage.removeItem("duta_cart");
        updateCart();
    }
}

function showAdminDashboard() {
    if (!isAdmin) return;

    let totalOmzet = 0;
    let totalModal = 0;

    cart.forEach(item => {
        const infoHarga = calculateProductPrice(item);
        totalOmzet += infoHarga.hargaFinal;
        totalModal += infoHarga.modalTotal;
    });

    const totalProfit = totalOmzet - totalModal;

    alert(`📊 REKAP KEUNTUNGAN (DARI KERANJANG)
-----------------------------------
Total Omzet  : Rp ${totalOmzet.toLocaleString("id-ID")}
Total Modal  : Rp ${totalModal.toLocaleString("id-ID")}
-----------------------------------
Margin Bersih : Rp ${totalProfit.toLocaleString("id-ID")}
Status       : ${totalProfit >= 0 ? 'Untung OKE ✅' : 'Rugi/Minus Untung ⚠️'}`);
}

// ==========================================
// 6. SISTEM PENGIRIMAN ORDER (WHATSAPP AUTOMATION)
// ==========================================
async function submitOrder() {
    if (cart.length === 0) return alert("Keranjang belanja Anda masih kosong!");
    
    const nama = document.getElementById('nama').value.trim();
    const wa = document.getElementById('wa').value.trim();
    const alamat = document.getElementById('alamat').value.trim();
    
    if (!nama || !wa || !alamat) {
        return alert("Mohon lengkapi Data Pembeli terlebih dahulu!");
    }

    // Kelompokkan item kembar untuk memadatkan pesan ringkas teks teks
    const itemMap = {};
    let totalSeluruhnya = 0;

    cart.forEach(item => {
        const infoHarga = calculateProductPrice(item);
        if (itemMap[item.Barang]) {
            itemMap[item.Barang].qty += 1;
            itemMap[item.Barang].subtotal += infoHarga.hargaFinal;
        } else {
            itemMap[item.Barang] = {
                qty: 1,
                hargaSatuan: infoHarga.hargaFinal,
                subtotal: infoHarga.hargaFinal
            };
        }
        totalSeluruhnya += infoHarga.hargaFinal;
    });

    // Format susunan teks pesan rapi untuk dikirim ke nomor WhatsApp Anda
    let textMessage = `*ORDER BARU - DUTAKITA ELECTRONIC*\n`;
    textMessage += `-------------------------------------------\n`;
    textMessage += `👤 *Nama:* ${nama}\n`;
    textMessage += `📱 *WhatsApp:* ${wa}\n`;
    textMessage += `📍 *Alamat:* ${alamat}\n`;
    textMessage += `-------------------------------------------\n`;
    textMessage += `📦 *Daftar Belanja:*\n`;

    for (const [namaBarang, detail] of Object.entries(itemMap)) {
        textMessage += `- ${namaBarang} (${detail.qty}x) @Rp ${detail.hargaSatuan.toLocaleString("id-ID")} = Rp ${detail.subtotal.toLocaleString("id-ID")}\n`;
    }

    textMessage += `-------------------------------------------\n`;
    textMessage += `💰 *Total Pembayaran:* *Rp ${totalSeluruhnya.toLocaleString("id-ID")}*\n\n`;
    textMessage += `Mohon segera diproses ya, terima kasih! 🙏`;

    // Kirim data payload transaksi cadangan ke Google Sheets Backend
    const payload = {
        action: "order",
        nama: nama,
        wa: wa,
        alamat: alamat,
        total_belanja: "Rp " + totalSeluruhnya.toLocaleString("id-ID")
    };

    try {
        // Jalankan POST paralel ke sistem Google Apps Script Anda
        fetch(API, {
            method: "POST",
            body: JSON.stringify(payload)
        });
    } catch(err) {
        console.log("Catatan log spreadsheet terlewati:", err);
    }

    // Direct langsung lempar otomatis buka aplikasi WhatsApp
    const nomorToko = "6283157925577"; // Ganti dengan nomor WhatsApp aktif toko Anda (Gunakan kode negara 62 di depan)
    const urlWA = `https://api.whatsapp.com/send?phone=${nomorToko}&text=${encodeURIComponent(textMessage)}`;
    
    // Reset status aplikasi dan bersihkan keranjang setelah checkout sukses
    cart = [];
    localStorage.removeItem("duta_cart");
    updateCart();
    document.getElementById('checkout-form').close();
    
    window.open(urlWA, '_blank');
}

// ==========================================
// 7. SISTEM KATEGORI & PENCARIAN
// ==========================================
function setupCategories(data) {
    const container = document.getElementById("categoryFilter");
    if (!container) return;
    const cats = ["Semua", ...new Set(data.map(p => (p.Kategori || "").trim() || "Lainnya"))];
    container.innerHTML = cats.map(c => `<button onclick="filterProduct('${c}')">${c}</button>`).join("");
}

function filterProduct(kategori) {
    // Berikan efek highlight aktif pada tombol filter
    const buttons = document.querySelectorAll("#categoryFilter button");
    buttons.forEach(btn => {
        if (btn.innerText === kategori) btn.classList.add("active");
        else btn.classList.remove("active");
    });

    renderProducts(kategori === 'Semua' ? products : products.filter(p => (p.Kategori || "").trim() === kategori));
}

function searchProduct() {
    const val = document.getElementById('search').value.toLowerCase();
    renderProducts(products.filter(p => (p.Barang || "").toLowerCase().includes(val)));
}
// Tambahkan fungsi ini di app.js untuk mengatur tombol saat mode admin aktif
window.addEventListener('load', () => {
    const btnAdmin = document.getElementById('btn-admin-login');
    if (isAdmin && btnAdmin) {
        btnAdmin.innerText = "❌ Keluar Admin";
        btnAdmin.style.background = "#d9534f";
        btnAdmin.onclick = () => {
            window.location.href = window.location.pathname; // Kembali ke tampilan biasa
        };
    }
});
