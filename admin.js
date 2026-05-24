const SUPABASE_URL = "https://opgeeqnucxrdqcgwcuge.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZ2VlcW51Y3hyZHFjZ3djdWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMTgzODAsImV4cCI6MjA5NDU5NDM4MH0.yT10QOFErxHbTL8X-QOUQ8EydcJuLpStCbd8ucfTJr8";

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let daftarProduk = [];
let namaAdminAktif = "";

// INISIALISASI
document.addEventListener('DOMContentLoaded', async () => {
    await muatDropdownAdmin();
});

// 1. MEMUAT DAFTAR ADMIN
async function muatDropdownAdmin() {
    const select = document.getElementById("dropdownAdmin");
    try {
        const { data, error } = await _supabase.from('akses_admin').select('username').order('username');
        if (error) throw error;

        const options = '<option value="">-- Pilih Admin --</option>' + 
                        data.map(acc => `<option value="${acc.username}">${acc.username.toUpperCase()}</option>`).join('');
        
        if (select) select.innerHTML = options;

        let lastSession = localStorage.getItem('duta_admin_name');
        if (lastSession) {
            namaAdminAktif = lastSession;
            if (select) select.value = lastSession;
        } else if (data.length > 0) {
            namaAdminAktif = data[0].username;
        }
        await muatDataKatalog();
    } catch (e) {
        console.error("Gagal muat admin:", e.message);
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
            .order('updated_at', { ascending: false });

        if (error) throw error;
        daftarProduk = data || [];
        updateDropdownKategori();
        hitungDanRenderSummary();
        renderTabel();
    } catch (e) {
        console.error("Gagal muat produk:", e.message);
    }
}

// 3. FUNGSI FORM
function bukaFormTambah() {
    document.getElementById("prod_id").value = "";
    document.getElementById("prod_nama").value = "";
    document.getElementById("prod_harga").value = "";
    document.getElementById("prod_stok").value = "10";
    document.getElementById("prod_harga_beli").value = "";
    document.getElementById("prod_diskon").value = "0";
    document.getElementById("prod_gambar1").value = "";
    document.getElementById("prod_gambar2").value = "";
    document.getElementById("prod_gambar3").value = "";
    document.getElementById("formTitle").innerText = "Tambah Produk Baru";
    document.getElementById("formCard").style.display = "block";
}

async function simpanProduk(event) {
    if (event) event.preventDefault();

    const prodId = document.getElementById("prod_id").value;
    const dataForm = {
        nama: document.getElementById("prod_nama").value,
        harga: parseFloat(document.getElementById("prod_harga").value) || 0,
        stok: parseInt(document.getElementById("prod_stok").value) || 0,
        harga_beli: parseFloat(document.getElementById("prod_harga_beli").value) || 0,
        gambar1: document.getElementById("prod_gambar1").value || "",
        gambar2: document.getElementById("prod_gambar2").value || "",
        gambar3: document.getElementById("prod_gambar3").value || "",
        estimasi_untung: parseFloat(document.getElementById("prod_estimasi_untung_val").value) || 0,
        pemilik: namaAdminAktif,
        updated_at: new Date().toISOString()
    };

    try {
        if (prodId) {
            await _supabase.from('produk').update(dataForm).eq('id', prodId);
        } else {
            dataForm.created_at = new Date().toISOString();
            await _supabase.from('produk').insert([dataForm]);
        }
        alert("Data berhasil disimpan!");
        tutupForm();
        await muatDataKatalog();
    } catch (e) {
        alert("Error: " + e.message);
    }
}

// 4. RENDER DAN UI
function renderTabel() {
    const tbody = document.getElementById("tabelProduk");
    if (!tbody) return;
    tbody.innerHTML = daftarProduk.length > 0 ? daftarProduk.map(p => `<tr>
        <td><img src="${p.gambar1 || 'https://via.placeholder.com/50'}" style="width:50px; height:50px; object-fit:cover;"></td>
        <td><strong>${p.nama}</strong><br><small>${p.pemilik}</small></td>
        <td>${p.kategori || '-'}</td>
        <td>Rp ${Number(p.harga).toLocaleString()}</td>
        <td>${p.stok}</td>
        <td>
            <button onclick="editForm(${p.id})">Edit</button>
            <button onclick="hapusProduk(${p.id}, '${p.nama}')">Hapus</button>
        </td>
    </tr>`).join('') : '<tr><td colspan="6">Belum ada produk.</td></tr>';
}

function editForm(id) {
    const p = daftarProduk.find(i => i.id === id);
    if(!p) return;
    document.getElementById("prod_id").value = p.id;
    document.getElementById("prod_nama").value = p.nama;
    document.getElementById("prod_harga").value = p.harga;
    document.getElementById("prod_stok").value = p.stok;
    document.getElementById("prod_harga_beli").value = p.harga_beli || "";
    document.getElementById("prod_gambar1").value = p.gambar1 || "";
    document.getElementById("formTitle").innerText = "Edit Produk";
    document.getElementById("formCard").style.display = "block";
    hitungLabaAdminOtomatis();
}

// FUNGSI PEMBANTU
function tutupForm() { document.getElementById("formCard").style.display = "none"; }
function hitungDanRenderSummary() {
    document.getElementById("statTotalJenis").innerText = daftarProduk.length + " Item";
    document.getElementById("statTotalStok").innerText = daftarProduk.reduce((s, p) => s + (Number(p.stok) || 0), 0) + " Pcs";
}
async function gantiAdminAktif(val) {
    namaAdminAktif = val;
    localStorage.setItem('duta_admin_name', val);
    await muatDataKatalog();
}
function updateDropdownKategori() {
    const select = document.getElementById("prod_kategori_select");
    if (!select) return;
    const kategori = [...new Set(daftarProduk.map(p => p.kategori).filter(Boolean))];
    select.innerHTML = '<option value="">-- Pilih Kategori --</option>' + kategori.map(k => `<option value="${k}">${k}</option>`).join('');
}
function hitungLabaAdminOtomatis() {
    const beli = parseFloat(document.getElementById('prod_harga_beli')?.value) || 0;
    const jual = parseFloat(document.getElementById('prod_harga')?.value) || 0;
    const untung = jual - beli;
    const elTampil = document.getElementById('prod_estimasi_untung');
    if (elTampil) elTampil.value = "Rp " + untung.toLocaleString();
    document.getElementById('prod_estimasi_untung_val').value = untung;
}
