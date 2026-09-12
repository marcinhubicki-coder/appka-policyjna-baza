/* A continuous selection and a reader-following list with manual ownership. */
(function(){
  let manual=false,held=false,touching=false,frame=0,activeId='',targetId='',lastY=scrollY;
  let marker=null,markerList=null,markerFrame=0,markerId='',markerAct='',markerBox=null;
  const watched=new WeakSet();
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease=t=>globalThis.__READER_CORE?.readingEase(t)??(t*t*t*(10-15*t+6*t*t));
  const stop=()=>{cancelAnimationFrame(frame);frame=0;targetId=''};
  const pause=()=>{manual=true;held=true;stop()};
  const release=()=>{held=false;manual=false};
  function paint(box){if(!marker)return;markerBox=box;marker.style.transform=`translate(${box.left}px,${box.top}px)`;marker.style.width=box.width+'px';marker.style.height=Math.max(0,box.bottom-box.top)+'px'}
  function selection(id){
    const list=document.getElementById('drawerArticles'),link=list?.querySelector('[data-id="'+CSS.escape(id||'')+'"]');
    if(list&&!watched.has(list)){watched.add(list);list.addEventListener('toggle',()=>requestAnimationFrame(()=>selection(activeId)),true)}
    if(!list||!link||link.closest('[hidden],.favorites-all-law.is-collapsed')){cancelAnimationFrame(markerFrame);markerFrame=0;marker?.remove();markerList?.classList.remove('has-active-marker');marker=null;markerId='';return}
    if(!marker?.isConnected||markerList!==list){cancelAnimationFrame(markerFrame);markerFrame=0;marker?.remove();markerList?.classList.remove('has-active-marker');markerList=list;marker=document.createElement('div');marker.className='drawer-active-morph';marker.setAttribute('aria-hidden','true');list.append(marker);markerId='';markerBox=null}
    const r=link.getBoundingClientRect(),box=list.getBoundingClientRect();
    if(!r.height||!r.width){marker.hidden=true;list.classList.remove('has-active-marker');return}marker.hidden=false;list.classList.add('has-active-marker');
    const next={left:r.left-box.left,width:r.width,top:r.top-box.top,bottom:r.bottom-box.top},act=link.dataset.act||id.split(/-art-|-par-/)[0];
    if(markerId===id&&markerFrame)return;
    if(markerId===id&&markerBox&&Math.abs(markerBox.top-next.top)<.5&&Math.abs(markerBox.bottom-next.bottom)<.5)return;
    cancelAnimationFrame(markerFrame);markerFrame=0;list.classList.add('has-active-marker');
    const from=markerBox,animate=from&&markerAct===act&&markerId!==id&&!reduced();markerId=id;markerAct=act;
    if(!animate){paint(next);return}
    const down=next.top>=from.top,began=performance.now();
    function tick(now){
      if(!marker?.isConnected){markerFrame=0;return}
      const t=Math.min(1,(now-began)/480),leading=ease(Math.min(1,t/.8)),trailing=ease(Math.max(0,(t-.16)/.84)),cross=ease(t);
      paint({left:from.left+(next.left-from.left)*cross,width:from.width+(next.width-from.width)*cross,top:from.top+(next.top-from.top)*(down?trailing:leading),bottom:from.bottom+(next.bottom-from.bottom)*(down?leading:trailing)});
      markerFrame=t<1?requestAnimationFrame(tick):0;
    }
    markerFrame=requestAnimationFrame(tick);
  }
  function follow(id=activeId){
    activeId=id||activeId;
    if(!document.body.classList.contains('drawer-open')||globalThis.__READER_STATE?.frozen||globalThis.__READER_STATE?.busy)return;
    const list=document.getElementById('drawerArticles'),link=list?.querySelector('[data-id="'+CSS.escape(activeId)+'"]'),scroller=document.querySelector('.drawer-scroll');
    if(!link||!scroller||link.closest('.favorites-all-law.is-collapsed'))return;
    if(!manual&&!touching)for(let ancestor=link.parentElement;ancestor&&ancestor!==list;ancestor=ancestor.parentElement){if(ancestor.matches('details'))ancestor.open=true}
    selection(activeId);if(manual||touching)return;
    if(targetId===activeId&&frame)return;stop();targetId=activeId;
    let from=scroller.scrollTop;const bounds=scroller.getBoundingClientRect(),r=link.getBoundingClientRect(),target=Math.max(0,Math.min(scroller.scrollHeight-scroller.clientHeight,from+r.top-bounds.top-(bounds.height-r.height)/2));
    if(Math.abs(target-from)<1)return;
    if(reduced()){scroller.scrollTop=target;return}
    if(Math.abs(target-from)>scroller.clientHeight*1.5){from=target-Math.sign(target-from)*80;scroller.scrollTop=from}
    const began=performance.now();
    function tick(now){if(manual||touching||globalThis.__READER_STATE?.frozen||globalThis.__READER_STATE?.busy){frame=0;return}const t=Math.min(1,(now-began)/480);scroller.scrollTop=from+(target-from)*ease(t);frame=t<1?requestAnimationFrame(tick):0}
    frame=requestAnimationFrame(tick);
  }
  function resume(){if(held)return;manual=false;follow(globalThis.__READER_STATE?.activeArticle()?.id||activeId)}
  function interaction(event){if(event.target.closest('.drawer-scroll,.favorites-label')){manual=true;stop();if(event.type==='touchstart'||event.type==='pointerdown')touching=true}else if(event.target.closest('main')){touching=false;release();follow()}}
  for(const type of ['pointerdown','touchstart','wheel'])document.addEventListener(type,interaction,{capture:true,passive:true});
  for(const type of ['pointerup','pointercancel','touchend','touchcancel'])document.addEventListener(type,()=>{touching=false},{capture:true,passive:true});
  document.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key))interaction(event)},true);
  window.addEventListener('scroll',()=>{const y=scrollY;if(!held&&Math.abs(y-lastY)>.5&&!globalThis.__READER_STATE?.frozen&&!touching)manual=false;lastY=y},{passive:true});
  window.addEventListener('police-law-active-article',event=>{follow(event.detail.id)});
  window.addEventListener('police-law-selection',event=>{activeId=event.detail.id;selection(activeId)});
  for(const event of ['police-law-drawer-rendered','police-law-favorites-drawer-rendered'])window.addEventListener(event,()=>{markerId='';markerBox=null;selection(activeId)});
  globalThis.__READER_FOLLOW={resume,follow,selection,stop,pause,release,get manual(){return manual}};
})();
