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

// 1. MEMUAT SEMUA DAFTAR ADMIN KE DROPDOWN
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

        // Cek sesi login terakhir
        let lastSession = localStorage.getItem('duta_admin_name');
        
        if (lastSession && select.querySelector(`option[value="${lastSession}"]`)) {
            select.value = lastSession;
            namaAdminAktif = lastSession;
        } else {
            namaAdminAktif = select.value; // Jika tidak ada sesi, pakai admin pertama di list
            localStorage.setItem('duta_admin_name', namaAdminAktif);
        }

        await muatDataKatalog();

    } catch (e) {
        alert("Gagal memuat sistem keamanan: " + e.message);
        blokirTotalPanel("Sistem Keamanan Gagal Dimuat");
    }
}

// 2. KETIKA DROPDOWN DIGANTI, VERIFIKASI DAN MUAT ULANG KATALOG
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
        
        await muatDataKatalog();
        
    } catch (e) {
        alert("Terjadi kesalahan verifikasi identitas.");
        blokirTotalPanel("AKSES DIKUNCI");
    }
}

// 3. AMBIL DATA PRODUK BERDASARKAN PEMILIK AKTIF
async function muatDataKatalog() {
    if (!namaAdminAktif || namaAdminAktif === "") {
        blokirTotalPanel("IDENTITAS KOSONG");
        return;
    }

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
        alert("Gagal memuat data produk: " + e.message);
    }
}

// 4. RENDER TABEL PRODUK
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
    
    // Mengambil nilai dari input text baru jika diisi, jika tidak gunakan dropdown
    let kategoriFinal = kategoriInputBaru || kategoriDropdown;
    kategoriFinal = kategoriFinal ? kategoriFinal.trim() : "Lainnya";

    // AMBIL NILAI INPUT HARGA BELI / MODAL BARU
    const hargaBeli = Number(document.getElementById("prod_harga_beli").value) || 0;
    const qtyStok = Number(document.getElementById("prod_stok").value);

    const payload = {
        nama: document.getElementById("prod_nama").value,
        kategori: kategoriFinal,
        harga: Number(document.getElementById("prod_harga").value),
        diskon: Number(document.getElementById("prod_diskon").value),
        stok: qtyStok,
        gambar1: document.getElementById("prod_gambar1").value,
        gambar2: document.getElementById("prod_gambar2").value,
        gambar3: document.getElementById("prod_gambar3").value,
        info: document.getElementById("prod_info").value,
        pemilik: namaAdminAktif
    };

    try {
        if (id) {
            // PROSES UPDATE PRODUK LAMA
            const { error } = await _supabase.from('produk').update(payload).eq('id', id).eq('pemilik', namaAdminAktif);
            if (error) throw error;

            // Opsional: Jika saat mengedit kamu memasukkan harga beli baru > 0, catat sebagai riwayat restock baru
            if (hargaBeli > 0) {
                await _supabase.from('order_supplier').insert([{
                    produk_id: Number(id),
                    qty_order: qtyStok,
                    harga_beli_satuan: hargaBeli,
                    total_tagihan: qtyStok * hargaBeli,
                    status_order: 'selesai'
                }]);
            }

            alert("✅ Produk berhasil diperbarui!");
        } else {
            // PROSES TAMBAH PRODUK BARU (Ditambah .select() untuk mengambil ID yang baru tercipta)
            const { data: produkBaru, error } = await _supabase.from('produk').insert([payload]).select();
            if (error) throw error;

            // JIKA PRODUK BARU BERHASIL DI-INSERT, OTOMATIS MASUKKAN KE ORDER_SUPPLIER
            if (produkBaru && produkBaru.length > 0) {
                const idProdukBaru = produkBaru[0].id;
                
                const { error: errorSupplier } = await _supabase.from('order_supplier').insert([{
                    produk_id: idProdukBaru,
                    qty_order: qtyStok,
                    harga_beli_satuan: hargaBeli,
                    total_tagihan: qtyStok * hargaBeli,
                    status_order: 'selesai'
                }]);
                
                if (errorSupplier) throw errorSupplier;
            }

            alert("✅ Produk baru & data analisis keuntungan berhasil ditambahkan!");
        }
        tutupForm();
        await muatDataKatalog();
    } catch (err) {
        alert("❌ Gagal menyimpan: " + err.message);
    }
}

