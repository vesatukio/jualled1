<script>
    // 1. KONFIGURASI URL
    const GOOGLE_API_URL = "https://script.google.com/macros/s/AKfycbxO1ItQclyBRHKSRso9yDL7WMLowhP1cJHXNtXXEiA8uiBrZnBVYW_fq__nGCcCSES4/exec";

    // 2. STATE APLIKASI
    let produkData = [];

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
                localStorage.setItem('digibhub_cache', JSON.stringify(data));
                renderDaftarProduk(produkData);
            }
        } catch (e) {
            console.log("Mode Offline: Mengambil dari cache");
            const cache = localStorage.getItem('digibhub_cache');
            if (cache) {
                produkData = JSON.parse(cache);
                renderDaftarProduk(produkData);
            }
        }
    }

    // 5. RENDER PRODUK (Diselaraskan dengan Header: Barang, Harga, Stok, gambar1)
    function renderDaftarProduk(data) {
        const list = document.getElementById('list');
        if (!list) return;

        list.innerHTML = data.map(p => `
            <div class="product-card">
                <img src="${p.gambar1 || 'https://via.placeholder.com/150'}" class="prod-img" style="width:100%">
                <h4>${p.Barang}</h4>
                <p>Stok: ${p.Stok || 0}</p>
                <div class="price-box">
                    <span>Rp ${Number(p.Harga).toLocaleString('id-ID')}</span>
                    <button ${p.Stok <= 0 ? 'disabled' : ''} onclick="tambahKeKeranjang('${p.ID}')">
                        ${p.Stok <= 0 ? 'Habis' : '+'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    // 6. FUNGSI KIRIM PESANAN
    window.kirimKeDatabase = async function () {
        const nama = document.getElementById('buyer-nama').value;
        const wa = document.getElementById('buyer-wa').value;
        const alamat = document.getElementById('buyer-alamat').value;
        
        if (!nama || !alamat || !wa) return alert("Mohon lengkapi data pembeli!");

        const payload = {
            nama: nama,
            wa: wa,
            alamat: alamat,
            waktu: new Date().toLocaleString()
        };

        try {
            // Pastikan mode cors diaktifkan jika script sudah di set header origin-nya
            await fetch(GOOGLE_API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            alert("Pesanan berhasil terkirim!");
        } catch (e) {
            alert("Gagal kirim: " + e.message);
        }
    };

    function tambahKeKeranjang(id) {
        alert("Produk ID: " + id + " ditambahkan ke keranjang!");
    }
</script>
