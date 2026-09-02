"use strict";
(function(){
  const SUPABASE_URL="https://opgeeqnucxrdqcgwcuge.supabase.co";
  const SUPABASE_KEY="sb_publishable_uqah55SK8ZjyugWprFnFMA_QnyVdCLA";
  const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
  const esc=s=>String(s??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;","'":"&#039;"}[c]));
  const rupiah=v=>"Rp"+(Number(v)||0).toLocaleString("id-ID");
  const num=v=>Number(String(v??"").replace(/[^\d.-]/g,""))||0;
  const statusList=["Menunggu Pembayaran","Diproses","Dikemas","Dikirim","Selesai","Dibatalkan"];
  const carriers=["J&T Express","JNE","SiCepat","SPX Express","POS Indonesia","AnterAja","Ninja Xpress","Lion Parcel","TIKI","ID Express","Lainnya"];
  const oldOpenOrder=window.openOrder;
  window.openOrder=function(o){
    if(!o)return oldOpenOrder?.(o);
    const details=o.detail_pesanan||[]; const detail=document.getElementById("orderDetail"); if(!detail)return oldOpenOrder?.(o);
    const ongkir=Number(o.ongkir)||0, cod=Number(o.biaya_cod)||0, produk=Number(o.total_harga)||0, grand=produk+ongkir+cod;
    detail.innerHTML=`<div class="ao-head"><div><b>${esc(o.order_id)}</b><div class="ao-muted">${esc(o.status||"Menunggu Pembayaran")}</div></div></div>
      <div class="ao-customer"><b>👤 ${esc(o.nama_pembeli)}</b><br>📱 ${esc(o.no_hp)}<br>📍 ${esc(o.alamat||"")}${o.kecamatan?", "+esc(o.kecamatan):""}</div>
      <div class="ao-info"><b>Pengiriman:</b> ${esc(o.metode_pengiriman||"-")}<br><b>Pembayaran:</b> ${esc(o.metode_pembayaran||"-")}</div>
      <div class="items">${details.map(d=>`<div class="item"><span>${esc(d.nama_produk)} × ${num(d.qty)}</span><b>${rupiah(d.subtotal)}</b></div>`).join("")}<div class="item"><span>Total Produk</span><b>${rupiah(produk)}</b></div></div>
      <div class="ao-status-box"><h3>🚚 Pengiriman & Biaya</h3>
      <label>Ekspedisi<select id="aoCarrier"><option value="">Pilih ekspedisi</option>${carriers.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("")}</select></label>
      <label>Ongkir resmi <span class="ao-help">isi sesuai tarif ekspedisi/destinasi</span><input id="aoOngkir" type="number" min="0" step="100" value="${ongkir}" placeholder="Contoh: 18000"></label>
      <label>Biaya COD <span class="ao-help">isi 0 jika transfer/QRIS</span><input id="aoCod" type="number" min="0" step="100" value="${cod}" placeholder="Contoh: 2500"></label>
      <label>Nomor Resi <span class="ao-help">isi saat pesanan dikirim</span><input id="aoResi" value="${esc(o.nomor_resi||"")}" placeholder="Contoh: JNE123456789"></label>
      <label>Status saat ini<select id="aoStatus">${statusList.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join("")}</select></label>
      <div class="ao-total"><span>Total yang dibayar pembeli</span><b id="aoGrand">${rupiah(grand)}</b></div>
      <button id="aoSave" class="btn primary" type="button">💾 Simpan Status, Resi & Biaya</button><div id="aoMsg"></div></div>
      <div class="order-actions"><button class="btn light" id="aoPrint" type="button">🖨️ Cetak Nota</button></div>`;
    document.getElementById("aoStatus").value=statusList.includes(o.status)?o.status:"Menunggu Pembayaran";
    const carrier=document.getElementById("aoCarrier"); carrier.value=o.ekspedisi||"";
    if(o.ekspedisi&&!carriers.includes(o.ekspedisi))carrier.insertAdjacentHTML("beforeend",`<option value="${esc(o.ekspedisi)}">${esc(o.ekspedisi)}</option>`),carrier.value=o.ekspedisi;
    const updateTotal=()=>{const g=produk+num(document.getElementById("aoOngkir")?.value)+num(document.getElementById("aoCod")?.value);const el=document.getElementById("aoGrand");if(el)el.textContent=rupiah(g)};
    ["aoOngkir","aoCod"].forEach(id=>document.getElementById(id)?.addEventListener("input",updateTotal));
    document.getElementById("aoSave").onclick=async()=>{
      const status=document.getElementById("aoStatus").value,resi=document.getElementById("aoResi").value.trim(),ekspedisi=document.getElementById("aoCarrier").value.trim(),ong=num(document.getElementById("aoOngkir").value),codfee=num(document.getElementById("aoCod").value),btn=document.getElementById("aoSave"),out=document.getElementById("aoMsg");
      if(status==='Dikirim'&&(!resi||!ekspedisi)){out.textContent="Isi ekspedisi dan nomor resi sebelum status Dikirim.";out.className="ao-error";return;}
      btn.disabled=true;btn.textContent="⏳ Menyimpan...";
      try{const {data,error}=await db.rpc("admin_update_pesanan_status",{p_order_id:o.id,p_status:status,p_nomor_resi:resi||null,p_ekspedisi:ekspedisi||null,p_ongkir:ong,p_biaya_cod:codfee});if(error)throw error;o.status=status;o.nomor_resi=resi||o.nomor_resi||null;o.ekspedisi=ekspedisi||o.ekspedisi||null;o.ongkir=ong;o.biaya_cod=codfee;out.textContent="✓ Status, resi, ekspedisi & biaya berhasil disimpan";out.className="ao-ok";window.loadOrders?.();}catch(e){out.textContent="Gagal: "+(e.message||e);out.className="ao-error"}finally{btn.disabled=false;btn.textContent="💾 Simpan Status, Resi & Biaya"}
    };
    document.getElementById("aoPrint").onclick=()=>window.printOrder?.(o);
    document.getElementById("orderModal").classList.remove("hidden");
  };
  window.addEventListener("DOMContentLoaded",()=>{const s=document.createElement("style");s.textContent=`.ao-head{display:flex;justify-content:space-between;margin-bottom:12px}.ao-muted{font-size:12px;color:#6b7585;margin-top:4px}.ao-customer,.ao-info{padding:12px;background:#f7f9fc;border-radius:10px;margin:8px 0;font-size:13px;line-height:1.65}.ao-status-box{margin-top:15px;padding:14px;background:#f5f9ff;border:1px solid #d8e6fb;border-radius:12px}.ao-status-box h3{margin:0 0 12px;font-size:15px}.ao-status-box label{display:block;font-size:12px;font-weight:800;margin:9px 0}.ao-status-box select,.ao-status-box input{display:block;width:100%;margin-top:5px;padding:11px;border:1px solid #d8dee7;border-radius:9px;background:#fff;font-size:14px}.ao-help{font-weight:400;color:#788395}.ao-status-box button{width:100%;margin-top:9px}.ao-total{display:flex;justify-content:space-between;gap:10px;margin-top:12px;padding:12px;background:#fff;border-radius:10px;font-size:13px}.ao-total b{font-size:16px}.ao-ok{margin-top:8px;color:#16804b;font-size:12px;font-weight:800}.ao-error{margin-top:8px;color:#b42318;font-size:12px;font-weight:800}`;document.head.appendChild(s);});
  window.addEventListener("DOMContentLoaded",()=>{
    const emailInput=document.getElementById("adminEmail");
    const savedEmail=(()=>{try{return localStorage.getItem("dutaled_customer_email")||localStorage.getItem("email")||localStorage.getItem("customer_email")||""}catch(e){return""}})();
    if(emailInput){emailInput.value=savedEmail;emailInput.placeholder="Email admin";}
    const host=document.querySelector(".loginbox");
    if(host&&!document.getElementById("adminFeedback")){
      const box=document.createElement("div");box.id="adminFeedback";box.style.cssText="margin-top:18px;padding-top:16px;border-top:1px solid #edf0f4";
      box.innerHTML=`<h3 style="margin:0 0 5px;font-size:16px">💬 Saran & Masukan Web</h3><p style="margin:0 0 10px;color:#6b7585;font-size:12px">Bantu kami memperbaiki web Duta LED.</p>${savedEmail?`<small style="color:#6b7585">Email tersimpan: ${esc(savedEmail)}</small>`:""}<textarea id="webFeedback" rows="4" maxlength="2000" placeholder="Tulis saran, kritik, atau kendala..." style="width:100%;margin-top:8px;padding:10px;border:1px solid #d8dee7;border-radius:9px;resize:vertical"></textarea><button id="sendWebFeedback" type="button" class="btn primary" style="margin-top:8px;width:100%">Kirim Saran</button><div id="feedbackMsg" style="margin-top:7px;font-size:12px"></div>`;
      host.appendChild(box);
      document.getElementById("sendWebFeedback").onclick=async()=>{const text=document.getElementById("webFeedback").value.trim(),msg=document.getElementById("feedbackMsg"),btn=document.getElementById("sendWebFeedback");if(text.length<3){msg.textContent="Tulis minimal 3 karakter.";return}btn.disabled=true;btn.textContent="Mengirim...";try{const {error}=await db.from("saran_masukan").insert({pesan:text,email:savedEmail||null});if(error)throw error;document.getElementById("webFeedback").value="";msg.textContent="✓ Saran berhasil dikirim. Terima kasih 🙏"}catch(e){msg.textContent="Gagal mengirim saran: "+(e.message||"coba lagi")}finally{btn.disabled=false;btn.textContent="Kirim Saran"}};
    }
    const tab=document.getElementById("tabStoreFinance"), finance=document.getElementById("storeFinanceView"), tabs=document.querySelector(".tabs"), main=document.querySelector("main.wrap");
    if(!tab||!tabs||!main)return;
    tab.textContent="💬 Saran & Masukan";
    const feedback=document.createElement("section");feedback.id="feedbackView";feedback.className="hidden finance-panel";feedback.innerHTML=`<div class="finance-head"><div><small>MASUKAN PELANGGAN</small><h2>💬 Saran & Masukan Web</h2><p>Baca saran, kritik, dan kendala yang dikirim dari web pembeli.</p></div><button id="refreshFeedback" class="btn primary" type="button">↻ Refresh</button></div><div id="feedbackList" class="feedback-list"><div class="empty">Memuat saran...</div></div>`;
    finance?.insertAdjacentElement("afterend",feedback);
    const feedbackList=document.getElementById("feedbackList");
    const loadFeedback=async()=>{feedbackList.innerHTML='<div class="empty">Memuat saran...</div>';try{const {data,error}=await db.from("saran_masukan").select("id,pesan,email,created_at").order("created_at",{ascending:false});if(error)throw error;if(!data?.length){feedbackList.innerHTML='<div class="empty">Belum ada saran atau masukan.</div>';return}feedbackList.innerHTML=data.map(x=>`<article class="feedback-card"><div class="feedback-top"><strong>💬 Masukan</strong><small>${new Date(x.created_at).toLocaleString("id-ID")}</small></div><div class="feedback-text">${esc(x.pesan)}</div>${x.email?`<div class="feedback-email">✉️ ${esc(x.email)}</div>`:'<div class="feedback-email">✉️ Tanpa email</div>'}</article>`).join('')}catch(e){feedbackList.innerHTML=`<div class="empty">Gagal membaca saran: ${esc(e.message||e)}</div>`}};
    document.getElementById("refreshFeedback").onclick=loadFeedback;
    const style=document.createElement("style");style.textContent=`.feedback-list{display:grid;gap:10px}.feedback-card{background:#fff;border:1px solid #e1e6ed;border-radius:12px;padding:14px}.feedback-top{display:flex;justify-content:space-between;gap:10px;align-items:center}.feedback-top small{color:#788395;font-size:11px}.feedback-text{margin-top:10px;white-space:pre-wrap;line-height:1.55;font-size:14px}.feedback-email{margin-top:9px;color:#6b7585;font-size:12px}`;document.head.appendChild(style);
    const activateFeedback=async e=>{if(e){e.preventDefault();e.stopImmediatePropagation()}["ordersView","productsView","storeFinanceView","personalFinanceView","feedbackView"].forEach(id=>document.getElementById(id)?.classList.add("hidden"));feedback.classList.remove("hidden");document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));tab.classList.add("active");await loadFeedback()};
    tab.addEventListener("click",activateFeedback,true);
  });
})();

/* Load the final admin UI modules after the base admin scripts. */
(function(){
  function load(src){const s=document.createElement('script');s.src=src;document.head.appendChild(s)}
  const run=()=>{
    load('admin-status-tabs.js?v=20260902-3');
    load('admin-ui-v2.js?v=20260902-4');
    load('nota-wa-share.js?v=20260902-2');
    load('admin-fixes-v6.js?v=20260902-2');
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,120));else setTimeout(run,120);
})();