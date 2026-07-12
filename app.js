// ==========================================
// 1. REGISTRASI SERVICE WORKER
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js');
    });
}

// ==========================================
// 2. KONFIGURASI SUPABASE (HANYA SEKALI)
// ==========================================
const supabase = supabase.createClient(
    'https://opgeeqnucxrdqcgwcuge.supabase.co', 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZ2VlcW51Y3hyZHFjZ3djdWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMTgzODAsImV4cCI6MjA5NDU5NDM4MH0.yT10QOFErxHbTL8X-QOUQ8EydcJuLpStCbd8ucfTJr8'
);

// Inisialisasi variabel global
let products = [];
let cart = JSON.parse(localStorage.getItem("duta_cart") || "[]");
const isAdmin = new URLSearchParams(window.location.search).get('admin') === 'true';

// Panggil fungsi utama saat aplikasi mulai
loadProducts();
updateCart();

async function loadProducts() {
    // Fungsi untuk menarik data dari tabel datadutaled
    const { data, error } = await supabase.from('datadutaled').select('*');
    if (error) {
        console.error("Gagal memuat dari Supabase:", error);
    } else {
        products = data;
        renderProducts(products);
    }
}

// Fungsi untuk update stok ke database
async function updateStokSupabase(id, newStok) {
    const { error } = await supabase.from('datadutaled').update({ Stok: newStok }).eq('ID', id);
    if (error) {
        alert("Gagal update stok: " + error.message);
    } else {
        await loadProducts();
        alert("Stok berhasil diperbarui!");
    }
}
