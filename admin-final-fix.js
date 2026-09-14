/* DUTA LED - Ambil Barang legacy handler disabled.
   Ambil Barang is handled by admin-ambil-cloud-sync.js.
   This file is intentionally a no-op so two handlers cannot compete. */
(()=>{
  'use strict';

  const css = `
    .ab-itemhead{
      grid-template-columns:minmax(0,1fr) 70px 135px 125px 36px !important;
      gap:7px !important;
    }
    .ab-itemhead > div{
      min-width:0 !important;
    }
    .ab-itemhead > div:nth-child(4){
      display:flex !important;
      flex-direction:column !important;
      min-width:115px !important;
    }
    .ab-itemhead .abi-discount{
      display:block !important;
      visibility:visible !important;
      opacity:1 !important;
      width:100% !important;
      min-width:0 !important;
    }
    @media(max-width:650px){
      .ab-itemhead{
        grid-template-columns:minmax(0,1fr) 58px 90px 90px 34px !important;
        gap:5px !important;
      }
      .ab-itemhead > div:nth-child(4){
        min-width:90px !important;
      }
    }
  `;

  const style = document.createElement('style');
  style.id = 'duta-led-ambil-diskon-css';
  style.textContent = css;
  document.head.appendChild(style);

  // Saat tombol Edit nota diklik, langsung bawa layar ke form edit.
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-edit]');
    if (!btn) return;
    setTimeout(() => {
      const form = document.getElementById('abSafeForm');
      if (!form || !form.firstElementChild) return;
      form.scrollIntoView({behavior:'smooth', block:'start'});
      setTimeout(() => document.getElementById('absSupplier')?.focus(), 350);
    }, 50);
  });
})();
