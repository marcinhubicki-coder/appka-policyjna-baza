/* Visual motion only: aria labels and search data always contain exact counts. */
(function(){
  const bar=document.getElementById('quickbar'),results=document.getElementById('results');
  if(!bar||!results)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),badges=new Map();
  let scrollFrame=0,activeFrame=0,scrollTarget='',groups=[];
  function stopBadge(state){clearTimeout(state.delay);clearTimeout(state.expand);state.animation?.cancel();state.animation=null;state.badge.removeAttribute('data-count-moving')}
  function exactBadge(state){state.badge.textContent=String(state.value);state.badge.style.setProperty('--hit-digits',String(String(state.value).length));state.badge.removeAttribute('data-count-moving');window.dispatchEvent(new CustomEvent('police-law-quickbar-motion'))}
  function rollBadge(state){
    const reel=document.createElement('span');reel.className='act-count-reel';
    for(let n=0;n<4;n++){const digit=document.createElement('span');digit.textContent=String(state.value+n);reel.append(digit)}
    state.badge.replaceChildren(reel);
    if(!reel.animate){exactBadge(state);return}
    const animation=reel.animate([{transform:'translateY(-51px)'},{transform:'translateY(0)'}],{duration:360,easing:'cubic-bezier(.2,.7,.2,1)'});state.animation=animation;
    animation.onfinish=()=>{if(state.animation!==animation)return;state.animation=null;exactBadge(state)};
  }
  function updateBadges(detail){
    for(const pill of bar.querySelectorAll('button[data-act]')){
      const badge=pill.querySelector('.act-pill-count');if(!badge)continue;
      let state=badges.get(pill);
      if(!state){state={badge,value:null};badges.set(pill,state)}
      if(!detail.active||pill.hidden){stopBadge(state);badge.classList.remove('count-ready');state.value=null;continue}
      if(detail.pending){stopBadge(state);if(state.value!==null)exactBadge(state);continue}
      const value=Number(pill.dataset.hitCount);if(!Number.isFinite(value)||value<1)continue;
      if(value===state.value&&badge.classList.contains('count-ready'))continue;
      stopBadge(state);state.value=value;
      if(reduced.matches){exactBadge(state);badge.classList.add('count-ready');continue}
      badge.setAttribute('data-count-moving','true');
      // Keep a previous exact count visible while the new field prepares.
      state.delay=setTimeout(()=>{
        badge.style.setProperty('--hit-digits',String(String(value+3).length));
        badge.classList.add('count-ready');
        state.expand=setTimeout(()=>rollBadge(state),180);
      },150);
    }
  }
  function highlight(code){
    for(const pill of bar.querySelectorAll('button[data-act]')){
      const on=pill.dataset.act===code;pill.classList.toggle('on',on);
      if(on)pill.setAttribute('aria-current','true');else pill.removeAttribute('aria-current');
    }
  }
  function syncActive(){
    activeFrame=0;if(!globalThis.__POLICE_SEARCH_STATE?.active||scrollTarget)return;
    const top=results.getBoundingClientRect().top;let current=groups[0];
    // Group bounds stay meaningful while their headings are sticky.
    for(const group of groups){if(group.getBoundingClientRect().top<=top+6)current=group;else break}
    if(results.scrollHeight>results.clientHeight&&results.scrollTop+results.clientHeight>=results.scrollHeight-2)current=groups.at(-1);
    if(current)highlight(current.dataset.searchAct);
  }
  function queueActive(){if(!activeFrame)activeFrame=requestAnimationFrame(syncActive)}
  function stopScroll(){if(scrollFrame)cancelAnimationFrame(scrollFrame);scrollFrame=0;scrollTarget='';queueActive()}
  function goToAct(code){
    const group=groups.find(node=>node.dataset.searchAct===code);if(!group)return false;
    stopScroll();scrollTarget=code;highlight(code);
    const from=results.scrollTop,to=Math.max(0,Math.min(results.scrollHeight-results.clientHeight,from+group.getBoundingClientRect().top-results.getBoundingClientRect().top-1));
    if(reduced.matches||Math.abs(to-from)<1){results.scrollTop=to;scrollTarget='';return true}
    const started=performance.now();
    function step(now){
      const t=Math.min(1,(now-started)/280);results.scrollTop=from+(to-from)*(1-Math.pow(1-t,3));
      if(t<1)scrollFrame=requestAnimationFrame(step);else{scrollFrame=0;scrollTarget='';queueActive()}
    }
    scrollFrame=requestAnimationFrame(step);return true;
  }
  globalThis.__POLICE_SEARCH_SCROLL=goToAct;
  results.addEventListener('scroll',queueActive,{passive:true});
  for(const type of ['pointerdown','wheel','touchstart'])results.addEventListener(type,stopScroll,{passive:true});
  results.addEventListener('keydown',event=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End'].includes(event.key))stopScroll()});
  window.addEventListener('police-law-search-state',event=>{
    const detail=event.detail;stopScroll();updateBadges(detail);
    if(!detail.active){groups=[];highlight(typeof ACT!=='undefined'?ACT?.[0]:'');return}
    if(!detail.pending){groups=[...results.querySelectorAll('.search-group')];queueActive()}
  });
})();
