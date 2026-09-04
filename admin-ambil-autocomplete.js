/* DUTA LED - Autocomplete barang + harga Ambil Barang v20260904-3 */
(function(){
'use strict';
const KEY='DUTA_ADMIN_AMBIL_BARANG_V1';
const HISTORY='DUTA_ADMIN_AMBIL_BARANG_NAMES_V1';
const $=id=>document.getElementById(id);
const money=n=>'Rp'+(Number(n)||0).toLocaleString('id-ID');

function loadItems(){
  const out=[];

  try{
    const h=JSON.parse(localStorage.getItem(HISTORY)||'[]');
    if(Array.isArray(h)){
      h.forEach(x=>{
        if(typeof x==='string'){
          out.push({name:x,price:0,unit:'pcs'});
        }else if(x&&x.name){
          out.push({name:x.name,price:Number(x.price)||0,unit:x.unit||'pcs'});
        }
      });
    }
  }catch(e){}

  try{
    const a=JSON.parse(localStorage.getItem(KEY)||'[]');
    if(Array.isArray(a)){
      a.forEach(x=>{
        (x.items||[]).forEach(i=>{
          if(i&&i.name){
            out.push({
              name:i.name,
              price:Number(i.price)||0,
              unit:i.unit||'pcs',
              variant:i.variant||''
            });
          }
        });
      });
    }
  }catch(e){}

  const map=new Map();
  out.forEach(x=>{
    const k=String(x.name).trim().toLowerCase();
    if(k)map.set(k,{...x,name:String(x.name).trim()});
  });
  return [...map.values()];
}

function remember(){
  try{
    const old=loadItems();
    document.querySelectorAll('#abItemRows input[data-abk="name"]').forEach(input=>{
      const name=input.value.trim();
      if(!name)return;
      const i=Number(input.dataset.i);
      const price=Number(document.querySelector(`#abItemRows input[data-abk="price"][data-i="${i}"]`)?.value)||0;
      const unit=document.querySelector(`#abItemRows input[data-abk="unit"][data-i="${i}"]`)?.value||'pcs';
      old.unshift({name,price,unit});
    });

    const m=new Map();
    old.forEach(x=>m.set(x.name.toLowerCase(),x));
    localStorage.setItem(HISTORY,JSON.stringify([...m.values()].slice(0,300)));
  }catch(e){}
}

function esc(s){
  return String(s??'').replace(/[&<>"']/g,m=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[m]));
}

function install(){
  const view=$('ambilBarangView');
  if(!view)return;

  if(!document.getElementById('abAutoStyle')){
    const s=document.createElement('style');
    s.id='abAutoStyle';
    s.textContent='.ab-name-wrap{position:relative}.ab-suggest{position:absolute;left:0;right:0;top:calc(100% + 3px);z-index:100000;background:#fff;border:1px solid #d8dee7;border-radius:9px;box-shadow:0 8px 24px #0002;max-height:240px;overflow:auto}.ab-suggest button{display:block;width:100%;text-align:left;padding:10px 12px;border:0;background:#fff;cursor:pointer;font-size:13px}.ab-suggest button:hover{background:#f1f6ff}.ab-suggest small{display:block;color:#778294;margin-top:3px}';
    document.head.appendChild(s);
  }

  document.querySelectorAll('#abItemRows input[data-abk="name"]').forEach(input=>{
    if(input.dataset.abInstalled)return;
    input.dataset.abInstalled='1';

    const wrap=document.createElement('div');
    wrap.className='ab-name-wrap';
    input.parentNode.insertBefore(wrap,input);
    wrap.appendChild(input);

    const box=document.createElement('div');
    box.className='ab-suggest';
    box.hidden=true;
    wrap.appendChild(box);

    const show=()=>{
      const q=input.value.trim().toLowerCase();
      if(q.length<2){
        box.hidden=true;
        return;
      }

      const arr=loadItems()
        .filter(x=>x.name.toLowerCase().includes(q))
        .sort((a,b)=>Number(b.name.toLowerCase().startsWith(q))-Number(a.name.toLowerCase().startsWith(q)))
        .slice(0,10);

      if(!arr.length){
        box.hidden=true;
        return;
      }

      box.innerHTML=arr.map((x,i)=>`<button type="button" data-pick="${i}"><b>${esc(x.name)}</b><small>${x.price?money(x.price):'Harga belum tersimpan'} · ${esc(x.unit||'pcs')}</small></button>`).join('');
      box.hidden=false;

      box.querySelectorAll('[data-pick]').forEach((b,i)=>{
        b.onmousedown=e=>{
          e.preventDefault();
          const x=arr[i];
          input.value=x.name;

          const n=Number(input.dataset.i);
          const price=document.querySelector(`#abItemRows input[data-abk="price"][data-i="${n}"]`);
          const unit=document.querySelector(`#abItemRows input[data-abk="unit"][data-i="${n}"]`);

          if(price&&!Number(price.value)&&x.price)price.value=x.price;
          if(unit&&!unit.value)unit.value=x.unit||'pcs';

          input.dispatchEvent(new Event('input',{bubbles:true}));
          price?.dispatchEvent(new Event('input',{bubbles:true}));
          unit?.dispatchEvent(new Event('input',{bubbles:true}));
          box.hidden=true;
        };
      });
    };

    input.addEventListener('input',show);
    input.addEventListener('focus',show);
    input.addEventListener('blur',()=>setTimeout(()=>{box.hidden=true;},180));
  });
}

const observer=new MutationObserver(install);

function boot(){
  install();
  observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{
    if(e.target.closest('#abSave'))setTimeout(remember,100);
  });
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',boot);
}else{
  boot();
}
})();
