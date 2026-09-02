/* DUTA LED - Admin fixes v6 */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const norm=s=>String(s||'').trim().toUpperCase().replace(/\s+/g,' ');
function cleanupTabs(){
  document.querySelectorAll('.tabs button,.tabs a').forEach(b=>{
    const t=String(b.textContent||'').trim().toLowerCase();
    if(t.includes('keuangan pribadi')||t.includes('promo header')||t==='💬 saran & kritik'||t==='saran & kritik'||t==='saran dan kritik') b.remove();
  });
  let b=$('tabSaranFinal');
  const tabs=document.querySelector('.tabs');
  if(tabs&&!b){
    b=document.createElement('button');b.id='tabSaranFinal';b.type='button';b.className='btn tab';b.textContent='💬 Saran & Masukan';
    b.onclick=()=>showFinal('tabSaranFinal');tabs.appendChild(b);
  }
}
function ensureSaran(){
  const v=$('saranViewV4'),p=$('adminPromoPanel');
  if(v&&p&&p.parentElement!==v){
    v.insertBefore(p,v.firstChild);p.classList.remove('hidden');
  }
}
function showFinal(id){
  const views=[...document.querySelectorAll('main.wrap > section,main.wrap > div')].filter(e=>!e.closest('#login'));
  views.forEach(e=>e.classList.add('hidden'));
  $('saranViewV4')?.classList.remove('hidden');
  document.querySelectorAll('.tabs .tab').forEach(x=>x.classList.remove('active'));
  $(id)?.classList.add('active');
}
const STATUS=[
 ['ALL','Semua'],['MENUNGGU BAYAR','Menunggu Bayar'],['BARU','Baru'],['DIPROSES','Diproses'],['DIKIRIM','Dikirim'],['SELESAI','Selesai'],['BATAL','Batal']
];
function statusKey(s){
 const x=norm(s);
 if(x==='MENUNGGU PEMBAYARAN'||x==='MENUNGGU BAYAR'||x==='MENUNGGU PEMBAYARAN/COD')return 'MENUNGGU BAYAR';
 return x;
}
function mountOrderTabs(){
 const host=$('orderStatusTabs'),list=$('orderList');if(!host||!list)return;
 const cards=[...list.querySelectorAll('.order')];
 host.innerHTML=STATUS.map(([key,label])=>{
   const n=key==='ALL'?cards.length:cards.filter(c=>statusKey(c.querySelector('.status')?.textContent)==key).length;
   return `<button type="button" class="order-status-tab ${key==='ALL'?'active':''}" data-final-status="${key}">${label}<b>${n}</b></button>`;
 }).join('');
 const active=window.__dutaFinalStatus||'ALL';
 host.querySelectorAll('.order-status-tab').forEach(b=>{
   const k=b.dataset.finalStatus;b.classList.toggle('active',k===active);
   b.onclick=()=>{window.__dutaFinalStatus=k;mountOrderTabs()};
 });
 cards.forEach(c=>{const k=statusKey(c.querySelector('.status')?.textContent);c.style.display=active==='ALL'||k===active?'':'none'});
}
function styleStatus(){
 if($('adminFinalStyle'))return;
 const s=document.createElement('style');s.id='adminFinalStyle';s.textContent=`.order-status-tabs{display:flex!important;gap:7px!important;overflow-x:auto!important;white-space:nowrap!important;padding:3px 1px 8px!important;margin:0 0 10px!important}.order-status-tabs::-webkit-scrollbar{display:none}.order-status-tab{flex:0 0 auto;border:1px solid #dfe5ec!important;background:#fff!important;color:#344054!important;border-radius:10px!important;padding:8px 11px!important;font-weight:800!important}.order-status-tab.active{background:#1769e0!important;color:#fff!important;border-color:#1769e0!important}.order-status-tab b{margin-left:5px;border-radius:10px;padding:2px 6px;background:#eef1f5;color:#344054}.order-status-tab.active b{background:#fff;color:#1769e0}`;document.head.appendChild(s);
}
function wireWA(){
 document.querySelectorAll('[data-print-order]').forEach(print=>{
   const id=print.dataset.printOrder;if(!id||print.parentElement.querySelector('[data-wa-order="'+id+'"]'))return;
   const wa=document.createElement('button');wa.type='button';wa.className='btn light';wa.dataset.waOrder=id;wa.textContent='📤 WA';
   wa.onclick=async()=>{const o=(window.orders||[]).find(x=>String(x.id)===String(id));if(!o)return alert('Pesanan tidak ditemukan.');if(window.dutaShareNotaImage)await window.dutaShareNotaImage(o);else alert('Fitur share nota belum siap, silakan refresh halaman.');};
   print.insertAdjacentElement('afterend',wa);
 });
 const d=$('printFromDetail');
 if(d&&!d.parentElement.querySelector('#waFromDetail')){
   const wa=document.createElement('button');wa.type='button';wa.id='waFromDetail';wa.className='btn light';wa.textContent='📤 WA';
   wa.onclick=()=>{const modal=$('orderModal');const no=modal?.querySelector('.order-no')?.textContent;const o=(window.orders||[]).find(x=>String(x.order_id)===String(no));if(o&&window.dutaShareNotaImage)window.dutaShareNotaImage(o);else alert('Buka ulang detail pesanan lalu coba lagi.')};
   d.insertAdjacentElement('afterend',wa);
 }
}
function exposeOrders(){if(!window.orders){try{window.orders=orders}catch(e){}}}
function run(){cleanupTabs();ensureSaran();styleStatus();mountOrderTabs();wireWA();exposeOrders();
 const list=$('orderList');if(list&&!window.__dutaFinalObserver){window.__dutaFinalObserver=new MutationObserver(()=>{clearTimeout(window.__dutaFinalTimer);window.__dutaFinalTimer=setTimeout(()=>{mountOrderTabs();wireWA();exposeOrders()},80)});window.__dutaFinalObserver.observe(list,{childList:true,subtree:true})}
}
function boot(){run();setTimeout(run,500);setTimeout(run,1200);setTimeout(run,2500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();