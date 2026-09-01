/* Duta LED — reliable bottom navigation */
(function(){
  'use strict';
  function init(){
    var items=document.querySelectorAll('.bottom-nav-item[data-nav]');
    if(!items.length)return;
    items.forEach(function(el){
      el.addEventListener('click',function(e){
        e.preventDefault();
        var nav=el.getAttribute('data-nav');
        items.forEach(function(x){x.classList.remove('active');});
        el.classList.add('active');
        if(nav==='home'){
          document.getElementById('ordersPage')?.remove();
          window.scrollTo({top:0,behavior:'smooth'});
        }else if(nav==='cart'){
          var b=document.getElementById('cartButton');if(b)b.click();
        }else if(nav==='orders'){
          if(typeof window.showOrders==='function') window.showOrders();
        }else if(nav==='account'){
          window.location.href='./admin.html';
        }
      });
    });
    var cc=document.getElementById('cartCount'),bc=document.getElementById('bottomCartCount');
    if(cc&&bc){function sync(){bc.textContent=cc.textContent||'0';}sync();new MutationObserver(sync).observe(cc,{childList:true,characterData:true,subtree:true});}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();