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
// 3. RENDERING (Admin Tools ada di dalam sini)
// ==========================================
function renderProducts(data) {
    const container = document.getElementById("products");
    if (!container) return;

    container.innerHTML = data.map((p, index) => {
        // Bagian Admin
        const adminSection = isAdmin ? `
            <div style="background:#fff3cd; padding:8px; border:1px solid #ffeeba; margin-bottom:8px; border-radius:5px; text-align:center; font-size:12px;">
                <strong>Admin Tools</strong><br>
                <button onclick="updateStokManual(${index}, -1)" style="background:#d9534f; color:white; border:none; padding:5px; cursor:pointer;">-1 Stok</button>
                <button onclick="updateStokManual(${index}, 1)" style="background:#5cb85c; color:white; border:none; padding:5px; cursor:pointer;">+1 Stok</button>
            </div>` : '';

        return `
            <div class="card">
                ${adminSection}
                <div class="nama">${p.Barang}</div>
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

async function bukaFormTambahProduk() {
    const nama = prompt("Nama Barang Baru:");
    if (!nama) return;
    const harga = prompt("Harga Jual:");
    const stok = prompt("Stok Awal:");
    
    if (nama && harga && stok) {
        const { error } = await sbClient.from('datadutaled').insert([{ 
            Barang: nama, 
            HargaJual: Number(harga), 
            Stok: Number(stok) 
        }]);
        if (error) alert("Gagal: " + error.message);
        else { alert("Berhasil!"); loadProducts(); }
    }
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
