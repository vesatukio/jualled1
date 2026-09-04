/* DUTA LED - Admin Ambil Barang stable fix v20260904 */
(function(){
  'use strict';

  const KEY = 'DUTA_ADMIN_AMBIL_BARANG_V1';
  const $ = id => document.getElementById(id);
  const money = n => 'Rp' + (Number(n) || 0).toLocaleString('id-ID');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function load(){
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch(e){ console.warn('Ambil Barang storage:', e); return []; }
  }
  function save(data){ localStorage.setItem(KEY, JSON.stringify(data)); }

  function dueDate(type, custom){
    if(type === 'custom') return custom;
    const d = new Date();
    if(type === 'month') d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + Number(type || 4));
    return d.toISOString().slice(0,10);
  }
  function formatDate(v){
    if(!v) return '-';
    const d = new Date(v + 'T00:00:00');
    return isNaN(d) ? v : d.toLocaleDateString('id-ID',{day:'2-digit',month:'2-digit',year:'numeric'});
  }
  function totalItems(items){ return (items || []).reduce((s,x)=>s+(Number(x.qty)||0)*(Number(x.price)||0),0); }

  function injectStyle(){
    if($('ambilBarangStyle')) return;
    const s=document.createElement('style');
    s.id='ambilBarangStyle';
    s.textContent=`
      #ambilBarangView{background:#fff;border:1px solid #e1e6ed;border-radius:16px;padding:16px}
      .ab-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:14px}
      .ab-muted{color:#6b7585;font-size:13px}
      .ab-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}
      .ab-stat{background:#f6f8fb;border-radius:12px;padding:12px}.ab-stat small{color:#6b7585}.ab-stat b{display:block;font-size:18px;margin-top:4px}
      .ab-form{background:#f8fafc;border:1px solid #e4e8ee;border-radius:14px;padding:14px;margin-bottom:14px}
      .ab-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ab-field{font-size:12px;font-weight:800}.ab-field input,.ab-field select{display:block;width:100%;margin-top:5px;padding:11px;border:1px solid #d8dee7;border-radius:9px;background:#fff;font-size:14px}.ab-full{grid-column:1/-1}
      .ab-items{border-top:1px solid #e4e8ee;margin-top:12px;padding-top:12px}.ab-row{display:grid;grid-template-columns:1fr 100px 145px 40px;gap:7px;margin:8px 0}.ab-row input{padding:10px;border:1px solid #d8dee7;border-radius:9px}.ab-row .variant{grid-column:1/-1}
      .ab-total{display:flex;justify-content:space-between;margin:12px 0;font-size:16px}.ab-list{display:grid;gap:10px}.ab-card{border:1px solid #e1e6ed;border-radius:13px;padding:13px;background:#fff}.ab-card-top{display:flex;justify-content:space-between;gap:10px}.ab-status{font-size:11px;font-weight:800;padding:5px 8px;border-radius:8px;background:#fff3cd;color:#8a6200}.ab-status.lunas{background:#e7f6ed;color:#16804b}.ab-status.tempo{background:#ffe8e6;color:#b42318}.ab-items-list{margin:9px 0;padding:9px;background:#f7f9fc;border-radius:9px;font-size:13px}.ab-actions{display:flex;gap:8px;margin-top:10px}.ab-actions button{flex:1}
      @media(max-width:650px){.ab-grid{grid-template-columns:1fr}.ab-full{grid-column:auto}.ab-stats{grid-template-columns:1fr}.ab-row{grid-template-columns:1fr 75px 110px 38px}.ab-head{display:block}.ab-head button{margin-top:10px}.ab-actions{flex-direction:column}}
    `;
    document.head.appendChild(s);
  }

  function setup(){
    const tabs=document.querySelector('.tabs');
    const main=document.querySelector('main.wrap');
    if(!tabs || !main) return false;
    injectStyle();

    let button=$('tabAmbilBarang');
    if(!button){
      button=document.createElement('button');
      button.id='tabAmbilBarang';button.type='button';button.className='btn tab';button.textContent='📦 Ambil Barang';tabs.appendChild(button);
    }

    let view=$('ambilBarangView');
    if(!view){
      view=document.createElement('section');view.id='ambilBarangView';view.className='hidden';main.appendChild(view);
    }

    button.onclick=show;
    render();
    return true;
  }

  function hideOtherViews(){
    ['ordersView','productsView','storeFinanceView','personalFinanceView','ambilBarangView'].forEach(id=>$(id)?.classList.add('hidden'));
    document.querySelectorAll('.tabs .tab').forEach(x=>x.classList.remove('active'));
  }
  function show(){
    hideOtherViews();
    $('ambilBarangView').classList.remove('hidden');
    $('tabAmbilBarang').classList.add('active');
    render();
  }

  function render(){
    const view=$('ambilBarangView');
    if(!view) return;
    const data=load();
    const today=new Date().toISOString().slice(0,10);
    let sisa=0,tempo=0,count=0;
    data.forEach(x=>{
      const rem=Math.max(0,(Number(x.total)||0)-(Number(x.paid)||0));
      sisa+=rem;if(rem>0) count++;if(rem>0 && x.due<today) tempo+=rem;
    });
    view.innerHTML=`
      <div class="ab-head"><div><small style="font-weight:800;color:#1769e0">ADMIN TOKO</small><h2 style="margin:4px 0">📦 Ambil Barang · Bayar Belakang</h2><div class="ab-muted">Catat barang yang diambil sekarang dan dibayar kepada supplier kemudian.</div></div><button id="abNew" class="btn primary" type="button">＋ Ambil Barang</button></div>
      <div class="ab-stats"><div class="ab-stat"><small>Total Sisa</small><b>${money(sisa)}</b></div><div class="ab-stat"><small>Jatuh Tempo</small><b>${money(tempo)}</b></div><div class="ab-stat"><small>Belum Lunas</small><b>${count}</b></div></div>
      <div id="abFormHost"></div>
      <div class="ab-list">${data.length ? data.slice().reverse().map(card).join('') : '<div class="empty">Belum ada pengambilan barang.</div>'}</div>`;
    $('abNew').onclick=form;
    view.querySelectorAll('[data-pay]').forEach(b=>b.onclick=()=>pay(b.dataset.pay));
    view.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>removeRecord(b.dataset.del));
  }

  function form(){
    const host=$('abFormHost');
    host.innerHTML=`<div class="ab-form"><div class="ab-grid"><label class="ab-field">Supplier *<input id="abSupplier" placeholder="Nama supplier"></label><label class="ab-field">Jatuh Tempo *<select id="abDueType"><option value="4">4 hari</option><option value="19">19 hari</option><option value="month">1 bulan</option><option value="custom">Tanggal tertentu</option></select></label><label id="abCustomWrap" class="ab-field" hidden>Tanggal Jatuh Tempo<input id="abCustom" type="date"></label><label class="ab-field ab-full">Keterangan<input id="abNote" placeholder="Opsional"></label></div><div class="ab-items"><b>Daftar Barang</b><div id="abItemRows"></div><button id="abAddItem" type="button" class="btn light">＋ Tambah Barang</button></div><div class="ab-total"><span>Total</span><b id="abFormTotal">Rp0</b></div><button id="abSave" type="button" class="btn primary">💾 Simpan Pengambilan</button> <button id="abCancel" type="button" class="btn light">Batal</button></div>`;
    let rows=[{name:'',variant:'',qty:1,price:0}];
    const redraw=()=>{
      $('abItemRows').innerHTML=rows.map((r,i)=>`<div class="ab-row"><input data-k="name" data-i="${i}" value="${esc(r.name)}" placeholder="Nama barang"><input data-k="qty" data-i="${i}" type="number" min="1" value="${r.qty}"><input data-k="price" data-i="${i}" type="number" min="0" value="${r.price}" placeholder="Harga/pcs"><button type="button" data-delrow="${i}" class="btn light">×</button><input class="variant" data-k="variant" data-i="${i}" value="${esc(r.variant)}" placeholder="Ukuran / varian (opsional)"></div>`).join('');
      $('abItemRows').querySelectorAll('[data-k]').forEach(e=>e.oninput=()=>{const i=Number(e.dataset.i);const k=e.dataset.k;rows[i][k]=(k==='qty'||k==='price')?(Number(e.value)||0):e.value;$('abFormTotal').textContent=money(totalItems(rows));});
      $('abItemRows').querySelectorAll('[data-delrow]').forEach(e=>e.onclick=()=>{rows.splice(Number(e.dataset.delrow),1);if(!rows.length)rows.push({name:'',variant:'',qty:1,price:0});redraw();});
      $('abFormTotal').textContent=money(totalItems(rows));
    };
    $('abDueType').onchange=()=>{$('abCustomWrap').hidden=$('abDueType').value!=='custom';};
    $('abAddItem').onclick=()=>{rows.push({name:'',variant:'',qty:1,price:0});redraw();};
    $('abCancel').onclick=()=>{host.innerHTML='';};
    $('abSave').onclick=()=>{
      const supplier=$('abSupplier').value.trim();
      const due=dueDate($('abDueType').value,$('abCustom').value);
      const valid=rows.filter(x=>x.name.trim() && Number(x.qty)>0);
      if(!supplier){alert('Nama supplier wajib diisi.');return;}
      if(!valid.length){alert('Minimal satu barang harus diisi.');return;}
      if($('abDueType').value==='custom' && !due){alert('Tanggal jatuh tempo wajib dipilih.');return;}
      const data=load();
      data.push({id:'AB'+Date.now(),supplier,takenAt:new Date().toISOString(),due,items:valid,total:totalItems(valid),paid:0,note:$('abNote').value.trim()});
      save(data);render();
    };
    redraw();
  }

  function card(x){
    const rem=Math.max(0,(Number(x.total)||0)-(Number(x.paid)||0));
    const today=new Date().toISOString().slice(0,10);
    const status=rem<=0?'LUNAS':x.due<today?'JATUH TEMPO':'BELUM LUNAS';
    const cls=rem<=0?'lunas':status==='JATUH TEMPO'?'tempo':'';
    return `<article class="ab-card"><div class="ab-card-top"><div><b>${esc(x.supplier)}</b><div class="ab-muted">Diambil ${formatDate((x.takenAt||'').slice(0,10))} · Jatuh tempo ${formatDate(x.due)}</div></div><span class="ab-status ${cls}">${status}</span></div><div class="ab-items-list">${(x.items||[]).map(i=>`<div><b>${esc(i.name)}</b>${i.variant?' · '+esc(i.variant):''} — ${Number(i.qty)||0} × ${money(i.price)} = <b>${money((Number(i.qty)||0)*(Number(i.price)||0))}</b></div>`).join('')}</div><div><b>Total: ${money(x.total)}</b> · Dibayar: ${money(x.paid||0)} · <b>Sisa: ${money(rem)}</b></div>${x.note?`<div class="ab-muted">${esc(x.note)}</div>`:''}${rem>0?`<div class="ab-actions"><button class="btn primary" data-pay="${esc(x.id)}" type="button">💰 Bayar</button><button class="btn light" data-del="${esc(x.id)}" type="button">🗑️ Hapus</button></div>`:`<div class="ab-actions"><button class="btn light" data-del="${esc(x.id)}" type="button">🗑️ Hapus</button></div>`}</article>`;
  }

  function pay(id){
    const data=load();
    const x=data.find(a=>a.id===id);if(!x)return;
    const rem=Math.max(0,(Number(x.total)||0)-(Number(x.paid)||0));
    const input=prompt('Masukkan jumlah pembayaran:\nSisa '+money(rem),String(rem));
    if(input===null)return;
    const n=Number(String(input).replace(/[^0-9]/g,''));
    if(!n || n<=0){alert('Jumlah pembayaran tidak valid.');return;}
    x.paid=Math.min(rem,(Number(x.paid)||0)+n);
    save(data);render();
  }

  function removeRecord(id){
    if(!confirm('Hapus catatan pengambilan barang ini?'))return;
    save(load().filter(x=>x.id!==id));render();
  }

  function boot(){
    if(setup()) return;
    setTimeout(boot,300);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,50));
  else boot();
})();