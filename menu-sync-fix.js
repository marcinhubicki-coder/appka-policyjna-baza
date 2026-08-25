(function(){
  function topOffset(){
    return (document.querySelector('.top')?.getBoundingClientRect().height || 0) + 8;
  }

  function visibleArticleId(){
    const rows=[...document.querySelectorAll('#actview .legal-unit[id]')];
    if(!rows.length) return null;
    const y=topOffset()+8;
    let best=null, distance=Infinity;
    for(const el of rows){
      const r=el.getBoundingClientRect();
      if(r.top<=y && r.bottom>y) return el.id;
      const d=Math.abs(r.top-y);
      if(d<distance){ distance=d; best=el; }
    }
    return best?.id || null;
  }

  function pinArticleToTop(id){
    if(!id) return;
    const el=document.getElementById(id);
    if(!el) return;
    const y=window.scrollY + el.getBoundingClientRect().top - topOffset();
    window.scrollTo({top:Math.max(0,y),behavior:'auto'});
  }

  // Capture the article BEFORE split mode changes widths/font wrapping.
  document.addEventListener('pointerdown',function(e){
    if(e.target.closest('#hamburger')){
      document.documentElement.dataset.splitArticle=visibleArticleId() || '';
    }
  },true);

  document.addEventListener('click',function(e){
    if(!e.target.closest('#hamburger')) return;
    const id=document.documentElement.dataset.splitArticle || visibleArticleId();
    // Two passes: first after class/layout switch, second after Safari has reflowed text.
    requestAnimationFrame(()=>requestAnimationFrame(()=>pinArticleToTop(id)));
    setTimeout(()=>pinArticleToTop(id),120);
    setTimeout(()=>{
      pinArticleToTop(id);
      const active=document.querySelector('.drawer-article[data-id="'+CSS.escape(id||'')+'"]');
      if(active) active.scrollIntoView({block:'nearest',behavior:'auto'});
    },260);
  },true);

  const style=document.createElement('style');
  style.textContent=`
    /* Resize handle: ~30% smaller, same touch behaviour. */
    .split-handle{
      right:-6px!important;
      width:11px!important;
      height:32px!important;
      border-radius:5px!important;
    }
    .split-handle span{
      width:3px!important;
      height:14px!important;
    }
  `;
  document.head.appendChild(style);
})();
