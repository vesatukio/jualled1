/* DUTA LED - Product loader fix v20260904-3 */
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
    if(box) box.innerHTML='<div class="empty">'+esc(text)+'<br><br><button class="btn primary" type="button" id="retryProducts">↻ Coba Lagi</button></div>';
    const r=$('retryProducts'); if(r) r.onclick=loadProducts;
  }
  function renderProducts(){
    const q=($('adminSearch')?.value||'').trim().toLowerCase();
    const list=fixProducts.filter(p=>!q||String(p.nama||'').toLowerCase().includes(q)||String(p.sku||'').toLowerCase().includes(q));
    const box=$('productList'); if(!box)return;
    if(!list.length){box.innerHTML='<div class="empty">Belum ada produk.</div>';return;}
    box.innerHTML=list.map(p=>{
      const price=num(p.harga_jual),cost=num(p.harga_pokok),d=num(p.diskon),sale=Math.max(0,Math.round(price*(100-d)/100)),profit=sale-cost;
      const img=imageOf(p);
      return '<article class="card">'+
        (img?'<img class="photo" src="'+esc(img)+'" onerror="this.style.opacity=.2">':'<div class="photo"></div>')+
        '<div><div class="name">'+esc(p.nama)+'</div><div class="cat">'+esc(p.sku||'Tanpa SKU')+' · Stok '+num(p.stok)+'</div>'+ 
        '<div class="prices">'+(d?'<span class="normal">'+rp(price)+'</span>':'')+'<span class="sale">'+rp(d?sale:price)+'</span>'+(d?'<span class="disc">-'+d+'%</span>':'')+'</div>'+ 
        '<div class="profit">Modal '+rp(cost)+' · Untung <b>'+rp(profit)+'</b></div></div>'+ 
        '<button class="edit" type="button" data-fix-product-id="'+esc(p.id)+'">✏️ Edit Produk</button></article>';
    }).join('');
    box.querySelectorAll('[data-fix-product-id]').forEach(b=>b.onclick=()=>{
      const p=fixProducts.find(x=>String(x.id)===String(b.dataset.fixProductId));
      if(typeof window.openEditor==='function') window.openEditor(p);
    });
  }
  async function loadProducts(){
    const box=$('productList'); if(!box||loading)return;
    loading=true;
    box.innerHTML='<div class="empty">⏳ Memuat produk...</div>';
    try{
      const {data:sessionData,error:sessionError}=await client.auth.getSession();
      if(sessionError)throw sessionError;
      if(!sessionData.session){showError('Sesi admin belum aktif. Silakan login ulang.');return;}
      const {data,error}=await client.from('produk').select('id,nama,sku,harga_pokok,harga_jual,diskon,stok,berat,deskripsi,foto_urls,is_active,kategori_id,created_at').order('created_at',{ascending:false}).limit(500);
      if(error)throw error;
      fixProducts=data||[];
      window.adminProducts=fixProducts;
      renderProducts();
    }catch(e){
      console.error('ADMIN PRODUCT LOAD ERROR',e);
      showError('Produk gagal dimuat: '+(e?.message||'Kesalahan tidak diketahui'));
    }finally{loading=false;}
  }
  function bind(){
    const tab=$('tabProducts');
    if(tab)tab.addEventListener('click',()=>setTimeout(loadProducts,50));
    const search=$('adminSearch'); if(search)search.addEventListener('input',renderProducts);
    window.reloadAdminProducts=loadProducts;
    /* Jangan tampilkan placeholder lama: produk langsung dimuat setelah login. */
    setTimeout(()=>{
      client.auth.getSession().then(({data})=>{if(data?.session)loadProducts();});
    },150);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
