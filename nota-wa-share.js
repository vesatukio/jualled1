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
function detailRows(o){
 return (o.detail_pesanan||[]).map(d=>{
  const q=Number(d.qty)||0;
  const price=Number(d.harga_saat_beli)||0;
  const subtotal=price*q;
  return `* ${clean(d.nama_produk)}\n  ${rp(price)} × ${q} = ${rp(subtotal)}`;
 }).join('\n────────────────────\n');
}
function makeText(o){
 const rows=detailRows(o);
 const ong=Number(o.ongkir)||0;
 const cod=isCOD(o) ? (Number(o.biaya_cod)||0) : 0;
 const produk=(o.detail_pesanan||[]).reduce((s,d)=>s+(Number(d.qty)||0)*(Number(d.harga_saat_beli)||0),0);
 const produkTotal=produk || Number(o.total_harga)||0;
 const total=produkTotal+ong+cod;
 const payment=paymentLabel(o);
 const shipping=shippingLabel(o);
 const status=clean(o.status||'BARU');
 const resi=clean(o.nomor_resi||o.resi||'');
 let out=`DUTA LED — NOTA PESANAN\n\nNo: ${clean(o.order_id)}\nTanggal: ${new Date(o.created_at).toLocaleString('id-ID')}\nPembeli: ${clean(o.nama_pembeli)} (HP: ${clean(o.no_hp)})\n\n────────────────────\nDETAIL PESANAN\n────────────────────\n${rows||'Tidak ada detail'}\n────────────────────\nTotal Produk: ${rp(produkTotal)}`;
 if(ong) out+=`\nOngkir: ${rp(ong)}`;
 if(cod) out+=`\nBiaya COD: ${rp(cod)}`;
 out+=`\n────────────────────\nTOTAL BAYAR: ${rp(total)}\nPembayaran: ${payment}\n────────────────────\nStatus: ${status}\nPengiriman: ${shipping}`;
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