const SUPABASE_URL = "https://opgeeqnucxrdqcgwcuge.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZ2VlcW51Y3hyZHFjZ3djdWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMTgzODAsImV4cCI6MjA5NDU5NDM4MH0.yT10QOFErxHbTL8X-QOUQ8EydcJuLpStCbd8ucfTJr8";

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let daftarProduk = [];
let daftarKategoriSedia = new Set();
let namaAdminAktif = "";

// Pemicu awal saat web dibuka
window.onload = async () => { 
    await muatDropdownAdmin();
    // muatDataKatalog otomatis dipanggil di dalam muatDropdownAdmin setelah namaAdminAktif dipastikan siap
    await muatDataPengaturanDanBanner();
};

// 1. MEMUAT SEMUA DAFTAR ADMIN KE DROPDOWN (MENJAWAB: PEMILIK BELUM MUNCUL SEMUA)
async function muatDropdownAdmin() {
    try {
        // Ambil semua username tanpa filter agar semua pemilik muncul di dropdown atas
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

        // Cek sesi login terakhir
        let lastSession = localStorage.getItem('duta_admin_name');
        
        if (lastSession && select.querySelector(`option[value="${lastSession}"]`)) {
            select.value = lastSession;
            namaAdminAktif = lastSession;
        } else {
            namaAdminAktif = select.value; // Jika tidak ada sesi, pakai admin pertama di list
            localStorage.setItem('duta_admin_name', namaAdminAktif);
        }

        // SETELAH DROPDOWN DAN ADMIN AKTIF SIAP, BARU AMBIL DATA PRODUK
        await muatDataKatalog();

    } catch (e) {
        alert("Gagal memuat sistem keamanan: " + e.message);
        blokirTotalPanel("Sistem Keamanan Gagal Dimuat");
    }
}

// 2. KETIKA DROPDOWN DIGANTI, VERIFIKASI DAN MUAT ULANG KATALOG YANG SESUAI
async function gantiAdminAktif(val) {
    val = val.trim().toLowerCase();
    
    try {
        const { data, error } = await _supabase.from('akses_admin').select('username').eq('username', val).single();
        
        if (error || !data) {
            alert("❌ AKSES DITOLAK!\nNama Admin tidak terdaftar di database!");
            blokirTotalPanel("AKSES DIKUNCI: IDENTITAS TIDAK VALID");
            return;
        }

        namaAdminAktif = val;
        localStorage.setItem('duta_admin_name', val);
        
        // Refresh data produk & banner berdasarkan admin yang baru dipilih
        await muatDataKatalog();
        
    } catch (e) {
        alert("Terjadi kesalahan verifikasi identitas.");
        blokirTotalPanel("AKSES DIKUNCI");
    }
}

// 3. AMBIL DATA PRODUK (MENJAWAB: TIAP ORANG HANYA BISA LIHAT PRODUK MASING-MASING)
async function muatDataKatalog() {
    if (!namaAdminAktif || namaAdminAktif === "") {
        blokirTotalPanel("IDENTITAS KOSONG");
        return;
    }

    try {
        // PERBAIKAN UTAMA: Tambahkan filter .eq('pemilik', namaAdminAktif) 
        // Supaya database hanya mengembalikan produk milik admin yang sedang login saja!
        const { data, error } = await _supabase
            .from('produk')
            .select('*')
            .eq('pemilik', namaAdminAktif)
            .order('id', { ascending: false });

        if (error) throw error;
        daftarProduk = data || [];
        
        // Kumpulkan kategori khusus dari produk milik admin ini saja
        daftarKategoriSedia.clear();
        daftarProduk.forEach(p => { if(p.kategori) daftarKategoriSedia.add(p.kategori); });
        
        updateDropdownKategori();
        hitungDanRenderSummary();
        renderTabel();
    } catch (e) {
        alert("Gagal memuat data produk: " + e.message);
    }
}

