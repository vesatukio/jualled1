/* Duta LED — install PWA floating prompt */
(function () {
  'use strict';

  var deferredPrompt = null;
  var KEY = 'dutaled_pwa_install_closed';
  var bar, installBtn, closeBtn;

  function getEls() {
    bar = document.getElementById('installPWA');
    installBtn = document.getElementById('installButton');
    closeBtn = document.getElementById('installClose');
    return !!(bar && installBtn && closeBtn);
  }

  function hide() {
    if (bar) bar.classList.add('hidden');
  }

  function show() {
    if (!getEls()) return;
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return;
    if (window.navigator.standalone === true) return;
    if (localStorage.getItem(KEY) === '1') return;
    bar.classList.remove('hidden');
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    deferredPrompt = event;
    show();
  });

  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    hide();
    localStorage.removeItem(KEY);
  });

  document.addEventListener('DOMContentLoaded', function () {
    if (!getEls()) return;

    closeBtn.addEventListener('click', function () {
      localStorage.setItem(KEY, '1');
      hide();
    });

    installBtn.addEventListener('click', async function () {
      if (!deferredPrompt) {
        hide();
        return;
      }

      installBtn.disabled = true;
      try {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
      } catch (err) {
        console.log('PWA install:', err);
      } finally {
        deferredPrompt = null;
        installBtn.disabled = false;
        hide();
      }
    });
  });
})();
