"use strict";
(function(){
  const CART_KEY="dutaled_cart_v4";
  const SUPABASE_URL="https://opgeeqnucxrdqcgwcuge.supabase.co";
  const SUPABASE_KEY="sb_publishable_uqah55SK8ZjyugWprFnFMA_QnyVdCLA";
  const headers={apikey:SUPABASE_KEY,Authorization:"Bearer "+SUPABASE_KEY};

  function readCart(){try{const c=JSON.parse(localStorage.getItem(CART_KEY)||"[]");return Array.isArray(c)?c:[]}catch(_){return[]}}
  function writeCart(c){try{localStorage.setItem(CART_KEY,JSON.stringify(c));}catch(_){} }
  async function getStocks(ids){
    const clean=[...new Set(ids.map(Number).filter(n=>Number.isFinite(n)&&n>0))];
    if(!clean.length)return new Map();
    const q=clean.join(",");
    const r=await fetch(SUPABASE_URL+"/rest/v1/produk?select=id,nama,stok&id=in.("+q+")&is_active=eq.true",{cache:"no-store",headers});
    if(!r.ok)throw new Error("HTTP "+r.status);
    const rows=await r.json();
    return new Map(rows.map(p=>[String(p.id),Math.max(0,Number(p.stok)||0)]));
  }
  function updateCartDom(cart){
    const box=document.getElementById("cartBox");
    if(!box)return;
    cart.forEach(i=>{
      const btn=box.querySelector('[data-action="plus"][data-id="'+CSS.escape(String(i.id))+'"]');
      if(!btn)return;
      const controls=btn.parentElement;
      const qty=controls?.querySelector("strong");
      if(qty)qty.textContent=String(i.qty);
      const row=btn.closest(".cart-item");
      const price=row?.querySelector(".cart-item-info span")?.textContent||"";
      const n=Number(String(price).replace(/[^\d]/g,""))||0;
      const sub=row?.querySelector(".cart-subtotal");
      if(sub)sub.textContent=new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n*i.qty);
      btn.disabled=false;
    });
    const count=cart.reduce((s,i)=>s+(Number(i.qty)||0),0);
    const total=cart.reduce((s,i)=>{const row=box.querySelector('[data-action="plus"][data-id="'+CSS.escape(String(i.id))+'"]')?.closest(".cart-item");const n=Number(String(row?.querySelector(".cart-item-info span")?.textContent||"").replace(/[^\d]/g,""))||0;return s+n*(Number(i.qty)||0)},0);
    document.getElementById("cartCount")?.replaceChildren(String(count));
    document.getElementById("bottomCartCount")?.replaceChildren(String(count));
    const totalEl=document.getElementById("cartTotal");
    if(totalEl)totalEl.textContent=new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(total);
  }
  async function enforceInitialStock(){
    const cart=readCart();
    if(!cart.length)return;
    try{
      const stocks=await getStocks(cart.map(i=>i.id));
      let changed=false;
      let warning="";
      cart.forEach(i=>{
        const key=String(i.id),stock=stocks.get(key);
        if(stock===undefined)return;
        const old=Math.max(0,Number(i.qty)||0);
        const next=Math.min(old,stock);
        if(next!==old){i.qty=next;changed=true;warning+=(warning?"\n":"")+`${i.nama||"Produk"}: stok tersedia hanya ${stock}. Jumlah disesuaikan menjadi ${next}.`;}
      });
      const filtered=cart.filter(i=>(Number(i.qty)||0)>0);
      if(filtered.length!==cart.length)changed=true;
      if(changed){writeCart(filtered);if(warning)alert("Stok diperbarui:\n\n"+warning);location.reload();}
    }catch(e){console.warn("Stock cart check:",e?.message||e)}
  }
  async function handlePlus(e){
    const b=e.target.closest?.('#cartBox [data-action="plus"]');
    if(!b)return;
    const cart=readCart(),item=cart.find(i=>String(i.id)===String(b.dataset.id));
    if(!item)return;
    try{
      const stocks=await getStocks([item.id]);
      const stock=stocks.get(String(item.id));
      const qty=Number(item.qty)||0;
      if(stock!==undefined&&qty>=stock){
        e.preventDefault();e.stopImmediatePropagation();
        alert(`${item.nama||"Produk"}\nStok tersedia hanya ${stock} unit.\nJumlah maksimal: ${stock}.`);
      }
    }catch(err){console.warn("Stock plus check:",err?.message||err)}
  }
  document.addEventListener("click",handlePlus,true);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(enforceInitialStock,500));
  else setTimeout(enforceInitialStock,500);
})();
