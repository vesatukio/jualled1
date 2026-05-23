const SUPABASE_URL = "https://opgeeqnucxrdqcgwcuge.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZ2VlcW51Y3hyZHFjZ3djdWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMTgzODAsImV4cCI6MjA5NDU5NDM4MH0.yT10QOFErxHbTL8X-QOUQ8EydcJuLpStCbd8ucfTJr8"; 
    const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    let bannerData = [];
    let produkData = []; // DEFINISI GLOBAL PENTING
    let keranjang = {}; 
    let kategoriWarna = ['#e0f2fe', '#fef3c7', '#dcfce7', '#fce7f3', '#ffedd5', '#f3e8ff'];
    let kategoriTerpilih = 'Semua';

    document.addEventListener("DOMContentLoaded", async () => {
        await muatPengaturanSistem();
        await muatBannerBergilir();
        await muatProdukDanOfflineCache();
    });

    // FUNGSI MENU AKSES
    function bukaMenu(tipe) {
        if (tipe === 'customer') {
            alert("Mode Customer: Harga Eceran Aktif");
        } else if (tipe === 'grosir') {
            const pin = prompt("Masukkan PIN untuk akses Grosir:");
            if (pin === "1234") alert("Mode Grosir Aktif!");
            else alert("PIN Salah!");
        } else if (tipe === 'admin') {
            const pin = prompt("Masukkan PIN Admin:");
            if (pin === "admin123") window.location.href = "admin.html";
            else alert("PIN Salah!");
        }
    }

    async function muatProdukDanOfflineCache() {
        try {
            // Pastikan tabel di Supabase bernama 'produk'
            let { data, error } = await _supabase.from('produk').select('*').order('id', { ascending: false });
            if (error) throw error;
            
            produkData = data || [];
            localStorage.setItem('duta_produk_cache', JSON.stringify(produkData));
        } catch (err) {
            console.error("Gagal load dari DB, mencoba cache...", err);
            const cache = localStorage.getItem('duta_produk_cache');
            produkData = cache ? JSON.parse(cache) : [];
        }

        if (produkData.length > 0) {
            const kat = ['Semua', ...new Set(produkData.map(p => p.kategori).filter(Boolean))];
            renderKategoriWarnaWarni(kat);
            jalankanFilterDanSortir();
        } else {
            document.getElementById('list').innerHTML = "<p>Data produk belum tersedia.</p>";
        }
    }

    // (Sisa fungsi lainnya seperti muatBannerBergilir, renderDaftarProdukKeHTML tetap sama)
