/* DUTA LED - Manual Variant Manager
 * Adds a simple admin panel for variant_group / variant_label.
 * Also injects the same fields directly into Tambah/Edit Produk.
 */
(function(){
  'use strict';
  if(!/admin/i.test(location.pathname)) return;

  function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn);else fn();}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

  function injectProductFields(){
    var form=document.getElementById('productForm');
    if(!form || !form.elements || !form.elements.nama) return false;
    if(!document.getElementById('variantGroupField')){
      var wrap=document.createElement('div');
      wrap.className='field';
      wrap.id='variantGroupField';
      wrap.innerHTML='<label>Grup Varian</label><input name="variantGroup" placeholder="Contoh: lampu-led-ac"><small style="color:#6b7585;font-size:11px">Produk dengan grup sama akan tampil sebagai 1 kartu.</small>';
      var sku=form.elements.sku;
      if(sku && sku.closest('.field')) sku.closest('.field').insertAdjacentElement('afterend',wrap);
      else form.querySelector('.grid')?.appendChild(wrap);
    }
    if(!document.getElementById('variantLabelField')){
      var wrap2=document.createElement('div');
      wrap2.className='field';
      wrap2.id='variantLabelField';
      wrap2.innerHTML='<label>Label Varian</label><input name="variantLabel" placeholder="Contoh: 5W"><small style="color:#6b7585;font-size:11px">Teks tombol varian yang dilihat pembeli.</small>';
      var vf=document.getElementById('variantGroupField');
      if(vf) vf.insertAdjacentElement('afterend',wrap2);
      else form.querySelector('.grid')?.appendChild(wrap2);
    }
    return true;
  }

  function hookProductForm(){
    if(!injectProductFields()) return false;
    if(window.__dutaVariantFormHooked) return true;
    if(typeof window.dataForm!=='function' || typeof window.openEditor!=='function') return false;

    var originalDataForm=window.dataForm;
    var originalOpenEditor=window.openEditor;

    window.dataForm=function(){
      var d=originalDataForm.apply(this,arguments);
      var f=document.getElementById('productForm');
      d.variant_group=f?.elements.variantGroup?.value.trim()||null;
      d.variant_label=f?.elements.variantLabel?.value.trim()||null;
      return d;
    };

    window.openEditor=function(p){
      injectProductFields();
      originalOpenEditor.apply(this,arguments);
      var f=document.getElementById('productForm');
      if(f){
        f.elements.variantGroup.value=p?.variant_group??'';
        f.elements.variantLabel.value=p?.variant_label??'';
      }
    };

    window.__dutaVariantFormHooked=true;
    return true;
  }

  function watchProductForm(){
    var tries=0;
    function go(){
      if(hookProductForm()) return;
      if(++tries<60) setTimeout(go,300);
    }
    go();
  }

  function init(){
    if(document.getElementById('manualVariantBtn')) return;
    var btn=document.createElement('button');btn.id='manualVariantBtn';btn.type='button';btn.textContent='⚙️ Varian Produk';
    btn.style.cssText='position:fixed;right:16px;bottom:76px;z-index:99999;border:0;border-radius:12px;padding:11px 15px;background:#111;color:#fff;font-weight:700;box-shadow:0 4px 18px #0003;cursor:pointer';
    document.body.appendChild(btn);
    btn.onclick=openPanel;
    watchProductForm();
  }

  async function getClient(){
    if(window.supabaseClient) return window.supabaseClient;
    if(window.supabase && typeof window.supabase.from==='function') return window.supabase;
    if(window.supabase && window.supabase.createClient && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) return window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
    return null;
  }

  async function openPanel(){
    if(document.getElementById('manualVariantPanel')) return;
    var sb=await getClient();
    if(!sb){alert('Koneksi database belum siap. Refresh Admin lalu coba lagi.');return;}
    var p=document.createElement('div');p.id='manualVariantPanel';p.style.cssText='position:fixed;inset:0;z-index:100000;background:#0007;padding:18px;overflow:auto';
    p.innerHTML='<div style="max-width:1050px;margin:0 auto;background:#fff;border-radius:16px;padding:18px;box-shadow:0 10px 40px #0005"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div><b style="font-size:20px">Varian Produk Manual</b><div style="font-size:13px;color:#666;margin-top:3px">Isi grup yang sama untuk produk yang ingin tampil sebagai 1 kartu.</div></div><button id="mvClose" style="border:0;background:#eee;border-radius:10px;padding:8px 12px">✕</button></div><div id="mvList" style="margin-top:14px">Memuat produk...</div></div>';
    document.body.appendChild(p);p.querySelector('#mvClose').onclick=function(){p.remove()};
    var r=await sb.from('produk').select('id,nama,harga_jual,variant_group,variant_label').order('id',{ascending:true});
    if(r.error){p.querySelector('#mvList').textContent='Gagal memuat: '+r.error.message;return;}
    var list=r.data||[];
    var html='<div style="display:grid;gap:9px">';
    list.forEach(function(x){html+='<div data-id="'+esc(x.id)+'" style="display:grid;grid-template-columns:minmax(230px,1fr) 190px 150px auto;gap:7px;align-items:center;border:1px solid #eee;border-radius:10px;padding:9px"><div><b>'+esc(x.nama)+'</b><div style="font-size:12px;color:#777">ID '+esc(x.id)+' · Rp '+Number(x.harga_jual||0).toLocaleString('id-ID')+'</div></div><input class="mv-group" placeholder="Grup, contoh: lampu-led-ac" value="'+esc(x.variant_group)+'" style="padding:9px;border:1px solid #ccc;border-radius:8px"><input class="mv-label" placeholder="Label, contoh: 5W" value="'+esc(x.variant_label)+'" style="padding:9px;border:1px solid #ccc;border-radius:8px"><button class="mv-save" style="border:0;background:#0b7;color:#fff;border-radius:8px;padding:9px 12px;font-weight:700">Simpan</button></div>';});
    html+='</div><div style="margin-top:12px;font-size:12px;color:#666">Kosongkan Grup Varian jika produk harus tetap menjadi kartu sendiri.</div>';
    p.querySelector('#mvList').innerHTML=html;
    p.querySelectorAll('.mv-save').forEach(function(b){b.onclick=async function(){var row=b.parentElement,id=row.dataset.id;b.disabled=true;b.textContent='...';var rr=await sb.from('produk').update({variant_group:row.querySelector('.mv-group').value.trim()||null,variant_label:row.querySelector('.mv-label').value.trim()||null,updated_at:new Date().toISOString()}).eq('id',id);b.disabled=false;b.textContent=rr.error?'Gagal':'Tersimpan';setTimeout(function(){b.textContent='Simpan'},1200);};});
  }

  ready(function(){setTimeout(init,800)});
})();
