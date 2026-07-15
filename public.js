const Public = {
    data: [],

    init: async function() {
        const response = await API.getProduk();
        this.data = response.slice(1); // Ambil data, abaikan header
        this.render(this.data);
    },

    render: function(data) {
        const container = document.getElementById('productGrid');
        if (data.length === 0) { container.innerHTML = "Produk tidak ditemukan."; return; }
        
        container.innerHTML = data.map(item => `
            <div class="card-produk">
                ${item[9] > 0 ? `<div class="badge-diskon">${item[9]}% OFF</div>` : ''}
                <img src="${item[15]}" loading="lazy">
                <p class="nama">${item[2]}</p>
                <p class="harga">Rp ${parseInt(item[7]).toLocaleString()}</p>
                <a href="https://wa.me/628XXXXXXXXXX?text=Halo Duta Terang, mau tanya ${item[2]}" class="btn-wa">Beli via WA</a>
            </div>
        `).join('');
    },

    cari: function() {
        const key = document.getElementById('searchPublic').value.toLowerCase();
        const filtered = this.data.filter(i => i[2].toLowerCase().includes(key));
        this.render(filtered);
    }
};

document.addEventListener('DOMContentLoaded', () => Public.init());
