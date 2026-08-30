(function(){
  function syncHeaderHeight(){
    const h=document.querySelector('.top');
    if(!h)return;
    const px=Math.ceil(h.getBoundingClientRect().height||h.offsetHeight||0);
    if(px>0)document.documentElement.style.setProperty('--topH',px+'px');
  }
  function topOffset(){return (document.querySelector('.top')?.getBoundingClientRect().height || 0) + 8}
  function visibleArticleId(){
    const rows=document.querySelectorAll('#actview .legal-unit[id]');
    if(!rows.length)return null;
    const y=topOffset()+8;let low=0,high=rows.length-1,firstBelow=rows.length;
    while(low<=high){const mid=(low+high)>>1,rect=rows[mid].getBoundingClientRect();if(rect.bottom>y){firstBelow=mid;high=mid-1}else low=mid+1}
    if(firstBelow<rows.length)return rows[firstBelow].id;
    return rows[rows.length-1]?.id||null;
  }
  function pinArticleToTop(id){if(!id)return;const el=document.getElementById(id);if(!el)return;const y=window.scrollY+el.getBoundingClientRect().top-topOffset();window.scrollTo({top:Math.max(0,y),behavior:'auto'})}
  function settleHeaderAndArticle(id){
    syncHeaderHeight();requestAnimationFrame(()=>{syncHeaderHeight();requestAnimationFrame(()=>{syncHeaderHeight();pinArticleToTop(id)})});
    setTimeout(()=>{syncHeaderHeight();pinArticleToTop(id)},90);
    setTimeout(()=>{syncHeaderHeight();pinArticleToTop(id);const active=document.querySelector('.drawer-article[data-id="'+CSS.escape(id||'')+'"]');if(active)active.scrollIntoView({block:'nearest',behavior:'auto'})},240);
  }
  const header=document.querySelector('.top');
  if(header){syncHeaderHeight();try{new ResizeObserver(syncHeaderHeight).observe(header)}catch(_){}}
  window.addEventListener('orientationchange',()=>setTimeout(syncHeaderHeight,80));
  window.addEventListener('resize',syncHeaderHeight,{passive:true});
  if(window.visualViewport)visualViewport.addEventListener('resize',syncHeaderHeight,{passive:true});
  document.addEventListener('pointerdown',e=>{if(e.target.closest('#hamburger'))document.documentElement.dataset.splitArticle=visibleArticleId()||''},true);
  document.addEventListener('click',e=>{if(!e.target.closest('#hamburger'))return;const id=document.documentElement.dataset.splitArticle||visibleArticleId();settleHeaderAndArticle(id)},true);
  const style=document.createElement('style');
  style.textContent=`.split-handle{right:-6px!important;width:11px!important;height:32px!important;border-radius:5px!important}.split-handle span{width:3px!important;height:14px!important}`;
  document.head.appendChild(style);
})();
