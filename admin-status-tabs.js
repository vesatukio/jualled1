(function(){
'use strict';
const STATUSES=[
 ['ALL','Semua',''],
 ['BARU','Baru','st-baru'],
 ['DIPROSES','Diproses','st-diproses'],
 ['DIKIRIM','Dikirim','st-dikirim'],
 ['SELESAI','Selesai','st-selesai'],
 ['BATAL','Batal','st-batal']
];
let active='ALL';
function norm(s){return String(s||'').trim().toUpperCase()}
function cards(){return [...document.querySelectorAll('#orderList .order')]}
function statusOf(card){return card.querySelector('.status')?.textContent?.trim()||'BARU'}
function render(){
 const host=document.getElementById('orderStatusTabs');if(!host)return;
 const all=cards();
 host.innerHTML=STATUSES.map(([v,label,cl])=>{const n=v==='ALL'?all.length:all.filter(c=>norm(statusOf(c))===v).length;return `<button type="button" class="order-status-tab ${active===v?'active':''} ${cl}" data-order-filter="${v}">${label}<b>${n}</b></button>`}).join('');
 all.forEach(c=>{c.style.display=active==='ALL'||norm(statusOf(c))===active?'':'none'});
 host.querySelectorAll('[data-order-filter]').forEach(b=>b.onclick=()=>{active=b.dataset.orderFilter;render()});
}
function mount(){
 const list=document.getElementById('orderList');if(!list)return;
 if(!document.getElementById('orderStatusTabs')){const h=document.createElement('div');h.id='orderStatusTabs';h.className='order-status-tabs';list.parentElement.insertBefore(h,list)}
 render();
}
function init(){
 if(!document.getElementById('orderList'))return;
 mount();
 const list=document.getElementById('orderList');
 if(list&&!window.__dutaOrderStatusObserver){window.__dutaOrderStatusObserver=new MutationObserver(()=>{clearTimeout(window.__dutaOrderStatusTimer);window.__dutaOrderStatusTimer=setTimeout(mount,40)});window.__dutaOrderStatusObserver.observe(list,{childList:true,subtree:true})}
}
const style=document.createElement('style');style.textContent=`.order-status-tabs{display:flex;gap:7px;overflow-x:auto;margin:0 0 12px;padding:2px 1px 6px;scrollbar-width:none}.order-status-tabs::-webkit-scrollbar{display:none}.order-status-tab{white-space:nowrap;border:1px solid #dfe5ec;background:#fff;border-radius:10px;padding:8px 11px;font-size:12px;font-weight:800;cursor:pointer;color:#344054}.order-status-tab b{display:inline-flex;min-width:20px;height:19px;padding:0 5px;margin-left:5px;border-radius:10px;align-items:center;justify-content:center;background:#eef1f5;font-size:10px}.order-status-tab.active{background:#1769e0;color:#fff;border-color:#1769e0}.order-status-tab.active b{background:#fff;color:#1769e0}.order-status-tab.st-baru{border-color:#d9a400}.order-status-tab.st-diproses{border-color:#f59e0b}.order-status-tab.st-dikirim{border-color:#2563eb}.order-status-tab.st-selesai{border-color:#16a34a}.order-status-tab.st-batal{border-color:#dc2626}.order .status.st-baru{background:#fff3cd!important;color:#8a6200!important}.order .status.st-diproses{background:#fff7ed!important;color:#c2410c!important}.order .status.st-dikirim{background:#eff6ff!important;color:#1d4ed8!important}.order .status.st-selesai{background:#ecfdf3!important;color:#15803d!important}.order .status.st-batal{background:#fef2f2!important;color:#b91c1c!important}`;document.head.appendChild(style);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,150));else setTimeout(init,150);
})();