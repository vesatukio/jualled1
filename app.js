// ==========================================
// 1. REGISTRASI SERVICE WORKER
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js');
    });
}

// ==========================================
// 2. KONFIGURASI SUPABASE
// ==========================================
const sbClient = supabase.createClient(
    'https://opgeeqnucxrdqcgwcuge.supabase.co', 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZ2VlcW51Y3hyZHFjZ3djdWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMTgzODAsImV4cCI6MjA5NDU5NDM4MH0.yT10QOFErxHbTL8X-QOUQ8EydcJuLpStCbd8ucfTJr8'
);

let products = [];
let cart = JSON.parse(localStorage.getItem("duta_cart") || "[]");
const isAdmin = new URLSearchParams(window.location.search).get('admin') === 'true';

// Jalankan saat load
loadProducts();
updateCart();

async function loadProducts() {
    const { data, error } = await sbClient.from('datadutaled').select('*');
    if (error) {
        console.error("Gagal memuat:", error);
    } else {
        products = data;
        renderProducts(products);
    }
}

// ==========================================
// 3. RENDERING
// ==========================================
function renderProducts(data) {
    const container = document.getElementById("products");
    if (!container) return;

    container.innerHTML = data.map((p, index) => {
        const adminSection = isAdmin ? `
            <div style="background:#fff3cd; padding:8px; border:1px solid #ffeeba; margin-bottom:8px; border-radius:5px; text-align:center; font-size:12px;">
                <strong>Admin Tools</strong><br>
                <button onclick="updateStokManual(${index}, -1)">-1 Stok</button>
                <button onclick="updateStokManual(${index}, 1)">+1 Stok</button>
            </div>` : '';

        // Tampilkan Gambar (Pastikan URL di database sudah benar)
        const gambar = p.Gambar ? `<img src="${p.Gambar}" alt="${p.Barang}" style="width:100%; height:150px; object-fit:cover; border-radius:5px;">` : '';

        // Tampilkan Diskon
        const hargaDiskon = p.Diskon ? Number(p.Diskon) : 0;
        const diskon = hargaDiskon > 0 ? `<div style="text-decoration:line-through; color:red; font-size:12px;">Rp ${hargaDiskon.toLocaleString()}</div>` : '';

        return `
            <div class="card" style="border:1px solid #ccc; padding:10px; margin:10px; border-radius:8px;">
                ${adminSection}
                ${gambar}
                <div class="nama" style="font-weight:bold; margin-top:5px;">${p.Barang}</div>
                ${diskon}
                <div class="price">Rp ${Number(p.HargaJual).toLocaleString()}</div>
                <div class="stock">Stok: ${p.Stok}</div>
                <button class="order-btn" onclick="addCart(${index})">Pesan</button>
            </div>`;
    }).join("");
}

// ==========================================
// 4. FUNGSI ADMIN & DATABASE
// ==========================================
async function updateStokManual(index, change) {
    const p = products[index];
    const newStok = Number(p.Stok) + change;
    
    const { error } = await sbClient.from('datadutaled').update({ Stok: newStok }).eq('ID', p.ID);
    if (error) alert("Gagal: " + error.message);
    else loadProducts();
}

function updateCart() {
    const countEl = document.getElementById("cartCount");
    if (countEl) countEl.innerText = cart.length;
}

function addCart(index) {
    cart.push(products[index]);
    localStorage.setItem("duta_cart", JSON.stringify(cart));
    updateCart();
}
