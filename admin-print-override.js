/* DUTA LED - Nota: Review & Print dalam satu tampilan */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
const rp=v=>'Rp'+Number(v||0).toLocaleString('id-ID');

function buildNota(o){
 const details=o.detail_pesanan||[];
 const rows=details.map(d=>{
  const q=Number(d.qty)||0, price=Number(d.harga_saat_beli)||0, sub=q*price;
  return `<tr><td><b>${esc(d.nama_produk)}</b><br><span>${rp(price)} × ${q}</span></td><td>${rp(sub)}</td></tr>`;
 }).join('');
 const productTotal=details.reduce((s,d)=>s+(Number(d.qty)||0)*(Number(d.harga_saat_beli)||0),0);
 const ong=Number(o.ongkir)||0,cod=Number(o.biaya_cod)||0;
 const base=Number(o.total_harga)||productTotal;
 const grand=base+ong+cod;
 return `<main class="paper"><div class="head"><h1>DUTA LED</h1><div class="muted">Toko LED & Elektronik</div></div><hr class="line"><div class="info"><b>No</b>: ${esc(o.order_id)}<br><b>Tanggal</b>: ${new Date(o.created_at).toLocaleString('id-ID')}<br><b>Pembeli</b>: ${esc(o.nama_pembeli)}<br><b>HP</b>: ${esc(o.no_hp)}</div><hr class="line"><div class="section-title">DETAIL PESANAN</div><table>${rows}</table><div class="sum"><div><span>Total Produk</span><b>${rp(productTotal)}</b></div>${ong?`<div><span>Ongkir</span><b>${rp(ong)}</b></div>`:''}${cod?`<div><span>Biaya COD</span><b>${rp(cod)}</b></div>`:''}<div class="grand"><span>TOTAL BAYAR</span><span>${rp(grand)}</span></div></div><hr class="line"><div class="status"><b>Status:</b> ${esc(o.status||'BARU')}<br><b>Pembayaran:</b> ${esc(o.metode_pembayaran||'-')}<br><b>Pengiriman:</b> ${esc(o.metode_pengiriman||'-')}${o.ekspedisi?`<br><b>Ekspedisi:</b> ${esc(o.ekspedisi)}`:''}${o.nomor_resi?`<br><b>Resi:</b> ${esc(o.nomor_resi)}`:''}</div><div class="thanks">Terima kasih telah berbelanja di DUTA LED</div></main>`;
}

window.dutaOpenNotaChooser=function(o){
 if(!o)return;
 const w=window.open('','_blank','width=900,height=1000');
 if(!w)return;
 const nota=buildNota(o);
 w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Nota ${esc(o.order_id)}</title><style>
*{box-sizing:border-box}body{margin:0;background:#eef1f5;font-family:Arial,sans-serif;color:#111}.top{position:sticky;top:0;z-index:5;background:#fff;padding:18px 24px 14px;box-shadow:0 2px 10px #0001}.top h2{margin:0 0 12px;font-size:22px}.actions{display:grid;grid-template-columns:1fr 1fr;gap:14px}.action{min-height:108px;border:2px solid #d8dde5;border-radius:16px;background:#fff;display:flex;align-items:center;justify-content:center;gap:12px;cursor:pointer;font-weight:800;font-size:18px;box-shadow:0 3px 10px #0001}.action span{display:block}.action small{display:block;font-size:12px;font-weight:500;color:#687386;margin-top:5px}.action.print{border-color:#1683ff}.action.review{border-color:#7c4dff}.preview{padding:24px}.preview-label{max-width:760px;margin:0 auto 10px;font-weight:800;color:#555}.paper{width:min(760px,100%);margin:0 auto;background:#fff;padding:38px 44px;box-shadow:0 2px 14px #0002}.head{text-align:center}.head h1{font-size:30px;margin:0 0 4px}.muted{color:#666;font-size:14px}.line{border:0;border-top:1px dashed #777;margin:18px 0}.info{font-size:15px;line-height:1.65}.info b{display:inline-block;min-width:85px}table{width:100%;border-collapse:collapse;font-size:15px}td{padding:10px 0;vertical-align:top;border-bottom:1px solid #ddd}td:last-child{text-align:right;font-weight:700;white-space:nowrap}.section-title{font-weight:900;margin-bottom:2px}.sum{margin-top:14px;width:100%;font-size:16px}.sum div{display:flex;justify-content:space-between;padding:5px 0}.grand{font-size:23px;font-weight:900;border-top:2px solid #111;margin-top:7px;padding-top:12px}.status{margin-top:18px;font-size:14px;line-height:1.7}.thanks{text-align:center;margin-top:28px;font-size:14px}@media(max-width:600px){.actions{grid-template-columns:1fr}.action{min-height:92px}.preview{padding:12px}.paper{padding:24px 20px}.head h1{font-size:25px}table,.info{font-size:14px}.grand{font-size:20px}}@media print{body{background:#fff}.top{display:none!important}.preview{padding:0}.preview-label{display:none}.paper{width:100%;margin:0;box-shadow:none;padding:18mm 16mm}}
</style></head><body><section class="top"><h2>Nota Pesanan — ${esc(o.order_id)}</h2><div class="actions"><button class="action review" id="review">👁️ <span>Review Nota<small>Lihat nota dengan jelas</small></span></button><button class="action print" id="print">🖨️ <span>Print Nota<small>Cetak nota sekarang</small></span></button></div></section><section class="preview"><div class="preview-label">REVIEW NOTA</div>${nota}</section><script>document.getElementById('review').onclick=()=>document.querySelector('.preview').scrollIntoView({behavior:'smooth'});document.getElementById('print').onclick=()=>window.print();<\/script></body></html>`);
 w.document.close();
};

/* Tetap pertahankan nama lama agar pemanggilan lain tidak rusak. */
window.printOrder=window.dutaOpenNotaChooser;
})();