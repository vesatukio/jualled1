<script>
    // 1. KONFIGURASI
    const SUPABASE_URL = "https://opgeeqnucxrdqcgwcuge.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZ2VlcW51Y3hyZHFjZ3djdWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMTgzODAsImV4cCI6MjA5NDU5NDM4MH0.yT10QOFErxHbTL8X-QOUQ8EydcJuLpStCbd8ucfTJr8";
    const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // 2. STATE GLOBAL
    let produkData = [];
    let bannerData = [];
    let isModeGrosir = false;
    let keranjang = {};
    let kategoriWarna = ['#e0f2fe', '#fef3c7', '#dcfce7', '#fce7f3', '#ffedd5', '#f3e8ff'];
    let kategoriTerpilih = 'Semua';
    let defferredPrompt;

    // 3. INISIALISASI UTAMA
    document.addEventListener("DOMContentLoaded", async () => {
        await muatPengaturanSistem();
        await muatBannerBergilir();
        await muatProduk(); // Memuat data produk sekaligus merender ke layar
    });

    // 4. FUNGSI NAVIGASI
    function bukaMenu(tipe) {
        if (tipe === 'customer') {
            isModeGrosir = false;
            renderDaftarProduk(kategoriTerpilih);
        } else if (tipe === 'grosir') {
            const pin = prompt("Masukkan PIN untuk akses Grosir:");
            if (pin === "1234") {
                isModeGrosir = true;
                alert("Mode Grosir Aktif!");
                renderDaftarProduk(kategoriTerpilih);
            } else {
                alert("PIN Salah!");
            }
        } else if (tipe === 'admin') {
            const pin = prompt("Masukkan PIN Admin:");
            if (pin === "admin123") window.location.href = "admin.html";
            else alert("PIN Salah!");
        }
    }

    // 5. FUNGSI DATA
    async function muatProduk() {
    try {
        // Mengambil semua data dari tabel 'produk'
        let { data: produk, error } = await _supabase
            .from('produk')
            .select('*') 
            .order('id', { ascending: false });

        if (error) throw error;

        produkData = produk || [];
        
        // Render kategori berdasarkan kolom 'kategori' di tabel produk
        const urutanKategori = ['Semua', ...new Set(produkData.map(p => p.kategori).filter(Boolean))];
        renderKategoriWarnaWarni(urutanKategori);
        
        renderDaftarProduk('Semua');
    } catch (err) {
        console.error("Gagal muat produk:", err);
    }
}
    // 6. FUNGSI RENDER (Logika Harga Disini)
    function renderDaftarProduk(filterKategori) {
    const listContainer = document.getElementById('list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    const data = filterKategori === 'Semua' 
        ? produkData 
        : produkData.filter(p => p.kategori === filterKategori);

    data.forEach(prod => {
        // Pastikan nama kolom di bawah ini SAMA PERSIS dengan di Supabase
        const nama = prod.nama || "Tanpa Nama";
        const hargaAsli = Number(prod.harga) || 0;
        const diskon = Number(prod.diskon) || 0;
        const stok = prod.stok || 0;
        const gambar = prod.gambar1 || 'https://via.placeholder.com/150'; // Fallback jika gambar kosong
        
        // Hitung harga
        let hargaJual = hargaAsli * (1 - (diskon / 100));

        listContainer.insertAdjacentHTML('beforeend', `
            <div class="product-card">
                <img src="${gambar}" style="width:100%; height:150px; object-fit:cover;">
                <h4>${nama}</h4>
                <p>Stok: ${stok}</p>
                <p>Harga: Rp ${hargaJual.toLocaleString('id-ID')}</p>
            </div>
        `);
    });
}
    // --- (Masukkan fungsi muatPengaturanSistem, muatBannerBergilir, renderKategori, dll di sini) ---
</script>
