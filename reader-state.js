/* One owner for reader movement and nested background locks. */
(function(){
  const root=document.documentElement,body=document.body,locks=new Set(),inertNodes=new Map();
  let generation=0,frame=0,busy=false,lockedY=0;
  const places=new Map();
  const reduced=()=>globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const top=()=>{const header=document.querySelector('.top')?.getBoundingClientRect().bottom||0;return document.body.matches('.favorites-filter-on:not(.drawer-open):not(.search-active):not(.favorite-editing)')?Math.max(header,document.querySelector('.reader-favorites-context')?.getBoundingClientRect().bottom||header):header};
  function instant(y){window.scrollTo({top:Math.max(0,y),left:0,behavior:'auto'})}
  function cancel(){generation++;cancelAnimationFrame(frame);busy=false;body.classList.remove('reader-layout-changing');return generation}
  function complete(){busy=false;body.classList.remove('reader-layout-changing');window.dispatchEvent(new CustomEvent('police-law-navigation-settled',{detail:{navigation:true}}))}
  function activeArticle(){
    const view=document.getElementById('actview');if(!view)return null;
    const box=view.getBoundingClientRect(),left=Math.max(0,box.left),right=Math.min(innerWidth,box.right),ceiling=top();
    const floor=innerHeight,occluders=[],visibleArticles=[];
    for(const bar of document.querySelectorAll('.article-pager,#return.show,#searchReturn.show')){if(getComputedStyle(bar).display==='none'||bar.matches('.article-pager')&&body.classList.contains('drawer-open'))continue;const r=(bar.querySelector('button')||bar).getBoundingClientRect();if(r.height>0)occluders.push(r)}
    for(const article of view.querySelectorAll('article.legal-unit')){
      if(article.closest('[hidden]'))continue;const r=article.getBoundingClientRect(),l=Math.max(left,r.left),rr=Math.min(right,r.right),t=Math.max(ceiling,r.top),b=Math.min(floor,r.bottom);
      let visible=Math.max(0,b-t)*Math.max(0,rr-l);
      for(const cover of occluders)visible-=Math.max(0,Math.min(b,cover.bottom)-Math.max(t,cover.top))*Math.max(0,Math.min(rr,cover.right)-Math.max(l,cover.left));
      if(visible>0)visibleArticles.push({article,top:r.top,height:visible/Math.max(1,rr-l)});
      if(visibleArticles.length===2)break;
    }
    const [first,next]=visibleArticles;
    return first?(first.top<ceiling&&next&&next.height>first.height?next.article:first.article):null;
  }
  function capture(){
    const article=activeArticle();if(!article)return null;
    const box=article.getBoundingClientRect(),y=(Math.max(top(),box.top)+Math.min(innerHeight,box.bottom))/2,x=Math.max(1,Math.min(innerWidth-1,box.left+box.width/2));
    let node=document.elementFromPoint(x,y)?.closest?.('#actview .subunit[id],#actview .legal-unit[id]');
    if(!node||!article.contains(node))node=[...article.querySelectorAll('.subunit[id]')].find(el=>{const r=el.getBoundingClientRect();return r.top<=y&&r.bottom>=y})||article;
    const rect=node.getBoundingClientRect();let range=null;
    try{const caret=document.caretRangeFromPoint?.(x,y);if(caret&&node.contains(caret.startContainer)){range=caret.cloneRange();if(range.startContainer.nodeType===3&&range.startOffset<range.startContainer.length)range.setEnd(range.startContainer,range.startOffset+1)}}catch(_){}
    return{id:node.id,articleId:article.id,ratio:Math.max(0,Math.min(1,(y-rect.top)/Math.max(1,rect.height))),range,point:range?.getBoundingClientRect?.().top??y};
  }
  function remember(code){if(!code||locks.size||busy)return;const anchor=capture();if(anchor&&document.getElementById(anchor.articleId)?.dataset.sourceAct===code)places.set(code,{id:anchor.id,articleId:anchor.articleId,ratio:anchor.ratio})}
  function restorePlace(anchor){const token=cancel();busy=true;restore(anchor);frame=requestAnimationFrame(()=>{if(token!==generation)return;restore(anchor);complete()})}
  function restore(anchor){
    const node=anchor&&document.getElementById(anchor.id);if(!node)return;
    const r=node.getBoundingClientRect(),caret=anchor.range?.startContainer?.isConnected?anchor.range.getBoundingClientRect?.():null;
    instant(window.scrollY+(caret?.height?caret.top-anchor.point:r.top+r.height*anchor.ratio-(top()+innerHeight)/2));
  }
  function layout(change,{articleTop=false}={}){
    const anchor=capture(),token=cancel();busy=true;body.classList.add('reader-layout-changing');change();
    if(articleTop&&anchor){toElement(document.getElementById(anchor.articleId),{alignTop:true});return}
    restore(anchor);frame=requestAnimationFrame(()=>{if(token!==generation)return;restore(anchor);complete()});
  }
  function toElement(element,{alignTop=false,animate=true}={}){
    const changing=body.classList.contains('reader-layout-changing'),token=cancel();if(!element)return;busy=true;if(changing)body.classList.add('reader-layout-changing');
      if(token!==generation||locks.size||!element.isConnected){if(token===generation)complete();return}
      // Lay out and place the new content before its first paint, avoiding two
      // frames at the previous law's scroll position.
      const header=document.querySelector('.top');if(header){const height=Math.ceil(header.getBoundingClientRect().height)+'px';if(root.style.getPropertyValue('--topH')!==height)root.style.setProperty('--topH',height)}
      const r=element.getBoundingClientRect(),offset=alignTop?top()+8:top()+Math.max(0,(innerHeight-top()-r.height)/2);
      const max=Math.max(0,document.documentElement.scrollHeight-innerHeight),destination=Math.max(0,Math.min(max,scrollY+r.top-offset));
      const delta=destination-scrollY;
      if(!animate||reduced()||Math.abs(delta)<2){instant(destination);complete();return}
      // Skip the distant middle; animate only the last small piece of the journey.
      const start=destination-Math.sign(delta)*Math.min(100,Math.abs(delta)),began=performance.now();instant(start);
      function tick(now){
        if(token!==generation)return;
        const t=Math.min(1,(now-began)/300),ease=(t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2)+.12*Math.sin(Math.PI*t)*Math.pow(t,4);
        instant(start+(destination-start)*ease);
        if(t<1)frame=requestAnimationFrame(tick);else{instant(destination);complete()}
      }
      frame=requestAnimationFrame(tick);
  }
  function syncInert(){
    const locked=locks.size>0,settings=locks.has('settings')||locks.has('popover');
    for(const node of document.querySelectorAll('main,.drawer,.article-pager,.return,.search-return,.split-handle,.top')){
      const should=locked&&(!node.matches('.top')||settings);
      if(should&&!inertNodes.has(node)){inertNodes.set(node,node.inert||false);node.inert=true}
      else if(!should&&inertNodes.has(node)){node.inert=inertNodes.get(node);inertNodes.delete(node)}
    }
  }
  function lock(owner,on){
    const was=locks.size>0;if(on)locks.add(owner);else locks.delete(owner);
    if(!was&&locks.size){cancel();lockedY=Math.max(0,scrollY);body.style.setProperty('--reader-lock-top',-lockedY+'px');root.classList.add('reader-frozen');body.classList.add('reader-frozen')}
    if(was&&!locks.size){root.classList.remove('reader-frozen');body.classList.remove('reader-frozen');body.style.removeProperty('--reader-lock-top');instant(lockedY);window.dispatchEvent(new CustomEvent('police-law-navigation-settled',{detail:{navigation:false}}))}
    syncInert();
  }
  const shade=document.createElement('div');shade.className='reader-search-shade';shade.setAttribute('aria-hidden','true');body.append(shade);
  shade.onclick=()=>{if(body.classList.contains('search-active'))globalThis.__POLICE_SEARCH_CLEAR?.()};
  globalThis.__READER_STATE={cancel,capture,restore,layout,toElement,lock,instant,activeArticle,remember,recall:code=>places.get(code),restorePlace,get busy(){return busy},get frozen(){return locks.size>0},get generation(){return generation}};
  for(const type of ['wheel','touchstart','pointerdown'])document.addEventListener(type,()=>{if(busy)cancel()},{passive:true,capture:true});
  document.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key)&&busy)cancel()},true);
  window.addEventListener('police-law-drawer-ready',syncInert);
})();
