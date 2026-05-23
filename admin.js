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

// 3. SIMPAN (TAMBAH/EDIT)
async function simpanProduk() {
    const prodId = document.getElementById("prod_id").value;
    
    // Ambil data dari form
    const dataForm = {
        nama: document.getElementById("prod_nama").value,
        harga: parseFloat(document.getElementById("prod_harga").value) || 0,
        stok: parseInt(document.getElementById("prod_stok").value) || 0,
        pemilik: namaAdminAktif
    };

    try {
        let error;
        if (prodId) {
            // EDIT
            const { error: err } = await _supabase.from('produk').update(dataForm).eq('id', prodId);
            error = err;
        } else {
            // TAMBAH
            const { error: err } = await _supabase.from('produk').insert([dataForm]);
            error = err;
        }

        if (error) throw error;

        alert("Berhasil disimpan!");
        tutupForm();
        await muatDataKatalog(); // Refresh otomatis
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
    const p = daftarProduk.find(i => i.id === id);
    if(!p) return;
    document.getElementById("prod_id").value = p.id;
    document.getElementById("prod_nama").value = p.nama;
    document.getElementById("prod_harga").value = p.harga;
    document.getElementById("prod_stok").value = p.stok;
    document.getElementById("formTitle").innerText = "Edit Produk";
    document.getElementById("formCard").style.display = "block";
}

function bukaFormTambah() {
    document.getElementById("prodForm").reset();
    document.getElementById("prod_id").value = "";
    document.getElementById("formTitle").innerText = "Tambah Produk Baru";
    document.getElementById("formCard").style.display = "block";
}

function tutupForm() { document.getElementById("formCard").style.display = "none"; }
