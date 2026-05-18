const SUPABASE_URL = "https://opgeeqnucxrdqcgwcuge.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZ2VlcW51Y3hyZHFjZ3djdWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMTgzODAsImV4cCI6MjA5NDU5NDM4MH0.yT10QOFErxHbTL8X-QOUQ8EydcJuLpStCbd8ucfTJr8";

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let daftarProduk = [];
let daftarKategoriSedia = new Set();
let namaAdminAktif = "";

// Initial run
window.onload = async () => { 
    await muatDropdownAdmin();
    await muatDataKatalog();
    await muatDataPengaturanDanBanner();
};

// 1. ME-LOAD DROPDOWN SECARA REALTIME DARI DATABASE
async function muatDropdownAdmin() {
    try {
        const { data, error } = await _supabase.from('akses_admin').select('username').order('username', { ascending: true });
        if (error) throw error;

        const select = document.getElementById("dropdownAdmin");
        select.innerHTML = "";

        if (data && data.length > 0) {
            data.forEach(acc => {
                select.innerHTML += `<option value="${acc.username}">${acc.username.toUpperCase()}</option>`;
            });
        } else {
            select.innerHTML = `<option value="dutaterang">DUTATERANG</option>`;
        }

        let lastSession = localStorage.getItem('duta_admin_name');
        
        if (lastSession && select.querySelector(`option[value="${lastSession}"]`)) {
            select.value = lastSession;
            namaAdminAktif = lastSession;
        } else {
            namaAdminAktif = select.value;
            localStorage.setItem('duta_admin_name', namaAdminAktif);
        }
    } catch (e) {
        alert("Gagal memuat sistem keamanan: " + e.message);
        blokirTotalPanel("Sistem Keamanan Gagal Dimuat");
    }
}

// 2. PROTEKSI KETAT SAAT USER MEMILIH / MENGUBAH VALUE DROPDOWN
async function gantiAdminAktif(val) {
    val = val.trim().toLowerCase();
    
    try {
        // Validasi database untuk memastikan nama terdaftar asli
        const { data, error } = await _supabase.from('akses_admin').select('username').eq('username', val).single();
        
        if (error || !data) {
            alert("❌ GAGAL! KODE ATAU NAMA ADMIN SALAH / TIDAK TERDAFTAR!");
            blokirTotalPanel("AKSES DIKUNCI: IDENTITAS TIDAK VALID");
            return;
        }

        namaAdminAktif = val;
        localStorage.setItem('duta_admin_name', val);
        alert(`Sesi Terverifikasi: ${val.toUpperCase()}`);
        
        // Refresh katalog jika lolos validasi keamanan
        muatDataKatalog();
        muatDataPengaturanDanBanner();
        
    } catch (e) {
        alert("Terjadi masalah pada enkripsi verifikasi.");
        blokirTotalPanel("AKSES DIKUNCI");
    }
}

// 3. MENAMBAH ORANG BARU KE DALAM DATABASE LEWAT DROPDOWN PANEL
async function tambahAdminBaru() {
    let namaBaru = prompt("Masukkan nama pengguna/admin baru:");
    if (!namaBaru || namaBaru.trim() === "") return;

    namaBaru = namaBaru.trim().toLowerCase();

    try {
        const { error } = await _supabase.from('akses_admin').insert([{ username: namaBaru, bisa_update: true }]);
        if (error) throw error;

        alert(`Admin "${namaBaru.toUpperCase()}" berhasil ditambahkan!`);
        await muatDropdownAdmin();
        
        document.getElementById("dropdownAdmin").value = namaBaru;
        gantiAdminAktif(namaBaru);
    } catch (e) {
        alert("Gagal mendaftarkan nama baru (Nama mungkin sudah dipakai orang lain).");
    }
}

// 4. KUNCI TOTAL TAMPILAN JIKA NAMA NGASAL / DI-MANIPULASI
function blokirTotalPanel(pesan) {
    daftarProduk = [];
    document.getElementById("tabelProduk").innerHTML = `
        <tr>
            <td colspan="6" style="text-align:center; color: red; font-weight: bold; padding: 30px;">
                ⚠️ ${pesan}. Pilih nama admin terdaftar pada opsi dropdown di atas!
            </td>
        </tr>
    `;
    document.getElementById("statTotalJenis").innerText = "0 Item";
    document.getElementById("statTotalStok").innerText = "0 Pcs";
    tutupForm();
}

// 5. AMBIL DATA DARI SUPABASE
async function muatDataKatalog() {
    if (!namaAdminAktif || namaAdminAktif === "") {
        blokirTotalPanel("IDENTITAS KOSONG");
        return;
    }

    try {
        const { data, error } = await _supabase
            .from('produk')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;
        daftarProduk = data || [];
        
        daftarKategoriSedia.clear();
        daftarProduk.forEach(p => { if(p.kategori) daftarKategoriSedia.add(p.kategori); });
        
        updateDropdownKategori();
        hitungDanRenderSummary();
        renderTabel();
    } catch (e) {
        alert("Gagal memuat data produk: " + e.message);
    }
}