// 6. PROSES HAPUS PRODUK
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
        await muatDropdownAdmin();
        
        document.getElementById("dropdownAdmin").value = namaBaru;
        await gantiAdminAktif(namaBaru);
    } catch (e) {
        alert("Gagal mendaftarkan nama baru (Kemungkinan nama sudah terdaftar).");
    }
}

// HAPUS / NONAKTIFKAN ADMIN
async function hapusAdminAktif() {
    const adminYangAkanDihapus = document.getElementById("dropdownAdmin").value;

    if (!adminYangAkanDihapus) {
        alert("Pilih nama admin yang ingin dihapus terlebih dahulu pada dropdown di atas!");
        return;
    }

    if (adminYangAkanDihapus.toLowerCase() === "dutaterang") {
        alert("❌ AKSES DITOLAK!\nAdmin utama 'dutaterang' adalah sistem pusat dan tidak boleh dihapus.");
        return;
    }

    const konfirmasi = confirm(`Apakah Anda yakin ingin MENGHAPUS total admin "${adminYangAkanDihapus.toUpperCase()}"?\n\nSemua hak akses masuk orang ini akan dicabut seketika.`);
    
    if (konfirmasi) {
        try {
            const { error } = await _supabase
                .from('akses_admin')
                .delete()
                .eq('username', adminYangAkanDihapus);

            if (error) throw error;

            alert(`Admin "${adminYangAkanDihapus.toUpperCase()}" telah berhasil dihapus dari sistem!`);
            
            if (namaAdminAktif === adminYangAkanDihapus) {
                localStorage.removeItem('duta_admin_name');
            }

            await muatDropdownAdmin();

        } catch (e) {
            alert("Gagal menghapus admin: " + e.message);
        }
    }
}

// 8. FUNGSI LOCKDOWN PANEL
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

// 9. FORM EDIT PRODUK
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

// 10. UTILITIES & INPUT HANDLERS
function hitungDanRenderSummary() {
    let totalJenis = daftarProduk.length;
    let totalStok = 0;
    daftarProduk.forEach(p => { totalStok += (Number(p.stok) || 0); });
    document.getElementById("statTotalJenis").innerText = totalJenis + " Item";
    document.getElementById("statTotalStok").innerText = totalStok + " Pcs";
}

// ==================== PERBAIKAN DI ADMIN.JS (BAGIAN 10) ====================

function updateDropdownKategori() {
    const select = document.getElementById("prod_kategori_select");
    select.innerHTML = '<option value="">-- Pilih Kategori --</option>';
    const kategoriUrut = Array.from(daftarKategoriSedia).sort();
    kategoriUrut.forEach(kat => { 
        if(kat) select.innerHTML += `<option value="${kat}">${kat}</option>`; 
    });
}

// DIGANTI: Mengikuti nama fungsi di HTML Anda (aktifkanInputKategoriBaru)
function aktifkanInputKategoriBaru(e) {
    e.preventDefault();
    const inputBaru = document.getElementById("prod_kategori_baru");
    const selectUtama = document.getElementById("prod_kategori_select");
    
    if (inputBaru && selectUtama) {
        inputBaru.style.display = "block"; 
        inputBaru.value = ""; 
        selectUtama.value = ""; 
        inputBaru.focus();
    }
}

// DIGANTI: Mengikuti nama fungsi di HTML Anda (handleKategoriSelect)
function handleKategoriSelect(selectEl) {
    const inputBaru = document.getElementById("prod_kategori_baru");
    if (inputBaru) {
        if (selectEl.value !== "") { 
            inputBaru.style.display = "none"; 
            inputBaru.value = selectEl.value; 
        } else {
            inputBaru.style.display = "none";
            inputBaru.value = "";
        }
    }
}
// ==================== PERBAIKAN STRUKTUR UTAMA DI SINI ====================
function bukaFormTambah() {
    // 1. Memastikan form dan input ID dibersihkan saat tombol tambah diklik
    const prodForm = document.getElementById("prodForm");
    const prodId = document.getElementById("prod_id");

    if (prodForm) prodForm.reset();
    if (prodId) prodId.value = "";

    // 2. Sembunyikan input kategori manual jika ada
    const manualKat = document.getElementById("prod_kategori_manual");
    if (manualKat) {
        manualKat.style.display = "none";
        manualKat.value = "";
    }

    const inputBaru = document.getElementById("prod_kategori_baru");
    if (inputBaru) inputBaru.style.display = "none";

    // 3. Menampilkan form card berdasarkan ID asli di HTML Anda
    const modalTarget = document.getElementById("formCard"); 

    if (modalTarget) {
        document.getElementById("formTitle").innerText = "Tambah Produk Baru";
        modalTarget.style.display = "block"; 
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        console.error("Error: Elemen dengan ID 'formCard' tidak ditemukan di HTML.");
    }
} 

