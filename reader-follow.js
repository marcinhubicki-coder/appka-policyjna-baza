/* The list follows reading; a gesture in the list always takes precedence. */
(function(){
  let manual=false,touching=false,frame=0,activeId='',targetId='',lastY=scrollY;
  const stop=()=>{cancelAnimationFrame(frame);frame=0;targetId=''};
  function follow(id=activeId){
    activeId=id||activeId;
    if(manual||touching||!document.body.classList.contains('drawer-open')||globalThis.__READER_STATE?.frozen||globalThis.__READER_STATE?.busy)return;
    const list=document.getElementById('drawerArticles'),link=list?.querySelector('[data-id="'+CSS.escape(activeId)+'"]'),scroller=document.querySelector('.drawer-scroll');
    if(!link||!scroller||link.closest('.favorites-all-law.is-collapsed'))return;
    for(let ancestor=link.parentElement;ancestor&&ancestor!==list;ancestor=ancestor.parentElement){if(ancestor.matches('details'))ancestor.open=true;if(ancestor.hidden)ancestor.hidden=false;if(ancestor.classList.contains('favorites-all-law')){ancestor.classList.remove('is-collapsed');ancestor.querySelector('button')?.setAttribute('aria-expanded','true')}}
    if(targetId===activeId&&frame)return;stop();targetId=activeId;
    let from=scroller.scrollTop;const bounds=scroller.getBoundingClientRect(),r=link.getBoundingClientRect(),target=Math.max(0,Math.min(scroller.scrollHeight-scroller.clientHeight,from+r.top-bounds.top-(bounds.height-r.height)/2));
    if(Math.abs(target-from)<1)return;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){scroller.scrollTop=target;return}
    if(Math.abs(target-from)>scroller.clientHeight*1.5){from=target-Math.sign(target-from)*80;scroller.scrollTop=from}
    const began=performance.now();
    function tick(now){if(manual||touching||globalThis.__READER_STATE?.frozen||globalThis.__READER_STATE?.busy){frame=0;return}const t=Math.min(1,(now-began)/360),ease=1-Math.pow(1-t,4)*(1+4*t);scroller.scrollTop=from+(target-from)*ease;frame=t<1?requestAnimationFrame(tick):0}
    frame=requestAnimationFrame(tick);
  }
  function resume(){manual=false;follow(globalThis.__READER_STATE?.activeArticle()?.id||activeId)}
  function interaction(event){if(event.target.closest('.drawer-scroll,.favorites-label')){manual=true;stop();if(event.type==='touchstart'||event.type==='pointerdown')touching=true}else if(event.target.closest('main')){touching=false;manual=false;follow()}}
  for(const type of ['pointerdown','touchstart','wheel'])document.addEventListener(type,interaction,{capture:true,passive:true});
  for(const type of ['pointerup','pointercancel','touchend','touchcancel'])document.addEventListener(type,()=>{touching=false},{capture:true,passive:true});
  document.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key))interaction(event)},true);
  window.addEventListener('scroll',()=>{const y=scrollY;if(Math.abs(y-lastY)>.5&&!globalThis.__READER_STATE?.frozen&&!touching)manual=false;lastY=y},{passive:true});
  window.addEventListener('police-law-active-article',event=>{follow(event.detail.id)});
  globalThis.__READER_FOLLOW={resume,follow,get manual(){return manual}};
})();
