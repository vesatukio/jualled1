/* Duta LED — sinkron status + pengiriman pesanan dari Supabase */
(function(){
  'use strict';
  const URL='https://opgeeqnucxrdqcgwcuge.supabase.co';
  const KEY='sb_publishable_uqah55SK8ZjyugWprFnFMA_QnyVdCLA';
  const ORDERS_KEY='dutaled_orders';
  const headers={apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json'};
  function read(){try{return JSON.parse(localStorage.getItem(ORDERS_KEY)||'[]')||[]}catch(_){return[]}}
  function write(a){localStorage.setItem(ORDERS_KEY,JSON.stringify(a.slice(0,50)))}
  function statusClass(s){const x=String(s||'').toLowerCase();return x.includes('selesai')?'done':x.includes('kirim')?'ship':x.includes('batal')?'cancel':x.includes('bayar')?'pay':'wait'}
  function trackingUrl(carrier,resi){
    const r=encodeURIComponent(resi||''); const c=String(carrier||'').toLowerCase();
    if(!r)return '';
    if(c.includes('j&t'))return 'https://www.jet.co.id/track?awb='+r;
    if(c==='jne'||c.includes('jne '))return 'https://www.jne.co.id/index.php?mib=tracking.detail&awb='+r;
    if(c.includes('sicepat'))return 'https://www.sicepat.com/checkAwb?awb='+r;
    if(c.includes('spx'))return 'https://spx.co.id/';
    if(c.includes('pos'))return 'https://www.posindonesia.co.id/id/tracking';
    if(c.includes('anteraja'))return 'https://anteraja.id/tracking';
    if(c.includes('ninja'))return 'https://www.ninjaxpress.co/id-id/tracking';
    if(c.includes('lion'))return 'https://lionparcel.com/track';
    if(c.includes('tiki'))return 'https://tiki.id/id/tracking';
    if(c.includes('id express'))return 'https://idexpress.com/';
    return 'https://www.google.com/search?q='+encodeURIComponent(String(carrier||'')+' tracking resi '+resi);
  }
  function shippingHtml(o){
    if(!o||!o.nomor_resi)return '';
    const carrier=o.ekspedisi||'Ekspedisi';
    const url=trackingUrl(carrier,o.nomor_resi);
    return `<div class="order-shipping-sync"><div>🚚 <b>${carrier}</b></div><div>Resi: <b>${o.nomor_resi}</b></div>${url?`<a href="${url}" target="_blank" rel="noopener">🔎 Lacak Pengiriman</a>`:''}</div>`;
  }
  function updateVisible(orderMap){
    document.querySelectorAll('.order-list-card').forEach(card=>{
      const strong=card.querySelector('.order-list-top strong'); if(!strong)return;
      const o=orderMap[strong.textContent.trim()]; if(!o)return;
      const badge=card.querySelector('.order-badge');
      if(badge){badge.textContent=o.status||'Menunggu Pembayaran';badge.className='order-badge '+statusClass(o.status)}
      let box=card.querySelector('.order-shipping-sync'); if(o.nomor_resi){if(!box){box=document.createElement('div');card.appendChild(box)}box.outerHTML=shippingHtml(o)} else if(box)box.remove();
    });
    const success=document.getElementById('orderSuccess');
    if(success){
      const num=success.querySelector('.order-number-card strong'); const o=num&&orderMap[num.textContent.trim()];
      if(o){const st=success.querySelector('.status-card .order-status strong');if(st)st.textContent=o.status||'Menunggu Pembayaran';let box=success.querySelector('.order-shipping-sync');if(o.nomor_resi){if(!box){box=document.createElement('div');success.appendChild(box)}box.outerHTML=shippingHtml(o)}else if(box)box.remove();}
    }
  }
  async function sync(){
    const local=read(); if(!local.length)return;
    const ids=[...new Set(local.map(o=>o.orderNo||o.order_id).filter(Boolean))]; if(!ids.length)return;
    try{
      const r=await fetch(URL+'/rest/v1/rpc/get_public_order_status',{method:'POST',headers,body:JSON.stringify({p_order_ids:ids}),cache:'no-store'});
      if(!r.ok)throw new Error('HTTP '+r.status);
      const rows=await r.json(); if(!Array.isArray(rows))return;
      const map={};rows.forEach(x=>{map[x.order_id]=x}); let changed=false;
      const merged=local.map(o=>{const id=o.orderNo||o.order_id,fresh=map[id];if(!fresh)return o;if(o.status!==fresh.status||o.status_diperbarui!==fresh.status_diperbarui||o.nomor_resi!==fresh.nomor_resi||o.ekspedisi!==fresh.ekspedisi){changed=true;return {...o,status:fresh.status||o.status,status_diperbarui:fresh.status_diperbarui||o.status_diperbarui,nomor_resi:fresh.nomor_resi||null,ekspedisi:fresh.ekspedisi||null}}return o});
      if(changed)write(merged); updateVisible(map);
    }catch(err){console.warn('Status/resi pesanan belum tersinkron:',err)}
  }
  window.syncOrderStatuses=sync;
  document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent='.order-shipping-sync{margin-top:10px;padding:10px;background:#f7f9fc;border:1px solid #e4e8ee;border-radius:10px;font-size:12px;line-height:1.6}.order-shipping-sync a{display:inline-block;margin-top:6px;padding:7px 10px;border-radius:8px;background:#ff7200;color:#fff;text-decoration:none;font-weight:800}.order-shipping-sync a:active{transform:scale(.98)}';document.head.appendChild(s);sync();document.addEventListener('dutaled:order-created',()=>setTimeout(sync,300));document.addEventListener('click',e=>{if(e.target.closest('[data-nav="orders"]'))setTimeout(sync,150)});setInterval(sync,30000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()})});
})();