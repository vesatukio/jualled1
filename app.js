const GOOGLE_API_URL = "https://script.google.com/macros/s/AKfycbxO1ItQclyBRHKSRso9yDL7WMLowhP1cJHXNtXXEiA8uiBrZnBVYW_fq__nGCcCSES4/exec";

async function muatDataProduk() {
    const list = document.getElementById('list');
    try {
        const res = await fetch(GOOGLE_API_URL);
        const data = await res.json();
        
        if (data && data.length > 0) {
            renderDaftarProduk(data);
        } else {
            list.innerHTML = "<p>Data produk kosong di Sheet.</p>";
        }
    } catch (e) {
        list.innerHTML = "<p>Gagal memuat produk. Cek koneksi!</p>";
        console.error(e);
    }
}

function renderDaftarProduk(data) {
    const list = document.getElementById('list');
    list.innerHTML = data.map(p => `
        <div class="card">
            <img src="${p.gambar1 || 'https://via.placeholder.com/150'}" style="width:100%">
            <h3>${p.Barang}</h3>
            <p>Stok: ${p.Stok}</p>
            <p>Rp ${Number(p.Harga).toLocaleString('id-ID')}</p>
            <button onclick="alert('Order ${p.Barang}')">Beli</button>
        </div>
    `).join('');
}

muatDataProduk();
