/* DUTA LED - page load helper + watt variant UI loader */
(function(){
  'use strict';
  function loadWattUI(){
    if(!document.querySelector('link[data-watt-ui]')){
      var css=document.createElement('link');css.rel='stylesheet';css.href='watt-variant-group.css?v=1';css.dataset.wattUi='1';document.head.appendChild(css);
    }
    if(!document.querySelector('script[data-watt-ui]')){
      var s=document.createElement('script');s.src='watt-variant-group.js?v=1';s.defer=true;s.dataset.wattUi='1';document.body.appendChild(s);
    }
  }
  function boot(){
    loadWattUI();
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
