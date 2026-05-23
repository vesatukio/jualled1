const SUPABASE_URL = "https://opgeeqnucxrdqcgwcuge.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZ2VlcW51Y3hyZHFjZ3djdWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMTgzODAsImV4cCI6MjA5NDU5NDM4MH0.yT10QOFErxHbTL8X-QOUQ8EydcJuLpStCbd8ucfTJr8";

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// State Global
let daftarProduk = [];
let daftarKategoriSedia = new Set();
let namaAdminAktif = "";

// INISIALISASI
document.addEventListener('DOMContentLoaded', async () => {
    // Memastikan ID dropdown yang digunakan konsisten
    await muatDropdownAdmin();
});

// 1. MEMUAT DAFTAR ADMIN
async function muatDropdownAdmin() {
    const select = document.getElementById("dropdownAdmin"); // Pastikan ID ini ada di HTML
    const selectKatalog = document.getElementById("pilih-admin"); // Pastikan ID ini ada jika dipakai

    try {
        const { data, error } = await _supabase.from('akses_admin').select('username').order('username');
        if (error) throw error;

        const options = '<option value="">-- Pilih Admin --</option>' + 
                        data.map(acc => `<option value="${acc.username}">${acc.username.toUpperCase()}</option>`).join('');
        
        if (select) select.innerHTML = options;
        if (selectKatalog) selectKatalog.innerHTML = options;

        let lastSession = localStorage.getItem('duta_admin_name');
        if (lastSession) {
            namaAdminAktif = lastSession;
            if (select) select.value = lastSession;
            if (selectKatalog) selectKatalog.value = lastSession;
        } else if (data.length > 0) {
            namaAdminAktif = data[0].username;
        }
        
        await muatDataKatalog();
    } catch (e) {
        console.error("Gagal memuat admin:", e.message);
    }
}

// 2. AMBIL DATA PRODUK
async function muatDataKatalog() {
    if (!namaAdminAktif) return;
    try {
        const { data, error } = await _supabase
            .from('produk')
            .select('*')
            .eq('pemilik', namaAdminAktif)
            .order('id', { ascending: false });

        if (error) throw error;
        daftarProduk = data || [];
        
        daftarKategoriSedia.clear();
        daftarProduk.forEach(p => { if(p.kategori) daftarKategoriSedia.add(p.kategori); });
        
        updateDropdownKategori();
        hitungDanRenderSummary();
        renderTabel();
    } catch (e) {
        console.error("Gagal muat produk:", e.message);
    }
}

async function simpanProduk() {
    const prodId = document.getElementById("prod_id").value;
    
    // 1. Ambil data dari form termasuk 3 gambar & estimasi untung
    const dataForm = {
        nama: document.getElementById("prod_nama").value,
        harga: parseFloat(document.getElementById("prod_harga").value) || 0,
        stok: parseInt(document.getElementById("prod_stok").value) || 0,
        
        // Menangkap data gambar baru
        gambar1: document.getElementById("prod_gambar1")?.value || "",
        gambar2: document.getElementById("prod_gambar2")?.value || "",
        gambar3: document.getElementById("prod_gambar3")?.value || "",
        
        // Menangkap data untung (yang sudah dihitung fungsi hitungLabaAdminOtomatis)
        estimasi_untung: document.getElementById("prod_estimasi_untung_val")?.value || 0,
        
        pemilik: namaAdminAktif
    };

    try {
        let error;
        if (prodId) {
            // EDIT: Update produk berdasarkan ID
            const { error: err } = await _supabase.from('produk').update(dataForm).eq('id', prodId);
            error = err;
        } else {
            // TAMBAH: Insert data baru
            const { error: err } = await _supabase.from('produk').insert([dataForm]);
            error = err;
        }

        if (error) throw error;

        alert("Data berhasil disimpan!");
        tutupForm();
        
        // Refresh otomatis agar tabel langsung update
        await muatDataKatalog(); 
    } catch (e) {
        alert("Gagal simpan: " + e.message);
    }
}

// 4. RENDER TABEL
function renderTabel() {
    const tbody = document.getElementById("tabelProduk");
    if (!tbody) return;

    tbody.innerHTML = daftarProduk.length > 0 
        ? daftarProduk.map(p => `<tr>
            <td><img src="${p.gambar1 || 'https://via.placeholder.com/50'}" style="width:50px;"></td>
            <td><strong>${p.nama}</strong><br><span style="font-size:10px;">👤 ${p.pemilik}</span></td>
            <td>${p.kategori || '-'}</td>
            <td>Rp ${Number(p.harga).toLocaleString()}</td>
            <td>${p.stok}</td>
            <td>
                <button onclick="editForm(${p.id})">Edit</button>
                <button onclick="hapusProduk(${p.id}, '${p.nama}')">Hapus</button>
            </td>
        </tr>`).join('')
        : '<tr><td colspan="6">Belum ada produk.</td></tr>';
}

// 5. HAPUS
async function hapusProduk(id, nama) {
    if (!confirm(`Hapus produk "${nama}"?`)) return;
    try {
        const { error } = await _supabase.from('produk').delete().eq('id', id);
        if (error) throw error;
        await muatDataKatalog();
    } catch (e) { alert("Error: " + e.message); }
}

