<script>
    // 1. KONFIGURASI URL
    const GOOGLE_API_URL = "https://script.google.com/macros/s/AKfycbxO1ItQclyBRHKSRso9yDL7WMLowhP1cJHXNtXXEiA8uiBrZnBVYW_fq__nGCcCSES4/exec";

    // 2. STATE APLIKASI
    let produkData = [];
    let keranjang = {};

    // 3. INISIALISASI
    document.addEventListener("DOMContentLoaded", async () => {
        await muatDataProduk();
    });

    // 4. MENGAMBIL DATA DARI GOOGLE SHEETS
    async function muatDataProduk() {
        try {
            const res = await fetch(GOOGLE_API_URL);
            const data = await res.json();
            if (data) {
                produkData = data;
                localStorage.setItem('duta_cache', JSON.stringify(data));
                renderDaftarProduk(produkData);
            }
        } catch (e) {
            console.log("Mode Offline: Mengambil dari cache");
            const cache = localStorage.getItem('duta_cache');
            if (cache) {
                produkData = JSON.parse(cache);
                renderDaftarProduk(produkData);
            }
        }
    }

    // 5. RENDER PRODUK KE LAYAR
    function renderDaftarProduk(data) {
        const list = document.getElementById('list');
        list.innerHTML = data.map(p => `
            <div class="product-card">
                <img src="${p.gambar1 || 'https://via.placeholder.com/150'}" class="prod-img">
                <h4>${p.nama}</h4>
                <p>Stok: ${p.stok || 0}</p>
                <div class="price-box">
                    <span>Rp ${Number(p.harga).toLocaleString('id-ID')}</span>
                    <button onclick="tambahKeKeranjang(${p.id})">+</button>
                </div>
            </div>
        `).join('');
    }

    // 6. FUNGSI KIRIM PESANAN KE GOOGLE SHEETS
    window.kirimKeDatabase = async function () {
        const nama = document.getElementById('buyer-nama').value;
        const wa = document.getElementById('buyer-wa').value;
        const alamat = document.getElementById('buyer-alamat').value;
        
        if (!nama || !alamat) return alert("Isi data pembeli!");

        const payload = {
            nama: nama,
            wa: wa,
            alamat: alamat,
            total: document.getElementById('summary-total').innerText,
            waktu: new Date().toLocaleString()
        };

        try {
            await fetch(GOOGLE_API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            alert("Pesanan terkirim ke Sheets!");
            resetKeranjang();
        } catch (e) {
            alert("Gagal kirim: " + e.message);
        }
    };

    // 7. FUNGSI PEMBANTU
    function tambahKeKeranjang(id) {
        keranjang[id] = (keranjang[id] || 0) + 1;
        alert("Produk ditambahkan!");
        // Update UI ringkasan Anda di sini
    }

    function resetKeranjang() {
        keranjang = {};
        document.getElementById('buyer-nama').value = '';
        document.getElementById('buyer-alamat').value = '';
    }
</script>
