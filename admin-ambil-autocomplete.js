/* DUTA LED - Autocomplete RIWAYAT Ambil Barang v20260904-6 */
(function(){
'use strict';
const KEY='DUTA_ADMIN_AMBIL_BARANG_V1';
const $=s=>document.querySelector(s);
const money=n=>'Rp'+(Number(n)||0).toLocaleString('id-ID');
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

/* HANYA membaca riwayat transaksi Ambil Barang yang tersimpan di KEY ini. */
function history(){
  let data=[];
  try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(a))data=a}catch(e){return []}
  const map=new Map();
  data.forEach((trx,txIndex)=>{
    const items=trx?.items||trx?.barang||trx?.details||[];
    if(!Array.isArray(items))return;
    items.forEach((it,itemIndex)=>{
      const name=String(it?.name??it?.nama??it?.namaBarang??it?.barang??'').trim();
      if(!name)return;
      const key=name.toLowerCase();
      const price=Number(it?.price??it?.harga??it?.hargaSatuan??0)||0;
      const discount=Number(it?.discount??it?.diskon??0)||0;
      const unit=String(it?.unit??it?.satuan??'pcs').trim()||'pcs';
      /* Data yang lebih baru menang, termasuk harga/diskon terakhir. */
      map.set(key,{name,price,discount,unit,order:txIndex*10000+itemIndex});
    });
  });
  return [...map.values()].sort((a,b)=>b.order-a.order);
}

function style(){
  if(document.getElementById('abHistoryAutoStyle'))return;
  const s=document.createElement('style');s.id='abHistoryAutoStyle';
  s.textContent=`
#abHistorySuggest{position:fixed;z-index:2147483647;background:#fff;border:1px solid #cfd7e3;border-radius:10px;box-shadow:0 10px 28px #0003;max-height:280px;overflow:auto;min-width:260px;display:none}
#abHistorySuggest button{display:block;width:100%;padding:10px 12px;text-align:left;border:0;border-bottom:1px solid #edf0f4;background:#fff;cursor:pointer;font-size:13px}
#abHistorySuggest button:last-child{border-bottom:0}
#abHistorySuggest button:hover,#abHistorySuggest button:focus{background:#f1f6ff;outline:0}
#abHistorySuggest b{display:block;color:#182230}
#abHistorySuggest small{display:block;color:#687486;margin-top:3px}
`;
  document.head.appendChild(s);
}

let box,activeInput,activeItems=[];
function ensureBox(){
  if(box)return box;
  box=document.createElement('div');box.id='abHistorySuggest';document.body.appendChild(box);return box;
}
function hide(){if(box)box.style.display='none';activeInput=null;activeItems=[]}
function position(){
  if(!activeInput||!box)return;
  const r=activeInput.getBoundingClientRect();
  box.style.left=Math.max(4,r.left)+'px';
  box.style.top=(r.bottom+3)+'px';
  box.style.width=Math.max(r.width,300)+'px';
}
function show(input){
  if(!input||!input.matches('#ab11rows input[data-k="name"]'))return;
  activeInput=input;
  const q=input.value.trim().toLowerCase();
  let arr=history();
  if(q)arr=arr.filter(x=>x.name.toLowerCase().includes(q));
  arr=arr.slice(0,15);
  activeItems=arr;
  const b=ensureBox();
  if(!arr.length){hide();return}
  b.innerHTML=arr.map((x,i)=>`<button type="button" data-pick="${i}"><b>${esc(x.name)}</b><small>${x.price?money(x.price):'Harga belum tersimpan'}${x.discount?' · Diskon '+x.discount+'%':''} · ${esc(x.unit)}</small></button>`).join('');
  b.style.display='block';position();
}
function pick(index){
  const x=activeItems[index],input=activeInput;
  if(!x||!input)return;
  const i=Number(input.dataset.i);
  input.value=x.name;
  const row=input.closest('.ab11row');
  if(row){
    const price=row.querySelector('input[data-k="price"]');
    const discount=row.querySelector('input[data-k="discount"]');
    const unit=row.querySelector('input[data-k="unit"]');
    if(price)price.value=x.price;
    if(discount)discount.value=x.discount;
    if(unit)unit.value=x.unit;
    /* Update state used by admin-final-fix without redrawing the input. */
    const ev=new Event('input',{bubbles:true});
    input.dispatchEvent(ev);price?.dispatchEvent(new Event('input',{bubbles:true}));discount?.dispatchEvent(new Event('input',{bubbles:true}));unit?.dispatchEvent(new Event('input',{bubbles:true}));
  }
  hide();
}
function install(){
  style();ensureBox();
  const rows=document.getElementById('ab11rows');
  if(!rows||rows.dataset.historyAutoInstalled)return;
  rows.dataset.historyAutoInstalled='1';
  rows.addEventListener('focusin',e=>{if(e.target.matches('input[data-k="name"]'))show(e.target)});
  rows.addEventListener('input',e=>{if(e.target.matches('input[data-k="name"]'))show(e.target)});
  rows.addEventListener('keydown',e=>{if(e.target.matches('input[data-k="name"]')&&e.key==='Escape')hide()});
  document.addEventListener('mousedown',e=>{
    const p=e.target.closest('#abHistorySuggest [data-pick]');
    if(p){e.preventDefault();pick(Number(p.dataset.pick));return}
    if(activeInput&&!e.target.closest('#abHistorySuggest')&&e.target!==activeInput)hide();
  });
  window.addEventListener('resize',position);window.addEventListener('scroll',position,true);
}
const mo=new MutationObserver(install);
function boot(){install();mo.observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
