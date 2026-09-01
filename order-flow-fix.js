/* Duta LED — checkout selesai langsung ke Pesanan Saya + checkout fallback */
(function(){
  'use strict';

  function loadCheckoutFallback(){
    if(document.getElementById('checkoutModal') || document.querySelector('script[data-checkout-hotfix]')) return;
    var s=document.createElement('script');
    s.src='checkout-hotfix.js?v=2';
    s.async=false;
    s.setAttribute('data-checkout-hotfix','1');
    document.head.appendChild(s);
  }

  function goToOrders(){
    try{
      document.getElementById('orderSuccess')?.remove();
      document.body.classList.remove('order-success-open');
      document.getElementById('ordersPage')?.remove();
      if(typeof window.showOrders === 'function') window.showOrders();
      document.querySelectorAll('.bottom-nav-item[data-nav]').forEach(function(el){
        el.classList.toggle('active', el.getAttribute('data-nav') === 'orders');
      });
    }catch(err){ console.error('Order flow error:',err); }
  }

  function init(){
    loadCheckoutFallback();
    document.addEventListener('dutaled:order-created',function(){ setTimeout(goToOrders,50); });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
