(function(){
  const STATUSES=[
    ['ALL','Semua',''],['Menunggu Pembayaran','Menunggu','st-menunggu'],['Diproses','Diproses','st-diproses'],['Dikemas','Dikemas','st-dikemas'],['Dikirim','Dikirim','st-dikirim'],['Selesai','Selesai','st-selesai'],['Dibatalkan','Dibatalkan','st-batal']
  ];
  let active='ALL';
  function norm(s){return String(s||'').trim().toLowerCase()}
  function cards(){return [...document.querySelectorAll('#orderList .order')]}
  function statusOf(card){return card.querySelector('.status')?.textContent?.trim()||''}
  function render(){
    const host=document.getElementById('orderStatusTabs'); if(!host)return;
    const all=cards();
    host.innerHTML=STATUSES.map(([v,label,cl])=>{const n=v==='ALL'?all.length:all.filter(c=>norm(statusOf(c))===norm(v)).length;return `<button type="button" class="order-status-tab ${active===v?'active':''} ${cl}" data-order-filter="${v}">${label}<b>${n}</b></button>`}).join('');
    all.forEach(c=>{c.style.display=active==='ALL'||norm(statusOf(c))===norm(active)?'':'none'});
    host.querySelectorAll('[data-order-filter]').forEach(b=>b.onclick=()=>{active=b.dataset.orderFilter;render()});
  }
  function mount(){
    const list=document.getElementById('orderList'); if(!list)return;
    if(!document.getElementById('orderStatusTabs')){const h=document.createElement('div');h.id='orderStatusTabs';h.className='order-status-tabs';list.parentElement.insertBefore(h,list)}
    render();
  }
  const style=document.createElement('style');style.textContent=`.order-status-tabs{display:flex;gap:7px;overflow:auto;margin:0 0 12px;padding:2px 1px 5px}.order-status-tab{white-space:nowrap;border:1px solid #dfe5ec;background:#fff;border-radius:10px;padding:8px 11px;font-size:12px;font-weight:800;cursor:pointer;color:#344054}.order-status-tab b{display:inline-flex;min-width:20px;height:19px;padding:0 5px;margin-left:5px;border-radius:10px;align-items:center;justify-content:center;background:#eef1f5;font-size:10px}.order-status-tab.active{background:#1769e0;color:#fff;border-color:#1769e0}.order-status-tab.active b{background:#fff;color:#1769e0}.order-status-tab.st-diproses{border-color:#f59e0b}.order-status-tab.st-dikemas{border-color:#8b5cf6}.order-status-tab.st-dikirim{border-color:#2563eb}.order-status-tab.st-selesai{border-color:#16a34a}.order-status-tab.st-batal{border-color:#dc2626}.order .status{font-weight:900}.order .status{background:#fff3cd;color:#8a6200}.order .status:where(.st-diproses){background:#fff7ed;color:#c2410c}.order .status:where(.st-dikemas){background:#f5f3ff;color:#6d28d9}.order .status:where(.st-dikirim){background:#eff6ff;color:#1d4ed8}.order .status:where(.st-selesai){background:#ecfdf3;color:#15803d}.order .status:where(.st-batal){background:#fef2f2;color:#b91c1c}@media(max-width:760px){.order-status-tabs{margin-left:-2px;margin-right:-2px}}`;document.head.appendChild(style);
  const mo=new MutationObserver(()=>mount());
  window.addEventListener('DOMContentLoaded',()=>{mount();const list=document.getElementById('orderList');if(list)mo.observe(list,{childList:true,subtree:true})});
})();
