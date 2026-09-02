/* DUTA LED - WhatsApp nota text langsung */
(function(){
'use strict';
const rp=v=>'Rp'+Number(v||0).toLocaleString('id-ID');
const clean=s=>String(s??'').trim();
const norm=s=>clean(s).toLowerCase();
function isCOD(o){
 const v=norm(o.metode_pembayaran||o.pembayaran||o.payment_method);
 return v.includes('cod') || v.includes('cash on delivery');
}
function paymentLabel(o){
 const v=norm(o.metode_pembayaran||o.pembayaran||o.payment_method);
 if(v.includes('transfer') || v.includes('bank')) return 'Transfer';
 if(isCOD(o)) return 'COD';
 return clean(o.metode_pembayaran||o.pembayaran||o.payment_method||'-');
}
function shippingLabel(o){
 const v=clean(o.metode_pengiriman||o.pengiriman||o.shipping_method||'');
 const e=clean(o.ekspedisi||o.courier||'');
 if(e) return e;
 if(/toko/i.test(v)) return 'Kirim Toko';
 return v || '-';
}
function makeText(o){
 const rows=(o.detail_pesanan||[]).map(d=>`* ${clean(d.nama_produk)} x${Number(d.qty)||0} = ${rp(d.subtotal)}`).join('\n');
 const ong=Number(o.ongkir)||0;
 const cod=isCOD(o) ? (Number(o.biaya_cod)||0) : 0;
 const produk=Number(o.total_harga)||0;
 const total=produk+ong+cod;
 const payment=paymentLabel(o);
 const shipping=shippingLabel(o);
 const status=clean(o.status||'BARU');
 const resi=clean(o.nomor_resi||o.resi||'');
 let out=`DUTA LED — NOTA PESANAN\n\nNo: ${clean(o.order_id)}\nTanggal: ${new Date(o.created_at).toLocaleString('id-ID')}\nPembeli: ${clean(o.nama_pembeli)} (HP: ${clean(o.no_hp)})\n\nDETAIL PESANAN\n${rows||'Tidak ada detail'}\n\nTotal Produk: ${rp(produk)}`;
 if(ong) out+=`\nOngkir: ${rp(ong)}`;
 if(cod) out+=`\nBiaya COD: ${rp(cod)}`;
 out+=`\nTOTAL BAYAR: ${rp(total)}\n\nStatus: ${status}\nPembayaran: ${payment}\nPengiriman: ${shipping}`;
 if(resi) out+=`\nResi: ${resi}`;
 out+='\n\nTerima kasih telah berbelanja di DUTA LED.';
 return out;
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