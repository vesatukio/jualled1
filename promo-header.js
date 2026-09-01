/* DUTA LED - Promo Header v1 */
(function(){
  'use strict';
  const KEY='duta_led_promo_header_v1';
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function get(){try{return JSON.parse(localStorage.getItem(KEY)||'[]').filter(x=>x&&x.image&&x.active!==false);}catch(e){return[];}}
  function render(){
    const host=document.getElementById('heroSlides');if(!host)return;
    const items=get(); if(!items.length){host.innerHTML='';return;}
    host.innerHTML=items.map((p,i)=>`<a class="promo-header-slide${i===0?' active':''}" href="${esc(p.link||'#')}" ${p.link?'':'onclick="return false"'}><img src="${esc(p.image)}" alt="${esc(p.title||'Promo Duta LED')}" loading="${i===0?'eager':'lazy'}"></a>`).join('');
    let n=0;clearInterval(window.__dutaPromoTimer);
    if(items.length>1){window.__dutaPromoTimer=setInterval(()=>{const slides=host.querySelectorAll('.promo-header-slide');if(!slides.length)return;slides[n]?.classList.remove('active');n=(n+1)%slides.length;slides[n]?.classList.add('active');},4000);}
  }
  window.renderPromoHeader=render;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
  window.addEventListener('dutaPromoUpdated',render);
  window.addEventListener('storage',e=>{if(e.key===KEY)render();});
})();
