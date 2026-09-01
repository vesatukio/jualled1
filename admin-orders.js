"use strict";
(function(){
  const SUPABASE_URL="https://opgeeqnucxrdqcgwcuge.supabase.co";
  const SUPABASE_KEY="sb_publishable_uqah55SK8ZjyugWprFnFMA_QnyVdCLA";
  const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
  const esc=s=>String(s??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;","'":"&#039;"}[c]));
  const rupiah=v=>"Rp"+(Number(v)||0).toLocaleString("id-ID");
  const num=v=>Number(String(v??"").replace(/[^\d.-]/g,""))||0;
  const statusList=["Menunggu Pembayaran","Diproses","Dikemas","Dikirim","Selesai","Dibatalkan"];
  const oldOpenOrder=window.openOrder;
  window.openOrder=function(o){
    if(!o){return oldOpenOrder?.(o)}
    const details=o.detail_pesanan||[];
    const detail=document.getElementById("orderDetail");
    if(!detail)return oldOpenOrder?.(o);
    detail.innerHTML=`<div class="ao-head"><div><b>${esc(o.order_id)}</b><div class="ao-muted">${esc(o.status||"Menunggu Pembayaran")}</div></div></div>
      <div class="ao-customer"><b>👤 ${esc(o.nama_pembeli)}</b><br>📱 ${esc(o.no_hp)}<br>📍 ${esc(o.alamat||"")}${o.kecamatan?", "+esc(o.kecamatan):""}</div>
      <div class="ao-info"><b>Pengiriman:</b> ${esc(o.metode_pengiriman||"-')}<br><b>Pembayaran:</b> ${esc(o.metode_pembayaran||"-")}</div>
      <div class="items">${details.map(d=>`<div class="item"><span>${esc(d.nama_produk)} × ${num(d.qty)}</span><b>${rupiah(d.subtotal)}</b></div>`).join("")}<div class="item"><strong>TOTAL</strong><strong>${rupiah(o.total_harga)}</strong></div></div>
      <div class="ao-status-box"><h3>📦 Status Pesanan</h3><label>Status saat ini<select id="aoStatus">${statusList.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join("")}</select></label><label>Nomor Resi <span class="ao-help">isi saat pesanan dikirim</span><input id="aoResi" value="${esc(o.nomor_resi||"")}" placeholder="Contoh: JNE123456789"></label><button id="aoSave" class="btn primary" type="button">💾 Simpan Status & Resi</button><div id="aoMsg"></div></div>
      <div class="order-actions"><button class="btn light" id="aoPrint" type="button">🖨️ Cetak Nota</button></div>`;
    document.getElementById("aoStatus").value=statusList.includes(o.status)?o.status:"Menunggu Pembayaran";
    document.getElementById("aoSave").onclick=async()=>{
      const status=document.getElementById("aoStatus").value,resi=document.getElementById("aoResi").value.trim(),btn=document.getElementById("aoSave"),out=document.getElementById("aoMsg");
      btn.disabled=true;btn.textContent="⏳ Menyimpan...";
      try{
        const {data,error}=await db.rpc("admin_update_pesanan_status",{p_order_id:o.id,p_status:status,p_nomor_resi:resi||null});
        if(error)throw error;
        o.status=status;o.nomor_resi=resi||o.nomor_resi||null;
        out.textContent="✓ Status pesanan berhasil diperbarui";out.className="ao-ok";
        window.loadOrders?.();
      }catch(e){out.textContent="Gagal: "+(e.message||e);out.className="ao-error"}
      finally{btn.disabled=false;btn.textContent="💾 Simpan Status & Resi"}
    };
    document.getElementById("aoPrint").onclick=()=>window.printOrder?.(o);
    document.getElementById("orderModal").classList.remove("hidden");
  };
  window.addEventListener("DOMContentLoaded",()=>{
    const s=document.createElement("style");s.textContent=`.ao-head{display:flex;justify-content:space-between;margin-bottom:12px}.ao-muted{font-size:12px;color:#6b7585;margin-top:4px}.ao-customer,.ao-info{padding:12px;background:#f7f9fc;border-radius:10px;margin:8px 0;font-size:13px;line-height:1.65}.ao-status-box{margin-top:15px;padding:14px;background:#f5f9ff;border:1px solid #d8e6fb;border-radius:12px}.ao-status-box h3{margin:0 0 12px;font-size:15px}.ao-status-box label{display:block;font-size:12px;font-weight:800;margin:9px 0}.ao-status-box select,.ao-status-box input{display:block;width:100%;margin-top:5px;padding:11px;border:1px solid #d8dee7;border-radius:9px;background:#fff;font-size:14px}.ao-help{font-weight:400;color:#788395}.ao-status-box button{width:100%;margin-top:9px}.ao-ok{margin-top:8px;color:#16804b;font-size:12px;font-weight:800}.ao-error{margin-top:8px;color:#b42318;font-size:12px;font-weight:800}`;document.head.appendChild(s);
  });
})();