function renderTabel() {
    let html = "";
    if (daftarProduk.length === 0) {
        html = `<tr><td colspan="6" style="text-align:center;">Tidak ada data produk di database.</td></tr>`;
    }
    daftarProduk.forEach(p => {
        const imgUrl = p.gambar1 || 'https://via.placeholder.com/150';
        const pemilikProduk = p.pemilik ? p.pemilik.toLowerCase() : "";
        
        html += `
            <tr>
                <td><img src="${imgUrl}" class="prod-img"></td>
                <td>
                    <strong>${p.nama}</strong>${p.diskon > 0 ? ' <span style="color:red;font-size:11px;">(-'+p.diskon+'%)</span>' : ''}
                    <br><span class="owner-badge">👤 Pemilik: ${pemilikProduk.toUpperCase()}</span>
                </td>
                <td>${p.kategori || '-'}</td>
                <td>Rp ${(Number(p.harga)||0).toLocaleString('id-ID')}</td>
                <td>${p.stok || '0'}</td>
                <td>
                    <button class="btn-primary" style="padding:4px 8px; font-size:12px;" onclick="editForm(${p.id})">Edit</button>
                    <button class="btn-danger" style="padding:4px 8px; font-size:12px;" onclick="hapusProduk(${p.id}, '${p.nama}', '${pemilikProduk}')">Hapus</button>
                </td>
            </tr>
        `;
    });
    document.getElementById("tabelProduk").innerHTML = html;
}

// 6. VALIDASI KEPEMILIKAN PRODUK SAAT UPDATE / SIMPAN DATA
async function simpanProduk(e) {
    e.preventDefault();
    const id = document.getElementById("prod_id").value;
    const pemilikLama = document.getElementById("prod_pemilik_lama").value;
    
    // Blokir aksi jika admin aktif mencoba memodifikasi barang milik orang lain
    if (id && pemilikLama !== namaAdminAktif) {
        alert(`❌ AKSES DITOLAK!\nProduk ini dibuat oleh "${pemilikLama.toUpperCase()}".\nAnda (${namaAdminAktif.toUpperCase()}) tidak berhak mengubah data ini.`);
        return;
    }

    let kategoriFinal = document.getElementById("prod_kategori_manual").value || document.getElementById("prod_kategori_select").value;
    kategoriFinal = kategoriFinal ? kategoriFinal.trim() : "Lainnya";

    const payload = {
        nama: document.getElementById("prod_nama").value,
        kategori: kategoriFinal,
        harga: Number(document.getElementById("prod_harga").value),
        diskon: Number(document.getElementById("prod_diskon").value),
        stok: Number(document.getElementById("prod_stok").value),
        gambar1: document.getElementById("prod_gambar1").value,
        gambar2: document.getElementById("prod_gambar2").value,
        gambar3: document.getElementById("prod_gambar3").value,
        info: document.getElementById("prod_info").value,
        pemilik: id ? pemilikLama : namaAdminAktif // Masukkan hak kepemilikan
    };

    try {
        if (id) {
            const { error } = await _supabase.from('produk').update(payload).eq('id', id);
            if (error) throw error;
            alert("Produk berhasil diperbarui!");
        } else {
            const { error } = await _supabase.from('produk').insert([payload]);
            if (error) throw error;
            alert("Produk baru berhasil ditambahkan!");
        }
        tutupForm();
        muatDataKatalog();
    } catch (err) {
        alert("Gagal menyimpan: " + err.message);
    }
}

