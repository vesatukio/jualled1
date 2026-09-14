/* DUTA LED - Ambil Barang Cloud Sync compatibility + autocomplete loader + date sorting */
(()=>{'use strict';
window.dutaAmbilSync=async()=>{};
window.dutaSyncAmbilBarang=async()=>{};
window.refreshAmbilBarangCloud=async()=>{};
function loadAutocomplete(){if(window.__dutaAmbilAutocompleteLoaded)return;window.__dutaAmbilAutocompleteLoaded=true;const s=document.createElement('script');s.src='admin-ambil-autocomplete.js?v=20260913-1';s.async=false;s.onload=()=>console.log('[Ambil Barang] autocomplete aktif');s.onerror=()=>{window.__dutaAmbilAutocompleteLoaded=false;console.warn('[Ambil Barang] autocomplete gagal dimuat')};document.head.appendChild(s)}
function hideAmbilBarang(){const v=document.getElementById('ambilBarangView');if(!v)return;v.classList.add('hidden');v.style.setProperty('display','none','important')}
function isOtherTab(tab){if(!tab)return false;if(tab.id==='tabAmbilBarang')return false;return tab.classList.contains('tab')||/^tab(Orders|Products|StoreFinance|PersonalFinance)$/i.test(tab.id||'')}
function fixAmbilTabPersistence(){document.addEventListener('click',e=>{const tab=e.target.closest?.('.tabs button,.tabs a,.tab');if(!isOtherTab(tab))return;hideAmbilBarang();setTimeout(hideAmbilBarang,0);setTimeout(hideAmbilBarang,50)},true)}
function sortAmbilByTanggal(){const l=document.getElementById('abfList');if(!l)return;const cards=[...l.querySelectorAll('.abf-card')];if(cards.length<2)return;const getDate=el=>{const s=el.querySelector('.abf-top small')?.textContent||'';const m=s.match(/(\d{4}-\d{2}-\d{2})/);return m?m[1]:''};cards.sort((a,b)=>getDate(b).localeCompare(getDate(a))||((b.querySelector('[data-edit]')?.dataset.edit||'').localeCompare(a.querySelector('[data-edit]')?.dataset.edit||'')));cards.forEach(c=>l.appendChild(c))}
function watchAmbilSort(){const l=document.getElementById('abfList');if(!l||l.dataset.dateSort)return;l.dataset.dateSort='1';sortAmbilByTanggal()}
function init(){loadAutocomplete();fixAmbilTabPersistence();const timer=setInterval(()=>{if(document.getElementById('abfList')){watchAmbilSort();sortAmbilByTanggal()}},300);setTimeout(()=>clearInterval(timer),30000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
