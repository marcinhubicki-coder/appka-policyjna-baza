/* One owner for reader movement and nested background locks. */
(function(){
  const root=document.documentElement,body=document.body,locks=new Set(),inertNodes=new Map();
  let generation=0,frame=0,busy=false,lockedY=0;
  const reduced=()=>globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const top=()=>document.querySelector('.top')?.getBoundingClientRect().bottom||0;
  function instant(y){window.scrollTo({top:Math.max(0,y),left:0,behavior:'auto'})}
  function cancel(){generation++;cancelAnimationFrame(frame);busy=false;body.classList.remove('reader-layout-changing');return generation}
  function complete(){busy=false;body.classList.remove('reader-layout-changing');window.dispatchEvent(new CustomEvent('police-law-navigation-settled'))}
  function capture(){
    const view=document.getElementById('actview');if(!view)return null;
    const box=view.getBoundingClientRect(),y=(top()+innerHeight)/2,x=Math.max(1,Math.min(innerWidth-1,box.left+box.width/2));
    let node=document.elementFromPoint(x,y)?.closest?.('#actview .subunit[id],#actview .legal-unit[id]');
    if(!node)node=[...view.querySelectorAll('.subunit[id],.legal-unit[id]')].find(el=>{const r=el.getBoundingClientRect();return r.top<=y&&r.bottom>=y});
    if(!node)return null;
    const rect=node.getBoundingClientRect();let range=null;
    try{const caret=document.caretRangeFromPoint?.(x,y);if(caret&&node.contains(caret.startContainer)){range=caret.cloneRange();if(range.startContainer.nodeType===3&&range.startOffset<range.startContainer.length)range.setEnd(range.startContainer,range.startOffset+1)}}catch(_){}
    return{id:node.id,ratio:Math.max(0,Math.min(1,(y-rect.top)/Math.max(1,rect.height))),range,point:range?.getBoundingClientRect?.().top??y};
  }
  function restore(anchor){
    const node=anchor&&document.getElementById(anchor.id);if(!node)return;
    const r=node.getBoundingClientRect(),caret=anchor.range?.startContainer?.isConnected?anchor.range.getBoundingClientRect?.():null;
    instant(window.scrollY+(caret?.height?caret.top-anchor.point:r.top+r.height*anchor.ratio-(top()+innerHeight)/2));
  }
  function layout(change){
    const anchor=capture(),token=cancel();busy=true;body.classList.add('reader-layout-changing');change();
    frame=requestAnimationFrame(()=>{if(token!==generation)return;restore(anchor);frame=requestAnimationFrame(()=>{if(token!==generation)return;restore(anchor);complete()})});
  }
  function toElement(element,{alignTop=false,animate=true}={}){
    const token=cancel();if(!element)return;busy=true;
    frame=requestAnimationFrame(()=>{frame=requestAnimationFrame(()=>{
      if(token!==generation||locks.size||!element.isConnected){if(token===generation)complete();return}
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
    })});
  }
  function syncInert(){
    const locked=locks.size>0,settings=locks.has('settings');
    for(const node of document.querySelectorAll('main,.drawer,.article-pager,.return,.search-return,.split-handle,.top')){
      const should=locked&&(!node.matches('.top')||settings);
      if(should&&!inertNodes.has(node)){inertNodes.set(node,node.inert||false);node.inert=true}
      else if(!should&&inertNodes.has(node)){node.inert=inertNodes.get(node);inertNodes.delete(node)}
    }
  }
  function lock(owner,on){
    const was=locks.size>0;if(on)locks.add(owner);else locks.delete(owner);
    if(!was&&locks.size){cancel();lockedY=Math.max(0,scrollY);body.style.setProperty('--reader-lock-top',-lockedY+'px');root.classList.add('reader-frozen');body.classList.add('reader-frozen')}
    if(was&&!locks.size){root.classList.remove('reader-frozen');body.classList.remove('reader-frozen');body.style.removeProperty('--reader-lock-top');instant(lockedY);window.dispatchEvent(new CustomEvent('police-law-navigation-settled'))}
    syncInert();
  }
  const shade=document.createElement('div');shade.className='reader-search-shade';shade.setAttribute('aria-hidden','true');body.append(shade);
  globalThis.__READER_STATE={cancel,capture,restore,layout,toElement,lock,instant,get busy(){return busy},get frozen(){return locks.size>0},get generation(){return generation}};
  for(const type of ['wheel','touchstart','pointerdown'])document.addEventListener(type,()=>{if(busy)cancel()},{passive:true,capture:true});
  document.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key)&&busy)cancel()},true);
  window.addEventListener('police-law-drawer-ready',syncInert);
})();
