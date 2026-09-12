/* DUTA LED - Ambil Barang FINAL BOOTSTRAP
   DATA: SUPABASE ONLY. No localStorage. */
(()=>{
'use strict';
const SRC='admin-ambil-barang.js?v=20260912-9';
let loaded=false;
function loadModule(){
  if(loaded || window.dutaShowAmbilBarang)return Promise.resolve();
  return new Promise(resolve=>{
    const old=[...document.scripts].find(s=>(s.src||'').includes('admin-ambil-barang.js'));
    if(old){loaded=true;resolve();return;}
    const s=document.createElement('script');
    s.src=SRC;
    s.async=false;
    s.onload=()=>{loaded=true;resolve()};
    s.onerror=()=>{console.error('[Ambil Barang] module gagal dimuat');resolve()};
    document.head.appendChild(s);
  });
}
function bind(){
  const b=document.getElementById('tabAmbilBarang');
  if(!b)return false;
  if(b.dataset.finalAbBound==='1')return true;
  b.dataset.finalAbBound='1';
  const open=e=>{
    if(e){e.preventDefault();e.stopImmediatePropagation();e.stopPropagation()}
    loadModule().then(()=>{
      if(typeof window.dutaShowAmbilBarang==='function')window.dutaShowAmbilBarang();
      else setTimeout(()=>window.dutaShowAmbilBarang&&window.dutaShowAmbilBarang(),100);
    });
  };
  b.addEventListener('click',open,true);
  b.addEventListener('touchend',open,{capture:true,passive:false});
  return true;
}
function boot(){
  loadModule();
  bind();
  let n=0;
  const t=setInterval(()=>{loadModule();if(bind()||++n>80)clearInterval(t)},100);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
