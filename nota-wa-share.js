/* DUTA LED - WhatsApp nota text langsung */
(function(){
'use strict';
const rp=v=>'Rp'+Number(v||0).toLocaleString('id-ID');
const clean=s=>String(s??'').trim();
function makeText(o){
 const rows=(o.detail_pesanan||[]).map(d=>`• ${clean(d.nama_produk)} x${Number(d.qty)||0} = ${rp(d.subtotal)}`).join('\n');
 const ong=Number(o.ongkir)||0,cod=Number(o.biaya_cod)||0,produk=Number(o.total_harga)||0,total=produk+ong+cod;
 return `*DUTA LED — NOTA PESANAN*\n\nNo: ${clean(o.order_id)}\nTanggal: ${new Date(o.created_at).toLocaleString('id-ID')}\nPembeli: ${clean(o.nama_pembeli)}\nHP: ${clean(o.no_hp)}\n\n*DETAIL PESANAN*\n${rows||'Tidak ada detail'}\n\nTotal Produk: ${rp(produk)}${ong?`\nOngkir: ${rp(ong)}`:''}${cod?`\nBiaya COD: ${rp(cod)}`:''}\n*TOTAL BAYAR: ${rp(total)}*\n\nStatus: ${clean(o.status||'BARU')}\nPembayaran: ${clean(o.metode_pembayaran||'-')}\nPengiriman: ${clean(o.metode_pengiriman||'-')}${o.ekspedisi?`\nEkspedisi: ${clean(o.ekspedisi)}`:''}${o.nomor_resi?`\nResi: ${clean(o.nomor_resi)}`:''}\n\nTerima kasih telah berbelanja di DUTA LED.`;
}
async function share(o){
 const text=makeText(o||{}),url='https://wa.me/?text='+encodeURIComponent(text);
 const w=window.open(url,'_blank');
 if(!w) window.location.href=url;
 return true;
}
window.dutaShareNotaImage=share;
window.dutaShareNotaWA=share;
window.dutaNotaText=makeText;
})();