// KREDENSIAL SUPABASE ASLI (Sudah disamakan dengan database Duta Terang LED Anda)
const SUPABASE_URL = "https://opgeeqnucxrdqcgwcuge.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZ2VlcW51Y3hyZHFjZ3djdWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMTgzODAsImV4cCI6MjA5NDU5NDM4MH0.yT10QOFErxHbTL8X-QOUQ8EydcJuLpStCbd8ucfTJr8"; 

// Inisialisasi menggunakan variabel _supabase agar konsisten
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State Aplikasi Global
let produkData = [];
let bannerData = [];
let keranjang = {};

// Inisialisasi Data dari Supabase sewaktu halaman dimuat
document.addEventListener("DOMContentLoaded", async () => {
    await muatPengaturanSistem();
    await muatBanners();
    await muatProduk();
});

// 1. Ambil Pengaturan Umum Website (Text Running Promo & Counter Install)
async function muatPengaturanSistem() {
    try {
        let { data: settings, error } = await _supabase
            .from('pengaturan')
            .select('*')
            .eq('id', 1)
            .single();
        
        if (error) throw error;

        if (settings) {
            const runningTextEl = document.getElementById('text-promo-running');
            const appStatsEl = document.getElementById('app-stats');
            
            if (runningTextEl) runningTextEl.innerHTML = `📢 ${settings.running_text}`;
            if (appStatsEl) appStatsEl.innerText = settings.total_terpasang;
        }
    } catch (err) { 
        console.error("Gagal memuat pengaturan:", err); 
    }
}

// 2. Ambil Data Banner Gambar Berubah Otomatis
async function muatBanners() {
    try {
        let { data: banners, error } = await _supabase
            .from('banners')
            .select('*')
            .eq('aktif', true)
            .order('urutan', { ascending: true });

        if (error) throw error;

        if (banners && banners.length > 0) {
            bannerData = banners;
            renderBanners();
        } else {
            const slider = document.getElementById('banner-slider');
            if (slider) slider.innerHTML = `<p style="text-align:center; padding:20px; color:#999;">Belum ada banner promo.</p>`;
        }
    } catch (err) { 
        console.error("Gagal memuat banner:", err); 
    }
}

function renderBanners() {
    const slider = document.getElementById('banner-slider');
    const dotsContainer = document.getElementById('banner-dots');
    if (!slider || !dotsContainer) return;

    slider.innerHTML = '';
    dotsContainer.innerHTML = '';

    bannerData.forEach((banner, index) => {
        // Render Element Gambar Slider
        const img = document.createElement('img');
        img.src = banner.image_url;
        img.style.width = '100%';
        img.style.flexShrink = '0';
        img.style.objectFit = 'cover';
        img.alt = banner.judul || "Promo";
        slider.appendChild(img);

        // Render Dots Indikator
        const dot = document.createElement('span');
        dot.style.cssText = `width:8px; height:8px; border-radius:50%; background:${index === 0 ? 'var(--pink, #ff477e)' : '#ccc'}; cursor:pointer;`;
        dot.onclick = () => gantiSlide(index);
        dotsContainer.appendChild(dot);
    });

    // Jalankan auto-play slider per 4 detik
    let currentSlide = 0;
    // Bersihkan interval lama jika ada agar tidak bentrok
    if (window.bannerInterval) clearInterval(window.bannerInterval);
    
    window.bannerInterval = setInterval(() => {
        currentSlide = (currentSlide + 1) % bannerData.length;
        gantiSlide(currentSlide);
    }, 4000);
}

function gantiSlide(index) {
    const slider = document.getElementById('banner-slider');
    const dotsContainer = document.getElementById('banner-dots');
    if (!slider || !dotsContainer) return;
    
    const dots = dotsContainer.children;
    slider.style.transform = `translateX(-${index * 100}%)`;
    
    for (let i = 0; i < dots.length; i++) {
        dots[i].style.background = i === index ? 'var(--pink, #ff477e)' : '#ccc';
    }
}

