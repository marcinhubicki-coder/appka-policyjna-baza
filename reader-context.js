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
  const sizes=new ResizeObserver(queue);let closeRevealed=null;
  document.addEventListener('pointerdown',event=>{if(!event.target.closest('.return,.search-return'))closeRevealed?.()},{passive:true});
  for(const id of ['searchReturn','return']){
    const bar=document.getElementById(id),main=bar?.querySelector('button');if(!bar||!main)continue;
    const surface=document.createElement('div'),content=document.createElement('div'),remove=document.createElement('button');
    surface.className='return-surface';content.className='return-content';main.classList.add('return-main');remove.type='button';remove.className='return-delete';remove.textContent='Usuń';remove.setAttribute('aria-label',id==='searchReturn'?'Usuń powrót do wyszukiwania':'Usuń powrót do odwołania');remove.tabIndex=-1;
    content.append(main,remove);surface.append(content);bar.append(surface);sizes.observe(bar);
    let drag=null,suppress=0,revealed=false,removing=false,animation=null;
    function reveal(on){if(on&&closeRevealed!==close)closeRevealed?.();revealed=on;bar.classList.toggle('return-revealed',on);bar.classList.remove('return-dragging');bar.style.removeProperty('--return-reveal');remove.tabIndex=on?0:-1;if(on)closeRevealed=close;else if(closeRevealed===close)closeRevealed=null}
    function close(){reveal(false)}
    function finish(){globalThis.__POLICE_DISMISS_RETURN?.(id==='searchReturn'?'search':'reference');animation=null;removing=false;bar.classList.remove('return-removing');close();queue()}
    function dismiss(){
      if(removing||globalThis.__READER_STATE?.frozen)return;removing=true;bar.classList.add('return-removing');
      if(content.animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches){animation=content.animate([{transform:'translateY(0)'},{transform:'translateY(105%)'}],{duration:240,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});animation.onfinish=()=>{animation?.cancel();finish()}}else finish();
    }
    remove.onclick=event=>{event.stopPropagation();dismiss()};
    new MutationObserver(()=>{if(!bar.classList.contains('show')&&(revealed||removing)){animation?.cancel();animation=null;removing=false;close()}queue()}).observe(bar,{attributes:true,attributeFilter:['class']});
    bar.addEventListener('pointerdown',event=>{if(event.button!==0||globalThis.__READER_STATE?.frozen||removing||event.target.closest('.return-delete'))return;drag={x:event.clientX,y:event.clientY,dx:0,axis:null,start:revealed?-66:0}});
    bar.addEventListener('pointermove',event=>{if(!drag)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(!drag.axis&&Math.max(Math.abs(dx),Math.abs(dy))>6)drag.axis=Math.abs(dx)>Math.abs(dy)*1.2?'x':'y';if(drag.axis!=='x')return;event.preventDefault();bar.setPointerCapture?.(event.pointerId);drag.dx=dx;bar.classList.add('return-dragging');bar.style.setProperty('--return-reveal',Math.max(-66,Math.min(0,drag.start+dx))+'px')});
    bar.addEventListener('pointerup',()=>{if(!drag)return;const horizontal=drag.axis==='x',open=drag.start+drag.dx<-18;if(horizontal)suppress=Date.now()+350;drag=null;if(horizontal)reveal(open)});
    bar.addEventListener('pointercancel',()=>{drag=null;reveal(revealed)});
    bar.addEventListener('click',event=>{if(event.target.closest('.return-delete'))return;if(event.detail!==0&&Date.now()<suppress||revealed){event.preventDefault();event.stopImmediatePropagation();if(Date.now()>=suppress)close()}},true);
    bar.addEventListener('keydown',event=>{if(globalThis.__READER_STATE?.frozen)return;if(event.key==='Escape'&&revealed){event.preventDefault();close()}else if(event.key==='ArrowLeft'||event.key==='Delete'){event.preventDefault();reveal(true);remove.focus({preventScroll:true})}});
  }
  window.addEventListener('police-law-active-article',context);
  window.addEventListener('police-law-favorites-visibility',queue);
  for(const event of ['police-law-rendered','police-law-favorites-change','police-law-navigation-settled','resize','police-law-drawer-ready'])window.addEventListener(event,queue);
  window.addEventListener('police-law-drawer-ready',()=>{const pager=document.querySelector('.article-pager');if(pager)sizes.observe(pager)});
  queue();
})();
