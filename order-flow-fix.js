/* DutaLED — checkout flow fix: use the built-in checkout modal on desktop, mobile and PWA */
(function(){
  'use strict';
  var CART_KEY='dutaled_cart_v4';
  function readCart(){
    try{var cart=JSON.parse(localStorage.getItem(CART_KEY)||'[]');return Array.isArray(cart)?cart:[];}catch(_){return[];}
  }
  function goCheckout(e){
    var b=e.target&&e.target.closest?e.target.closest('#checkoutButton'):null;
    if(!b)return;
    e.preventDefault();e.stopImmediatePropagation();
    if(!readCart().length){alert('Keranjang masih kosong. Tambahkan produk terlebih dahulu.');return;}
    if(typeof window.openCheckout==='function')window.openCheckout();
    else setTimeout(function(){if(typeof window.openCheckout==='function')window.openCheckout();},150);
  }
  function init(){document.addEventListener('click',goCheckout,true);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
