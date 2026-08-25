(function(){
  let drawer=null,backdrop=null,articleList=null,actsBox=null,headSub=null,toast=null;
  let touchStart=null,toastTimer=null,scrollTick=false,lastActCode=null;

  function appReady(){
    try{return Array.isArray(DATA)&&DATA.length>0&&ACT&&ACT[0]&&typeof renderAct==='function'&&typeof jump==='function'}catch(_){return false}
  }
  function metaFor(code){
    try{return META[code]||[code,actBy(code)?.[1]||code,'']}catch(_){return[code,code,'']}
  }
  function currentArticleIndex(){
    if(!ACT||!ACT[3]?.length)return 0;
    const nodes=[...document.querySelectorAll('#actview .legal-unit')];
    if(!nodes.length)return 0;
    const top=(document.querySelector('.top')?.getBoundingClientRect().bottom||0)+12;
    let closest=0,best=Infinity;
    for(let i=0;i<nodes.length;i++){
      const r=nodes[i].getBoundingClientRect();
      if(r.top<=top&&r.bottom>top)return i;
      const d=Math.abs(r.top-top);
      if(d<best){best=d;closest=i}
    }
    return closest;
  }
  function currentArticleId(){
    if(!ACT||!ACT[3]?.length)return null;
    return ACT[3][Math.min(currentArticleIndex(),ACT[3].length-1)]?.[0]||null;
  }
  function showToast(text){
    if(!toast)return;
    toast.textContent=text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>toast.classList.remove('show'),1050);
  }
  function goArticle(step){
    if(!ACT||!ACT[3]?.length)return;
    const idx=currentArticleIndex();
    const next=idx+step;
    if(next<0){showToast('To pierwszy artykuł');return}
    if(next>=ACT[3].length){showToast('To ostatni artykuł');return}
    const R=ACT[3][next];
    results?.classList.remove('show');
    closeDrawer();
    history.replaceState(null,'','#'+R[0]);
    jump(R[0],true);
    showToast(`${step>0?'→':'←'} ${R[2]} · ${R[3]||''}`);
    setTimeout(highlightCurrent,420);
  }
  function highlightCurrent(){
    if(!drawer||!articleList)return;
    const id=currentArticleId();
    articleList.querySelectorAll('.drawer-article').forEach(a=>a.classList.toggle('active',a.dataset.id===id));
    if(drawer.classList.contains('open')){
      const active=articleList.querySelector('.drawer-article.active');
      if(active)active.scrollIntoView({block:'nearest'});
    }
  }
  function populateDrawer(){
    if(!appReady()||!drawer)return;
    const m=metaFor(ACT[0]);
    headSub.textContent=m[1];
    actsBox.innerHTML='';
    for(const A of DATA){
      const mm=metaFor(A[0]);
      const b=document.createElement('button');
      b.className='drawer-act'+(A[0]===ACT[0]?' on':'');
      b.type='button';b.textContent=mm[0];b.title=mm[1];
      b.onclick=()=>{
        renderAct(A[0],null,false);
        setTimeout(()=>{populateDrawer();highlightCurrent()},60);
      };
      actsBox.appendChild(b);
    }
    articleList.innerHTML='';
    for(const R of ACT[3]){
      const a=document.createElement('a');
      a.className='drawer-article';a.href='#'+R[0];a.dataset.id=R[0];
      a.innerHTML=`<span class="da-num">${esc(R[2])}</span><span class="da-topic">${esc(R[3]||'')}</span>`;
      a.onclick=e=>{
        e.preventDefault();
        closeDrawer();
        history.replaceState(null,'','#'+R[0]);
        jump(R[0],true);
        setTimeout(highlightCurrent,420);
      };
      articleList.appendChild(a);
    }
    lastActCode=ACT[0];
    highlightCurrent();
  }
  function openDrawer(){
    if(!drawer)return;
    populateDrawer();
    drawer.classList.add('open');backdrop.classList.add('open');document.body.classList.add('drawer-open');
    drawer.setAttribute('aria-hidden','false');
    setTimeout(highlightCurrent,40);
  }
  function closeDrawer(){
    if(!drawer)return;
    drawer.classList.remove('open');backdrop.classList.remove('open');document.body.classList.remove('drawer-open');
    drawer.setAttribute('aria-hidden','true');
  }
  function build(){
    if(document.getElementById('hamburger'))return;
    const topline=document.querySelector('.topline');
    if(!topline)return;
    const btn=document.createElement('button');
    btn.id='hamburger';btn.className='hamburger';btn.type='button';btn.setAttribute('aria-label','Otwórz menu');
    btn.innerHTML='<span></span><span></span><span></span>';
    btn.onclick=openDrawer;
    topline.prepend(btn);

    backdrop=document.createElement('div');backdrop.className='drawer-backdrop';backdrop.onclick=closeDrawer;
    drawer=document.createElement('aside');drawer.className='drawer';drawer.setAttribute('aria-hidden','true');
    drawer.innerHTML=`<div class="drawer-head"><div class="drawer-head-text"><b>Nawigacja</b><small id="drawerHeadSub"></small></div><button class="drawer-close" type="button" aria-label="Zamknij">×</button></div><div class="drawer-scroll"><section class="drawer-section"><div class="drawer-label">Akty prawne</div><div class="drawer-acts" id="drawerActs"></div></section><section class="drawer-section"><div class="drawer-label">Artykuły / paragrafy</div><div class="drawer-article-list" id="drawerArticles"></div></section></div>`;
    toast=document.createElement('div');toast.className='swipe-toast';toast.setAttribute('aria-live','polite');
    document.body.append(backdrop,drawer,toast);
    drawer.querySelector('.drawer-close').onclick=closeDrawer;
    actsBox=drawer.querySelector('#drawerActs');articleList=drawer.querySelector('#drawerArticles');headSub=drawer.querySelector('#drawerHeadSub');
    populateDrawer();

    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer()});
    const mo=new MutationObserver(()=>{
      if(!appReady())return;
      if(ACT[0]!==lastActCode){lastActCode=ACT[0];if(drawer.classList.contains('open'))populateDrawer()}
    });
    const view=document.getElementById('actview');if(view)mo.observe(view,{childList:true});
    window.addEventListener('scroll',()=>{
      if(scrollTick)return;scrollTick=true;
      requestAnimationFrame(()=>{scrollTick=false;if(drawer?.classList.contains('open'))highlightCurrent()});
    },{passive:true});

    document.addEventListener('touchstart',e=>{
      if(e.touches.length!==1||drawer.classList.contains('open')){touchStart=null;return}
      const t=e.target;
      if(t.closest('input,button,a,summary,.quickbar,.navrefs,.drawer')){touchStart=null;return}
      const p=e.touches[0];
      touchStart={x:p.clientX,y:p.clientY,time:Date.now(),edge:p.clientX<28||p.clientX>window.innerWidth-28,axis:null,lastX:p.clientX};
    },{passive:true});

    document.addEventListener('touchmove',e=>{
      if(!touchStart||e.touches.length!==1||touchStart.edge)return;
      const p=e.touches[0],dx=p.clientX-touchStart.x,dy=p.clientY-touchStart.y;
      if(!touchStart.axis&&Math.max(Math.abs(dx),Math.abs(dy))>16){
        if(Math.abs(dx)>Math.abs(dy)*1.18)touchStart.axis='x';
        else if(Math.abs(dy)>Math.abs(dx)*1.05)touchStart.axis='y';
      }
      if(touchStart.axis==='x'){
        e.preventDefault();
        touchStart.lastX=p.clientX;
      }
    },{passive:false});

    document.addEventListener('touchend',e=>{
      if(!touchStart||!e.changedTouches.length)return;
      const p=e.changedTouches[0],dx=p.clientX-touchStart.x,dy=p.clientY-touchStart.y,dt=Date.now()-touchStart.time,edge=touchStart.edge,axis=touchStart.axis;
      touchStart=null;
      if(edge||axis==='y'||dt>950||Math.abs(dx)<58||Math.abs(dx)<Math.abs(dy)*1.2)return;
      goArticle(dx<0?1:-1);
    },{passive:true});
    document.addEventListener('touchcancel',()=>{touchStart=null},{passive:true});

    let ds=null;
    drawer.addEventListener('touchstart',e=>{if(e.touches.length===1){const p=e.touches[0];ds={x:p.clientX,y:p.clientY}}},{passive:true});
    drawer.addEventListener('touchend',e=>{if(!ds||!e.changedTouches.length)return;const p=e.changedTouches[0],dx=p.clientX-ds.x,dy=p.clientY-ds.y;ds=null;if(dx<-60&&Math.abs(dx)>Math.abs(dy)*1.3)closeDrawer()},{passive:true});
  }
  function wait(){if(appReady())build();else setTimeout(wait,80)}
  wait();
})();
