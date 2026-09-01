/* DUTA LED - Admin Promo Header v1
 * Menyimpan daftar promo header di localStorage.
 * Bisa memakai URL gambar atau upload file gambar sebagai data URL.
 */
(function(){
  'use strict';
  const KEY='duta_led_promo_header_v1';
  const $=s=>document.querySelector(s);
  const clean=s=>String(s??'').trim();
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||'[]').filter(x=>x&&x.image);}catch(e){return [];}}
  function save(items){localStorage.setItem(KEY,JSON.stringify(items));window.dispatchEvent(new CustomEvent('dutaPromoUpdated',{detail:items}));render();}
  function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function render(){
    const box=$('#promoHeaderList'); if(!box)return;
    const items=load();
    box.innerHTML=items.length?items.map((p,i)=>`<div class="promo-admin-item" data-i="${i}"><img src="${esc(p.image)}" alt=""><div class="promo-admin-main"><b>${esc(p.title||'Promo '+(i+1))}</b><small>${esc(p.link||'Tanpa link')}</small></div><button type="button" data-action="up" title="Naik">↑</button><button type="button" data-action="down" title="Turun">↓</button><button type="button" data-action="toggle">${p.active===false?'OFF':'ON'}</button><button type="button" data-action="delete" title="Hapus">×</button></div>`).join(''):'<div class="promo-empty">Belum ada promo header.</div>';
  }
  function add(image,title,link){
    image=clean(image); if(!image){alert('Masukkan URL gambar atau pilih file gambar.');return;}
    const items=load();items.push({id:Date.now().toString(36),image,title:clean(title),link:clean(link),active:true});save(items);
  }
  function bind(){
    const form=$('#promoHeaderForm');if(!form)return;
    const url=$('#promoImageUrl'),file=$('#promoImageFile'),title=$('#promoTitle'),link=$('#promoLink'),preview=$('#promoImagePreview');
    file?.addEventListener('change',()=>{const f=file.files?.[0];if(!f)return;if(!f.type.startsWith('image/')){alert('File harus berupa gambar.');file.value='';return;}if(f.size>2*1024*1024){alert('Ukuran gambar maksimal 2 MB.');file.value='';return;}const r=new FileReader();r.onload=()=>{url.value='';url.dataset.fileData=r.result;preview.src=r.result;preview.hidden=false;};r.readAsDataURL(f);});
    url?.addEventListener('input',()=>{url.dataset.fileData='';const v=clean(url.value);if(v){preview.src=v;preview.hidden=false;}else preview.hidden=true;});
    form.addEventListener('submit',e=>{e.preventDefault();const image=clean(url.value)||url.dataset.fileData||'';add(image,title.value,link.value);form.reset();url.dataset.fileData='';preview.hidden=true;});
    $('#promoHeaderList')?.addEventListener('click',e=>{const btn=e.target.closest('button[data-action]');if(!btn)return;const row=btn.closest('.promo-admin-item'),i=Number(row?.dataset.i);const items=load();if(!Number.isInteger(i)||!items[i])return;const a=btn.dataset.action;if(a==='delete'){if(confirm('Hapus promo ini?'))items.splice(i,1);}else if(a==='up'&&i>0)[items[i-1],items[i]]=[items[i],items[i-1]];else if(a==='down'&&i<items.length-1)[items[i+1],items[i]]=[items[i],items[i+1]];else if(a==='toggle')items[i].active=items[i].active===false;save(items);});
    render();
  }
  window.getPromoHeader=()=>load().filter(x=>x.active!==false);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