function tutupForm() { 
    document.getElementById("formCard").style.display = "none"; 
}

function switchTab(tabId, el) {
    document.querySelectorAll('.panel-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.add('active'); el.classList.add('active');
}

// 11. MANAGEMENT BANNER DAN KONFIGURASI BERANDA
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
// 1. UPDATE TEKS NAMA FILE SAAT DIEMBAT USER
function updateFileNameDisplay(input) {
    const messageSpan = document.getElementById('fileChosenMessage');
    if (input.files && input.files.length > 0) {
        messageSpan.innerText = input.files[0].name;
        messageSpan.style.color = "#16a34a";
        messageSpan.style.fontWeight = "bold";
    } else {
        messageSpan.innerText = "atau seret file ke sini";
        messageSpan.style.color = "#64748b";
        messageSpan.style.fontWeight = "normal";
    }
}

// 2. MEMBUAT TEMPLATE DENGAN KOLOM PEMILIK DI DALAMNYA
function downloadTemplateMassal(format) {
    // Menambahkan 'pemilik' ke dalam susunan header template
    const headers = ["nama", "pemilik", "kategori", "harga", "diskon", "stok", "gambar1", "gambar2", "gambar3", "info"];
    const contohData = ["Modul LED 12W Super", "Duta Terang", "Modul", "45000", "0", "10", "https://link-gambar.com/1.jpg", "", "", "Promo cuci gudang"];
    
    let content = "";
    let mimeType = "";
    let extension = "";

    if (format === 'csv') {
        content = [headers.join(","), contohData.join(",")].join("\n");
        mimeType = "text/csv;charset=utf-8;";
        extension = "csv";
    } else {
        // Format Tab-Separated (XLS) agar terbaca rapi per kolom di Excel
        content = [headers.join("\t"), contohData.join("\t")].join("\n");
        mimeType = "application/vnd.ms-excel;charset=utf-8;";
        extension = "xls";
    }
    
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement("a");
    
    if (navigator.msSaveBlob) { 
        navigator.msSaveBlob(blob, `template_produk_massal.${extension}`);
    } else {
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `template_produk_massal.${extension}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// 3. DOWNLOAD BACKUP DATA (TERMASUK KOLOM PEMILIK)
async function downloadSemuaProdukAktif() {
    try {
        const clientSupabase = typeof _supabase !== 'undefined' ? _supabase : (typeof supabase !== 'undefined' ? supabase : null);
        
        if (!clientSupabase) {
            return alert("Koneksi Supabase tidak ditemukan.");
        }

        // Mengunduh kolom pemilik juga dari database
        const { data, error } = await clientSupabase
            .from('produk') 
            .select('nama, pemilik, kategori, harga, diskon, stok, gambar1, gambar2, gambar3, info');

        if (error) throw error;
        if (!data || data.length === 0) return alert("Belum ada data produk di database.");

        const headers = Object.keys(data[0]);
        const rows = data.map(row => headers.map(header => `"${row[header] !== null ? row[header] : ''}"`).join(","));
        const csvContent = [headers.join(","), ...rows].join("\n");
        
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "backup_semua_produk.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (err) {
        alert("Gagal mengunduh data: " + err.message);
    }
}

// 4. PROSES UPLOAD MASSAL (MEMBACA DATA PEMILIK LANGSUNG DARI FILE EXCEL)
async function prosesUploadMassal() {
    const fileInput = document.querySelector('.file-input');
    if (!fileInput.files || fileInput.files.length === 0) {
        return alert("Silakan pilih file Excel/CSV hasil isi template terlebih dahulu!");
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async function(e) {
        const text = e.target.result;
        
        const rows = text.split(/\r?\n/).map(r => r.trim()).filter(row => row !== "");
        if (rows.length <= 1) return alert("File kosong atau hanya terdeteksi baris judul kolom!");
        
        // Deteksi pemisah kolom otomatis (; , atau tab)
        let separator = ",";
        if (rows[0].includes(";")) {
            separator = ";";
        } else if (rows[0].includes("\t")) {
            separator = "\t";
        }
        
        const headers = rows[0].split(separator).map(h => h.trim().replace(/['"]/g, '').toLowerCase());
        const dataRows = rows.slice(1);

        if (dataRows.length > 50) {
            return alert(`Gagal! Maksimal 50 produk per upload.`);
        }

        const dataToInsert = [];
        
        dataRows.forEach((row) => {
            const values = row.split(separator).map(v => v.trim().replace(/['"]/g, ''));
            
            if (values.length >= headers.length) {
                let produkObj = {};
                headers.forEach((header, index) => {
                    if (['harga', 'stok', 'diskon'].includes(header)) {
                        let angkaBersih = values[index] ? values[index].replace(/[^0-9]/g, '') : "0";
                        produkObj[header] = Number(angkaBersih) || 0;
                    } else {
                        // Membaca string teks termasuk kolom 'pemilik' yang diisi di excel
                        produkObj[header] = values[index] || "";
                    }
                });

                dataToInsert.push(produkObj);
            }
        });

        if (dataToInsert.length === 0) return alert("Tidak ada data produk valid yang bisa diproses.");

        // Eksekusi kirim data massal ke Supabase
        try {
            const clientSupabase = typeof _supabase !== 'undefined' ? _supabase : (typeof supabase !== 'undefined' ? supabase : null);
            
            if (!clientSupabase) {
                return alert("Koneksi Supabase tidak ditemukan.");
            }

            const { error } = await clientSupabase
                .from('produk') 
                .insert(dataToInsert);

            if (error) throw error;

            alert(`Sukses! Berhasil mengunggah ${dataToInsert.length} data produk baru dari file template.`);
            
            // Membaca ulang dashboard admin agar tabel & statistik langsung sinkron
            if (typeof muatUlangTabelProduk === "function") {
                muatUlangTabelProduk();
            } else if (typeof ambilDataSupabase === "function") {
                ambilDataSupabase();
            } else {
                window.location.reload();
            }
            
        } catch (err) {
            alert("Gagal memproses ke database Supabase:\n" + err.message);
        }
    };

    reader.readAsText(file);
}
function hitungLabaAdminOtomatis() {
    const hargaBeli = parseFloat(document.getElementById('prod_harga_beli').value) || 0;
    const hargaJualAsli = parseFloat(document.getElementById('prod_harga').value) || 0;
    const diskonPersen = parseFloat(document.getElementById('prod_diskon').value) || 0;

    // Rumus: Harga jual dipotong diskon
    const hargaJualSetelahDiskon = hargaJualAsli - (hargaJualAsli * (diskonPersen / 100));
    
    // Laba = Harga jual bersih dikurangi modal beli
    const untungPcs = hargaJualSetelahDiskon - hargaBeli;

    // 1. Tampilkan ke User (Format Rupiah)
    document.getElementById('prod_estimasi_untung').value = new Intl.NumberFormat('id-ID', { 
        style: 'currency', currency: 'IDR', maximumFractionDigits: 0 
    }).format(untungPcs);

    // 2. Simpan nilai murni (angka saja) ke hidden input untuk database
    // Pastikan ID 'prod_estimasi_untung_val' sudah ada di HTML Anda
    const hiddenUntung = document.getElementById('prod_estimasi_untung_val');
    if (hiddenUntung) {
        hiddenUntung.value = untungPcs;
    }

    // 3. (Opsional) Beri warna merah jika rugi
    document.getElementById('prod_estimasi_untung').style.color = untungPcs < 0 ? '#dc2626' : '#15803d';
}
// Contoh untuk menampilkan data order milik admin dengan ID 1 (dutaterang)
const { data, error } = await supabase
  .from('order_supplier')
  .select(`
    *,
    admin_detail:akses_admin(username)
  `)
  .eq('admin_id', 1); // Ganti angka 1 sesuai ID admin yang sedang login
