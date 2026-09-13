/* Duta LED — install PWA prompt */
(function(){
'use strict';
var deferredPrompt=null,KEY='dutaled_pwa_install_closed_v3',bar,installBtn,closeBtn,bound=false;
function getEls(){
  bar=document.getElementById('installPWA');
  installBtn=document.getElementById('installButton');
  closeBtn=document.getElementById('installClose');
  if(bar&&installBtn&&closeBtn)return true;
  if(document.body&&!bar){
    var wrap=document.createElement('div');
    wrap.id='installPWA';
    wrap.className='install-pwa';
    wrap.innerHTML='<div class="install-pwa-icon">D</div><div class="install-pwa-text"><strong>Pasang Aplikasi Duta LED</strong><span>Lebih cepat dibuka dari HP</span></div><button id="installButton" type="button" class="installButton">INSTALL</button><button id="installClose" type="button" class="installClose" aria-label="Tutup">×</button>';
    document.body.appendChild(wrap);
    bar=wrap;installBtn=wrap.querySelector('#installButton');closeBtn=wrap.querySelector('#installClose');
  }
  return!!(bar&&installBtn&&closeBtn)
}
function hide(){if(bar)bar.classList.add('hidden')}
function show(){
  if(!getEls())return;
  if(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)return;
  if(window.navigator.standalone===true)return;
  if(localStorage.getItem(KEY)==='1')return;
  bar.classList.remove('hidden');
  installBtn.disabled=false;
  installBtn.textContent=deferredPrompt?'INSTALL':'CARA PASANG';
}
function init(){
  if(bound||!getEls())return;
  bound=true;
  closeBtn.addEventListener('click',function(){localStorage.setItem(KEY,'1');hide()});
  installBtn.addEventListener('click',async function(){
    if(!deferredPrompt){
      alert('Di Chrome HP: tekan menu ⋮ lalu pilih “Tambahkan ke layar utama” atau “Install app”. Jika pilihan belum ada, tutup tab DutaLED, buka lagi dari Chrome, lalu tunggu beberapa detik.');
      return;
    }
    installBtn.disabled=true;
    try{deferredPrompt.prompt();await deferredPrompt.userChoice}catch(err){console.log('PWA install:',err)}
    finally{deferredPrompt=null;installBtn.disabled=false;hide()}
  });
  show();
}
window.addEventListener('beforeinstallprompt',function(event){event.preventDefault();deferredPrompt=event;show()});
window.addEventListener('appinstalled',function(){deferredPrompt=null;hide();localStorage.removeItem(KEY)});
document.addEventListener('DOMContentLoaded',init);
window.addEventListener('load',function(){setTimeout(init,500)});
window.addEventListener('dutaled-install-ui-ready',init);
})();