// 3. Ambil Data Produk & Kategori
async function muatProduk() {
    try {
        let { data: produk, error } = await _supabase
            .from('produk')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;

        if (produk) {
            produkData = produk;
            
            // Ekstrak kategori unik untuk mengisi kategori bar
            const kategoriUnik = ['Semua', ...new Set(produk.map(p => p.kategori).filter(Boolean))];
            renderKategoriBar(kategoriUnik);
            
            // Tampilkan seluruh produk awal
            renderDaftarProduk('Semua');
        }
    } catch (err) {
        console.error("Gagal memuat produk:", err);
        const listEl = document.getElementById('list');
        if (listEl) listEl.innerHTML = `<p style="text-align:center; color:red; padding:20px;">Gagal memuat data produk: ${err.message}</p>`;
    }
}

function renderKategoriBar(kategoriArr) {
    const catBar = document.getElementById('cat-bar');
    if (!catBar) return;
    catBar.innerHTML = '';
    
    kategoriArr.forEach((kat, index) => {
        const btn = document.createElement('button');
        btn.innerText = kat;
        btn.className = index === 0 ? 'cat-btn active' : 'cat-btn';
        btn.style.cssText = `padding: 6px 15px; border-radius: 15px; border: none; font-weight: bold; background: ${index === 0 ? 'var(--primary, #007bff)' : '#f1f5f9'}; color: ${index === 0 ? '#fff' : '#333'}; white-space: nowrap; cursor: pointer; margin-right: 5px;`;
        btn.onclick = (e) => {
            document.querySelectorAll('.cat-btn').forEach(b => {
                b.style.background = '#f1f5f9';
                b.style.color = '#333';
            });
            btn.style.background = 'var(--primary, #007bff)';
            btn.style.color = '#fff';
            renderDaftarProduk(kat);
        };
        catBar.appendChild(btn);
    });
}

function renderDaftarProduk(filterKategori) {
    const listContainer = document.getElementById('list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    const produkDifilter = filterKategori === 'Semua' 
        ? produkData 
        : produkData.filter(p => p.kategori === filterKategori);

    if(produkDifilter.length === 0) {
        listContainer.innerHTML = `<p style="grid-column:span 2; text-align:center; color:#999; padding:20px;">Produk tidak ditemukan.</p>`;
        return;
    }

    produkDifilter.forEach(prod => {
        // Toleransi jika database menggunakan gambar1 atau gambar_url
        const imgUrl = prod.gambar1 || prod.gambar_url || 'https://via.placeholder.com/150';
        
        const itemHtml = `
            <div class="product-card" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; background: #fff;">
                <img src="${imgUrl}" style="width:100%; height:120px; object-fit:cover; border-radius:6px; cursor:zoom-in;" onclick="zoomGambar('${imgUrl}')">
                <h4 style="margin: 8px 0 4px; font-size: 14px; color:#333;">${prod.nama}</h4>
                <p style="font-size: 11px; color:#777; margin:0 0 8px;">Stok: ${prod.stok || 0} | Kategori: ${prod.kategori || '-'}</p>
                <div style="display:flex; justify-content:space-between; align-items:center; gap:5px;">
                    <span style="font-weight:bold; color:var(--pink, #ff477e); font-size:14px;">Rp ${(Number(prod.harga) || 0).toLocaleString('id-ID')}</span>
                    <button onclick="tambahKeKeranjang(${prod.id}, '${prod.nama}', ${prod.harga})" style="background:var(--primary, #007bff); color:white; border:none; padding:5px 10px; border-radius:4px; font-size:12px; cursor:pointer;">+ Beli</button>
                </div>
            </div>
        `;
        listContainer.insertAdjacentHTML('beforeend', itemHtml);
    });
}

function zoomGambar(src) {
    const modal = document.getElementById('zoomModal');
    const imgZoom = document.getElementById('imgZoom');
    if (modal && imgZoom) {
        imgZoom.src = src;
        modal.style.display = 'flex';
    }
}
