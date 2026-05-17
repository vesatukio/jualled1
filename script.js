/* script.js */
// URL Google Sheets CSV Baru Anda
const URL_PRODUK1 = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAd4pEtxlxD_EaVYx4L_vhhz0U3WmPYNxOXENt1NiTEGRZjpoIECzIRQSQDYhmjGQQYGN6VaMUuQ-C/pub?gid=0&single=true&output=csv";
const URL_PRODUK2 = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAd4pEtxlxD_EaVYx4L_vhhz0U3WmPYNxOXENt1NiTEGRZjpoIECzIRQSQDYhmjGQQYGN6VaMUuQ-C/pub?gid=971357804&single=true&output=csv";

const WA_NUMBER = "6288224166270";
let produk = [], order = {}, deferredPrompt, streamPointer = null;
let pesanPromoTerbaru = "Cek video panduan kami di YouTube!";

window.onload = () => { 
    load(); 
    if(!sessionStorage.getItem('promo_per_sesi')) {
        setTimeout(() => { document.getElementById('installModal').style.display = 'flex'; }, 2000);
    }
};

// Fungsi pembantu untuk membaca CSV dengan pemisah koma (,) atau titik koma (;) secara otomatis
function parseCSV(text) {
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line);
    if (lines.length === 0) return [];
    
    const barisPertama = lines[0];
    const pemisah = barisPertama.includes(';') ? ';' : ',';
    
    const splitCSVLine = (line, separator) => {
        const result = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            let char = line.charAt(i);
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === separator && !inQuotes) {
                result.push(current.trim().replace(/^"|"$/g, ''));
                current = "";
            } else {
                current += char;
            }
        }
        result.push(current.trim().replace(/^"|"$/g, ''));
        return result;
    };

    const headers = splitCSVLine(lines[0], pemisah).map(h => h.toLowerCase().replace(/\s/g, ''));
    
    // Mendaftarkan indeks untuk kolom gambar1, gambar2, dan gambar3
    const idx = {
        id: headers.indexOf('id'),
        nama: headers.indexOf('nama'),
        kategori: headers.indexOf('kategori'),
        harga: headers.indexOf('harga'),
        diskon: headers.indexOf('diskon'),
        stok: headers.indexOf('stok'),
        gambar1: headers.indexOf('gambar1'),
        gambar2: headers.indexOf('gambar2'),
        gambar3: headers.indexOf('gambar3'),
        info: headers.indexOf('info')
    };

    return lines.slice(1).map(line => {
        const columns = splitCSVLine(line, pemisah);
        
        return {
            id: idx.id !== -1 ? columns[idx.id] : "",
            nama: idx.nama !== -1 ? columns[idx.nama] : "Tanpa Nama",
            kategori: idx.kategori !== -1 ? columns[idx.kategori] : "Lainnya",
            harga: idx.harga !== -1 ? columns[idx.harga] : "0",
            diskon: idx.diskon !== -1 ? columns[idx.diskon] : "0",
            stok: idx.stok !== -1 ? columns[idx.stok] : "0",
            gambar1: idx.gambar1 !== -1 ? columns[idx.gambar1] : "",
            gambar2: idx.gambar2 !== -1 ? columns[idx.gambar2] : "",
            gambar3: idx.gambar3 !== -1 ? columns[idx.gambar3] : "",
            info: idx.info !== -1 ? columns[idx.info] : ""
        };
    });
}
async function load() {
    try {
        const [res1, res2] = await Promise.all([
            fetch(URL_PRODUK1),
            fetch(URL_PRODUK2)
        ]);
        
        const text1 = await res1.text();
        const text2 = await res2.text();
        
        const produk1 = parseCSV(text1);
        const produk2 = parseCSV(text2);
        
        produk = [...produk1, ...produk2];
        
        prosesUpdateSistem(produk);
        render();
        autoFillForm();
    } catch (e) { 
        console.error(e);
        document.getElementById("list").innerHTML = "<p style='grid-column: span 2; text-align:center;'>Koneksi gagal.</p>"; 
    }
}

