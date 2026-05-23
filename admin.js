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
        
        // Panggil fungsi pendukung yang tadinya menyebabkan error
        updateDropdownKategori();
        hitungDanRenderSummary();
        renderTabel();
    } catch (e) {
        alert("Gagal memuat produk: " + e.message);
    }
}

// 4. RENDER TABEL
function renderTabel() {
    const tbody = document.getElementById("tabelProduk");
    if (!tbody) return;

    let html = "";
    if (daftarProduk.length === 0) {
        html = `<tr><td colspan="6" style="text-align:center; padding:20px;">Belum ada produk untuk admin ini.</td></tr>`;
    } else {
        daftarProduk.forEach(p => {
            html += `<tr>
                <td><img src="${p.gambar1 || 'https://via.placeholder.com/50'}" style="width:50px;"></td>
                <td><strong>${p.nama}</strong><br><span style="font-size:10px;">👤 ${p.pemilik}</span></td>
                <td>${p.kategori || '-'}</td>
                <td>Rp ${Number(p.harga).toLocaleString()}</td>
                <td>${p.stok}</td>
                <td>
                    <button onclick="editForm(${p.id})">Edit</button>
                    <button onclick="hapusProduk(${p.id})">Hapus</button>
                </td>
            </tr>`;
        });
    }
    tbody.innerHTML = html;
}

// 5. FUNGSI PENDUKUNG (AGAR TIDAK ERROR)
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

// Tambahkan fungsi dummy/placeholder jika editForm/hapusProduk belum ada
function editForm(id) { alert("Edit produk ID: " + id); }
function hapusProduk(id) { alert("Hapus produk ID: " + id); }
