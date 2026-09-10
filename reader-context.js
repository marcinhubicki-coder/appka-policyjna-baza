/* Persistent favorites context and a measured stack of dismissible returns. */
(function(){
  const banner=document.createElement('div');banner.className='reader-favorites-context';banner.setAttribute('aria-label','Widok ulubionych');
  const label=document.createElement('b'),law=document.createElement('span'),lawNav=document.createElement('div'),prev=document.createElement('button'),next=document.createElement('button');label.textContent='Ulubione';lawNav.className='reader-favorites-law-nav';prev.textContent='‹';next.textContent='›';prev.setAttribute('aria-label','Poprzednia ustawa');next.setAttribute('aria-label','Następna ustawa');lawNav.append(law,prev,next);banner.append(label,lawNav);document.body.append(banner);
  for(const [button,step] of [[prev,-1],[next,1]])button.onclick=()=>{const codes=globalThis.__FAVORITES_NAV?.laws()||[],code=globalThis.__READER_STATE?.activeArticle()?.dataset.sourceAct;const target=codes[codes.indexOf(code)+step];if(target)globalThis.__FAVORITES_NAV.gotoLaw(target)};
  let queued=false;
  function context(){
    if(!document.body.matches('.favorites-filter-on:not(.drawer-open):not(.search-active):not(.favorite-editing)'))return;
    const article=globalThis.__READER_STATE?.activeArticle(),code=article?.dataset.sourceAct||ACT?.[0],name=!article&&document.body.classList.contains('favorites-all-acts')?'Wszystkie ustawy':META[code]?.[1]||ACT?.[1]||'';
    if(law.textContent!==name)law.textContent=name;
    const codes=globalThis.__FAVORITES_NAV?.laws()||[],index=codes.indexOf(code);prev.hidden=next.hidden=!document.body.classList.contains('favorites-all-acts');prev.disabled=index<=0;next.disabled=index<0||index>=codes.length-1;
  }
  function stack(){
    queued=false;context();const split=document.body.classList.contains('drawer-open'),pager=document.querySelector('.article-pager');let bottom=split?8:10;
    if(!split&&pager&&getComputedStyle(pager).display!=='none')bottom+=pager.getBoundingClientRect().height+8;
    for(const id of ['searchReturn','return']){const bar=document.getElementById(id);if(!bar)continue;bar.style.setProperty('--return-bottom',bottom+'px');if(bar.classList.contains('show'))bottom+=bar.getBoundingClientRect().height+8}
  }
  function queue(){if(queued)return;queued=true;requestAnimationFrame(stack)}
  new MutationObserver(queue).observe(document.body,{attributes:true,attributeFilter:['class']});
  const sizes=new ResizeObserver(queue);
  for(const id of ['searchReturn','return']){
    const bar=document.getElementById(id);if(!bar)continue;sizes.observe(bar);new MutationObserver(queue).observe(bar,{attributes:true,attributeFilter:['class']});
    let drag=null,suppress=0;
    function reset(){bar.classList.remove('return-dragging');bar.style.removeProperty('--return-drag');bar.style.removeProperty('--return-opacity')}
    function dismiss(){
      const r=bar.getBoundingClientRect(),ghost=bar.cloneNode(true);ghost.removeAttribute('id');ghost.classList.add('reader-return-ghost');ghost.inert=true;
      ghost.style.cssText=`position:fixed!important;left:${r.left}px!important;right:auto!important;top:${r.top}px!important;bottom:auto!important;width:${r.width}px!important;height:${r.height}px!important;pointer-events:none!important;opacity:1;transform:none;`;
      document.body.append(ghost);globalThis.__POLICE_DISMISS_RETURN?.(id==='searchReturn'?'search':'reference');reset();
      if(ghost.animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const animation=ghost.animate([{transform:'translateX(0)',opacity:1},{transform:'translateX(-110vw)',opacity:0}],{duration:220,easing:'cubic-bezier(.3,0,.7,1)',fill:'forwards'});animation.onfinish=()=>ghost.remove()}else ghost.remove();queue();
    }
    bar.addEventListener('pointerdown',event=>{if(event.button!==0||globalThis.__READER_STATE?.frozen)return;const r=bar.getBoundingClientRect();if(event.clientX<r.left+r.width*.45)return;drag={x:event.clientX,y:event.clientY,dx:0,axis:null};bar.setPointerCapture?.(event.pointerId)});
    bar.addEventListener('pointermove',event=>{if(!drag)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(!drag.axis&&Math.max(Math.abs(dx),Math.abs(dy))>8)drag.axis=Math.abs(dx)>Math.abs(dy)*1.2?'x':'y';if(drag.axis!=='x')return;event.preventDefault();drag.dx=Math.min(0,dx);bar.classList.add('return-dragging');bar.style.setProperty('--return-drag',drag.dx+'px');bar.style.setProperty('--return-opacity',String(Math.max(.35,1+drag.dx/300)))});
    bar.addEventListener('pointerup',()=>{if(!drag)return;const remove=drag.axis==='x'&&drag.dx<-52;if(drag.axis==='x')suppress=Date.now()+400;drag=null;if(remove)dismiss();else reset()});
    bar.addEventListener('pointercancel',()=>{drag=null;reset()});
    bar.addEventListener('click',event=>{if(event.detail!==0&&Date.now()<suppress){event.preventDefault();event.stopImmediatePropagation()}},true);
    bar.addEventListener('keydown',event=>{if(event.key==='Escape'&&!globalThis.__READER_STATE?.frozen){event.preventDefault();dismiss()}});
  }
  window.addEventListener('police-law-active-article',context);
  window.addEventListener('police-law-favorites-visibility',queue);
  for(const event of ['police-law-rendered','police-law-favorites-change','police-law-navigation-settled','resize','police-law-drawer-ready'])window.addEventListener(event,queue);
  window.addEventListener('police-law-drawer-ready',()=>{const pager=document.querySelector('.article-pager');if(pager)sizes.observe(pager)});
  queue();
})();
