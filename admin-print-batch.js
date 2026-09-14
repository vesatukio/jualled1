/* DUTA LED - Cetak nota banyak pesanan v20260915 */
(function(){
'use strict';
const URL='https://opgeeqnucxrdqcgwcuge.supabase.co';
const KEY='sb_publishable_uqah55SK8ZjyugWprFnFMA_QnyVdCLA';
const db=window.dutaSupabase||(window.dutaSupabase=window.supabase.createClient(URL,KEY));
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
const num=v=>Number(String(v??'').replace(/[^\d.-]/g,''))||0;
const rp=v=>'Rp'+num(v).toLocaleString('id-ID');
let paper='A4';

function style(){
 if($('batchPrintStyle'))return;
 const s=document.createElement('style');s.id='batchPrintStyle';
 s.textContent='.batch-print-tools{display:flex;flex-wrap:wrap;gap:7px;align-items:center;margin:-3px 0 12px}.batch-print-tools .bp-count{font-size:12px;font-weight:800;color:#667085;margin-right:auto}.batch-print-tools button,.batch-print-tools select{border:1px solid #d8dee7;background:#fff;border-radius:9px;padding:8px 10px;font-weight:800;cursor:pointer}.batch-print-tools .bp-primary{background:#1769e0;color:#fff;border-color:#1769e0}.batch-check{width:18px;height:18px;accent-color:#1769e0;flex:0 0 auto}.batch-order-head{display:flex;align-items:flex-start;gap:8px}.batch-order-head>div:nth-child(2){min-width:0;flex:1}.batch-selected{outline:2px solid #1769e0!important;outline-offset:-2px}.batch-paper-label{font-size:11px;color:#667085;font-weight:700}';
 document.head.appendChild(s);
}
function ensureTools(){
 const host=$('ordersView');if(!host)return;
 let t=$('batchPrintTools');
 if(!t){
  t=document.createElement('div');t.id='batchPrintTools';t.className='batch-print-tools';
  t.innerHTML='<span class="bp-count" id="batchPrintCount">0 nota dipilih</span><button type="button" id="batchSelectAll">☑ Pilih semua</button><button type="button" id="batchClear">× Hapus pilihan</button><select id="batchPaper"><option value="A4">A4</option><option value="F4">F4</option></select><span class="batch-paper-label">2 nota/lembar</span><button type="button" class="bp-primary" id="batchPrintBtn">🖨️ Cetak dipilih</button>';
  const toolbar=host.querySelector('.toolbar');
  if(toolbar)toolbar.insertAdjacentElement('afterend',t); else host.prepend(t);
  $('batchPaper').onchange=e=>{paper=e.target.value};
  $('batchSelectAll').onclick=()=>{document.querySelectorAll('#orderList .batch-check').forEach(c=>c.checked=true);update()};
  $('batchClear').onclick=()=>{document.querySelectorAll('#orderList .batch-check').forEach(c=>c.checked=false);update()};
  $('batchPrintBtn').onclick=printSelected;
 }
}
function decorate(){
 const list=$('orderList');if(!list)return;
 list.querySelectorAll('.order').forEach(card=>{
  if(card.querySelector('.batch-check'))return;
  const b=card.querySelector('[data-view-order]');if(!b)return;
  const id=b.dataset.viewOrder;
  const head=card.querySelector('.order-head');if(!head)return;
  const first=head.firstElementChild;
  const wrap=document.createElement('div');wrap.className='batch-order-head';
  const cb=document.createElement('input');cb.type='checkbox';cb.className='batch-check';cb.dataset.orderId=id;cb.title='Pilih nota ini';cb.onclick=e=>e.stopPropagation();
  wrap.appendChild(cb);if(first){head.removeChild(first);wrap.appendChild(first)}
  head.insertBefore(wrap,head.firstChild);
  cb.onchange=update;
 });
 update();
}
function update(){
 const c=[...document.querySelectorAll('#orderList .batch-check:checked')].length;
 const e=$('batchPrintCount');if(e)e.textContent=c+' nota dipilih';
 document.querySelectorAll('#orderList .order').forEach(card=>{const c=card.querySelector('.batch-check');card.classList.toggle('batch-selected',!!c?.checked)});
 const b=$('batchPrintBtn');if(b)b.disabled=!c;
}
async function getOrders(ids){
 if(!ids.length)return[];
 const q=ids.map(id=>`'${String(id).replace(/'/g,"''")}'`).join(',');
 const {data,error}=await db.from('pesanan').select('id,order_id,created_at,nama_pembeli,no_hp,alamat,kecamatan,metode_pengiriman,metode_pembayaran,status,total_harga,ongkir,biaya_cod,nomor_resi,detail_pesanan(id,pesanan_id,produk_id,nama_produk,qty,harga_saat_beli)').in('id',ids);
 if(error)throw error;
 const map=new Map((data||[]).map(o=>[String(o.id),o]));
 return ids.map(id=>map.get(String(id))).filter(Boolean);
}
function note(o){
 const details=o.detail_pesanan||[];
 const total=details.reduce((s,d)=>s+num(d.qty)*num(d.harga_saat_beli),0)||num(o.total_harga);
 const rows=details.map(d=>{const q=num(d.qty),p=num(d.harga_saat_beli);return '<tr><td>'+esc(d.nama_produk)+'<div class="muted">'+q+' × '+rp(p)+'</div></td><td>'+rp(q*p)+'</td></tr>'}).join('');
 return '<section class="nota"><div class="nota-brand">DUTA LED</div><div class="nota-sub">Toko LED & Elektronik</div><div class="line"></div><div class="row"><b>'+esc(o.order_id)+'</b><span>'+new Date(o.created_at).toLocaleDateString('id-ID')+'</span></div><div class="customer"><b>'+esc(o.nama_pembeli||'Pelanggan')+'</b><br>HP: '+esc(o.no_hp||'-')+'<br>'+esc(o.alamat||'-')+(o.kecamatan?', '+esc(o.kecamatan):'')+'</div><table>'+rows+'</table><div class="total"><span>TOTAL</span><b>'+rp(total)+'</b></div><div class="foot">'+esc(o.metode_pembayaran||'-')+' · '+esc(o.metode_pengiriman||'-')+(o.nomor_resi?' · Resi: '+esc(o.nomor_resi):'')+'</div></section>';
}
function printHtml(list){
 const perPage=2;
 let pages='';
 for(let i=0;i<list.length;i+=perPage){pages+='<div class="page">'+list.slice(i,i+perPage).map(note).join('')+'</div>'}
 const pageSize=paper==='F4'?'8.5in 13in':'A4';
 const w=window.open('','_blank','width=900,height=700');if(!w){alert('Popup diblokir. Izinkan popup untuk mencetak nota.');return}
 w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Cetak Nota Duta LED</title><style>@page{size:'+pageSize+' portrait;margin:8mm}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#111}.page{height:calc('+pageSize.split(' ')[1]+' - 16mm);display:grid;grid-template-rows:1fr 1fr;gap:6mm;page-break-after:always}.page:last-child{page-break-after:auto}.nota{border:1px solid #555;border-radius:4px;padding:6mm;overflow:hidden;display:flex;flex-direction:column;min-height:0}.nota-brand{text-align:center;font-size:19px;font-weight:900;letter-spacing:.5px}.nota-sub{text-align:center;font-size:10px;margin-top:2px}.line{border-top:1px dashed #555;margin:4mm 0}.row{display:flex;justify-content:space-between;font-size:11px;gap:8px}.customer{font-size:10px;line-height:1.45;margin:3mm 0}.nota table{width:100%;border-collapse:collapse;font-size:10px}.nota td{padding:2mm 0;border-bottom:1px dashed #bbb;vertical-align:top}.nota td:last-child{text-align:right;font-weight:700;white-space:nowrap}.muted{font-size:9px;color:#555;margin-top:1mm}.total{display:flex;justify-content:space-between;border-top:2px solid #111;margin-top:3mm;padding-top:3mm;font-size:14px}.foot{text-align:center;font-size:9px;margin-top:auto;padding-top:3mm;border-top:1px dashed #aaa}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.nota{break-inside:avoid}}@media screen{body{background:#ddd}.page{max-width:210mm;margin:8mm auto;background:#fff;padding:0}.nota{background:#fff}}</style></head><body>'+pages+'<script>window.onload=()=>setTimeout(()=>window.print(),250);<\/script></body></html>');w.document.close();
}
async function printSelected(){
 const ids=[...document.querySelectorAll('#orderList .batch-check:checked')].map(c=>c.dataset.orderId);
 if(!ids.length){alert('Pilih minimal 1 pesanan.');return}
 const b=$('batchPrintBtn');if(b){b.disabled=true;b.textContent='⏳ Menyiapkan...'}
 try{const list=await getOrders(ids);if(!list.length)throw new Error('Pesanan tidak ditemukan.');printHtml(list)}catch(e){alert('Gagal menyiapkan nota: '+(e?.message||e))}finally{if(b){b.disabled=false;b.textContent='🖨️ Cetak dipilih'}}
}
function boot(){style();ensureTools();const list=$('orderList');if(!list)return;const mo=new MutationObserver(()=>{ensureTools();decorate()});mo.observe(list,{childList:true,subtree:true});setTimeout(decorate,300);setTimeout(decorate,1000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();