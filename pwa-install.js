/* Duta LED — install PWA floating prompt */
(function(){
'use strict';
var deferredPrompt=null,KEY='dutaled_pwa_install_closed',bar,installBtn,closeBtn,bound=false;
function getEls(){bar=document.getElementById('installPWA');installBtn=document.getElementById('installButton');closeBtn=document.getElementById('installClose');return!!(bar&&installBtn&&closeBtn)}
function hide(){if(bar)bar.classList.add('hidden')}
function show(){if(!getEls())return;if(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)return;if(window.navigator.standalone===true)return;if(localStorage.getItem(KEY)==='1')return;bar.classList.remove('hidden')}
function init(){if(bound||!getEls())return;bound=true;closeBtn.addEventListener('click',function(){localStorage.setItem(KEY,'1');hide()});installBtn.addEventListener('click',async function(){if(!deferredPrompt){hide();return}installBtn.disabled=true;try{deferredPrompt.prompt();await deferredPrompt.userChoice}catch(err){console.log('PWA install:',err)}finally{deferredPrompt=null;installBtn.disabled=false;hide()}});if(deferredPrompt)show()}
window.addEventListener('beforeinstallprompt',function(event){event.preventDefault();deferredPrompt=event;show()});
window.addEventListener('appinstalled',function(){deferredPrompt=null;hide();localStorage.removeItem(KEY)});
document.addEventListener('DOMContentLoaded',init);window.addEventListener('dutaled-install-ui-ready',init);
})();