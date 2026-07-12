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

// ==========================================
// 2. KONFIGURASI SUPABASE & MODUL UTAMA
// ==========================================
const supabase = supabase.createClient(
    'https://opgeeqnucxrdqcgwcuge.supabase.co', 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZ2VlcW51Y3hyZHFjZ3djdWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMTgzODAsImV4cCI6MjA5NDU5NDM4MH0.yT10QOFErxHbTL8X-QOUQ8EydcJuLpStCbd8ucfTJr8'
);

let products = [];
let cart = JSON.parse(localStorage.getItem("duta_cart") || "[]");

const urlParams = new URLSearchParams(window.location.search);
const isAdmin = urlParams.get('admin') === 'true';

loadProducts();
updateCart();

async function loadProducts() {
    try {
        const { data, error } = await supabase
            .from('datadutaled')
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
    const hargaJual = Number(p.HargaJual || p.Harga || 0); 
    const modalTotal = Number(p.HargaPokok || 0);
    const diskon = Number(p.Diskon || 0);
    const hargaFinal = Math.round(hargaJual - (hargaJual * diskon / 100));

    return { hargaDasar: hargaJual, hargaFinal: hargaFinal, modalTotal: modalTotal, diskon: diskon };
}

// ==========================================
// 4. RENDERING & FILTERING
// ==========================================
function renderProducts(data) {
    const container = document.getElementById("products");
    if (!container) return;

    container.innerHTML = data.map((p, index) => {
        const stok = Number(p.Stok || 0);
        const isHabis = stok <= 0;
        const infoHarga = calculateProductPrice(p);

        const adminSection = isAdmin ? `
            <div style="background:#fff3cd; padding:8px; border:1px solid #ffeeba; margin-bottom:8px; border-radius:5px; text-align:center; font-size:12px;">
                <strong>Admin: Edit Data</strong><br>
                <button onclick="updateStokManual(${index}, -1)" style="background:#d9534f; color:white; border:none; padding:5px 10px; cursor:pointer;">-1</button>
                <button onclick="updateStokManual(${index}, 1)" style="background:#5cb85c; color:white; border:none; padding:5px 10px; cursor:pointer;">+1</button>
                <button onclick="updateStok(${index})" style="background:#337ab7; color:white; border:none; padding:5px 10px; cursor:pointer;">Set Stok</button>
                <button onclick="promptEditHarga(${index})" style="background:#f0ad4e; color:white; border:none; padding:5px 10px; cursor:pointer;">Edit Harga</button>
            </div>` : '';

        return `
            <div class="card">
                ${adminSection}
                <img class="slider" loading="lazy" src="${p.gambar1}" alt="${p.Barang}">
                <div class="nama">${p.Barang}</div>
                <div class="price">Rp ${infoHarga.hargaFinal.toLocaleString("id-ID")}</div>
                <div class="stock">Stok: ${isHabis ? 'Habis' : stok}</div>
                <button class="order-btn" ${isHabis ? 'disabled style="background:#999"' : 'onclick="addCart('+index+')" '}>
                    ${isHabis ? 'Stok Habis' : '📞 Klik Order'}
                </button>
            </div>`;
    }).join("");
}

// ==========================================
// 5. FUNGSI DATABASE SUPABASE
// ==========================================
async function updateStokSupabase(id, newStok) {
    const { error } = await supabase.from('datadutaled').update({ Stok: newStok }).eq('ID', id);
    if (error) alert("Gagal update stok: " + error.message);
    else { await loadProducts(); alert("Stok berhasil diperbarui!"); }
}

async function updateHargaSupabase(id, newHarga) {
    const { error } = await supabase.from('datadutaled').update({ HargaJual: newHarga }).eq('ID', id);
    if (error) alert("Gagal update harga: " + error.message);
    else { await loadProducts(); alert("Harga berhasil diperbarui!"); }
}

function updateStok(index) {
    const p = products[index];
    const val = prompt("Masukkan jumlah stok baru:", p.Stok);
    if (val !== null) updateStokSupabase(p.ID, Number(val));
}

function updateStokManual(index, change) {
    const p = products[index];
    updateStokSupabase(p.ID, Number(p.Stok) + change);
}

function promptEditHarga(index) {
    const p = products[index];
    const val = prompt("Masukkan harga baru:", p.HargaJual);
    if (val !== null) updateHargaSupabase(p.ID, Number(val));
}

// ==========================================
// 6. KERANJANG & LAINNYA
// ==========================================
function addCart(index) {
    cart.push(products[index]);
    localStorage.setItem("duta_cart", JSON.stringify(cart));
    alert("Ditambahkan ke keranjang!");
    updateCart();
}

function updateCart() {
    const countEl = document.getElementById("cartCount");
    if (countEl) countEl.innerText = cart.length;
}

window.addEventListener('load', () => {
    const btnAdmin = document.getElementById('btn-admin-login');
    if (isAdmin && btnAdmin) {
        btnAdmin.innerText = "❌ Keluar Admin";
        btnAdmin.onclick = () => window.location.href = window.location.pathname;
    }
});
