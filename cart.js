const cart = JSON.parse(localStorage.getItem('cart')) || {};

function renderKeranjang() {
    const list = document.getElementById('cart-list');
    // Anda perlu mencocokkan ID di cart dengan data produk (asumsi dataGlobal tersimpan di localStorage atau fetch ulang)
    // Jika dataGlobal tidak ada, kita tampilkan ID-nya saja sementara
    let html = `<h4>Produk Anda:</h4>`;
    for(let id in cart) {
        html += `<div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span>Produk ID: ${id}</span>
                    <span>Jumlah: ${cart[id]}</span>
                 </div>`;
    }
    list.innerHTML = html;
}

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
