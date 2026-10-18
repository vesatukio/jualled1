/* DutaLED catalog: vanilla JS, no build step required. */
(() => {
  "use strict";
  const products = Array.isArray(window.DUTALED_PRODUCTS) ? window.DUTALED_PRODUCTS : [];
  const $ = selector => document.querySelector(selector);
  const rupiah = value => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(value||0);
  const state = {category:"Semua",query:"",sort:"featured",selectedAliano:"aliano-5w",cart:readCart()};
  const productList=$("#productList"),categoryList=$("#categoryList");
  let toastTimer;
  function readCart(){try{return JSON.parse(localStorage.getItem("dutaled-cart")||"{}")}catch{return {}}}
  function saveCart(){try{localStorage.setItem("dutaled-cart",JSON.stringify(state.cart))}catch{}}
  function toast(message){const node=$("#toast");node.textContent=message;node.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove("show"),2400)}
  function safe(text){return String(text??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]))}
  function getProduct(id){return products.find(p=>p.id===id)}
  function categories(){return ["Semua",...new Set(products.map(p=>p.category).filter(Boolean))]}
  function renderCategories(){categoryList.innerHTML=categories().map(c=>'<button class="category-pill '+(c===state.category?'active':'')+'" data-category="'+safe(c)+'" aria-pressed="'+(c===state.category)+'">'+safe(c)+'</button>').join("")}
  function activePromo(p){
    if(!p.promo||!p.promo.discount||!p.promo.start||!p.promo.end)return null;
    const now=new Date(),start=new Date(p.promo.start),end=new Date(p.promo.end);
    return start<=now&&now<=end? p.promo:null;
  }
  function discountFor(p,qty=1){
    const tiers=Array.isArray(p.quantityTiers)?p.quantityTiers:[];
    const tier=tiers.find(t=>qty>=Number(t.min)&&qty<=Number(t.max));
    let discount=tier?Math.max(Number(tier.discount)||0,Number(p.retailDiscount)||0):Number(p.retailDiscount)||0;
    const promo=activePromo(p);
    if(promo)discount=Math.max(discount,Number(promo.discount)||0);
    return Math.min(100,Math.max(0,discount));
  }
  function unitPrice(p,qty=1){return Math.round(Number(p.price||0)*(1-discountFor(p,qty)/100))}
  function visibleProducts(){
    let result=products.filter(p=>(state.category==="Semua"||p.category===state.category)&&[p.name,p.code,p.category,p.description].join(" ").toLowerCase().includes(state.query.toLowerCase()));
    if(state.sort==="price-asc")result.sort((a,b)=>unitPrice(a,1)-unitPrice(b,1));
    if(state.sort==="price-desc")result.sort((a,b)=>unitPrice(b,1)-unitPrice(a,1));
    if(state.sort==="name")result.sort((a,b)=>a.name.localeCompare(b.name,"id"));
    return result;
  }
  function imageMarkup(p){return p.image?'<img src="'+safe(p.image)+'" alt="'+safe(p.name)+'" loading="lazy" onerror="this.remove()">':'<span class="product-emoji" aria-hidden="true">'+safe(p.emoji||"💡")+'</span>'}
  function priceMarkup(p,qty=1){
    const discount=discountFor(p,qty),price=unitPrice(p,qty);
    return '<div class="price">'+rupiah(price)+(discount?'<small><s>'+rupiah(p.price)+'</s> <span class="sale-badge">-'+discount+'%</span></small>':'<small>Harga per unit</small>')+'</div>';
  }
  function alianoCard(variants){
    const selected=variants.find(p=>p.id===state.selectedAliano)||variants[0];
    if(!selected)return '';
    return '<article class="product-card aliano-card"><div class="product-visual"><span class="product-emoji" aria-hidden="true">💡</span><span class="product-badge">Pilih watt</span></div><div class="product-info"><span class="product-category">Lampu LED</span><h3>Lampu LED Aliano</h3><div class="product-code">Pilih daya dan harga sesuai varian</div><label class="variant-label">Varian daya<select class="variant-select" data-variant-select aria-label="Pilih watt lampu Aliano">'+variants.map(p=>'<option value="'+safe(p.id)+'" '+(p.id===selected.id?'selected':'')+'>'+safe(p.code.replace("ALIANO-",""))+' · '+rupiah(unitPrice(p,1))+'</option>').join("")+'</select></label>'+priceMarkup(selected,1)+'<div class="product-bottom"><small class="stock-note">'+(Number(selected.stock)>0?'Stok contoh: '+Number(selected.stock):'Stok perlu dikonfirmasi')+'</small><button class="add-button" data-add="'+safe(selected.id)+'" aria-label="Tambah '+safe(selected.name)+' ke keranjang" title="Tambah ke keranjang">+</button></div></div></article>';
  }
  function renderProducts(){
    const items=visibleProducts();
    const variants=items.filter(p=>p.id.startsWith("aliano-"));
    const others=items.filter(p=>!p.id.startsWith("aliano-"));
    const displayCount=others.length+(variants.length?1:0);
    $("#productTotal").textContent=displayCount+" produk";
    const cards=[];
    if(variants.length)cards.push(alianoCard(products.filter(p=>p.id.startsWith("aliano-"))));
    cards.push(...others.map(p=>{
      const stockText=Number(p.stock)>0?'Stok contoh: '+Number(p.stock):'Stok perlu dikonfirmasi';
      return '<article class="product-card"><div class="product-visual">'+imageMarkup(p)+(p.badge?'<span class="product-badge">'+safe(p.badge)+'</span>':'')+'</div><div class="product-info"><span class="product-category">'+safe(p.category)+'</span><h3>'+safe(p.name)+'</h3><div class="product-code">Kode: '+safe(p.code)+'</div>'+priceMarkup(p,1)+'<div class="product-bottom"><small class="stock-note">'+safe(stockText)+'</small><button class="add-button" data-add="'+safe(p.id)+'" aria-label="Tambah '+safe(p.name)+' ke keranjang" title="Tambah ke keranjang">+</button></div></div></article>';
    }));
    productList.innerHTML=cards.join("");
    $("#emptyState").classList.toggle("hidden",displayCount>0);
  }
  function cartCount(){return Object.values(state.cart).reduce((sum,q)=>sum+q,0)}
  function cartLines(){return Object.entries(state.cart).map(([id,qty])=>({product:getProduct(id),qty:Number(qty)})).filter(line=>line.product&&line.qty>0)}
  function lineTotal(p,qty){return unitPrice(p,qty)*qty}
  function renderCart(){
    const lines=cartLines(),count=lines.reduce((s,l)=>s+l.qty,0),total=lines.reduce((sum,line)=>sum+lineTotal(line.product,line.qty),0);
    $("#cartCount").textContent=count;$("#drawerCount").textContent="("+count+")";$("#cartTotal").textContent=rupiah(total);
    $("#cartItems").innerHTML=lines.map(({product:p,qty})=>{
      const discount=discountFor(p,qty),unit=unitPrice(p,qty),saved=(Number(p.price)-unit)*qty;
      return '<div class="cart-line"><div class="cart-thumb">'+(p.image?'<img src="'+safe(p.image)+'" alt="">':safe(p.emoji||"💡"))+'</div><div><h3>'+safe(p.name)+'</h3><div class="line-price">'+rupiah(unit)+' / unit · total '+rupiah(unit*qty)+'</div>'+(discount?'<small class="cart-discount">Diskon '+discount+'% · hemat '+rupiah(saved)+'</small>':'')+'<div class="quantity-control"><button data-qty="'+safe(p.id)+'" data-delta="-1" aria-label="Kurangi jumlah">−</button><span>'+qty+'</span><button data-qty="'+safe(p.id)+'" data-delta="1" aria-label="Tambah jumlah">+</button></div></div><button class="remove-line" data-remove="'+safe(p.id)+'" aria-label="Hapus '+safe(p.name)+'">✕</button></div>';
    }).join("");
    $("#cartEmpty").classList.toggle("hidden",lines.length>0);$("#cartFooter").classList.toggle("hidden",lines.length===0);
  }
  function add(id,delta=1){const p=getProduct(id);if(!p)return;const next=(Number(state.cart[id])||0)+delta;if(next<=0)delete state.cart[id];else state.cart[id]=Math.min(next,Math.max(1,Number(p.stock)||999));saveCart();renderCart();renderProducts();toast(delta>0?"Ditambahkan ke keranjang":"Jumlah diperbarui")}
  function openCart(){$("#cartDrawer").classList.add("open");$("#drawerBackdrop").classList.remove("hidden");$("#cartDrawer").setAttribute("aria-hidden","false");document.body.style.overflow="hidden";$("#closeCart").focus()}
  function closeCart(){$("#cartDrawer").classList.remove("open");$("#drawerBackdrop").classList.add("hidden");$("#cartDrawer").setAttribute("aria-hidden","true");document.body.style.overflow=""}
  async function copyOrderSummary(message){
    try {
      if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(message);toast("Ringkasan pesanan disalin.");return;}
    } catch {}
    const field=document.createElement("textarea");field.value=message;field.setAttribute("readonly","");field.style.position="fixed";field.style.opacity="0";document.body.appendChild(field);field.select();
    const copied=document.execCommand("copy");field.remove();toast(copied?"Ringkasan pesanan disalin.":"Gagal menyalin. Coba lagi di browser yang mendukung salin teks.");
  }
  function checkout(){
    const lines=cartLines();if(!lines.length){toast("Keranjang masih kosong.");return}
    const name=$("#customerName").value.trim();
    const total=lines.reduce((s,l)=>s+lineTotal(l.product,l.qty),0);
    const message=["Halo Duta Terang LED, saya ingin memesan:","",...lines.map(({product:p,qty},i)=>{const disc=discountFor(p,qty);return (i+1)+". "+p.name+" ("+p.code+") × "+qty+" = "+rupiah(lineTotal(p,qty))+(disc?" · diskon "+disc+"%":"")}),"","Estimasi total: "+rupiah(total),name?"Nama: "+name:null,"","Mohon konfirmasi stok dan harga terbaru. Harga serta diskon di katalog adalah contoh dan perlu dikonfirmasi."].filter(Boolean).join("\n");
    copyOrderSummary(message);
  }
  categoryList.addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(!b)return;state.category=b.dataset.category;renderCategories();renderProducts()});
  productList.addEventListener("click",e=>{const b=e.target.closest("[data-add]");if(b)add(b.dataset.add)});
  productList.addEventListener("change",e=>{const select=e.target.closest("[data-variant-select]");if(select){state.selectedAliano=select.value;renderProducts()}});
  $("#searchInput").addEventListener("input",e=>{state.query=e.target.value.trim();renderProducts()});
  $("#sortSelect").addEventListener("change",e=>{state.sort=e.target.value;renderProducts()});
  $("#resetFilters").addEventListener("click",()=>{state.category="Semua";state.query="";state.sort="featured";$("#searchInput").value="";$("#sortSelect").value="featured";renderCategories();renderProducts()});
  $("#openCart").addEventListener("click",openCart);$("#closeCart").addEventListener("click",closeCart);$("#drawerBackdrop").addEventListener("click",closeCart);$("#continueShopping").addEventListener("click",()=>{closeCart();$("#produk").scrollIntoView({behavior:"smooth"})});
  $("#cartItems").addEventListener("click",e=>{const q=e.target.closest("[data-qty]"),r=e.target.closest("[data-remove]");if(q)add(q.dataset.qty,Number(q.dataset.delta));if(r){delete state.cart[r.dataset.remove];saveCart();renderCart();renderProducts();toast("Produk dihapus")}});
  $("#clearCart").addEventListener("click",()=>{state.cart={};saveCart();renderCart();renderProducts();toast("Keranjang dikosongkan")});
  $("#checkoutBtn").addEventListener("click",checkout);
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeCart();if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("#searchInput").focus()}});
  $("#year").textContent=new Date().getFullYear();
  renderCategories();renderProducts();renderCart();
})();
