/* DUTA LED - Autocomplete nama barang Ambil Barang */
(function(){
'use strict';
const KEY='DUTA_ADMIN_AMBIL_BARANG_V1';
const HISTORY='DUTA_ADMIN_AMBIL_BARANG_NAMES_V1';
const $=id=>document.getElementById(id);
function loadNames(){
  const out=[];
  try{const h=JSON.parse(localStorage.getItem(HISTORY)||'[]');if(Array.isArray(h))out.push(...h)}catch(e){}
  try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(a))a.forEach(x=>(x.items||[]).forEach(i=>{if(i&&i.name)out.push(i.name)}))}catch(e){}
  return [...new Map(out.map(x=>[String(x).trim().toLowerCase(),String(x).trim()]).filter(x=>x[1])).values()].slice(0,300);
}
function rememberNames(){
  try{
    const names=loadNames();
    document.querySelectorAll('#abItemRows input[data-abk="name"]').forEach(i=>{if(i.value.trim())names.unshift(i.value.trim())});
    localStorage.setItem(HISTORY,JSON.stringify([...new Map(names.map(x=>[x.toLowerCase(),x])).values()].slice(0,300)));
  }catch(e){}
}
function install(){
  const view=$('ambilBarangView');if(!view)return;
  if(!document.getElementById('abAutoStyle')){const s=document.createElement('style');s.id='abAutoStyle';s.textContent='.ab-name-wrap{position:relative}.ab-suggest{position:absolute;left:0;right:0;top:calc(100% + 3px);z-index:100000;background:#fff;border:1px solid #d8dee7;border-radius:9px;box-shadow:0 8px 24px #0002;max-height:220px;overflow:auto}.ab-suggest button{display:block;width:100%;text-align:left;padding:10px 12px;border:0;background:#fff;cursor:pointer;font-size:13px}.ab-suggest button:hover{background:#f1f6ff}.ab-suggest b{font-weight:800}';document.head.appendChild(s)}
  document.querySelectorAll('#abItemRows input[data-abk="name"]').forEach(input=>{
    if(input.dataset.abInstalled)return;input.dataset.abInstalled='1';
    const wrap=document.createElement('div');wrap.className='ab-name-wrap';input.parentNode.insertBefore(wrap,input);wrap.appendChild(input);
    const box=document.createElement('div');box.className='ab-suggest';box.hidden=true;wrap.appendChild(box);
    const show=()=>{
      const q=input.value.trim().toLowerCase();const names=loadNames().filter(n=>!q||n.toLowerCase().includes(q)).slice(0,10);
      if(!names.length){box.hidden=true;return}
      box.innerHTML=names.map(n=>'<button type="button" data-name="'+n.replace(/&/g,'&amp;').replace(/"/g,'&quot;')+'">'+n.replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</button>').join('');box.hidden=false;
      box.querySelectorAll('button').forEach(b=>b.onclick=()=>{input.value=b.dataset.name;input.dispatchEvent(new Event('input',{bubbles:true}));box.hidden=true});
    };
    input.addEventListener('input',show);input.addEventListener('focus',show);input.addEventListener('blur',()=>setTimeout(()=>box.hidden=true,180));
  });
}
const observer=new MutationObserver(()=>install());
function boot(){install();observer.observe(document.body,{childList:true,subtree:true});document.addEventListener('click',e=>{if(e.target.closest('#abSave'))setTimeout(rememberNames,100)})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
