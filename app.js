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
// 2. KONFIGURASI DATA & MODUL UTAMA (SUPABASE)
// ==========================================
// Pastikan script supabase-js sudah dimuat di HTML Anda
const supabase = supabase.createClient(
    'https://opgeeqnucxrdqcgwcuge.supabase.co', 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZ2VlcW51Y3hyZHFjZ3djdWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMTgzODAsImV4cCI6MjA5NDU5NDM4MH0.yT10QOFErxHbTL8X-QOUQ8EydcJuLpStCbd8ucfTJr8' // Ganti dengan anon key dari Project Settings > API
);

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
        // 'products' adalah nama tabel Anda di Supabase
        const { data, error } = await supabase
            .from('products')
            .select('*'); 

        if (error) throw error;

        products = data;
        setupCategories(products);
        renderProducts(products);
    } catch (e) {
        console.error("Gagal memuat dari Supabase:", e);
    }
}

function calculateProductPrice(p) {
    // LANGSUNG ambil dari kolom D (HargaJual) di Spreadsheet
    const hargaJual = Number(p.HargaJual || p.Harga || 0); 
    
    // Ambil HargaPokok (Kolom G) untuk info modal
    const modalTotal = Number(p.HargaPokok || 0);
    
    // Ambil Diskon (Kolom E)
    const diskon = Number(p.Diskon || 0);

    // Hitung harga setelah diskon
    const hargaFinal = Math.round(hargaJual - (hargaJual * diskon / 100));

    return { 
        hargaDasar: hargaJual, 
        hargaFinal: hargaFinal, 
        modalTotal: modalTotal, 
        diskon: diskon 
    };
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

        // Tampilan Admin (Hanya muncul jika ?admin=true)
        const adminSection = isAdmin ? `
            <div style="background:#fff3cd; padding:8px; border:1px solid #ffeeba; margin-bottom:8px; border-radius:5px; text-align:center; font-size:12px;">
                <strong style="display:block; margin-bottom:5px;">Admin: Info Harga</strong>
                • Modal: Rp ${infoHarga.modalTotal.toLocaleString("id-ID")}<br>
                • Untung: <span style="color:${infoHarga.hargaFinal - infoHarga.modalTotal > 0 ? 'green' : 'red'}; font-weight:bold;">
                    Rp ${(infoHarga.hargaFinal - infoHarga.modalTotal).toLocaleString("id-ID")}
                </span>
                <hr style="margin:8px 0;">
                <div style="font-weight:bold; margin-bottom:5px;">Stok: ${stok}</div>
                <button onclick="updateStokManual(${index}, -1)" style="padding:5px 12px; margin:2px; background:#d9534f; color:white; border:none; border-radius:3px; cursor:pointer;">-1</button>
                <button onclick="updateStokManual(${index}, 1)" style="padding:5px 12px; margin:2px; background:#5cb85c; color:white; border:none; border-radius:3px; cursor:pointer;">+1</button>
                <button onclick="updateStok(${index})" style="padding:5px 8px; margin:2px; background:#337ab7; color:white; border:none; border-radius:3px; cursor:pointer;">Set</button>
            </div>` : '';

        const diskonBadge = infoHarga.diskon > 0 ? `<div class="badge">-${infoHarga.diskon}%</div>` : '';
        const oldPriceDisplay = infoHarga.diskon > 0 ? `<div class="price-old">Rp ${infoHarga.hargaDasar.toLocaleString("id-ID")}</div>` : '';
        const priceDisplay = infoHarga.isRugi 
            ? `<div style="color:red; font-weight:bold; font-size:14px; margin: 4px 0;">⚠️ RUGI: Rp ${infoHarga.hargaFinal.toLocaleString("id-ID")}</div>`
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
async function updateStokSupabase(id, newStok) {
    const { data, error } = await supabase
        .from('products')
        .update({ Stok: newStok })
        .eq('ID', id); // Pastikan kolom di Supabase bernama 'ID'

    if (error) {
        console.error("Error:", error);
        alert("Gagal update ke database!");
    } else {
        // Refresh data setelah berhasil
        await loadProducts();
        alert("Stok berhasil diupdate!");
    }
}

function updateStok(index) {
    const p = products[index];
    const newStok = prompt(`Masukkan jumlah stok baru untuk ${p.Barang}:`, p.Stok);
    
    if (newStok !== null && !isNaN(newStok)) {
        // 1. Update data di array lokal
        products[index].Stok = Number(newStok);
        renderProducts(products);
        
        // 2. Kirim ke Google Sheets di background
        fetch(API, {
            method: "POST",
            body: JSON.stringify({ action: "updateStok", ID: p.ID, Stok: Number(newStok) })
        }).catch(err => {
            alert("Gagal sync ke server!");
            location.reload(); 
        });
    } else if (newStok !== null) {
        alert("Mohon masukkan angka yang valid!");
    }
}
// Di dalam file app.js Anda
function handleUpdateStok(index, stokLama) {
    let val = prompt("Masukkan jumlah stok baru:", stokLama);
    
    if (val !== null && val !== "") {
        console.log("Menyimpan ke server...");
        google.script.run
            .withSuccessHandler(function() {
                alert("Stok berhasil diupdate!");
                // Pastikan fungsi ini ada di app.js untuk refresh data
                loadDataFromSheet(); 
            })
            .withFailureHandler(function(err) {
                alert("Gagal update: " + err);
            })
            .updateStokManual(index, parseInt(val));
    }
}
