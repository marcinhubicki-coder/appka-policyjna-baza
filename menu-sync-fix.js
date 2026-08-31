(function(){
  function syncHeaderHeight(){
    const h=document.querySelector('.top');
    if(!h)return;
    const px=Math.ceil(h.getBoundingClientRect().height||h.offsetHeight||0);
    if(px>0)document.documentElement.style.setProperty('--topH',px+'px');
  }
  function topOffset(){return (document.querySelector('.top')?.getBoundingClientRect().height || 0) + 8}
  function visibleArticleId(){
    const view=document.getElementById('actview'),rect=view?.getBoundingClientRect();if(!view||!rect)return null;
    const x=Math.max(1,Math.min(window.innerWidth-1,rect.left+Math.min(24,Math.max(1,rect.width/2)))),y=Math.max(1,Math.min(window.innerHeight-1,topOffset()+8));
    return document.elementFromPoint(x,y)?.closest?.('#actview .legal-unit[id]')?.id||location.hash.slice(1)||null;
  }
  function pinArticleToTop(id){if(!id)return;if(typeof globalThis.__POLICE_SCROLL_ARTICLE==='function'){globalThis.__POLICE_SCROLL_ARTICLE(id,false);return}document.getElementById(id)?.scrollIntoView({block:'start',behavior:'auto'})}
  function settleHeaderAndArticle(id){
    syncHeaderHeight();requestAnimationFrame(()=>requestAnimationFrame(()=>{syncHeaderHeight();pinArticleToTop(id);const active=document.querySelector('.drawer-article[data-id="'+CSS.escape(id||'')+'"]');if(active)active.scrollIntoView({block:'nearest',behavior:'auto'})}));
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
