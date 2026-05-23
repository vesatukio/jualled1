const SUPABASE_URL = "https://opgeeqnucxrdqcgwcuge.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZ2VlcW51Y3hyZHFjZ3djdWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMTgzODAsImV4cCI6MjA5NDU5NDM4MH0.yT10QOFErxHbTL8X-QOUQ8EydcJuLpStCbd8ucfTJr8";

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let daftarProduk = [];
let daftarKategoriSedia = new Set();
let namaAdminAktif = "";

// INISIALISASI
document.addEventListener('DOMContentLoaded', async () => {
    await muatDropdownAdmin();
});

// 1. MEMUAT DAFTAR ADMIN
async function muatDropdownAdmin() {
    const select = document.getElementById("dropdownAdmin");
    if (!select) return;

    try {
        const { data, error } = await _supabase.from('akses_admin').select('username').order('username');
        if (error) throw error;

        select.innerHTML = '<option value="">-- Pilih Admin --</option>';
        data.forEach(acc => {
            select.innerHTML += `<option value="${acc.username}">${acc.username.toUpperCase()}</option>`;
        });

        let lastSession = localStorage.getItem('duta_admin_name');
        if (lastSession && select.querySelector(`option[value="${lastSession}"]`)) {
            select.value = lastSession;
            namaAdminAktif = lastSession;
        } else if (data.length > 0) {
            namaAdminAktif = data[0].username;
            select.value = namaAdminAktif;
            localStorage.setItem('duta_admin_name', namaAdminAktif);
        }
        await muatDataKatalog();
    } catch (e) {
        console.error("Gagal memuat admin:", e.message);
    }
}

// 2. GANTI ADMIN
async function gantiAdminAktif(val) {
    if (!val) return;
    namaAdminAktif = val.trim().toLowerCase();
    localStorage.setItem('duta_admin_name', namaAdminAktif);
    await muatDataKatalog();
}

// 3. AMBIL DATA PRODUK
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
        alert("Gagal memuat produk: " + e.message);
    }
}

// 4. RENDER TABEL & FUNGSI AKSI
function renderTabel() {
    const tbody = document.getElementById("tabelProduk");
    if (!tbody) return;

    let html = "";
    daftarProduk.forEach(p => {
        html += `<tr>
            <td><img src="${p.gambar1 || 'https://via.placeholder.com/50'}" style="width:50px;"></td>
            <td><strong>${p.nama}</strong><br><span style="font-size:10px;">👤 ${p.pemilik}</span></td>
            <td>${p.kategori || '-'}</td>
            <td>Rp ${Number(p.harga).toLocaleString()}</td>
            <td>${p.stok}</td>
            <td>
                <button onclick="editForm(${p.id})">Edit</button>
                <button onclick="hapusProduk(${p.id}, '${p.nama}')">Hapus</button>
            </td>
        </tr>`;
    });
    tbody.innerHTML = html || '<tr><td colspan="6">Belum ada produk.</td></tr>';
}

// 5. HAPUS PRODUK
async function hapusProduk(id, nama) {
    if (!confirm(`Hapus produk "${nama}"?`)) return;
    try {
        const { error } = await _supabase.from('produk').delete().eq('id', id).eq('pemilik', namaAdminAktif);
        if (error) throw error;
        alert("Produk berhasil dihapus!");
        await muatDataKatalog();
    } catch (e) { alert("Error hapus: " + e.message); }
}

// 6. BUKA FORM (TAMBAH/EDIT)
function bukaFormTambah() {
    document.getElementById("prodForm").reset();
    document.getElementById("prod_id").value = "";
    document.getElementById("formTitle").innerText = "Tambah Produk Baru";
    document.getElementById("formCard").style.display = "block";
}

function editForm(id) {
    const p = daftarProduk.find(i => i.id === id);
    if(!p) return;
    document.getElementById("prod_id").value = p.id;
    document.getElementById("prod_nama").value = p.nama;
    document.getElementById("prod_harga").value = p.harga;
    document.getElementById("prod_stok").value = p.stok;
    document.getElementById("formTitle").innerText = "Edit Produk";
    document.getElementById("formCard").style.display = "block";
}

function tutupForm() { document.getElementById("formCard").style.display = "none"; }

// 7. FUNGSI PENDUKUNG
function updateDropdownKategori() {
    const select = document.getElementById("prod_kategori_select");
    if (!select) return;
    select.innerHTML = '<option value="">-- Pilih Kategori --</option>';
    Array.from(daftarKategoriSedia).sort().forEach(kat => {
        select.innerHTML += `<option value="${kat}">${kat}</option>`;
    });
}

function hitungDanRenderSummary() {
    const elJenis = document.getElementById("statTotalJenis");
    const elStok = document.getElementById("statTotalStok");
    if (elJenis) elJenis.innerText = daftarProduk.length + " Item";
    if (elStok) elStok.innerText = daftarProduk.reduce((a, b) => a + (Number(b.stok) || 0), 0) + " Pcs";
}
// Tambahkan fungsi ini di admin.js
function hitungLabaAdminOtomatis() {
    const hargaBeli = parseFloat(document.getElementById('prod_harga_beli').value) || 0;
    const hargaJualAsli = parseFloat(document.getElementById('prod_harga').value) || 0;
    const diskonPersen = parseFloat(document.getElementById('prod_diskon').value) || 0;

    const hargaJualSetelahDiskon = hargaJualAsli - (hargaJualAsli * (diskonPersen / 100));
    const untungPcs = hargaJualSetelahDiskon - hargaBeli;

    // Tampilkan di layar
    document.getElementById('prod_estimasi_untung').value = new Intl.NumberFormat('id-ID', { 
        style: 'currency', currency: 'IDR', maximumFractionDigits: 0 
    }).format(untungPcs);

    // Simpan nilai murni (angka saja) ke hidden input untuk database
    const hiddenUntung = document.getElementById('prod_estimasi_untung_val');
    if (hiddenUntung) hiddenUntung.value = untungPcs;
}
// Tambahkan fungsi ini di atas fungsi muatKatalogKeuntungan
async function isiDropdownAdmin() {
    const select = document.getElementById("pilih-admin");
    if (!select) return;

    try {
        const { data, error } = await supabaseClient
            .from('akses_admin')
            .select('username')
            .order('username');
        
        if (error) throw error;

        select.innerHTML = '<option value="">-- Pilih Admin --</option>';
        data.forEach(acc => {
            select.innerHTML += `<option value="${acc.username}">${acc.username.toUpperCase()}</option>`;
        });

        // Set value jika sudah ada di localStorage
        const adminTersimpan = localStorage.getItem('duta_admin_name');
        if (adminTersimpan) select.value = adminTersimpan;
        
    } catch (e) {
        console.error("Gagal memuat dropdown admin:", e.message);
    }
}
async function simpanProduk() {
    // ... proses insert ke supabase ...
    const { error } = await _supabase.from('produk').insert([dataBaru]);
    
    if (!error) {
        alert("Produk berhasil ditambah!");
        tutupForm(); // Tutup form
        await muatDataKatalog(); // <--- WAJIB ADA: Ini memanggil ulang data dari database
    } else {
        alert("Gagal: " + error.message);
    }
}
