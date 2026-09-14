/* DUTA LED - Product loader fix v20260915-2 */
(function(){
  'use strict';
  const URL='https://opgeeqnucxrdqcgwcuge.supabase.co';
  const KEY='sb_publishable_uqah55SK8ZjyugWprFnFMA_QnyVdCLA';
  const client=window.dutaSupabase||(window.dutaSupabase=window.supabase.createClient(URL,KEY));
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const num=v=>Number(String(v??'').replace(/[^\d.-]/g,''))||0;
  const rp=v=>'Rp'+num(v).toLocaleString('id-ID');
  let fixProducts=[];
  let loading=false;

  function imageOf(p){return Array.isArray(p.foto_urls)&&p.foto_urls.length?p.foto_urls[0]:'';}

  function showError(text){
    const box=$('productList');
    if(!box)return;
    box.innerHTML='<div class="empty">'+esc(text)+'<br><br><button class="btn primary" type="button" id="retryProducts">↻ Coba Lagi</button></div>';
    const r=$('retryProducts');
    if(r)r.onclick=loadProducts;
  }

  function ensureStyle(){
    if($('adminStockEditStyle'))return;
    const s=document.createElement('style');s.id='adminStockEditStyle';
    s.textContent='.stock-line{display:inline-flex;align-items:center;gap:5px}.stock-edit-btn{border:1px solid #d7dee8;background:#fff;color:#1769e0;border-radius:6px;padding:2px 6px;font-size:10px;font-weight:800;cursor:pointer;line-height:1.2}.stock-edit-btn:hover{background:#f1f6ff}.stock-edit-btn:disabled{opacity:.6;cursor:wait}';
    document.head.appendChild(s);
  }

  function ensureCategoryFilter(){
    const search=$('adminSearch');
    const toolbar=search?.parentElement;
    if(!toolbar)return null;
    let select=$('adminCategoryFilter');
    if(!select){
      select=document.createElement('select');select.id='adminCategoryFilter';select.className='search';select.style.flex='0 0 220px';select.style.maxWidth='100%';select.setAttribute('aria-label','Filter kategori produk');select.innerHTML='<option value="">Semua Kategori</option>';toolbar.insertBefore(select,$('addProduct'));select.addEventListener('change',renderProducts);
    }
    const current=select.value;
    const cats=[...new Set(fixProducts.map(p=>String(p.kategori_id??'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'id'));
    select.innerHTML='<option value="">Semua Kategori</option>'+cats.map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join('');
    if(cats.includes(current))select.value=current;
    return select;
  }

  function renderProducts(){
    const q=($('adminSearch')?.value||'').trim().toLowerCase();
    const category=$('adminCategoryFilter')?.value||'';
    const list=fixProducts.filter(p=>{
      const matchSearch=!q||String(p.nama||'').toLowerCase().includes(q)||String(p.sku||'').toLowerCase().includes(q);
      const matchCategory=!category||String(p.kategori_id??'').trim()===category;
      return matchSearch&&matchCategory;
    });
    const box=$('productList');
    if(!box)return;
    if(!list.length){box.innerHTML='<div class="empty">Tidak ada produk pada kategori ini.</div>';return;}
    box.innerHTML=list.map(p=>{
      const price=num(p.harga_jual),cost=num(p.harga_pokok),d=num(p.diskon),sale=Math.max(0,Math.round(price*(100-d)/100)),profit=sale-cost;
      const img=imageOf(p);
      return '<article class="card">'+
        (img?'<img class="photo" src="'+esc(img)+'" onerror="this.style.opacity=.2">':'<div class="photo"></div>')+
        '<div><div class="name">'+esc(p.nama)+'</div><div class="cat"><span class="stock-line">'+esc(p.kategori_id||'Tanpa Kategori')+' · '+esc(p.sku||'Tanpa SKU')+' · Stok <b>'+num(p.stok)+'</b> <button type="button" class="stock-edit-btn" data-stock-id="'+esc(p.id)+'">✎ Stok</button></span></div>'+
        '<div class="prices">'+(d?'<span class="normal">'+rp(price)+'</span>':'')+'<span class="sale">'+rp(d?sale:price)+'</span>'+(d?'<span class="disc">-'+d+'%</span>':'')+'</div>'+ 
        '<div class="profit"><span>Harga Modal <b>'+rp(cost)+'</b></span> · Untung <b>'+rp(profit)+'</b></div></div>'+ 
        '<button class="edit" type="button" data-fix-product-id="'+esc(p.id)+'">✏️ Edit Produk</button></article>';
    }).join('');
    box.querySelectorAll('[data-fix-product-id]').forEach(b=>b.onclick=()=>{
      const p=fixProducts.find(x=>String(x.id)===String(b.dataset.fixProductId));
      if(typeof window.openEditor==='function')window.openEditor(p);
    });
    box.querySelectorAll('[data-stock-id]').forEach(b=>b.onclick=()=>editStock(b));
  }

  async function editStock(button){
    const id=String(button.dataset.stockId);
    const p=fixProducts.find(x=>String(x.id)===id);
    if(!p)return;
    const old=num(p.stok);
    const value=window.prompt('Ubah stok:\n'+(p.nama||'Produk'),String(old));
    if(value===null)return;
    const stock=Number(String(value).trim());
    if(!Number.isInteger(stock)||stock<0){alert('Stok harus berupa angka bulat 0 atau lebih.');return;}
    button.disabled=true;
    try{
      const {data,error}=await client.from('produk').update({stok:stock}).eq('id',id).select('id,stok').single();
      if(error)throw error;
      p.stok=num(data?.stok);
      renderProducts();
    }catch(e){
      console.error('ADMIN STOCK UPDATE ERROR',e);
      alert('Stok gagal diubah: '+(e?.message||'Kesalahan tidak diketahui'));
    }finally{button.disabled=false;}
  }

  async function loadProducts(){
    const box=$('productList');
    if(!box||loading)return;
    loading=true;box.innerHTML='<div class="empty">⏳ Memuat produk...</div>';
    try{
      const {data:sessionData,error:sessionError}=await client.auth.getSession();
      if(sessionError)throw sessionError;
      if(!sessionData?.session){showError('Sesi admin belum aktif. Silakan login ulang.');return;}
      let result=await client.from('produk').select('id,nama,sku,harga_pokok,harga_jual,diskon,stok,berat,deskripsi,foto_urls,is_active,kategori_id,created_at,updated_at').order('updated_at',{ascending:false}).order('id',{ascending:false}).limit(500);
      if(result.error){result=await client.from('produk').select('id,nama,sku,harga_pokok,harga_jual,diskon,stok,berat,deskripsi,foto_urls,is_active,kategori_id,created_at').order('created_at',{ascending:false}).order('id',{ascending:false}).limit(500);}
      if(result.error)throw result.error;
      fixProducts=result.data||[];window.adminProducts=fixProducts;ensureStyle();ensureCategoryFilter();renderProducts();
    }catch(e){console.error('ADMIN PRODUCT LOAD ERROR',e);showError('Produk gagal dimuat: '+(e?.message||'Kesalahan tidak diketahui'));}
    finally{loading=false;}
  }

  function activateProductsTab(){
    $('ordersView')?.classList.add('hidden');$('productsView')?.classList.remove('hidden');$('storeFinanceView')?.classList.add('hidden');$('personalFinanceView')?.classList.add('hidden');$('ambilBarangView')?.classList.add('hidden');document.querySelectorAll('.tabs .tab').forEach(b=>b.classList.remove('active'));$('tabProducts')?.classList.add('active');loadProducts();
  }

  function bind(){
    const tab=$('tabProducts');
    if(tab){tab.addEventListener('click',activateProductsTab,true);tab.onclick=activateProductsTab;}
    const search=$('adminSearch');if(search)search.addEventListener('input',renderProducts);
    window.reloadAdminProducts=loadProducts;window.openAdminProducts=activateProductsTab;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
