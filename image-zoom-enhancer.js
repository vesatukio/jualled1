/* One-tap large zoom + second tap returns; supports image 1/2/3 in zoom view */
(function(){
  function enhance(overlay){
    const img=overlay.querySelector('.zoom-image'); if(!img||overlay.dataset.enhanced)return; overlay.dataset.enhanced='1';
    img.classList.remove('zoomed');
    const dots=document.createElement('div');dots.className='zoom-dots';
    const currentSrc=img.getAttribute('src');
    const sources=[currentSrc];
    const card=document.querySelector('.product-card');
    if(card){card.querySelectorAll('.gallery-slide img').forEach(x=>{const s=x.getAttribute('src');if(s&&!sources.includes(s))sources.push(s);});}
    sources.slice(0,3).forEach((src,i)=>{const b=document.createElement('button');b.type='button';b.className='zoom-dot'+(i===0?' active':'');b.onclick=e=>{e.stopPropagation();img.src=src;img.classList.remove('zoomed');dots.querySelectorAll('button').forEach((d,k)=>d.classList.toggle('active',k===i));};dots.appendChild(b);});
    overlay.appendChild(dots);
    let sx=0;overlay.addEventListener('touchstart',e=>{sx=e.changedTouches[0]?.clientX||0},{passive:true});overlay.addEventListener('touchend',e=>{const dx=(e.changedTouches[0]?.clientX||0)-sx;if(Math.abs(dx)<45)return;let n=sources.indexOf(img.src);if(n<0)n=0;n=(n+(dx<0?1:-1)+sources.length)%sources.length;img.src=sources[n];img.classList.remove('zoomed');dots.querySelectorAll('button').forEach((d,k)=>d.classList.toggle('active',k===n));},{passive:true});
  }
  const ob=new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1){if(n.classList?.contains('image-zoom-overlay'))enhance(n);n.querySelectorAll?.('.image-zoom-overlay').forEach(enhance);}}));
  document.addEventListener('DOMContentLoaded',()=>ob.observe(document.body,{childList:true,subtree:true}));
})();
