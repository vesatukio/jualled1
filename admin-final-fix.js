/* DUTA LED - Product variant fields */
(()=>{
  'use strict';

  function injectVariantFields(){
    const form=document.getElementById('productForm');
    if(!form) return false;
    const grid=form.querySelector('.grid');
    if(!grid) return false;

    if(!form.elements.variantGroup){
      const a=document.createElement('div');
      a.className='field';
      a.id='variantGroupField';
      a.innerHTML='<label>Grup Varian</label><input name="variantGroup" autocomplete="off" placeholder="Contoh: lampu-led-ac"><small style="color:#6b7585;font-size:11px">Gunakan nama grup yang sama untuk varian sejenis.</small>';
      const sku=form.elements.sku;
      if(sku && sku.closest('.field')) sku.closest('.field').insertAdjacentElement('afterend',a);
      else grid.appendChild(a);
    }

    if(!form.elements.variantLabel){
      const b=document.createElement('div');
      b.className='field';
      b.id='variantLabelField';
      b.innerHTML='<label>Label Varian</label><input name="variantLabel" autocomplete="off" placeholder="Contoh: 5W"><small style="color:#6b7585;font-size:11px">Label pilihan varian yang dilihat pembeli.</small>';
      const g=document.getElementById('variantGroupField');
      if(g) g.insertAdjacentElement('afterend',b);
      else grid.appendChild(b);
    }
    return true;
  }

  function fillVariantFields(){
    const form=document.getElementById('productForm');
    if(!form || !form.elements.variantGroup) return;
    const id=form.elements.id?.value?.trim();
    if(!id) {
      form.elements.variantGroup.value='';
      form.elements.variantLabel.value='';
      return;
    }
    const db=window.dutaSupabase;
    if(!db) return;
    db.from('produk').select('variant_group,variant_label').eq('id',id).maybeSingle().then(({data})=>{
      if(data){
        form.elements.variantGroup.value=data.variant_group||'';
        form.elements.variantLabel.value=data.variant_label||'';
      }
    }).catch(()=>{});
  }

  async function saveVariantProduct(e){
    const form=document.getElementById('productForm');
    if(!form || !form.elements.variantGroup) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    const db=window.dutaSupabase;
    if(!db){ alert('Koneksi database belum siap.'); return; }

    const nama=form.elements.nama.value.trim();
    const hargaJual=Number(String(form.elements.hargaJual.value||'').replace(/[^\\d.-]/g,''))||0;
    if(!nama){ alert('Nama produk wajib diisi.'); return; }
    if(!hargaJual){ alert('Harga jual wajib diisi.'); return; }

    const toNum=v=>Number(String(v??'').replace(/[^\\d.-]/g,''))||0;
    const foto=(form.elements.fotoUrls.value||'').split('\\n').map(x=>x.trim()).filter(Boolean);
    const data={
      nama,
      kategori_id:form.elements.kategoriId.value.trim()||null,
      sku:form.elements.sku.value.trim()||null,
      harga_pokok:toNum(form.elements.hargaPokok.value)||null,
      harga_jual:hargaJual,
      diskon:toNum(form.elements.diskon.value),
      stok:toNum(form.elements.stok.value),
      berat:toNum(form.elements.berat.value)||null,
      deskripsi:form.elements.deskripsi.value.trim()||null,
      foto_urls:foto,
      is_active:form.elements.isActive.checked,
      variant_group:form.elements.variantGroup.value.trim()||null,
      variant_label:form.elements.variantLabel.value.trim()||null,
      updated_at:new Date().toISOString()
    };

    const btn=document.getElementById('saveBtn');
    if(btn){btn.disabled=true;btn.textContent='⏳ Menyimpan...';}

    try{
      const id=form.elements.id.value.trim();
      let result;
      if(id) result=await db.from('produk').update(data).eq('id',id);
      else result=await db.from('produk').insert(data).select('id').single();
      if(result.error) throw result.error;

      const editor=document.getElementById('editor');
      if(editor) editor.classList.add('hidden');
      const message=document.getElementById('message');
      if(message){
        message.textContent='Produk berhasil disimpan.';
        message.style.background='#182230';
        message.classList.remove('hidden');
        setTimeout(()=>message.classList.add('hidden'),2500);
      }

      if(typeof window.load==='function') await window.load();
      else location.reload();
    }catch(err){
      alert('Gagal menyimpan: '+(err?.message||err));
    }finally{
      if(btn){btn.disabled=false;btn.textContent='💾 Simpan Produk';}
    }
  }

  function observe(){
    if(!injectVariantFields()) return;
    const form=document.getElementById('productForm');
    if(!form || form.dataset.variantReady==='1') return;
    form.dataset.variantReady='1';
    form.addEventListener('submit',saveVariantProduct,true);

    const add=document.getElementById('addProduct');
    if(add && add.dataset.variantClick!=='1'){
      add.dataset.variantClick='1';
      add.addEventListener('click',()=>setTimeout(fillVariantFields,80));
    }

    const editObserver=new MutationObserver(()=>fillVariantFields());
    editObserver.observe(form,{attributes:true,subtree:true,childList:true});
    setTimeout(fillVariantFields,100);
  }

  document.addEventListener('DOMContentLoaded',()=>{
    observe();
    setInterval(observe,500);
  });
})();
