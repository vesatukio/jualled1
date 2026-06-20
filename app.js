const produk = [
    { nama: "Laptop ASUS", harga: "Rp 8.000.000" },
    { nama: "Mouse Wireless", harga: "Rp 150.000" },
    { nama: "Keyboard Mechanical", harga: "Rp 500.000" },
    { nama: "Monitor LG", harga: "Rp 1.500.000" }
];

const container = document.getElementById('product-container');

function tampilkanProduk(data) {
    container.innerHTML = "";
    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `<h3>${item.nama}</h3><p>${item.harga}</p>`;
        container.appendChild(card);
    });
}

function filterProduk() {
    const keyword = document.getElementById('search').value.toLowerCase();
    const hasil = produk.filter(p => p.nama.toLowerCase().includes(keyword));
    tampilkanProduk(hasil);
}

// Inisialisasi awal
tampilkanProduk(produk);
