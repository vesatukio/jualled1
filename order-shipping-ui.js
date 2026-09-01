/* Duta LED — tampilan ongkir, COD, resi & tracking di sisi pembeli */
(function(){
  'use strict';
  const KEY='dutaled_orders';
  const rupiah=n=>'Rp'+(Number(n)||0).toLocaleString('id-ID');
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')||[]}catch(_){return[]}};
  function track(carrier,resi){
    const r=encodeURIComponent(resi||''),c=String(carrier||'').toLowerCase(); if(!r)return '';
    if(c.includes('j&t'))return 'https://www.jet.co.id/track?awb='+r;
    if(c.includes('jne'))return 'https://www.jne.co.id/index.php?mib=tracking.detail&awb='+r;
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
  function find(orderNo){return read().find(o=>(o.orderNo||o.order_id)===orderNo);}
  function block(o){
    if(!o)return '';
    const produk=Number(o.total_harga??o.total)||0,ong=Number(o.ongkir)||0,cod=Number(o.biaya_cod)||0,grand=produk+ong+cod;
    const carrier=o.ekspedisi||'',resi=o.nomor_resi||'',url=track(carrier,resi);
    return `<div class="buyer-shipping-box"><div class="buyer-shipping-title">🚚 Pengiriman</div>${carrier?`<div class="buyer-row"><span>Ekspedisi</span><b>${esc(carrier)}</b></div>`:''}${resi?`<div class="buyer-row"><span>Nomor Resi</span><b class="buyer-resi">${esc(resi)}</b></div><a class="buyer-track-btn" href="${url}" target="_blank" rel="noopener noreferrer">🔎 Lacak Pengiriman</a>`:''}<div class="buyer-row"><span>Total produk</span><b>${rupiah(produk)}</b></div><div class="buyer-row"><span>Ongkir</span><b>${rupiah(ong)}</b></div>${cod?`<div class="buyer-row"><span>Biaya COD</span><b>${rupiah(cod)}</b></div>`:''}<div class="buyer-grand"><span>Total dibayar</span><b>${rupiah(grand)}</b></div></div>`;
  }
  function decorate(){
    const orders=read();
    document.querySelectorAll('.order-list-card').forEach(card=>{
      const n=card.querySelector('.order-list-top strong')?.textContent?.trim(),o=orders.find(x=>(x.orderNo||x.order_id)===n);if(!o)return;
      let box=card.querySelector('.buyer-shipping-box');
      const html=block(o); if(!html)return;
      if(box)box.outerHTML=html; else card.insertAdjacentHTML('beforeend',html);
    });
    const success=document.getElementById('orderSuccess');
    if(success){
      const n=success.querySelector('.order-number-card strong')?.textContent?.trim(),o=orders.find(x=>(x.orderNo||x.order_id)===n);
      if(o){let box=success.querySelector('.buyer-shipping-box');const html=block(o);if(box)box.outerHTML=html;else success.querySelector('.order-success-page')?.insertAdjacentHTML('beforeend',html)}
    }
  }
  const css=document.createElement('style');css.textContent=`.buyer-shipping-box{margin-top:12px;padding:13px;border:1px solid #e2e7ee;border-radius:12px;background:#f8fafc;font-size:13px}.buyer-shipping-title{font-weight:900;font-size:15px;margin-bottom:8px}.buyer-row{display:flex;justify-content:space-between;gap:12px;padding:4px 0}.buyer-row span{color:#667085}.buyer-row b{color:#17202a;text-align:right}.buyer-resi{word-break:break-all}.buyer-track-btn{display:block;text-align:center;margin:9px 0;padding:10px;border-radius:9px;background:#ff7200;color:#fff!important;text-decoration:none!important;font-weight:900}.buyer-grand{display:flex;justify-content:space-between;margin-top:7px;padding-top:8px;border-top:1px dashed #ccd3dc;font-size:14px;font-weight:900}.buyer-grand b{font-size:16px}.buyer-track-btn:active{transform:scale(.98)}`;document.head.appendChild(css);
  window.addEventListener('load',()=>{decorate();setTimeout(decorate,500);setTimeout(decorate,1500);});
  document.addEventListener('click',e=>{if(e.target.closest('[data-nav="orders"],.order-view-btn'))setTimeout(decorate,300)});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(decorate,200)});
  setInterval(decorate,5000);
})();