// 6. FUNGSI UI
function editForm(id) {
    // 1. Cari produk berdasarkan ID
    const p = daftarProduk.find(i => i.id === id);
    if(!p) {
        alert("Data produk tidak ditemukan!");
        return;
    }
    
    // 2. Isi data ke elemen form (PASTIKAN ID HTML SAMA)
    document.getElementById("prod_id").value = p.id;
    document.getElementById("prod_nama").value = p.nama;
    document.getElementById("prod_harga").value = p.harga; // Harga Jual
    document.getElementById("prod_stok").value = p.stok;
    
    // TAMBAHKAN INI agar data muncul di form:
    document.getElementById("prod_harga_beli").value = p.harga_modal || 0; // Pastikan nama kolom di DB adalah harga_modal
    document.getElementById("prod_gambar1").value = p.gambar1 || "";
    document.getElementById("prod_gambar2").value = p.gambar2 || "";
    document.getElementById("prod_gambar3").value = p.gambar3 || "";
    
    // 3. Panggil fungsi hitung agar angka untung muncul otomatis saat form edit dibuka
    if (typeof hitungLabaAdminOtomatis === 'function') {
        hitungLabaAdminOtomatis();
    }
    
    // 4. Tampilkan form
    document.getElementById("formTitle").innerText = "Edit Produk";
    document.getElementById("formCard").style.display = "block";
}
function tutupForm() { document.getElementById("formCard").style.display = "none"; }
function updateDropdownKategori() {
    const select = document.getElementById("prod_kategori_select");
    if (!select) return;

    // Ambil data unik dari daftarProduk
    const kategoriUnik = [...new Set(daftarProduk.map(p => p.kategori).filter(Boolean))];
    
    select.innerHTML = '<option value="">-- Pilih Kategori --</option>';
    kategoriUnik.sort().forEach(kat => {
        select.innerHTML += `<option value="${kat}">${kat}</option>`;
    });
}
// --- FUNGSI YANG HILANG (Tambahkan ini di bagian bawah admin.js) ---

function hitungDanRenderSummary() {
    const elJenis = document.getElementById("statTotalJenis");
    const elStok = document.getElementById("statTotalStok");
    
    // Hitung total item unik dan total stok
    const totalJenis = daftarProduk.length;
    const totalStok = daftarProduk.reduce((sum, p) => sum + (Number(p.stok) || 0), 0);
    
    if (elJenis) elJenis.innerText = totalJenis + " Item";
    if (elStok) elStok.innerText = totalStok + " Pcs";
}

async function gantiAdminAktif(val) {
    if (!val) return;
    namaAdminAktif = val.trim().toLowerCase();
    localStorage.setItem('duta_admin_name', namaAdminAktif);
    // Muat ulang data saat admin diganti
    await muatDataKatalog();
}

function updateDropdownKategori() {
    const select = document.getElementById("prod_kategori_select");
    if (!select) return;
    
    // Ambil kategori unik
    const kategoriList = [...new Set(daftarProduk.map(p => p.kategori).filter(k => k))];
    
    select.innerHTML = '<option value="">-- Pilih Kategori --</option>';
    kategoriList.sort().forEach(kat => {
        select.innerHTML += `<option value="${kat}">${kat}</option>`;
    });
}
// Tambahkan fungsi-fungsi pelengkap ini agar HTML tidak error
function handleKategoriSelect(el) {
    const inputBaru = document.getElementById("prod_kategori_baru");
    if (el.value === "tambah_baru") { // Anda perlu menyesuaikan logika ini
        inputBaru.style.display = "block";
    } else {
        inputBaru.style.display = "none";
    }
}

function switchTab(tabId, btn) {
    document.querySelectorAll('.panel-section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).style.display = 'block';
    btn.classList.add('active');
}

function aktifkanInputKategoriBaru(e) {
    e.preventDefault();
    document.getElementById("prod_kategori_baru").style.display = "block";
}

// Fungsi Dummy (Isi nanti sesuai kebutuhan)
function tambahAdminBaru() { alert("Fitur tambah admin belum dibuat"); }
function hapusAdminAktif() { alert("Fitur hapus admin belum dibuat"); }
function simpanPengaturan(e) { e.preventDefault(); alert("Simpan pengaturan..."); }
function simpanBanner(e) { e.preventDefault(); alert("Simpan banner..."); }
function downloadTemplateMassal(tipe) { alert("Download " + tipe); }
function downloadSemuaProdukAktif() { alert("Download semua produk"); }
function updateFileNameDisplay(el) { console.log(el.value); }
function prosesUploadMassal() { alert("Proses upload..."); }
function hitungLabaAdminOtomatis() {
    // Ambil elemen input
    const hargaBeli = parseFloat(document.getElementById('prod_harga_beli')?.value) || 0;
    const hargaJualAsli = parseFloat(document.getElementById('prod_harga')?.value) || 0;
    const diskonPersen = parseFloat(document.getElementById('prod_diskon')?.value) || 0;

    // Kalkulasi
    const hargaJualSetelahDiskon = hargaJualAsli - (hargaJualAsli * (diskonPersen / 100));
    const untungPcs = hargaJualSetelahDiskon - hargaBeli;

    // Debugging: cek di Console (F12) apakah nilai untung muncul
    console.log("Untung per pcs:", untungPcs);

    // Tampilkan ke layar (format Rupiah)
    const elTampil = document.getElementById('prod_estimasi_untung');
    if (elTampil) {
        elTampil.value = new Intl.NumberFormat('id-ID', { 
            style: 'currency', currency: 'IDR', maximumFractionDigits: 0 
        }).format(untungPcs);
    }

    // Simpan nilai murni ke hidden input untuk database
    const elHidden = document.getElementById('prod_estimasi_untung_val');
    if (elHidden) {
        elHidden.value = untungPcs;
    }
}