// 7. VALIDASI KEPEMILIKAN PRODUK SAAT HAPUS DATA
async function hapusProduk(id, nama, pemilik) {
    if (pemilik !== namaAdminAktif) {
        alert(`❌ AKSES DITOLAK!\nProduk ini milik "${pemilik.toUpperCase()}".\nAnda (${namaAdminAktif.toUpperCase()}) tidak memiliki izin menghapusnya.`);
        return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus produk "${nama}"?`)) {
        try {
            const { error } = await _supabase.from('produk').delete().eq('id', id);
            if (error) throw error;
            alert("Produk berhasil dihapus!");
            muatDataKatalog();
        } catch (err) {
            alert("Gagal menghapus: " + err.message);
        }
    }
}

function editForm(id) {
    const p = daftarProduk.find(item => item.id === id);
    if(!p) return;

    const pemilikProduk = p.pemilik ? p.pemilik.toLowerCase() : "";
    
    if (pemilikProduk !== namaAdminAktif) {
        alert(`⚠️ INFORMASI:\nAnda hanya dapat melihat spek detail produk ini. Anda tidak bisa menyimpannya karena produk ini milik "${pemilikProduk.toUpperCase()}".`);
    }

    document.getElementById("prod_id").value = p.id;
    document.getElementById("prod_pemilik_lama").value = pemilikProduk;
    document.getElementById("prod_nama").value = p.nama || "";
    
    const select = document.getElementById("prod_kategori_select");
    const inputManual = document.getElementById("prod_kategori_manual");
    if(p.kategori && daftarKategoriSedia.has(p.kategori)) {
        select.value = p.kategori;
        inputManual.style.display = "none";
        inputManual.value = p.kategori;
    } else {
        select.value = "";
        inputManual.style.display = "block";
        inputManual.value = p.kategori || "";
    }

    document.getElementById("prod_harga").value = p.harga || 0;
    document.getElementById("prod_diskon").value = p.diskon || 0;
    document.getElementById("prod_stok").value = p.stok || 0;
    document.getElementById("prod_gambar1").value = p.gambar1 || "";
    document.getElementById("prod_gambar2").value = p.gambar2 || "";
    document.getElementById("prod_gambar3").value = p.gambar3 || "";
    document.getElementById("prod_info").value = p.info || "";
    
    document.getElementById("formTitle").innerText = "Edit Produk: " + p.nama;
    document.getElementById("formCard").style.display = "block";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- UTILITY SCRIPT (PENGATURAN COUNTER, KATEGORI & TAB) ---
function hitungDanRenderSummary() {
    let totalJenis = daftarProduk.length;
    let totalStok = 0;
    daftarProduk.forEach(p => { totalStok += (Number(p.stok) || 0); });
    document.getElementById("statTotalJenis").innerText = totalJenis + " Item";
    document.getElementById("statTotalStok").innerText = totalStok + " Pcs";
}

function updateDropdownKategori() {
    const select = document.getElementById("prod_kategori_select");
    select.innerHTML = '<option value="">-- Pilih Kategori --</option>';
    daftarKategoriSedia.forEach(kat => { select.innerHTML += `<option value="${kat}">${kat}</option>`; });
}

function aktifkanInputKategoriBaru(e) {
    e.preventDefault();
    const inputManual = document.getElementById("prod_kategori_manual");
    const select = document.getElementById("prod_kategori_select");
    inputManual.style.display = "block"; inputManual.value = ""; select.value = ""; inputManual.focus();
}

function handleKategoriSelect(selectEl) {
    const inputManual = document.getElementById("prod_kategori_manual");
    if(selectEl.value !== "") { inputManual.style.display = "none"; inputManual.value = selectEl.value; }
}

function bukaFormTambah() {
    document.getElementById("prodForm").reset();
    document.getElementById("prod_id").value = "";
    document.getElementById("prod_pemilik_lama").value = "";
    document.getElementById("prod_kategori_manual").style.display = "none";
    document.getElementById("formTitle").innerText = "Tambah Produk Baru";
    document.getElementById("formCard").style.display = "block";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function tutupForm() { document.getElementById("formCard").style.display = "none"; }

function switchTab(tabId, el) {
    document.querySelectorAll('.panel-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.add('active'); el.classList.add('active');
}

async function muatDataPengaturanDanBanner() {
    try {
        let { data: config } = await _supabase.from('pengaturan').select('*').eq('id', 1).single();
        if (config) {
            document.getElementById('set-running-text').value = config.running_text || '';
            document.getElementById('set-terpasang').value = config.total_terpasang || '0';
        }
        let { data: banners } = await _supabase.from('banners').select('*').order('urutan', { ascending: true });
        renderTabelBanner(banners || []);
    } catch (e) { console.error(e); }
}

async function simpanPengaturan(e) {
    e.preventDefault();
    try {
        const { error } = await _supabase.from('pengaturan').update({ 
            running_text: document.getElementById('set-running-text').value, 
            total_terpasang: document.getElementById('set-terpasang').value 
        }).eq('id', 1);
        if (error) throw error; alert('Konfigurasi Beranda sukses disimpan!');
    } catch (err) { alert(err.message); }
}

async function simpanBanner(e) {
    e.preventDefault();
    try {
        const { error } = await _supabase.from('banners').insert([{ 
            judul: document.getElementById('banner-judul').value, 
            image_url: document.getElementById('banner-url').value, 
            urutan: parseInt(document.getElementById('banner-urutan').value), aktif: true 
        }]);
        if (error) throw error; alert('Banner berhasil ditambahkan!');
        document.getElementById('form-banner').reset(); muatDataPengaturanDanBanner();
    } catch (err) { alert(err.message); }
}

function renderTabelBanner(banners) {
    let html = "";
    if (banners.length === 0) html = `<tr><td colspan="5" style="text-align:center;">Belum ada banner aktif.</td></tr>`;
    banners.forEach(b => {
        html += `<tr>
            <td><img src="${b.image_url}" class="prod-img" style="width:80px;height:45px;"></td>
            <td><strong>${b.judul || 'Tanpa Judul'}</strong></td>
            <td>${b.urutan}</td>
            <td><span style="color:${b.aktif?'green':'red'};">● Aktif</span></td>
            <td><button class="btn-danger" style="padding:4px 8px;font-size:12px;" onclick="hapusBanner(${b.id})">Hapus</button></td>
        </tr>`;
    });
    document.getElementById('tabelBanners').innerHTML = html;
}

async function logoutBanner(id) {
    if (confirm("Hapus banner promo ini?")) {
        try { const { error } = await _supabase.from('banners').delete().eq('id', id); if (error) throw error; muatDataPengaturanDanBanner(); } catch (err) { alert(err.message); }
    }
}