function prosesUpdateSistem(data) {
    const memori = JSON.parse(localStorage.getItem('duta_terang_state')) || { totalHarga: 0, infoTeks: "" };
    let currentTotal = 0, currentInfo = "";
    data.forEach(p => {
        currentTotal += Number(p.harga || 0);
        if (p.info && !currentInfo) currentInfo = p.info;
    });
    if (currentInfo !== memori.infoTeks || currentTotal !== memori.totalHarga) {
        tampilkanBadge("!"); 
    }
    pesanPromoTerbaru = currentInfo || "Tonton panduan merakit LED agar awet!";
    localStorage.setItem('temp_state', JSON.stringify({ totalHarga: currentTotal, infoTeks: currentInfo }));
}

function tampilkanBadge(teks) {
    const b = document.getElementById('badge-promo');
    b.innerText = teks;
    b.style.display = 'block';
}

function bukaPromo() {
    alert("📢 INFO TERBARU:\n\n" + pesanPromoTerbaru);
    document.getElementById('badge-promo').style.display = 'none';
    const temp = localStorage.getItem('temp_state');
    if (temp) localStorage.setItem('duta_terang_state', temp);
    window.open("https://vesatukio.github.io/jualled/panduan", "_blank"); 
}

function render() {
    let html = "", kategori = new Set();
    
    produk.forEach((p, indexProduk) => {
        if (!p.nama) return;
        kategori.add(p.kategori || "Lainnya");
        const disc = Number(p.diskon) || 0;
        const hargaAsli = Number(p.harga) || 0;
        const hrgFix = hargaAsli - (hargaAsli * disc / 100);
        const isHabis = Number(p.stok) <= 0;

        // 1. MENGGABUNGKAN KOLOM GAMBAR 1, 2, & 3 SECARA OTOMATIS
        let daftarGambar = [];
        if (p.gambar1) daftarGambar.push(p.gambar1.trim());
        if (p.gambar2) daftarGambar.push(p.gambar2.trim());
        if (p.gambar3) daftarGambar.push(p.gambar3.trim());
        
        // Jika semua kolom gambar kosong, pasang gambar placeholder bawaan
        if (daftarGambar.length === 0) daftarGambar = ['https://via.placeholder.com/150'];

        // Membuat elemen HTML untuk masing-masing gambar
        let htmlGambar = "";
        daftarGambar.forEach((imgUrl, indexImg) => {
            htmlGambar += `<img src="${imgUrl}" class="slide-img prodImg-${indexProduk}" data-index="${indexImg}" style="display: ${indexImg === 0 ? 'block' : 'none'}; width:100%; cursor:pointer;" onclick="openZoom('${imgUrl}')">`;
        });

        // Membuat tombol navigasi panah jika gambar yang terisi lebih dari satu kolom
        let tombolNavigasi = "";
        if (daftarGambar.length > 1) {
            tombolNavigasi = `
                <div class="slider-nav" style="position:absolute; top:45%; width:100%; display:flex; justify-content:space-between; padding:0 5px; box-sizing:border-box; z-index:4; pointer-events:none;">
                    <button onclick="geserGambar(${indexProduk}, -1, ${daftarGambar.length})" style="pointer-events:auto; background:rgba(0,0,0,0.5); color:white; border:none; border-radius:50%; width:24px; height:24px; font-weight:bold; cursor:pointer; font-size:12px;"><</button>
                    <button onclick="geserGambar(${indexProduk}, 1, ${daftarGambar.length})" style="pointer-events:auto; background:rgba(0,0,0,0.5); color:white; border:none; border-radius:50%; width:24px; height:24px; font-weight:bold; cursor:pointer; font-size:12px;">></button>
                </div>
            `;
        }

        html += `
<div class="card" data-category="${(p.kategori||'').toLowerCase()}" style="position:relative;">
    ${isHabis ? '<div class="status-habis">HABIS</div>' : ''}
    
    <button class="btn-share-prod" onclick="shareProduk('${p.nama}', ${hrgFix})" title="Bagikan Produk" style="left: 10px; right: auto; z-index:5;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px; height:16px;">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
            <polyline points="16 6 12 2 8 6"></polyline>
            <line x1="12" y1="2" x2="12" y2="15"></line>
        </svg>
    </button>

    ${disc > 0 && !isHabis ? `<div style="position:absolute; top:10px; right:10px; background:var(--pink); color:white; font-size:10px; font-weight:bold; padding:3px 8px; border-radius:5px; z-index:5; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.2);">-${disc}%</div>` : ''}
    
    <div class="img-container" style="position:relative; width:100%; overflow:hidden; min-height:150px; display:flex; align-items:center;">
        ${htmlGambar}
        ${tombolNavigasi}
    </div>
    
    <div class="product-name">${p.nama}</div>
    
    ${disc > 0 ? `<div style="text-decoration:line-through; color:#999; font-size:10px; margin-top:5px;">Rp ${hargaAsli.toLocaleString('id-ID')}</div>` : '<div style="height:15px;"></div>'}
    
    <div class="price-new">Rp ${hrgFix.toLocaleString('id-ID')}</div>
    
    <div class="qty-wrapper">
        <button onclick="changeQty('${p.id}', -1, ${hrgFix}, '${p.nama}')" ${isHabis?'disabled':''}>-</button>
        <span id="qty-${p.id}">0</span>
        <button onclick="changeQty('${p.id}', 1, ${hrgFix}, '${p.nama}')" ${isHabis?'disabled':''}>+</button>
    </div>
</div>`;
    });
    document.getElementById("list").innerHTML = html;
    
    let catHtml = '<button onclick="filter(\'all\', this)" style="background:var(--primary); color:white;">Semua</button>';
    kategori.forEach(k => { catHtml += `<button onclick="filter('${k.toLowerCase()}', this)">${k}</button>`; });
    document.getElementById("cat-bar").innerHTML = catHtml;
}

