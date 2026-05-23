const SUPABASE_URL = "https://opgeeqnucxrdqcgwcuge.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZ2VlcW51Y3hyZHFjZ3djdWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMTgzODAsImV4cCI6MjA5NDU5NDM4MH0.yT10QOFErxHbTL8X-QOUQ8EydcJuLpStCbd8ucfTJr8"; 
    const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    let bannerData = [];
    let produkData = []; // Ditambahkan untuk menyimpan data produk
    let keranjang = {}; 
    let kategoriWarna = ['#e0f2fe', '#fef3c7', '#dcfce7', '#fce7f3', '#ffedd5', '#f3e8ff'];
    let klikRahasiaCount = 0;
    let defferredPrompt;
    let kategoriTerpilih = 'Semua';

    document.addEventListener("DOMContentLoaded", async () => {
        await muatPengaturanSistem();
        await muatBannerBergilir();
        await muatProdukDanOfflineCache();
    });

    // --- FUNGSI BARU DITAMBAHKAN ---
    function bukaMenu(tipe) {
        if (tipe === 'customer') {
            alert("Mode Customer Aktif");
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
    // -------------------------------

    async function muatPengaturanSistem() {
        try {
            let { data: settings, error } = await _supabase.from('pengaturan').select('*').eq('id', 1).single();
            if (error) throw error;
            if (settings) {
                const runningTextEl = document.getElementById('text-promo-running');
                // Mengambil semua elemen app-stats yang ada
                const appStatsEls = document.querySelectorAll('#app-stats');
                if (runningTextEl) runningTextEl.innerHTML = `${settings.running_text}`;
                appStatsEls.forEach(el => el.innerText = settings.total_terpasang);
            }
        } catch (err) { 
            console.error("Gagal memuat pengaturan:", err); 
        }
    }

    async function muatBannerBergilir() {
        try {
            let { data: banners } = await _supabase.from('banners').select('*').eq('aktif', true).order('urutan', { ascending: true });
            if (banners && banners.length > 0) {
                bannerData = banners;
                renderBannerSlider();
            }
        } catch (e) { console.error(e); }
    }

    function renderBannerSlider() {
        const slider = document.getElementById('banner-slider');
        const dots = document.getElementById('banner-dots');
        if(!slider) return;
        slider.innerHTML = ''; dots.innerHTML = '';

        bannerData.forEach((b, idx) => {
            const img = document.createElement('img');
            img.src = b.image_url;
            slider.appendChild(img);

            const dot = document.createElement('div');
            dot.className = idx === 0 ? 'dot active' : 'dot';
            dot.onclick = () => geserSlide(idx);
            dots.appendChild(dot);
        });

        let current = 0;
        setInterval(() => {
            if(bannerData.length > 0) {
                current = (current + 1) % bannerData.length;
                geserSlide(current);
            }
        }, 4000);
    }

    function geserSlide(idx) {
        const slider = document.getElementById('banner-slider');
        const dots = document.getElementById('banner-dots') ? document.getElementById('banner-dots').children : [];
        if(slider && dots.length > idx) {
            slider.style.transform = `translateX(-${idx * 100}%)`;
            for (let i = 0; i < dots.length; i++) {
                dots[i].className = i === idx ? 'dot active' : 'dot';
            }
        }
    }

    async function muatProdukDanOfflineCache() {
        try {
            let { data: produk, error } = await _supabase.from('produk').select('*').order('id', { ascending: false });
            if (produk) {
                produkData = produk;
                localStorage.setItem('duta_produk_cache', JSON.stringify(produk));
            }
        } catch (err) { console.log("Mode offline"); }
        
        if (produkData.length === 0) {
            const cache = localStorage.getItem('duta_produk_cache');
            if (cache) produkData = JSON.parse(cache);
        }

        if (produkData.length > 0) {
            const kat = ['Semua', ...new Set(produkData.map(p => p.kategori).filter(Boolean))];
            renderKategoriWarnaWarni(kat);
            jalankanFilterDanSortir();
        }
    }

    function renderKategoriWarnaWarni(katArr) {
        const bar = document.getElementById('cat-bar');
        if(!bar) return;
        bar.innerHTML = '';
        katArr.forEach((kat, idx) => {
            const btn = document.createElement('button');
            btn.innerText = kat;
            btn.className = 'cat-btn';
            btn.style.background = kategoriWarna[idx % kategoriWarna.length];
            btn.style.border = idx === 0 ? '2px solid var(--primary)' : '2px solid transparent';
            btn.onclick = () => {
                document.querySelectorAll('.cat-btn').forEach(b => b.style.border = '2px solid transparent');
                btn.style.border = '2px solid var(--primary)';
                kategoriTerpilih = kat;
                jalankanFilterDanSortir();
            };
            bar.appendChild(btn);
        });
    }

    function jalankanFilterDanSortir() {
        const kataKunci = document.getElementById('search-box').value.toLowerCase().trim();
        const tipeSortir = document.getElementById('sort-box').value;
        let hasil = kategoriTerpilih === 'Semua' ? produkData : produkData.filter(p => p.kategori === kategoriTerpilih);
        if (kataKunci !== '') hasil = hasil.filter(p => p.nama.toLowerCase().includes(kataKunci));
        
        const dH = (p) => { const d = Number(p.diskon) || 0; return Number(p.harga) * (1 - (d/100)); };
        if (tipeSortir === 'termurah') hasil.sort((a,b) => dH(a)-dH(b));
        else if (tipeSortir === 'termahal') hasil.sort((a,b) => dH(b)-dH(a));
        else if (tipeSortir === 'terlaris') hasil.sort((a,b) => (b.stok||0)-(a.stok||0));
        else hasil.sort((a,b) => b.id-a.id);
        
        renderDaftarProdukKeHTML(hasil);
    }

    function renderDaftarProdukKeHTML(filteredProducts) {
        const container = document.getElementById('list');
        if(!container) return;
        container.innerHTML = '';
        filteredProducts.forEach(p => {
            const qty = keranjang[p.id] || 0;
            const final = (Number(p.harga) || 0) * (1 - ((Number(p.diskon)||0)/100));
            container.insertAdjacentHTML('beforeend', `
                <div class="product-card">
                    <h4 style="font-size:12px;">${p.nama}</h4>
                    <p>Rp ${final.toLocaleString('id-ID')}</p>
                    <div class="order-control">
                        <button onclick="ubahAngkaQty(${p.id}, -1)">-</button>
                        <span id="qty-val-${p.id}">${qty}</span>
                        <button onclick="ubahAngkaQty(${p.id}, 1)">+</button>
                    </div>
                </div>
            `);
        });
    }

    function ubahAngkaQty(id, ubah) {
        let q = (keranjang[id] || 0) + ubah;
        if (q < 0) q = 0;
        keranjang[id] = q;
        const el = document.getElementById(`qty-val-${id}`);
        if(el) el.innerText = q;
        pembaruanStrukRingkasan();
    }

    function pembaruanStrukRingkasan() {
        // Logika struk tetap sama
    }
    
    // (Sisa fungsi lainnya kirimKeWhatsApp, bukaZoom, dll tetap sama)
