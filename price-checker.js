/* Kalkulator harga internal; data tersimpan hanya pada browser/perangkat ini. */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const ids = ["calcProduct","calcVariant","calcCost","calcDiscount","calcMarkup","calcRound","calcNet","calcSale","calcProfit","calcActualMarkup","calcMargin","saveCalc","copyCalc","clearSaved","savedVariantList","calcStatus"];
  if (ids.some(id => !$(id))) return;
  const money = n => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Math.round(n||0));
  const pct = n => (Number.isFinite(n)?n:0).toLocaleString("id-ID",{maximumFractionDigits:1,minimumFractionDigits:1})+"%";
  const STORAGE_KEY = "dutaled-price-variants-v1";
  let saved = readSaved();
  function readSaved(){try{const v=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");return Array.isArray(v)?v:[]}catch{return []}}
  function store(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(saved));return true}catch{return false}}
  function calculate(){
    const cost=Math.max(0,Number($("calcCost").value)||0);
    const discount=Math.min(100,Math.max(0,Number($("calcDiscount").value)||0));
    const markup=Math.max(0,Number($("calcMarkup").value)||0);
    const round=Math.max(1,Number($("calcRound").value)||100);
    const net=cost*(1-discount/100);
    const raw=net*(1+markup/100);
    const sale=Math.ceil(raw/round)*round;
    const profit=sale-net;
    const actual=net>0?profit/net*100:0;
    const margin=sale>0?profit/sale*100:0;
    $("calcNet").textContent=money(net);
    $("calcSale").textContent=money(sale);
    $("calcProfit").textContent=money(profit);
    $("calcActualMarkup").textContent=pct(actual);
    $("calcMargin").textContent=pct(margin);
    return {name:$("calcProduct").value.trim()||"Produk",variant:$("calcVariant").value,cost,discount,markup,round,net,sale,profit,actual,margin};
  }
  function renderSaved(){
    $("savedVariantList").innerHTML=saved.length?saved.map((v,i)=>'<div class="saved-variant"><div><strong>'+escapeHtml(v.name)+' · '+escapeHtml(v.variant)+'</strong><small>Modal bersih '+money(v.net)+' · jual '+money(v.sale)+' · untung '+money(v.profit)+'</small></div><button type="button" data-load="'+i+'">Pakai</button></div>').join(""):'<p class="saved-empty">Belum ada varian tersimpan.</p>';
  }
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
  function load(v){$("calcProduct").value=v.name;$("calcVariant").value=v.variant;$("calcCost").value=v.cost;$("calcDiscount").value=v.discount;$("calcMarkup").value=v.markup;$("calcRound").value=String(v.round);calculate();$("calcStatus").textContent="Varian dimuat. Periksa harga supplier sebelum digunakan."}
  ["calcProduct","calcVariant","calcCost","calcDiscount","calcMarkup","calcRound"].forEach(id=>$(id).addEventListener("input",calculate));
  $("saveCalc").addEventListener("click",()=>{const v=calculate();const idx=saved.findIndex(x=>x.name===v.name&&x.variant===v.variant);if(idx>=0)saved[idx]=v;else saved.unshift(v);saved=saved.slice(0,100);const ok=store();renderSaved();$("calcStatus").textContent=ok?"Varian tersimpan di browser perangkat ini.":"Penyimpanan browser tidak tersedia; catat hasilnya secara manual."});
  $("copyCalc").addEventListener("click",async()=>{const v=calculate();const txt=["DUTA TERANG LED — CEK HARGA",v.name+" "+v.variant,"Harga supplier: "+money(v.cost),"Diskon supplier: "+pct(v.discount),"Modal bersih: "+money(v.net),"Target kenaikan: "+pct(v.markup),"Harga jual disarankan: "+money(v.sale),"Untung per unit: "+money(v.profit),"Kenaikan aktual: "+pct(v.actual),"Margin dari harga jual: "+pct(v.margin)].join("\n");try{await navigator.clipboard.writeText(txt);$("calcStatus").textContent="Rincian harga berhasil disalin."}catch{$("calcStatus").textContent=txt}});
  $("clearSaved").addEventListener("click",()=>{if(!saved.length)return;saved=[];store();renderSaved();$("calcStatus").textContent="Daftar varian tersimpan di perangkat ini telah dikosongkan."});
  $("savedVariantList").addEventListener("click",e=>{const b=e.target.closest("[data-load]");if(!b)return;const v=saved[Number(b.dataset.load)];if(v)load(v)});
  calculate();renderSaved();
})();