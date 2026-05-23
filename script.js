<script>
    // --- 1. STATE & KONFIGURASI ---
    const SUPABASE_URL = "https://opgeeqnucxrdqcgwcuge.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZ2VlcW51Y3hyZHFjZ3djdWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMTgzODAsImV4cCI6MjA5NDU5NDM4MH0.yT10QOFErxHbTL8X-QOUQ8EydcJuLpStCbd8ucfTJr8";
    const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    let produkData = [];
    let isModeGrosir = false; // State untuk mode harga
    let keranjang = {};

    // --- 2. INISIALISASI ---
    document.addEventListener("DOMContentLoaded", async () => {
        await muatPengaturanSistem();
        await muatBanners();
        await muatProduk();
    });

    // --- 3. FUNGSI NAVIGASI & MENU (Bisa diakses dari tombol HTML) ---
    function bukaMenu(tipe) {
        if (tipe === 'customer') {
            isModeGrosir = false;
            alert("Mode Customer aktif. Harga normal.");
            renderDaftarProduk('Semua');
        } 
        else if (tipe === 'grosir') {
            const pin = prompt("Masukkan PIN untuk akses Grosir:");
            if (pin === "1234") {
                isModeGrosir = true;
                alert("Akses Grosir Diterima!");
                renderDaftarProduk('Semua');
            } else {
                alert("PIN Grosir Salah!");
            }
        } 
        else if (tipe === 'admin') {
            const pin = prompt("Masukkan PIN untuk akses Admin:");
            if (pin === "admin123") {
                window.location.href = "admin.html";
            } else {
                alert("PIN Admin Salah!");
            }
        }
    }

    // --- 4. FUNGSI RENDER & DATA ---
    async function muatProduk() {
        try {
            let { data: produk, error } = await _supabase.from('produk').select('*').order('id', { ascending: false });
            if (error) throw error;
            produkData = produk || [];
            renderDaftarProduk('Semua');
        } catch (err) {
            console.error("Gagal memuat produk:", err);
        }
    }

    function renderDaftarProduk(filterKategori) {
    const listContainer = document.getElementById('list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    // Filter data
    const data = filterKategori === 'Semua' ? produkData : produkData.filter(p => p.kategori === filterKategori);

    data.forEach(prod => {
        // Ambil data dari database
        const hargaAsli = Number(prod.harga) || 0;
        const diskonReguler = Number(prod.diskon) || 0;
        const diskonGrosir = Number(prod.diskon_grosir) || 0;

        // --- RUMUS HARGA ---
        let hargaJual = hargaAsli * (1 - (diskonReguler / 100));
        
        // Cek status Global: apakah sedang mode grosir?
        if (isModeGrosir === true) {
            hargaJual = hargaJual * (1 - (diskonGrosir / 100));
        }

        // --- RENDER KE LAYAR ---
        listContainer.insertAdjacentHTML('beforeend', `
            <div class="product-card">
                <h4>${prod.nama}</h4>
                <p>Harga: Rp ${hargaJual.toLocaleString('id-ID')}</p>
                ${isModeGrosir ? `<small style="color:red;">Mode Grosir Aktif</small>` : ''}
            </div>
        `);
    });
}

    // Fungsi pendukung lainnya (muatPengaturanSistem, muatBanners, dll) 
    // tetap letakkan di sini...
</script>
