/* DUTA LED - prevent public catalog spinner from blocking the page */
(function(){
  'use strict';
  function boot(){
    setTimeout(function(){
      const loading=document.getElementById('loading');
      const grid=document.getElementById('productGrid');
      const status=document.getElementById('status');
      if(!loading)return;
      const stillLoading=!loading.classList.contains('hidden');
      const hasProducts=!!(grid&&grid.children&&grid.children.length);
      if(stillLoading&&!hasProducts){
        loading.classList.add('hidden');
        if(status)status.textContent='Katalog sedang tidak dapat dimuat. Silakan refresh beberapa saat lagi.';
      }
    },7000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