// 4. RENDER TABEL PRODUK KHUSUS PEMILIK AKTIF
function renderTabel() {
    let html = "";
    if (daftarProduk.length === 0) {
        html = `<tr><td colspan="6" style="text-align:center; color:#64748b; padding:20px;">Anda belum mengupload produk. Silakan tambah produk baru!</td></tr>`;
    }
    
    daftarProduk.forEach(p => {
        const imgUrl = p.gambar1 || 'https://via.placeholder.com/150';
        const pemilikProduk = p.pemilik ? p.pemilik.toLowerCase() : "tidak diketahui";
        
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
                    <button class="btn-danger" style="padding:4px 8px; font-size:12px;" onclick="hapusProduk(${p.id}, '${p.nama}')">Hapus</button>
                </td>
            </tr>
        `;
    });
    document.getElementById("tabelProduk").innerHTML = html;
}

// 5. PROSES SIMPAN PRODUK BARU / EDIT PRODUK LAMA
async function simpanProduk(e) {
    e.preventDefault();
    const id = document.getElementById("prod_id").value;
    
    let kategoriInputBaru = document.getElementById("prod_kategori_baru").value;
    let kategoriDropdown = document.getElementById("prod_kategori_select").value;
    
    let kategoriFinal = kategoriInputBaru || kategoriDropdown;
    kategoriFinal = kategoriFinal ? kategoriFinal.trim() : "Lainnya";

    // Payload data otomatis mengunci field 'pemilik' ke admin yang sedang aktif
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
        pemilik: namaAdminAktif // Dipaksa masuk sebagai pemilik aktif
    };

    try {
        if (id) {
            // Update data
            const { error } = await _supabase.from('produk').update(payload).eq('id', id).eq('pemilik', namaAdminAktif);
            if (error) throw error;
            alert("Produk berhasil diperbarui!");
        } else {
            // Insert data baru
            const { error } = await _supabase.from('produk').insert([payload]);
            if (error) throw error;
            alert("Produk baru berhasil ditambahkan!");
        }
        tutupForm();
        await muatDataKatalog(); // Muat ulang data terfilter
    } catch (err) {
        alert("Gagal menyimpan: " + err.message);
    }
}

// 6. PROSES HAPUS PRODUK (HANYA BISA MENGHAPUS DATA MILIK SENDIRI KARENA SINKRON API)
async function hapusProduk(id, nama) {
    if (confirm(`Apakah Anda yakin ingin menghapus produk "${nama}"?`)) {
        try {
            const { error } = await _supabase.from('produk').delete().eq('id', id).eq('pemilik', namaAdminAktif);
            if (error) throw error;
            alert("Produk berhasil dihapus!");
            await muatDataKatalog();
        } catch (err) {
            alert("Gagal menghapus: " + err.message);
        }
    }
}

// 7. TAMBAH ADMIN BARU LEWAT PANEL
async function tambahAdminBaru() {
    let namaBaru = prompt("Masukkan nama pengguna/admin baru:");
    if (!namaBaru || namaBaru.trim() === "") return;

    namaBaru = namaBaru.trim().toLowerCase();

    try {
        const { error } = await _supabase.from('akses_admin').insert([{ username: namaBaru, bisa_update: true }]);
        if (error) throw error;

        alert(`Admin "${namaBaru.toUpperCase()}" berhasil terdaftar!`);
        await muatDropdownAdmin(); // Reload dropdown agar nama baru muncul
        
        document.getElementById("dropdownAdmin").value = namaBaru;
        await gantiAdminAktif(namaBaru); // Langsung switch ke admin baru
    } catch (e) {
        alert("Gagal mendaftarkan nama baru (Kemungkinan nama sudah terdaftar).");
    }
}
// ==================== FITUR BARU: HAPUS / NONAKTIFKAN ADMIN ====================
async function hapusAdminAktif() {
    // Ambil nama admin yang sedang terpilih di dropdown saat ini
    const adminYangAkanDihapus = document.getElementById("dropdownAdmin").value;

    if (!adminYangAkanDihapus) {
        alert("Pilih nama admin yang ingin dihapus terlebih dahulu pada dropdown di atas!");
        return;
    }

    // Proteksi keamanan: Jangan biarkan admin utama 'dutaterang' dihapus agar sistem tidak rusak
    if (adminYangAkanDihapus.toLowerCase() === "dutaterang") {
        alert("❌ AKSES DITOLAK!\nAdmin utama 'dutaterang' adalah sistem pusat dan tidak boleh dihapus.");
        return;
    }

    const konfirmasi = confirm(`Apakah Anda yakin ingin MENGHAPUS total admin "${adminYangAkanDihapus.toUpperCase()}"?\n\nSemua hak akses masuk orang ini akan dicabut seketika.`);
    
    if (konfirmasi) {
        try {
            // Eksekusi hapus baris data di tabel Supabase akses_admin
            const { error } = await _supabase
                .from('akses_admin')
                .delete()
                .eq('username', adminYangAkanDihapus);

            if (error) throw error;

            alert(`Admin "${adminYangAkanDihapus.toUpperCase()}" telah berhasil dihapus dari sistem!`);
            
            // Bersihkan sesi login localstorage jika dia menghapus dirinya sendiri
            if (namaAdminAktif === adminYangAkanDihapus) {
                localStorage.removeItem('duta_admin_name');
            }

            // Muat ulang dropdown admin agar nama orang tersebut hilang dari daftar pilihan
            await muatDropdownAdmin();

        } catch (e) {
            alert("Gagal menghapus admin: " + e.message);
        }
    }
}

// 8. FUNGSI LOCKDOWN AMAN JIKA TERJADI INDIKASI MANIPULASI IDENTITAS
function blokirTotalPanel(pesan) {
    daftarProduk = [];
    document.getElementById("tabelProduk").innerHTML = `
        <tr>
            <td colspan="6" style="text-align:center; color: red; font-weight: bold; padding: 30px;">
                ⚠️ ${pesan}. Sila pilih kembali nama Admin yang sah pada dropdown di atas!
            </td>
        </tr>
    `;
    document.getElementById("statTotalJenis").innerText = "0 Item";
    document.getElementById("statTotalStok").innerText = "0 Pcs";
    tutupForm();
}

// --- SISA UTILITY KODE DI BAWAH TETAP SAMA ---
function editForm(id) {
    const p = daftarProduk.find(item => item.id === id);
    if(!p) return;

    document.getElementById("prod_id").value = p.id;
    document.getElementById("prod_nama").value = p.nama || "";
    
    const select = document.getElementById("prod_kategori_select");
    const inputBaru = document.getElementById("prod_kategori_baru");
    
    inputBaru.style.display = "none";
    inputBaru.value = p.kategori || "";

    if (p.kategori && daftarKategoriSedia.has(p.kategori)) {
        select.value = p.kategori;
    } else {
        select.value = "";
        if(p.kategori) inputBaru.style.display = "block";
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
    const kategoriUrut = Array.from(daftarKategoriSedia).sort();
    kategoriUrut.forEach(kat => { if(kat) select.innerHTML += `<option value="${kat}">${kat}</option>`; });
}

function bukaInputKategoriBaru(e) {
    e.preventDefault();
    const inputBaru = document.getElementById("prod_kategori_baru");
    const selectUtama = document.getElementById("prod_kategori_select");
    inputBaru.style.display = "block"; inputBaru.value = ""; selectUtama.value = ""; inputBaru.focus();
}

function handlePilihDropdown(selectEl) {
    const inputBaru = document.getElementById("prod_kategori_baru");
    if (selectEl.value !== "") { inputBaru.style.display = "none"; inputBaru.value = selectEl.value; }
}

function bukaFormTambah() {
    // 1. Pastikan form dan input ID ada sebelum di-reset
    const prodForm = document.getElementById("prodForm");
    const prodId = document.getElementById("prod_id");

    if (prodForm) prodForm.reset();
    if (prodId) prodId.value = "";

    // 2. Amankan bagian pencarian elemen modal/form pop-up
    // GANTI "modalForm" dengan ID elemen pop-up/modal yang ingin Anda munculkan
    const modalTarget = document.getElementById("modalForm"); 

    if (modalTarget) {
        modalTarget.style.display = "block"; // atau "flex" sesuai CSS Anda
    } else {
        // Jika error, pasang alert ini agar Anda tahu ID mana yang salah/tidak ada di HTML
        alert("Gagal membuka form! JavaScript tidak menemukan elemen target.");
        console.error("JavaScript mencari elemen, tapi tidak ketemu. Periksa kembali ID di HTML Anda.");
    }
}
    
    // GANTI DUA BARIS INI MENGGUNAKAN "prod_kategori_manual"
    document.getElementById("prod_kategori_manual").style.display = "none";
    document.getElementById("prod_kategori_manual").value = "";
    
    document.getElementById("formTitle").innerText = "Tambah Produk Baru";
    document.getElementById("formCard").style.display = "block";
    window.scrollTo({ top: 0, behavior: 'smooth' });
} // Jangan lupa pastikan ada penutup kurung kurawal di akhir fungsi

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

async function hapusBanner(id) {
    if (confirm("Hapus banner promo ini?")) {
        try { const { error } = await _supabase.from('banners').delete().eq('id', id); if (error) throw error; muatDataPengaturanDanBanner(); } catch (err) { alert(err.message); }
    }
}
