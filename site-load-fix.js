/* DutaLED - page load helper + manual variant UI loader */
(function(){
  'use strict';
  function loadCatalogVariantUI(){
    if(!document.querySelector('link[data-watt-ui]')){
      var css=document.createElement('link');css.rel='stylesheet';css.href='watt-variant-group.css?v=2';css.dataset.wattUi='1';document.head.appendChild(css);
    }
    if(!document.querySelector('script[data-watt-ui]')){
      var s=document.createElement('script');s.src='watt-variant-group.js?v=2';s.defer=true;s.dataset.wattUi='1';document.body.appendChild(s);
    }
  }
  function loadAdminVariantUI(){
    if(!document.querySelector('script[data-manual-variant-admin]')){
      var s=document.createElement('script');s.src='admin-variant-manager.js?v=3';s.defer=true;s.dataset.manualVariantAdmin='1';document.body.appendChild(s);
    }
  }
  function boot(){
    if(/admin/i.test(location.pathname)) loadAdminVariantUI();
    else loadCatalogVariantUI();
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