function changeQty(id, delta, price, name) {
    if (!order[id]) order[id] = { qty: 0, name, price };
    order[id].qty += delta;
    if (order[id].qty <= 0) delete order[id];
    const el = document.getElementById(`qty-${id}`);
    if(el) el.innerText = order[id] ? order[id].qty : 0;
    updateCart();
}

function updateCart() {
    let total = 0, renderText = "";
    for (let id in order) {
        total += (order[id].qty * order[id].price);
        renderText += `• ${order[id].name} (${order[id].qty})\n`;
    }
    document.getElementById("total").innerText = "Rp " + total.toLocaleString('id-ID');
    document.getElementById("cart-list-render").innerText = renderText; 
    document.getElementById("cart").classList.toggle("hide", total === 0);
}

function prosesPemesanan() {
    const n = document.getElementById("f_nama").value, a = document.getElementById("f_alamat").value, b = document.getElementById("f_bayar").value;
    if(!n || !a) return alert("Lengkapi Nama & Alamat!");
    let m = `*PESANAN DUTA TERANG LED*\n--------------------------\n`;
    for (let id in order) m += `• ${order[id].name} (x${order[id].qty})\n`;
    m += `--------------------------\n*Total: ${document.getElementById("total").innerText}*\n\n👤 Nama: ${n}\n📍 Alamat: ${a}\n💳 Bayar: ${b}`;
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(m)}`);
}

async function startScanner() {
    const modal = document.getElementById('camera-modal'), v = document.getElementById('video-preview');
    try {
        modal.style.display = 'block';
        streamPointer = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        v.srcObject = streamPointer;
    } catch (e) { alert("Izin kamera ditolak."); modal.style.display = 'none'; }
}

function stopScanner() {
    if (streamPointer) streamPointer.getTracks().forEach(t => t.stop());
    document.getElementById('camera-modal').style.display = 'none';
}

function filter(cat, btn) {
    document.querySelectorAll(".card").forEach(c => {
        const pCat = (c.getAttribute('data-category') || '').toLowerCase();
        c.style.display = (cat === 'all' || pCat === cat) ? 'flex' : 'none';
    });
    document.querySelectorAll("#cat-bar button").forEach(b => { b.style.background = '#fff'; b.style.color = '#666'; });
    btn.style.background = 'var(--primary)'; btn.style.color = '#fff';
}

function openZoom(url) { 
    if(!url || url.includes('placeholder')) return;
    document.getElementById("imgZoom").src = url; 
    document.getElementById("zoomModal").style.display = 'flex'; 
}

function autoFillForm() {
    ['f_nama', 'f_alamat'].forEach(id => {
        const s = localStorage.getItem(id);
        if (s) document.getElementById(id).value = s;
        document.getElementById(id).addEventListener('input', e => localStorage.setItem(id, e.target.value));
    });
}

function resetCart() { if(confirm("Reset keranjang?")) { order = {}; updateCart(); document.querySelectorAll("[id^='qty-']").forEach(e => e.innerText = "0"); } }
function hapusIdentitas() { if(confirm("Hapus data diri?")) { localStorage.clear(); location.reload(); } }
function closeModal() { document.getElementById('installModal').style.display = 'none'; sessionStorage.setItem('promo_per_sesi', 'true'); }

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferredPrompt = e;
    document.getElementById('btn-install-float').style.display = 'flex';
});

async function actionInstall() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt = null;
        closeModal();
    } else { alert('Gunakan menu browser untuk install.'); closeModal(); }
}

function shareProduk(nama, harga) {
    const urlToko = `https://vesatukio.github.io/jualled/?item=${encodeURIComponent(nama)}`;
    const hargaIDR = "Rp " + harga.toLocaleString('id-ID');

    const listPesan = [
        `Lampu mati jangan langsung dibuang! 💡 Ganti aja modulnya pakai *${nama}*. Cuma ${hargaIDR} di Duta Terang LED. Cek stoknya:`,
        `Solusi hemat servis lampu sendiri. Ready *${nama}* kualitas mantap harga teknisi (${hargaIDR}). Intip katalognya yuk:`,
        `Lagi cari sparepart LED atau audio? Di Duta Terang lagi ready *${nama}* nih. Harga cuma ${hargaIDR}. Cek detailnya di sini:`,
        `Benerin lampu jadi lebih murah daripada beli baru. Pakai *${nama}* ini beres! Harga cuma ${hargaIDR}:`
    ];

    const pesanRandom = listPesan[Math.floor(Math.random() * listPesan.length)];
    const textFinal = `${pesanRandom}\n\n👉 ${urlToko}`;

    if (navigator.share) {
        navigator.share({
            title: 'Duta Terang LED',
            text: textFinal,
        }).catch(err => console.log('Batal share'));
    } else {
        const waUrl = `https://wa.me/?text=${encodeURIComponent(textFinal)}`;
        window.open(waUrl, '_blank');
    }
}
// Fungsi pembantu menangani logika perpindahan gambar slide produk saat diklik panah
function geserGambar(idProduk, arah, totalGambar) {
    const elemenGambar = document.querySelectorAll(`.prodImg-${idProduk}`);
    let indeksSekarang = 0;

    // Cari tahu gambar index ke berapa yang saat ini aktif tampil
    elemenGambar.forEach((img, index) => {
        if (img.style.display === 'block') {
            indeksSekarang = index;
        }
    });

    // Sembunyikan gambar aktif saat ini
    elemenGambar[indeksSekarang].style.display = 'none';

    // Hitung target gambar berikutnya
    let indeksBaru = indeksSekarang + arah;
    if (indeksBaru >= totalGambar) indeksBaru = 0; // Balik ke awal jika klik kanan saat mentok
    if (indeksBaru < 0) indeksBaru = totalGambar - 1; // Balik ke akhir jika klik kiri saat mentok

    // Tampilkan gambar baru
    elemenGambar[indeksBaru].style.display = 'block';
}
