(function(){
  const shell=document.getElementById('launcherShell'),query=document.getElementById('launcherQuery'),searchWrap=document.getElementById('launcherSearch'),clear=document.getElementById('launcherClear'),quickSections=document.getElementById('launcherQuickSections'),suggestions=document.getElementById('launcherSuggestions'),resultsBox=document.getElementById('launcherResults'),resultList=document.getElementById('launcherResultList'),resultStatus=document.getElementById('launcherResultStatus'),loadMore=document.getElementById('launcherLoadMore'),showAll=document.getElementById('launcherShowAll'),recentBox=document.getElementById('launcherRecent'),recentList=document.getElementById('launcherRecentList'),readerButton=document.getElementById('launcherReader'),fab=document.getElementById('launcherFab');
  if(!shell||!query)return;
  const RECENT_KEY='police-law-launcher-recent-v1',MAX_RESULTS=10,SUGGESTIONS=['Legitymowanie','Zatrzymanie','Kontrola osobista','Przeszukanie','ŚPB','Nietrzeźwy','Przemoc domowa','Nieletni','Ruch drogowy','Narkotyki'];
  const QUICK_SECTIONS=[
    {id:'legitymowanie',label:'Podstawy legitymowania',items:[
      {label:'UoP · A. 15 u. 1 p. 1',target:'uop-art-15-ust-1-pkt-1',fallback:'legitymowanie art 15 ust 1 pkt 1'},
      {label:'PRD · A. 129 u. 2 p. 1',target:'prd-art-129-ust-2-pkt-1',fallback:'art 129 ust 2 pkt 1 policja ustalanie tożsamości'},
      {label:'Cudzoziemcy · A. 289',target:'cudz-art-289',fallback:'cudzoziemcy art 289'},
      {label:'Cudzoziemcy · A. 293',target:'cudz-art-293',fallback:'cudzoziemcy art 293'}
    ]},
    {id:'wykroczenia',label:'Częste wykroczenia',items:[
      {label:'Zakłócanie spokoju',target:'kw-art-51',fallback:'zakłócanie spokoju'},
      {label:'Wprowadzanie w błąd',target:'kw-art-65',fallback:'wprowadza w błąd organ państwowy'},
      {label:'Kradzież',target:'kw-art-119',fallback:'kradzież wykroczenie'},
      {label:'Uszkodzenie mienia',target:'kw-art-124',fallback:'uszkodzenie mienia wykroczenie'},
      {label:'Nieobyczajny wybryk',target:'kw-art-140',fallback:'nieobyczajny wybryk'},
      {label:'Nieprzyzwoite słowa',target:'kw-art-141',fallback:'nieprzyzwoite słowa'},
      {label:'Zaśmiecanie',target:'kw-art-145',fallback:'zaśmiecanie'},
      {label:'Spożywanie alkoholu',target:'alk-art-43s1',fallback:'spożywa napoje alkoholowe wbrew zakazom'},
      {label:'Palenie tytoniu',target:'tyton-art-13',fallback:'pali wyroby tytoniowe wbrew'}
    ]},
    {id:'przestepstwa',label:'Częste przestępstwa',items:[
      {label:'Groźby karalne',target:'kk-art-190',fallback:'groźba karalna'},
      {label:'Uszkodzenie ciała',target:'kk-art-157',fallback:'naruszenie czynności narządu ciała'},
      {label:'Bójka / pobicie',target:'kk-art-158',fallback:'bójka pobicie'},
      {label:'Nietrzeźwy kierujący',target:'kk-art-178a',fallback:'prowadzi pojazd w stanie nietrzeźwości'},
      {label:'Naruszenie nietykalności',target:'kk-art-217',fallback:'narusza nietykalność cielesną'},
      {label:'Znieważenie funkcjonariusza',target:'kk-art-226',fallback:'znieważa funkcjonariusza'},
      {label:'Kradzież',target:'kk-art-278',fallback:'kradzież'},
      {label:'Kradzież z włamaniem',target:'kk-art-279',fallback:'kradzież z włamaniem'},
      {label:'Rozbój',target:'kk-art-280',fallback:'rozbój'},
      {label:'Uszkodzenie mienia',target:'kk-art-288',fallback:'niszczy uszkadza cudzą rzecz'},
      {label:'Narkotyki',target:'nark-art-62',fallback:'posiadanie środków odurzających'}
    ]},
    {id:'prd',label:'Ruch drogowy · PRD',items:[
      {label:'Prędkość · art. 20',target:'prd-art-20',fallback:'prd art 20 prędkość'},
      {label:'Piesi · art. 26',target:'prd-art-26',fallback:'prd art 26 pieszy'},
      {label:'Wypadek · art. 44',target:'prd-art-44',fallback:'prd art 44 wypadek'},
      {label:'Zatrzymanie / postój · art. 46',target:'prd-art-46',fallback:'prd art 46 zatrzymanie postój'},
      {label:'Zakazy postoju · art. 49',target:'prd-art-49',fallback:'prd art 49 zatrzymanie postój'},
      {label:'Kontrola · art. 129',target:'prd-art-129',fallback:'prd art 129 kontrola ruchu drogowego'}
    ]}
  ];
  let router=null,discovery=null,articleById=new Map(),idById=new Map(),actByCode=new Map(),routerPromise=null,discoveryPromise=null,searchTimer=0,opened=false,openSectionId='',resultObserver=null,fabFrame=0,searchSession=null,searchToken=0;
  const norm=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/ł/g,'l').replace(/\s+/g,' ').trim();
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function isDeepLink(){try{const h=decodeURIComponent(location.hash.slice(1));return !!h&&h!=='start'}catch(_){return false}}
  function isOpen(){return !shell.hidden&&shell.getAttribute('aria-hidden')!=='true'}
  function readRecent(){try{const value=JSON.parse(localStorage.getItem(RECENT_KEY)||'[]');return Array.isArray(value)?value.slice(0,4):[]}catch(_){return[]}}
  function writeRecent(list){try{localStorage.setItem(RECENT_KEY,JSON.stringify(list.slice(0,4)))}catch(_){}}
  function remember(id,act,label,sub){
    if(!id||!act)return;const list=readRecent().filter(item=>item.id!==id);list.unshift({id,act,label,sub,at:Date.now()});writeRecent(list);renderRecent();
  }
  function renderRecent(){
    const items=readRecent();recentBox.hidden=!items.length;if(!items.length){recentList.replaceChildren();return}
    recentList.innerHTML=items.map(item=>'<button class="launcher-recent-item" type="button" data-recent="'+esc(item.id)+'"><span><b>'+esc(item.label||item.id)+'</b><small>'+esc(item.sub||item.act)+'</small></span><span>›</span></button>').join('');
  }
  function renderQuickSections(){
    quickSections.innerHTML=QUICK_SECTIONS.map(section=>{
      const open=section.id===openSectionId;
      return '<section class="launcher-quick-section'+(open?' is-open':'')+'" data-quick-section="'+esc(section.id)+'"><button class="launcher-quick-toggle" type="button" aria-expanded="'+String(open)+'"><span>'+esc(section.label)+'</span><span class="launcher-quick-chevron" aria-hidden="true">›</span></button><div class="launcher-quick-body"'+(open?'':' hidden')+'><div class="launcher-quick-chips">'+section.items.map((item,index)=>'<button class="launcher-chip" type="button" data-quick-item="'+esc(section.id)+'" data-quick-index="'+index+'">'+esc(item.label)+'</button>').join('')+'</div></div></section>';
    }).join('');
  }
  function renderSuggestions(){
    if(!suggestions)return;suggestions.innerHTML=SUGGESTIONS.map(value=>'<button class="launcher-chip" type="button" data-suggestion="'+esc(value)+'">'+esc(value)+'</button>').join('');
  }
  function indexRouter(value){
    router=value;articleById=new Map((router?.articles||[]).map(row=>[row[0],row]));idById=new Map((router?.ids||[]).map(row=>[row[0],row]));actByCode=new Map((router?.acts||[]).map(row=>[row[0],row]));return router;
  }
  async function ensureRouter(){
    if(router)return router;if(routerPromise)return routerPromise;
    if(!globalThis.__LAW_DATA?.loadRouter)return null;
    routerPromise=globalThis.__LAW_DATA.loadRouter().then(indexRouter).catch(error=>{console.warn('Launcher routes unavailable',error);return null}).finally(()=>{routerPromise=null});
    return routerPromise;
  }
  async function ensureDiscovery(){
    if(discovery)return discovery;if(discoveryPromise)return discoveryPromise;
    if(!globalThis.__LAW_DATA?.loadDiscovery)return null;
    discoveryPromise=globalThis.__LAW_DATA.loadDiscovery().then(value=>discovery=value).catch(error=>{console.warn('Launcher search unavailable',error);return null}).finally(()=>{discoveryPromise=null});
    return discoveryPromise;
  }
  async function ensureData(){
    const values=await Promise.all([ensureRouter(),ensureDiscovery()]);
    return values[0]&&values[1]?{router:values[0],discovery:values[1]}:null;
  }
  function resultMeta(id){
    const article=articleById.get(id);if(!article)return null;
    const act=actByCode.get(article[1]),cfg=globalThis.__LAW_CONFIG?.acts?.[article[1]]||{};
    return{id,act:article[1],heading:article[3]||'',title:article[4]||'',short:cfg.short||act?.[2]||article[1],actName:cfg.name||act?.[3]||article[1]};
  }
  function scoreResult(row,meta,needle,terms){
    const heading=norm(meta.heading),title=norm(meta.title),act=norm(meta.short+' '+meta.actName),preview=norm(row[2]||''),text=String(row[1]||'');
    let score=0;if(title.includes(needle))score+=80;if(heading.includes(needle))score+=70;if(act.includes(needle))score+=46;if(preview.includes(needle))score+=24;if(text.includes(needle))score+=18;
    for(const term of terms){if(title.includes(term))score+=12;if(heading.includes(term))score+=10;if(act.includes(term))score+=7;if(preview.includes(term))score+=3}
    if(/^art\.?\s*\d+/i.test(needle)&&heading.includes(needle.replace('.','')))score+=30;return score;
  }
  function resultMarkup({row,meta}){return '<button class="launcher-result" type="button" data-result="'+esc(meta.id)+'" data-act="'+esc(meta.act)+'"><span class="launcher-result-head"><b>'+esc(meta.heading+(meta.title?' · '+meta.title:''))+'</b><span class="launcher-result-act">'+esc(meta.short)+'</span></span><span class="launcher-result-title">'+esc(meta.actName)+'</span>'+(row[2]?'<span class="launcher-result-preview">'+esc(row[2])+'</span>':'')+'</button>'}
  function resetSearchSession(){
    searchToken++;searchSession=null;resultObserver?.disconnect?.();if(loadMore)loadMore.hidden=true;
  }
  function observeResultMore(){
    resultObserver?.disconnect?.();if(!loadMore||loadMore.hidden||typeof IntersectionObserver!=='function')return;
    resultObserver=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){resultObserver.disconnect();requestAnimationFrame(()=>scanNextResultPage())}},{root:shell,rootMargin:'0px 0px 220px 0px',threshold:.01});
    resultObserver.observe(loadMore);
  }
  async function scanNextResultPage(){
    const session=searchSession;if(!session||session.loading||session.done)return false;
    session.loading=true;if(loadMore)loadMore.disabled=true;
    const batch=[],rows=discovery||[];let scanned=0;
    try{
      while(session.cursor<rows.length&&batch.length<MAX_RESULTS){
        const row=rows[session.cursor++],meta=resultMeta(row[0]);if(meta){
          const hay=String(row[1]||'')+' '+norm(meta.heading+' '+meta.title+' '+meta.short+' '+meta.actName+' '+(row[2]||''));
          if(session.terms.every(term=>hay.includes(term)))batch.push({row,meta,score:scoreResult(row,meta,session.needle,session.terms)});
        }
        if(++scanned>=240&&batch.length<MAX_RESULTS){scanned=0;await new Promise(resolve=>document.hidden?setTimeout(resolve,0):requestAnimationFrame(resolve));if(searchSession!==session)return false}
      }
      if(searchSession!==session)return false;
      batch.sort((a,b)=>b.score-a.score||a.meta.act.localeCompare(b.meta.act)||a.meta.id.localeCompare(b.meta.id));
      if(batch.length){resultList.insertAdjacentHTML('beforeend',batch.map(resultMarkup).join(''));session.shown+=batch.length}
      session.done=session.cursor>=rows.length;
      resultList.hidden=false;resultStatus.hidden=false;showAll.hidden=false;
      if(!session.shown&&session.done){resultStatus.textContent='Brak szybkich trafień. Możesz sprawdzić pełne wyniki.'}
      else resultStatus.textContent=session.done?'Pokazuję '+session.shown+' trafień':'Pokazuję '+session.shown+' trafień · kolejne będą doczytane przy przewijaniu';
      if(loadMore){loadMore.hidden=session.done;loadMore.disabled=false;loadMore.textContent='Pokaż kolejne 10'}
      if(!session.done)observeResultMore();else resultObserver?.disconnect?.();
      return !!batch.length;
    }finally{
      session.loading=false;if(loadMore)loadMore.disabled=false;
    }
  }
  async function runSearch(){
    const value=query.value.trim(),needle=norm(value);searchWrap.classList.toggle('has-value',!!value);
    if(needle.length<2){resetSearchSession();resultsBox.hidden=true;resultList.replaceChildren();if(suggestions)suggestions.closest('.launcher-suggestions').hidden=false;recentBox.hidden=!readRecent().length;return}
    resetSearchSession();const token=searchToken;
    if(suggestions)suggestions.closest('.launcher-suggestions').hidden=true;recentBox.hidden=true;resultsBox.hidden=false;resultList.hidden=true;resultList.replaceChildren();showAll.hidden=true;resultStatus.hidden=false;resultStatus.textContent='Szukam pierwszych 10 trafień…';
    const ready=await ensureData();if(token!==searchToken||query.value.trim()!==value)return;
    if(!ready){resultStatus.textContent='Nie udało się wczytać szybkiej wyszukiwarki. Możesz użyć pełnych wyników.';showAll.hidden=false;return}
    searchSession={token,value,needle,terms:needle.split(/\s+/).filter(Boolean),cursor:0,shown:0,done:false,loading:false};
    await scanNextResultPage();
  }
  function scheduleSearch(){clearTimeout(searchTimer);searchTimer=setTimeout(runSearch,110)}
  function fullSearch(){
    const value=query.value.trim();if(norm(value).length<2)return;close(false);waitForApp().then(()=>{const q=document.getElementById('q');if(!q)return;q.value=value;try{q.focus({preventScroll:true})}catch(_){q.focus()}q.dispatchEvent(new Event('input',{bubbles:true}))});
  }
  function waitForApp(){
    if(document.querySelector('#actview .act-head')&&typeof globalThis.__POLICE_GOTO_ID==='function')return Promise.resolve();
    return new Promise(resolve=>{let done=false;const finish=()=>{if(done)return;done=true;window.removeEventListener('police-law-rendered',finish);resolve()};window.addEventListener('police-law-rendered',finish,{once:true});setTimeout(finish,3000)});
  }
  function setFabReady(ready){
    if(!fab)return;fab.classList.toggle('is-ready',!!ready);fab.tabIndex=ready?0:-1;fab.setAttribute('aria-hidden',String(!ready));if(ready)scheduleFabPosition();
  }
  function scheduleFabPosition(){if(!fab||isOpen())return;cancelAnimationFrame(fabFrame);fabFrame=requestAnimationFrame(syncFabPosition)}
  function syncFabPosition(){
    fabFrame=0;if(!fab||isOpen())return;const viewportHeight=globalThis.visualViewport?.height||innerHeight,edge=innerWidth-104;let top=viewportHeight;
    document.querySelectorAll('.return.show,.search-return.show,.article-pager,.reader-toast').forEach(node=>{if(node===fab)return;const style=getComputedStyle(node),rect=node.getBoundingClientRect();if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0||rect.width<2||rect.height<2||rect.right<edge||rect.bottom<viewportHeight*.45)return;top=Math.min(top,rect.top)});
    const lift=top<viewportHeight?Math.max(0,viewportHeight-top+10):0,next=lift+'px';if(fab.style.getPropertyValue('--launcher-fab-lift')!==next)fab.style.setProperty('--launcher-fab-lift',next);
  }
  function positionSearchAtTop(){
    if(!isOpen()||document.activeElement!==query)return;shell.classList.add('is-search-mode');const shellBox=shell.getBoundingClientRect(),box=searchWrap.getBoundingClientRect(),topGap=10;const target=Math.max(0,shell.scrollTop+box.top-shellBox.top-topGap);shell.scrollTo({top:target,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  }
  function close(animate=true){
    if(!isOpen())return;opened=false;globalThis.__POLICE_LAUNCHER_BOOT=false;resultObserver?.disconnect?.();document.body.classList.remove('launcher-open');shell.setAttribute('aria-hidden','true');shell.classList.remove('is-search-mode');
    const finish=()=>{shell.hidden=true;shell.classList.remove('is-closing','is-opening-from-fab');setTimeout(()=>setFabReady(true),35)};if(animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches){shell.classList.add('is-closing');setTimeout(finish,190)}else finish();
  }
  function open({focus=false,fromFab=false}={}){
    if(isOpen())return;opened=true;delete document.documentElement.dataset.launcherSkip;shell.classList.add('is-runtime-open');setFabReady(false);globalThis.__POLICE_LAUNCHER_BOOT=true;shell.hidden=false;shell.setAttribute('aria-hidden','false');shell.classList.remove('is-closing','is-search-mode');shell.scrollTop=0;
    if(fromFab&&fab){const rect=fab.getBoundingClientRect();shell.style.setProperty('--launcher-origin-x',(rect.left+rect.width/2)+'px');shell.style.setProperty('--launcher-origin-y',(rect.top+rect.height/2)+'px');shell.classList.remove('is-opening-from-fab');void shell.offsetWidth;shell.classList.add('is-opening-from-fab');setTimeout(()=>shell.classList.remove('is-opening-from-fab'),1650)}
    document.body.classList.add('launcher-open');history.replaceState(null,'','#start');renderRecent();renderQuickSections();if(focus)setTimeout(()=>query.focus(),80);
  }
  async function openTarget(id,actHint='',rememberLabel=''){
    await ensureRouter();const meta=resultMeta(id),route=idById.get(id),act=meta?.act||route?.[1]||actHint;if(!act&&rememberLabel){query.value=rememberLabel;searchWrap.classList.add('has-value');runSearch();return}
    const cfg=globalThis.__LAW_CONFIG?.acts?.[act]||{},label=rememberLabel||meta?.heading||id,sub=meta?.actName||cfg.name||act;if(act)remember(id,act,label,sub);
    globalThis.__POLICE_LAUNCHER_RETURN?.clear?.();close();await waitForApp();await globalThis.__POLICE_GOTO_ID?.(id,{smooth:false,alignTop:true});
  }
  async function openQuickItem(sectionId,index){
    const section=QUICK_SECTIONS.find(item=>item.id===sectionId),item=section?.items?.[Number(index)];if(!item)return;
    await ensureRouter();if(idById.has(item.target)){await openTarget(item.target,'',item.label);return}
    query.value=item.fallback||item.label;searchWrap.classList.add('has-value');runSearch();query.focus();
  }
  renderQuickSections();renderSuggestions();renderRecent();
  query.addEventListener('input',scheduleSearch);query.addEventListener('focus',()=>{positionSearchAtTop();setTimeout(positionSearchAtTop,180);setTimeout(positionSearchAtTop,420)});
  clear.addEventListener('click',()=>{query.value='';runSearch();query.focus()});
  suggestions?.addEventListener('click',event=>{const button=event.target.closest('[data-suggestion]');if(!button)return;query.value=button.dataset.suggestion;searchWrap.classList.add('has-value');runSearch();query.focus()});
  quickSections.addEventListener('click',event=>{
    const toggle=event.target.closest('.launcher-quick-toggle');if(toggle){const section=toggle.closest('[data-quick-section]'),id=section?.dataset.quickSection||'';openSectionId=openSectionId===id?'':id;renderQuickSections();return}
    const item=event.target.closest('[data-quick-item]');if(item)openQuickItem(item.dataset.quickItem,item.dataset.quickIndex);
  });
  resultList.addEventListener('click',event=>{const button=event.target.closest('[data-result]');if(button)openTarget(button.dataset.result,button.dataset.act)});loadMore?.addEventListener('click',scanNextResultPage);
  recentList.addEventListener('click',event=>{const button=event.target.closest('[data-recent]');if(!button)return;const item=readRecent().find(x=>x.id===button.dataset.recent);if(item)openTarget(item.id,item.act,item.label)});
  showAll.addEventListener('click',fullSearch);readerButton.addEventListener('click',()=>close());fab?.addEventListener('click',()=>open({fromFab:true}));
  shell.addEventListener('keydown',event=>{if(event.key==='Escape')close()});
  document.getElementById('home')?.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();globalThis.__POLICE_SEARCH_CLEAR?.();open()},{capture:true});
  window.addEventListener('police-law-rendered',event=>{if(isOpen())return;setTimeout(()=>{const act=event.detail?.act||'',hash=decodeURIComponent(location.hash.slice(1));if(!act||!hash||hash==='start')return;const meta=resultMeta(hash);if(meta)remember(hash,act,meta.heading+(meta.title?' · '+meta.title:''),meta.actName)},0)});
  globalThis.__POLICE_LAUNCHER_OPEN=options=>open(options||{});
  globalThis.__POLICE_LAUNCHER_CLOSE=()=>close();
  const standalone=document.documentElement.dataset.pwaStandalone==='1'||window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true;
  const initial=standalone||(document.documentElement.dataset.launcherSkip!=='1'&&!isDeepLink());
  if(initial){delete document.documentElement.dataset.launcherSkip;shell.classList.add('is-runtime-open');globalThis.__POLICE_LAUNCHER_BOOT=true;shell.hidden=false;shell.setAttribute('aria-hidden','false');document.body.classList.add('launcher-open');opened=true;setFabReady(false);history.replaceState(null,'','#start')}else{shell.hidden=true;shell.setAttribute('aria-hidden','true');requestAnimationFrame(()=>setFabReady(true))}
  const fabObserver=new MutationObserver(scheduleFabPosition);fabObserver.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','hidden','style']});window.addEventListener('resize',scheduleFabPosition,{passive:true});globalThis.visualViewport?.addEventListener?.('resize',()=>{scheduleFabPosition();if(document.activeElement===query)setTimeout(positionSearchAtTop,40)},{passive:true});
  const warm=()=>ensureRouter();if('requestIdleCallback'in window)requestIdleCallback(warm,{timeout:1600});else setTimeout(warm,500);
})();