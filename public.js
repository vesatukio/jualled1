const Public = {
    data: [], // Data global produk

    init: async function() {
        const response = await API.getProduk(); // Mengambil data dari sheet
        this.data = response.slice(1);
        this.render(this.data);
    },

    render: function(data) {
        const container = document.getElementById('productGrid');
        container.innerHTML = data.map(item => `
            <div class="card-produk">
                <img src="${item[15]}" alt="${item[2]}" loading="lazy"> <!-- Gambar -->
                <p class="nama-produk">${item[2]}</p> <!-- Nama -->
                <p class="harga-promo">Rp ${parseInt(item[7]).toLocaleString()}</p> <!-- Harga -->
                <a href="https://wa.me/628XXXXXXXXXX?text=Halo Duta Terang, saya mau beli ${item[2]}" class="btn-wa">Beli via WA</a>
            </div>
        `).join('');
    }
};

document.addEventListener('DOMContentLoaded', () => Public.init());
