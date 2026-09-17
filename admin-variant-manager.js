/* DUTA LED - Variant fields directly in Tambah/Edit Produk */
(function(){
  'use strict';
  if(!/admin/i.test(location.pathname)) return;

  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');}
  function client(){return window.dutaSupabase||window.supabaseClient||null;}

  function inject(){
    var form=document.getElementById('productForm');
    if(!form) return false;
    var grid=form.querySelector('.grid');
    if(!grid) return false;

    if(!document.getElementById('variantGroupField')){
      var a=document.createElement('div');
      a.className='field'; a.id='variantGroupField';
      a.innerHTML='<label>Grup Varian</label><input name="variantGroup" autocomplete="off" placeholder="Contoh: lampu-led-ac"><small style="color:#6b7585;font-size:11px">Gunakan nama grup yang sama untuk varian sejenis.</small>';
      var sku=form.elements.sku;
      if(sku&&sku.closest('.field')) sku.closest('.field').insertAdjacentElement('afterend',a); else grid.appendChild(a);
    }
    if(!document.getElementById('variantLabelField')){
      var b=document.createElement('div');
      b.className='field'; b.id='variantLabelField';
      b.innerHTML='<label>Label Varian</label><input name="variantLabel" autocomplete="off" placeholder="Contoh: 5W"><small style="color:#6b7585;font-size:11px">Label yang akan menjadi tombol pilihan varian.</small>';
      var g=document.getElementById('variantGroupField');
      if(g) g.insertAdjacentElement('afterend',b); else grid.appendChild(b);
    }
    return true;
  }

  async function fillEditVariant(){
    var form=document.getElementById('productForm');
    if(!form||!form.elements.id) return;
    var id=form.elements.id.value.trim();
    var group=form.elements.variantGroup,label=form.elements.variantLabel;
    if(!group||!label) return;
    if(!id){group.value='';label.value='';return;}
    var sb=client(); if(!sb) return;
    var r=await sb.from('produk').select('variant_group,variant_label').eq('id',id).maybeSingle();
    if(!r.error&&r.data){group.value=r.data.variant_group||'';label.value=r.data.variant_label||'';}
  }

  function installSave(){
    var form=document.getElementById('productForm');
    if(!form||form.dataset.variantSaveInstalled==='1') return;
    form.dataset.variantSaveInstalled='1';
    form.addEventListener('submit',async function(e){
      /* Capture-phase handler below handles the real save. */
    },true);
    form.addEventListener('submit',async function(e){
      if(form.dataset.variantSaving==='1') return;
      e.preventDefault(); e.stopImmediatePropagation();
      var sb=client(); if(!sb){alert('Database belum siap. Silakan refresh Admin.');return;}
      var f=form.elements;
      var nama=f.nama.value.trim(), harga=Number(f.hargaJual.value||0);
      if(!nama){alert('Nama produk wajib diisi.');return;}
      if(!harga){alert('Harga jual wajib diisi.');return;}
      var data={
        nama:nama,
        kategori_id:f.kategoriId.value.trim()||null,
        sku:f.sku.value.trim()||null,
        harga_pokok:Number(f.hargaPokok.value||0)||null,
        harga_jual:harga,
        diskon:Number(f.diskon.value||0),
        stok:Number(f.stok.value||0),
        berat:Number(f.berat.value||0)||null,
        deskripsi:f.deskripsi.value.trim()||null,
        foto_urls:f.fotoUrls.value.split('\n').map(function(x){return x.trim()}).filter(Boolean),
        is_active:f.isActive.checked,
        variant_group:f.variantGroup.value.trim()||null,
        variant_label:f.variantLabel.value.trim()||null,
        updated_at:new Date().toISOString()
      };
      form.dataset.variantSaving='1';
      var btn=document.getElementById('saveBtn');if(btn){btn.disabled=true;btn.textContent='⏳ Menyimpan...';}
      try{
        var id=f.id.value.trim();
        var r=id?await sb.from('produk').update(data).eq('id',id):await sb.from('produk').insert(data);
        if(r.error) throw r.error;
        var msg=document.getElementById('message');
        if(msg){msg.textContent='Produk + varian berhasil disimpan.';msg.classList.remove('hidden');}
        document.getElementById('editor').classList.add('hidden');
        setTimeout(function(){location.reload();},400);
      }catch(err){alert('Gagal menyimpan: '+err.message);}
      finally{form.dataset.variantSaving='0';if(btn){btn.disabled=false;btn.textContent='💾 Simpan Produk';}}
    },false);
  }

  function observe(){
    inject(); installSave();
    var editor=document.getElementById('editor');
    if(editor&&!editor.dataset.variantObserver){
      editor.dataset.variantObserver='1';
      var obs=new MutationObserver(function(){
        inject();installSave();
        if(!editor.classList.contains('hidden')) fillEditVariant();
      });
      obs.observe(editor,{attributes:true,childList:true,subtree:true});
    }
    fillEditVariant();
  }

  function panelButton(){
    if(document.getElementById('manualVariantBtn')) return;
    var btn=document.createElement('button');
    btn.id='manualVariantBtn';btn.type='button';btn.textContent='⚙️ Varian Produk';
    btn.style.cssText='position:fixed;right:16px;bottom:76px;z-index:99999;border:0;border-radius:12px;padding:11px 15px;background:#111;color:#fff;font-weight:700;box-shadow:0 4px 18px #0003;cursor:pointer';
    document.body.appendChild(btn);btn.onclick=openPanel;
  }

  async function openPanel(){
    var sb=client(); if(!sb){alert('Database belum siap. Refresh Admin lalu coba lagi.');return;}
    if(document.getElementById('manualVariantPanel')) return;
    var p=document.createElement('div');p.id='manualVariantPanel';
    p.style.cssText='position:fixed;inset:0;z-index:100000;background:#0007;padding:18px;overflow:auto';
    p.innerHTML='<div style="max-width:1050px;margin:0 auto;background:#fff;border-radius:16px;padding:18px"><div style="display:flex;justify-content:space-between"><div><b style="font-size:20px">Varian Produk</b><div style="font-size:13px;color:#666">Atur grup dan label varian semua produk.</div></div><button id="mvClose">✕</button></div><div id="mvList" style="margin-top:14px">Memuat...</div></div>';
    document.body.appendChild(p);p.querySelector('#mvClose').onclick=function(){p.remove()};
    var r=await sb.from('produk').select('id,nama,harga_jual,variant_group,variant_label').order('id',{ascending:true});
    if(r.error){p.querySelector('#mvList').textContent='Gagal memuat: '+r.error.message;return;}
    var html='<div style="display:grid;gap:9px">';
    (r.data||[]).forEach(function(x){html+='<div data-id="'+esc(x.id)+'" style="display:grid;grid-template-columns:minmax(230px,1fr) 190px 150px auto;gap:7px;align-items:center;border:1px solid #eee;border-radius:10px;padding:9px"><div><b>'+esc(x.nama)+'</b><div style="font-size:12px;color:#777">ID '+esc(x.id)+' · Rp '+Number(x.harga_jual||0).toLocaleString('id-ID')+'</div></div><input class="mv-group" placeholder="Grup" value="'+esc(x.variant_group)+'" style="padding:9px;border:1px solid #ccc;border-radius:8px"><input class="mv-label" placeholder="Label, contoh: 5W" value="'+esc(x.variant_label)+'" style="padding:9px;border:1px solid #ccc;border-radius:8px"><button class="mv-save">Simpan</button></div>';});
    html+='</div>';p.querySelector('#mvList').innerHTML=html;
    p.querySelectorAll('.mv-save').forEach(function(b){b.onclick=async function(){var row=b.parentElement,id=row.dataset.id;b.disabled=true;var rr=await sb.from('produk').update({variant_group:row.querySelector('.mv-group').value.trim()||null,variant_label:row.querySelector('.mv-label').value.trim()||null,updated_at:new Date().toISOString()}).eq('id',id);b.textContent=rr.error?'Gagal':'Tersimpan';setTimeout(function(){b.textContent='Simpan';b.disabled=false},1200);};});
  }

  function start(){observe();panelButton();setInterval(observe,700);}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){setTimeout(start,100)}); else setTimeout(start,100);
})();
