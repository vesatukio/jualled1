/* DUTA LED - Ambil Barang FINAL BOOTSTRAP
   SUPABASE ONLY. Loaded independently so the Ambil Barang tab cannot depend on another fix file. */
(()=>{
'use strict';
const SRC='admin-ambil-barang.js?v=20260912-4';
function load(){
  if(window.__AB_FINAL_BOOT)return;
  window.__AB_FINAL_BOOT=1;
  const run=()=>{
    let s=document.querySelector('script[src*="admin-ambil-barang.js"]');
    if(!s){
      s=document.createElement('script');
      s.src=SRC;
      s.async=false;
      s.onload=()=>setTimeout(bind,50);
      s.onerror=()=>{console.error('[Ambil Barang] gagal memuat module');};
      document.head.appendChild(s);
    }else bind();
  };
  function bind(){
    const b=document.getElementById('tabAmbilBarang');
    if(!b)return false;
    if(!b.dataset.abFinalBound){
      b.dataset.abFinalBound='1';
      b.addEventListener('click',e=>{
        e.preventDefault();e.stopImmediatePropagation();
        if(typeof window.dutaShowAmbilBarang==='function')window.dutaShowAmbilBarang();
      },true);
      b.addEventListener('touchend',e=>{
        e.preventDefault();e.stopImmediatePropagation();
        if(typeof window.dutaShowAmbilBarang==='function')window.dutaShowAmbilBarang();
      },{capture:true,passive:false});
    }
    return true;
  }
  run();
  let n=0,t=setInterval(()=>{if(bind()||++n>60)clearInterval(t)},200);
  setTimeout(run,500);setTimeout(run,1500);setTimeout(run,3000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();
