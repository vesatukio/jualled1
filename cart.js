const cart = JSON.parse(localStorage.getItem('cart')) || {};

// 1. Pastikan data produk ada, jika tidak, coba ambil dari localStorage atau set default []
const cart = JSON.parse(localStorage.getItem('cart')) || {};
const allProducts = JSON.parse(localStorage.getItem('allProducts')) || [];

function renderKeranjang() {
    const list = document.getElementById('cart-list');
    if (!list) return;

    // Cek apakah ada barang di keranjang
    if (Object.keys(cart).length === 0) {
        list.innerHTML = "<p>Keranjang Anda kosong. Yuk, belanja dulu!</p>";
        return;
    }

    let totalBelanja = 0;
    let html = `<h4>Ringkasan Pesanan:</h4>`;

    for(let id in cart) {
        // Tambahkan konversi string ke number jika perlu agar .find cocok
        const produk = allProducts.find(p => String(p.id) === String(id));
        
        if (produk) {
            const subtotal = produk.hargaSetelahDiskon * cart[id];
            totalBelanja += subtotal;
            html += `
                <div class="cart-item" style="display:flex; align-items:center; border-bottom:1px solid #ddd; padding:10px 0;">
                    <img src="${produk.gambar1}" style="width:50px; height:50px; object-fit:cover; margin-right:10px;">
                    <div style="flex-grow:1;">
                        <strong>${produk.nama}</strong><br>
                        <span>Rp ${parseInt(produk.hargaSetelahDiskon).toLocaleString()}</span>
                    </div>
                    <div class="qty-control">
                        <button onclick="updateCart('${id}', -1)" style="padding: 2px 8px;">-</button>
                        <span style="margin: 0 10px;">${cart[id]}</span>
                        <button onclick="updateCart('${id}', 1)" style="padding: 2px 8px;">+</button>
                        <button onclick="hapusItem('${id}')" style="background:red; color:white; border:none; margin-left:10px; padding:2px 8px;">X</button>
                    </div>
                </div>`;
        }
    }
    
    html += `<h3 style="text-align:right;">Total: Rp ${totalBelanja.toLocaleString()}</h3>`;
    list.innerHTML = html;
}

// ... sisanya (updateCart, hapusItem, dan submit listener) sama dengan kode Anda sebelumnya.

document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        nama: document.getElementById('nama').value,
        wa: document.getElementById('wa').value,
        alamat: document.getElementById('alamat').value,
        pesanan: JSON.stringify(cart),
        tanggal: new Date().toLocaleString()
    };

    try {
        await fetch("https://script.google.com/macros/s/AKfycbwLtAJsbkYAKsx9M1fUJu-eXR2-hMTp7cl2SZrprvGJ0_ql6BWkm9pM-9EBNHXDABGblA/exec", {
            method: "POST",
            mode: 'no-cors',
            body: JSON.stringify(data)
        });
        localStorage.removeItem('cart');
        alert("Pesanan berhasil dikirim!");
        window.location.href = "index.html";
    } catch (err) { alert("Gagal mengirim"); }
});

renderKeranjang();
