/* Duta LED — sinkron status pesanan dari Supabase */
(function(){
  'use strict';
  const URL='https://opgeeqnucxrdqcgwcuge.supabase.co';
  const KEY='sb_publishable_uqah55SK8ZjyugWprFnFMA_QnyVdCLA';
  const ORDERS_KEY='dutaled_orders';
  const headers={apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json'};

  function read(){try{return JSON.parse(localStorage.getItem(ORDERS_KEY)||'[]')||[]}catch(_){return[]}}
  function write(a){localStorage.setItem(ORDERS_KEY,JSON.stringify(a.slice(0,50)))}
  function statusClass(s){const x=String(s||'').toLowerCase();return x.includes('selesai')?'done':x.includes('kirim')?'ship':x.includes('batal')?'cancel':x.includes('bayar')?'pay':'wait'}
  function updateVisible(orderMap){
    document.querySelectorAll('.order-list-card').forEach(card=>{
      const strong=card.querySelector('.order-list-top strong');
      if(!strong)return;
      const o=orderMap[strong.textContent.trim()];
      if(!o)return;
      const badge=card.querySelector('.order-badge');
      if(badge){badge.textContent=o.status||'Menunggu Pembayaran';badge.className='order-badge '+statusClass(o.status)}
    });
    const success=document.getElementById('orderSuccess');
    if(success){
      const num=success.querySelector('.order-number-card strong');
      const o=num&&orderMap[num.textContent.trim()];
      if(o){const st=success.querySelector('.status-card .order-status strong');if(st)st.textContent=o.status||'Menunggu Pembayaran';}
    }
  }
  async function sync(){
    const local=read();
    if(!local.length)return;
    const ids=[...new Set(local.map(o=>o.orderNo||o.order_id).filter(Boolean))];
    if(!ids.length)return;
    try{
      const r=await fetch(URL+'/rest/v1/rpc/get_public_order_status',{method:'POST',headers,body:JSON.stringify({p_order_ids:ids}),cache:'no-store'});
      if(!r.ok)throw new Error('HTTP '+r.status);
      const rows=await r.json();
      if(!Array.isArray(rows))return;
      const map={};rows.forEach(x=>{map[x.order_id]=x});
      let changed=false;
      const merged=local.map(o=>{
        const id=o.orderNo||o.order_id, fresh=map[id];
        if(!fresh)return o;
        if(o.status!==fresh.status||o.status_diperbarui!==fresh.status_diperbarui){changed=true;return {...o,status:fresh.status||o.status,status_diperbarui:fresh.status_diperbarui||o.status_diperbarui}}
        return o;
      });
      if(changed)write(merged);
      updateVisible(map);
    }catch(err){console.warn('Status pesanan belum tersinkron:',err)}
  }
  window.syncOrderStatuses=sync;
  document.addEventListener('DOMContentLoaded',()=>{
    sync();
    document.addEventListener('dutaled:order-created',()=>setTimeout(sync,300));
    document.addEventListener('click',e=>{if(e.target.closest('[data-nav="orders"]'))setTimeout(sync,150)});
    setInterval(sync,30000);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});
  });
})();
