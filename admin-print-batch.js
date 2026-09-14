/* DUTA LED - Cetak nota banyak pesanan v20260915-2 */
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
let perPage=10;

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
  t.innerHTML='<span class="bp-count" id="batchPrintCount">0 nota dipilih</span><button type="button" id="batchSelectAll">☑ Pilih semua</button><button type="button" id="batchClear">× Hapus pilihan</button><select id="batchPaper"><option value="A4">A4</option><option value="F4">F4</option></select><select id="batchPerPage" title="Jumlah nota per lembar"><option value="8">8 nota/lembar</option><option value="10" selected>10 nota/lembar</option><option value="12">12 nota/lembar</option></select><button type="button" class="bp-primary" id="batchPrintBtn">🖨️ Cetak dipilih</button>';
  const toolbar=host.querySelector('.toolbar');
  if(toolbar)toolbar.insertAdjacentElement('afterend',t); else host.prepend(t);
  $('batchPaper').onchange=e=>{paper=e.target.value};
  $('batchPerPage').onchange=e=>{perPage=Math.max(1,Math.min(12,Number(e.target.value)||10))};
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
 const {data,error}=await db.from('pesanan').select('id,order_id,created_at,nama_pembeli,no_hp,alamat,kecamatan,metode_pengiriman,metode_pembayaran,status,total_harga,ongkir,biaya_cod,nomor_resi,detail_pesanan(id,pesanan_id,produk_id,nama_produk,qty,harga_saat_beli)').in('id',ids);
 if(error)throw error;
 const map=new Map((data||[]).map(o=>[String(o.id),o]));
 return ids.map(id=>map.get(String(id))).filter(Boolean);
}
function note(o){
 const details=o.detail_pesanan||[];
 const total=details.reduce((s,d)=>s+num(d.qty)*num(d.harga_saat_beli),0)||num(o.total_harga);
 const rows=details.map(d=>{const q=num(d.qty),p=num(d.harga_saat_beli);return '<tr><td>'+esc(d.nama_produk)+' <span class="qty">×'+q+'</span></td><td>'+rp(q*p)+'</td></tr>'}).join('');
 return '<section class="nota"><div class="nota-top"><div class="nota-brand">DUTA LED</div><div class="nota-id">'+esc(o.order_id)+' · '+new Date(o.created_at).toLocaleDateString('id-ID')+'</div></div><div class="customer"><b>'+esc(o.nama_pembeli||'Pelanggan')+'</b><br><span>'+esc(o.no_hp||'-')+'</span> · <span>'+esc(o.alamat||'-')+(o.kecamatan?', '+esc(o.kecamatan):'')+'</span></div><table>'+rows+'</table><div class="total"><span>TOTAL</span><b>'+rp(total)+'</b></div><div class="foot">'+esc(o.metode_pembayaran||'-')+' · '+esc(o.metode_pengiriman||'-')+(o.nomor_resi?' · '+esc(o.nomor_resi):'')+'</div></section>';
}
function printHtml(list){
 const pageSize=paper==='F4'?'8.5in 13in':'210mm 297mm';
 const cols=2;
 const rows=perPage===8?4:perPage===12?6:5;
 const gap='3mm';
 let pages='';
 for(let i=0;i<list.length;i+=perPage){pages+='<div class="page"><div class="grid grid-'+perPage+'">'+list.slice(i,i+perPage).map(note).join('')+'</div></div>'}
 const w=window.open('','_blank','width=900,height=700');if(!w){alert('Popup diblokir. Izinkan popup untuk mencetak nota.');return}
 w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Cetak Nota Duta LED</title><style>@page{size:'+pageSize+' portrait;margin:5mm}*{box-sizing:border-box}html,body{margin:0;padding:0}body{font-family:Arial,sans-serif;color:#17202a;background:#ddd}.page{width:100%;height:calc(100vh - 10mm);page-break-after:always;background:#fff}.page:last-child{page-break-after:auto}.grid{height:100%;display:grid;grid-template-columns:repeat('+cols+',1fr);grid-template-rows:repeat('+rows+',1fr);gap:'+gap+'}.nota{border:1px solid #aeb7c2;border-radius:3mm;padding:3mm 3.2mm;overflow:hidden;display:flex;flex-direction:column;min-height:0;background:#fff}.nota-top{display:flex;justify-content:space-between;align-items:flex-start;gap:3mm;border-bottom:1px solid #d6dbe1;padding-bottom:1.8mm}.nota-brand{font-size:11px;font-weight:900;letter-spacing:.5px}.nota-id{font-size:7px;color:#667085;text-align:right;white-space:nowrap}.customer{font-size:7.4px;line-height:1.35;margin:1.7mm 0;color:#303943;max-height:11mm;overflow:hidden}.customer b{font-size:8.2px;color:#111820}.nota table{width:100%;border-collapse:collapse;font-size:7.2px;line-height:1.2;table-layout:fixed}.nota td{padding:1mm 0;border-bottom:1px dashed #d5d9de;vertical-align:top}.nota td:first-child{padding-right:2mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nota td:last-child{text-align:right;font-weight:700;white-space:nowrap;width:30%}.qty{color:#667085;font-size:6.8px}.total{display:flex;justify-content:space-between;border-top:1px solid #222;margin-top:auto;padding-top:1.4mm;font-size:8px}.total b{font-size:9.5px}.foot{text-align:center;font-size:6.4px;color:#667085;margin-top:1.2mm;padding-top:1mm;border-top:1px dashed #c8cdd3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}@media print{html,body{background:#fff}.page{height:calc(100vh - 10mm)}.nota{break-inside:avoid;box-shadow:none}}@media screen{.page{width:210mm;height:297mm;margin:8mm auto;padding:0;background:#fff;box-shadow:0 1px 8px #999}.grid{height:100%}.nota{background:#fff}}</style></head><body>'+pages+'<script>window.onload=()=>setTimeout(()=>window.print(),300);<\/script></body></html>');w.document.close();
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