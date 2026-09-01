/* Duta LED — checkout selesai langsung ke Pesanan Saya */
(function(){
  'use strict';

  function goToOrders(){
    try{
      document.getElementById('orderSuccess')?.remove();
      document.body.classList.remove('order-success-open');
      document.getElementById('ordersPage')?.remove();

      if(typeof window.showOrders === 'function'){
        window.showOrders();
      }

      document.querySelectorAll('.bottom-nav-item[data-nav]').forEach(function(el){
        el.classList.toggle('active', el.getAttribute('data-nav') === 'orders');
      });
    }catch(err){
      console.error('Order flow error:', err);
    }
  }

  document.addEventListener('dutaled:order-created', function(){
    setTimeout(goToOrders, 50);
  });
})();
