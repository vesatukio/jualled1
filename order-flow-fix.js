/* DutaLED — checkout dedicated page */
(function(){
  'use strict';
  var CART_KEY='dutaled_cart_v4';
  var HANDOFF_KEY='dutaled_checkout_handoff_v1';

  function readCart(){
    var keys=[CART_KEY,'dutaled_cart_v3','dutaled_cart_v2','dutaled_cart','cart'];
    for(var i=0;i<keys.length;i++){
      try{
        var raw=localStorage.getItem(keys[i]);
        if(!raw) continue;
        var cart=JSON.parse(raw);
        if(Array.isArray(cart)&&cart.length) return cart;
      }catch(_){ }
    }
    return [];
  }

  function hasCart(){ return readCart().length>0; }

  function saveHandoff(cart){
    try{
      sessionStorage.setItem(HANDOFF_KEY,JSON.stringify(cart));
      localStorage.setItem(CART_KEY,JSON.stringify(cart));
    }catch(_){ }
  }

  function goCheckout(e){
    var b=e.target.closest ? e.target.closest('#checkoutButton') : null;
    if(!b) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    var cart=readCart();
    if(!cart.length){
      alert('Keranjang masih kosong. Tambahkan produk terlebih dahulu.');
      return;
    }
    saveHandoff(cart);
    window.location.href='checkout.html?cart=1';
  }

  function init(){ document.addEventListener('click',goCheckout,true); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
