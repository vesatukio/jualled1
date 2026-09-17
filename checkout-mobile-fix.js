/* DutaLED - checkout mobile/PWA fix */
(function(){
  'use strict';
  const CART_KEY='dutaled_cart_v4';
  function hasCart(){
    try{
      const c=JSON.parse(localStorage.getItem(CART_KEY)||'[]');
      return Array.isArray(c)&&c.length>0;
    }catch(e){return false;}
  }
  function open(){
    if(!hasCart()) return;
    if(typeof window.openCheckout==='function'){
      window.openCheckout();
    }
  }
  function hook(){
    const b=document.getElementById('checkoutButton');
    if(b&&!b.dataset.mobileCheckoutFix){
      b.dataset.mobileCheckoutFix='1';
      b.addEventListener('click',function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        open();
      },true);
    }
    const params=new URLSearchParams(location.search);
    if(params.get('cart')==='1'&&hasCart()){
      setTimeout(open,180);
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',hook);
  else hook();
})();
