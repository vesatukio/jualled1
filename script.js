function updateQty(btn, change) {
    let input = btn.parentElement.querySelector('.qty-input');
    let val = parseInt(input.value) + change;
    if (val < 0) val = 0;
    input.value = val;
    hitungTotal();
}

function hitungTotal() {
    let total = 0;
    document.querySelectorAll('.card').forEach(card => {
        let harga = parseInt(card.querySelector('.final-price').innerText.replace(/[^0-9]/g, ''));
        let qty = parseInt(card.querySelector('.qty-input').value);
        total += (harga * qty);
    });
    document.getElementById('total-harga').innerText = 'Rp ' + total.toLocaleString('id-ID');
}

function sendToWhatsApp() {
    let pesan = "Halo, saya ingin memesan:\n";
    let adaBarang = false;
    
    document.querySelectorAll('.card').forEach(card => {
        let qty = parseInt(card.querySelector('.qty-input').value);
        if (qty > 0) {
            let nama = card.querySelector('.card-title').innerText;
            pesan += `- ${nama} (${qty}x)\n`;
            adaBarang = true;
        }
    });

    if (!adaBarang) return alert("Keranjang masih kosong!");
    
    pesan += "\nTotal: " + document.getElementById('total-harga').innerText;
    let urlWA = "https://wa.me/6283157925577?text=" + encodeURIComponent(pesan);
    window.open(urlWA, '_blank');
}
