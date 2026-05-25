// KREDENSIAL SUPABASE ASLI
const SUPABASE_URL = "https://opgeeqnucxrdqcgwcuge.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZ2VlcW51Y3hyZHFjZ3djdWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMTgzODAsImV4cCI6MjA5NDU5NDM4MH0.yT10QOFErxHbTL8X-QOUQ8EydcJuLpStCbd8ucfTJr8"; 

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State Aplikasi Global
let produkData = [];
let bannerData = [];
let keranjang = {};
let modeLihatModal = false; 
let kategoriTerpilih = 'Semua'; 

// Fungsi Toggle Mode Admin
function toggleModalMode() {
    modeLihatModal = !modeLihatModal;
    
    // Indikator warna tombol
    const btn = document.getElementById('btn-rahasia');
    if(btn) btn.style.color = modeLihatModal ? '#ef4444' : '#cbd5e1';
    
    renderDaftarProduk(kategoriTerpilih);
    
    if(modeLihatModal) {
        console.log("Mode Admin: Harga Modal Diaktifkan");
    }
}

// Inisialisasi Data
document.addEventListener("DOMContentLoaded", async () => {
    // Registrasi tombol rahasia dengan Event Listener (PENTING)
    const btnRahasia = document.getElementById('btn-rahasia');
    if(btnRahasia) {
        btnRahasia.addEventListener('click', toggleModalMode);
    }

    await muatPengaturanSistem();
    await muatBanners();
    await muatProduk();
});

// [Fungsi-fungsi pendukung lainnya tetap di bawah sini...]
async function muatPengaturanSistem() {
    try {
        let { data: settings, error } = await _supabase.from('pengaturan').select('*').eq('id', 1).single();
        if (error) throw error;
        if (settings) {
            const runningTextEl = document.getElementById('text-promo-running');
            const appStatsEl = document.getElementById('app-stats');
            if (runningTextEl) runningTextEl.innerHTML = `📢 ${settings.running_text}`;
            if (appStatsEl) appStatsEl.innerText = settings.total_terpasang;
        }
    } catch (err) { console.error("Gagal memuat pengaturan:", err); }
}

async function muatProduk() {
    try {
        let { data: produk, error } = await _supabase.from('produk').select('*').order('id', { ascending: false });
        if (error) throw error;
        if (produk) {
            produkData = produk;
            const kategoriUnik = ['Semua', ...new Set(produk.map(p => p.kategori).filter(Boolean))];
            renderKategoriBar(kategoriUnik);
            renderDaftarProduk('Semua');
        }
    } catch (err) { console.error("Gagal memuat produk:", err); }
}

function renderDaftarProduk(filterKategori) {
    kategoriTerpilih = filterKategori;
    const listContainer = document.getElementById('list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    const produkDifilter = filterKategori === 'Semua' ? produkData : produkData.filter(p => p.kategori === filterKategori);

    produkDifilter.forEach(prod => {
        const imgUrl = prod.gambar1 || prod.gambar_url || 'https://via.placeholder.com/150';
        const htmlModal = modeLihatModal ? 
            `<div style="font-size:11px; color:#ef4444; margin-top:5px; font-weight:bold;">
                Modal: Rp ${(Number(prod.harga_modal) || 0).toLocaleString('id-ID')}
            </div>` : '';
        
        const itemHtml = `
            <div class="product-card" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; background: #fff;">
                <img src="${imgUrl}" style="width:100%; height:120px; object-fit:cover; border-radius:6px; cursor:zoom-in;" onclick="zoomGambar('${imgUrl}')">
                <h4 style="margin: 8px 0 4px; font-size: 14px; color:#333;">${prod.nama}</h4>
                <p style="font-size: 11px; color:#777; margin:0 0 8px;">Stok: ${prod.stok || 0}</p>
                <div style="display:flex; justify-content:space-between; align-items:center; gap:5px;">
                    <span style="font-weight:bold; color:var(--pink, #ff477e); font-size:14px;">Rp ${(Number(prod.harga) || 0).toLocaleString('id-ID')}</span>
                    <button onclick="tambahKeKeranjang(${prod.id}, '${prod.nama}', ${prod.harga})" style="background:var(--primary, #007bff); color:white; border:none; padding:5px 10px; border-radius:4px; font-size:12px; cursor:pointer;">+ Beli</button>
                </div>
                ${htmlModal}
            </div>
        `;
        listContainer.insertAdjacentHTML('beforeend', itemHtml);
    });
}
function simpanDataDiri() {
    const dataDiri = {
        nama: document.getElementById('buyer-nama').value,
        wa: document.getElementById('buyer-wa').value,
        alamat: document.getElementById('buyer-alamat').value,
        rt: document.getElementById('buyer-rt').value,
        kodepos: document.getElementById('buyer-kodepos').value,
        kec: document.getElementById('buyer-kec').value,
        kab: document.getElementById('buyer-kab').value,
        prov: document.getElementById('buyer-prov').value
    };
    localStorage.setItem('duta_data_pembeli', JSON.stringify(dataDiri));
}

// Memuat data saat halaman dibuka
window.addEventListener('load', () => {
    const saved = localStorage.getItem('duta_data_pembeli');
    if (saved) {
        const data = JSON.parse(saved);
        if(document.getElementById('buyer-nama')) document.getElementById('buyer-nama').value = data.nama || '';
        if(document.getElementById('buyer-wa')) document.getElementById('buyer-wa').value = data.wa || '';
        if(document.getElementById('buyer-alamat')) document.getElementById('buyer-alamat').value = data.alamat || '';
        if(document.getElementById('buyer-rt')) document.getElementById('buyer-rt').value = data.rt || '';
        if(document.getElementById('buyer-kodepos')) document.getElementById('buyer-kodepos').value = data.kodepos || '';
        if(document.getElementById('buyer-kec')) document.getElementById('buyer-kec').value = data.kec || '';
        if(document.getElementById('buyer-kab')) document.getElementById('buyer-kab').value = data.kab || '';
        if(document.getElementById('buyer-prov')) document.getElementById('buyer-prov').value = data.prov || '';
    }
});
async function kirimPesananKeAplikasi() {
    // ... (kode ambil nilai input tetap sama)
    
    if (!nama || !alamat) {
        alert("Harap isi Nama dan Alamat!");
        return;
    }

    // SIMPAN DATA KE HP SETELAH KLIK KIRIM
    simpanDataDiri(); 

    // ... (sisa kode kirim ke Supabase tetap sama)
}
function pembaruanStrukRingkasan() {
    const listWrap = document.getElementById('summary-items');
    const panelKasir = document.getElementById('checkout-kasir');
    
    // ... (logic hitung total tetap sama) ...

    if (adaBarang) {
        panelKasir.classList.remove('hidden'); // Menampilkan panel
    } else {
        panelKasir.classList.add('hidden');    // Menyembunyikan panel
    }
}
