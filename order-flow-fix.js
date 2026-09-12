/* DutaLED — checkout dedicated page */
(function(){
  'use strict';

  function hasCart(){
    try{
      var cart=JSON.parse(localStorage.getItem('dutaled_cart_v4')||'[]');
      return Array.isArray(cart) && cart.length>0;
    }catch(_){ return false; }
  }

  function goCheckout(e){
    var b=e.target.closest ? e.target.closest('#checkoutButton') : null;
    if(!b) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if(!hasCart()){
      alert('Keranjang masih kosong.');
      return;
    }
    window.location.href='checkout.html';
  }

  function init(){
    document.addEventListener('click',goCheckout,true);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
