(function(){
  function syncHeaderHeight(){
    const h=document.querySelector('.top');
    if(!h)return;
    const px=Math.ceil(h.getBoundingClientRect().height||h.offsetHeight||0);
    if(px>0)document.documentElement.style.setProperty('--topH',px+'px');
  }
  function topOffset(){return (document.querySelector('.top')?.getBoundingClientRect().height || 0) + 8}
  function visibleArticleId(){
    const rows=[...document.querySelectorAll('#actview .legal-unit[id]')];
    if(!rows.length)return null;
    const y=topOffset()+8;let best=null,distance=Infinity;
    for(const el of rows){const r=el.getBoundingClientRect();if(r.top<=y&&r.bottom>y)return el.id;const d=Math.abs(r.top-y);if(d<distance){distance=d;best=el}}
    return best?.id||null;
  }
  function pinArticleToTop(id){if(!id)return;const el=document.getElementById(id);if(!el)return;const y=window.scrollY+el.getBoundingClientRect().top-topOffset();window.scrollTo({top:Math.max(0,y),behavior:'auto'})}
  function settleHeaderAndArticle(id){
    syncHeaderHeight();requestAnimationFrame(()=>{syncHeaderHeight();requestAnimationFrame(()=>{syncHeaderHeight();pinArticleToTop(id)})});
    setTimeout(()=>{syncHeaderHeight();pinArticleToTop(id)},90);
    setTimeout(()=>{syncHeaderHeight();pinArticleToTop(id);const active=document.querySelector('.drawer-article[data-id="'+CSS.escape(id||'')+'"]');if(active)active.scrollIntoView({block:'nearest',behavior:'auto'})},240);
  }
  function prepareCompactTocLabels(root=document){
    root.querySelectorAll?.('.drawer-article').forEach(row=>{
      const b=row.querySelector('b');if(!b)return;
      const m=(b.textContent||'').trim().match(/(?:Art\.|A\.)\s*([0-9]+[a-z]*)/i);
      if(m)row.dataset.num=m[1];
    });
  }
  const header=document.querySelector('.top');
  if(header){syncHeaderHeight();try{new ResizeObserver(syncHeaderHeight).observe(header)}catch(_){}}
  window.addEventListener('orientationchange',()=>setTimeout(syncHeaderHeight,80));
  window.addEventListener('resize',syncHeaderHeight,{passive:true});
  if(window.visualViewport)visualViewport.addEventListener('resize',syncHeaderHeight,{passive:true});
  document.addEventListener('pointerdown',e=>{if(e.target.closest('#hamburger'))document.documentElement.dataset.splitArticle=visibleArticleId()||''},true);
  document.addEventListener('click',e=>{if(!e.target.closest('#hamburger'))return;const id=document.documentElement.dataset.splitArticle||visibleArticleId();settleHeaderAndArticle(id);setTimeout(()=>prepareCompactTocLabels(),0)},true);
  prepareCompactTocLabels();
  try{new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1)prepareCompactTocLabels(n.matches?.('.drawer-article')?n:n)}).observe(document.body,{childList:true,subtree:true})}catch(_){}
  const style=document.createElement('style');
  style.textContent=`.split-handle{right:-6px!important;width:11px!important;height:32px!important;border-radius:5px!important}.split-handle span{width:3px!important;height:14px!important}`;
  document.head.appendChild(style);
})();
