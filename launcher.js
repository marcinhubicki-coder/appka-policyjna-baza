(function(){
  const shell=document.getElementById('launcherShell'),panel=shell?.querySelector('.launcher-panel'),query=document.getElementById('launcherQuery'),searchWrap=document.getElementById('launcherSearch'),clear=document.getElementById('launcherClear'),quickSections=document.getElementById('launcherQuickSections'),suggestions=document.getElementById('launcherSuggestions'),resultsBox=document.getElementById('launcherResults'),resultList=document.getElementById('launcherResultList'),resultStatus=document.getElementById('launcherResultStatus'),loadMore=document.getElementById('launcherLoadMore'),showAll=document.getElementById('launcherShowAll'),recentBox=document.getElementById('launcherRecent'),recentList=document.getElementById('launcherRecentList'),readerButton=document.getElementById('launcherReader'),fab=document.getElementById('launcherFab');
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
      {label:'Zakłócanie spokoju',target:'kw-art-51',fallback:'kw art 51'},
      {label:'Wprowadzanie w błąd',target:'kw-art-65',fallback:'kw art 65'},
      {label:'Niewykonanie polecenia',target:'kw-art-65a',fallback:'kw art 65a'},
      {label:'Zagrożenie w ruchu',target:'kw-art-86',fallback:'kw art 86'},
      {label:'Jazda po alkoholu',target:'kw-art-87',fallback:'kw art 87'},
      {label:'Jazda bez oświetlenia',target:'kw-art-88',fallback:'kw art 88'},
      {label:'Znaki i polecenia',target:'kw-art-92',fallback:'kw art 92'},
      {label:'Inne przepisy ruchu',target:'kw-art-97',fallback:'kw art 97'},
      {label:'Kradzież / przywłaszczenie',target:'kw-art-119',fallback:'kw art 119'},
      {label:'Uszkodzenie rzeczy',target:'kw-art-124',fallback:'kw art 124'},
      {label:'Nieobyczajny wybryk',target:'kw-art-140',fallback:'kw art 140'},
      {label:'Nieprzyzwoite treści',target:'kw-art-141',fallback:'kw art 141'},
      {label:'Zaśmiecanie',target:'kw-art-145',fallback:'kw art 145'}
    ],moreItems:[
      {label:'Fałszywy alarm',target:'kw-art-66',fallback:'kw art 66'},
      {label:'Naruszenie nakazu / zakazu',target:'kw-art-66b',fallback:'kw art 66b'},
      {label:'Brak zabezpieczenia miejsca',target:'kw-art-72',fallback:'kw art 72'},
      {label:'Brak uprawnień',target:'kw-art-94',fallback:'kw art 94'},
      {label:'Brak dokumentów',target:'kw-art-95',fallback:'kw art 95'},
      {label:'Niewłaściwy nadzór',target:'kw-art-106',fallback:'kw art 106'},
      {label:'Złośliwe niepokojenie',target:'kw-art-107',fallback:'kw art 107'},
      {label:'Wyłudzenie świadczenia',target:'kw-art-121',fallback:'kw art 121'},
      {label:'Paserstwo',target:'kw-art-122',fallback:'kw art 122'},
      {label:'Znaleziona rzecz / zwierzę',target:'kw-art-125',fallback:'kw art 125'},
      {label:'Urządzenia publiczne',target:'kw-art-143',fallback:'kw art 143'},
      {label:'Niszczenie zieleni',target:'kw-art-144',fallback:'kw art 144'}
    ]},
    {id:'przestepstwa',label:'Częste przestępstwa',items:[
      {label:'Uszkodzenie ciała',target:'kk-art-157',fallback:'kk art 157'},
      {label:'Bójka / pobicie',target:'kk-art-158',fallback:'kk art 158'},
      {label:'Nietrzeźwy kierujący',target:'kk-art-178a',fallback:'kk art 178a'},
      {label:'Groźby karalne',target:'kk-art-190',fallback:'kk art 190'},
      {label:'Stalking',target:'kk-art-190a',fallback:'kk art 190a'},
      {label:'Zmuszanie',target:'kk-art-191',fallback:'kk art 191'},
      {label:'Mir domowy',target:'kk-art-193',fallback:'kk art 193'},
      {label:'Znęcanie',target:'kk-art-207',fallback:'kk art 207'},
      {label:'Naruszenie nietykalności',target:'kk-art-217',fallback:'kk art 217'},
      {label:'Nietykalność funkcjonariusza',target:'kk-art-222',fallback:'kk art 222'},
      {label:'Czynna napaść',target:'kk-art-223',fallback:'kk art 223'},
      {label:'Znieważenie funkcjonariusza',target:'kk-art-226',fallback:'kk art 226'},
      {label:'Kradzież',target:'kk-art-278',fallback:'kk art 278'},
      {label:'Kradzież z włamaniem',target:'kk-art-279',fallback:'kk art 279'},
      {label:'Rozbój',target:'kk-art-280',fallback:'kk art 280'},
      {label:'Oszustwo',target:'kk-art-286',fallback:'kk art 286'},
      {label:'Zniszczenie mienia',target:'kk-art-288',fallback:'kk art 288'}
    ],moreItems:[
      {label:'Zabójstwo',target:'kk-art-148',fallback:'kk art 148'},
      {label:'Ciężki uszczerbek',target:'kk-art-156',fallback:'kk art 156'},
      {label:'Broń w bójce / pobiciu',target:'kk-art-159',fallback:'kk art 159'},
      {label:'Narażenie na niebezpieczeństwo',target:'kk-art-160',fallback:'kk art 160'},
      {label:'Jazda mimo cofnięcia uprawnień',target:'kk-art-180a',fallback:'kk art 180a'},
      {label:'Zgwałcenie',target:'kk-art-197',fallback:'kk art 197'},
      {label:'Rozpijanie małoletniego',target:'kk-art-208',fallback:'kk art 208'},
      {label:'Nietykalność interweniującego',target:'kk-art-217a',fallback:'kk art 217a'},
      {label:'Fałszywy alarm',target:'kk-art-224a',fallback:'kk art 224a'},
      {label:'Fałszywe zeznania',target:'kk-art-233',fallback:'kk art 233'},
      {label:'Fałszywe oskarżenie',target:'kk-art-234',fallback:'kk art 234'},
      {label:'Fałszywe zawiadomienie',target:'kk-art-238',fallback:'kk art 238'},
      {label:'Poplecznictwo',target:'kk-art-239',fallback:'kk art 239'},
      {label:'Kradzież rozbójnicza',target:'kk-art-281',fallback:'kk art 281'},
      {label:'Wymuszenie rozbójnicze',target:'kk-art-282',fallback:'kk art 282'},
      {label:'Przywłaszczenie',target:'kk-art-284',fallback:'kk art 284'},
      {label:'Zabór pojazdu',target:'kk-art-289',fallback:'kk art 289'}
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
  let router=null,discovery=null,articleById=new Map(),idById=new Map(),actByCode=new Map(),routerPromise=null,discoveryPromise=null,searchTimer=0,opened=false,openSectionId='',resultObserver=null,fabFrame=0,searchSession=null,searchToken=0,openMoreSectionIds=new Set(),fabRevealAnimation=null,exitRevealFrame=0,transitionGlass=null,fabIconFadeTimer=0,fabDismissTimer=0,navigationBusy=false;
  const norm=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/ł/g,'l').replace(/\s+/g,' ').trim();
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function isDeepLink(){try{const h=decodeURIComponent(location.hash.slice(1));return !!h&&h!=='start'}catch(_){return false}}
  function isOpen(){return opened}
  function readRecent(){try{const value=JSON.parse(localStorage.getItem(RECENT_KEY)||'[]');return Array.isArray(value)?value.slice(0,4):[]}catch(_){return[]}}
  function writeRecent(list){try{localStorage.setItem(RECENT_KEY,JSON.stringify(list.slice(0,4)))}catch(_){}}
  function remember(id,act,label,sub){
    if(!id||!act)return;const list=readRecent().filter(item=>item.id!==id);list.unshift({id,act,label,sub,at:Date.now()});writeRecent(list);renderRecent();
  }
  function renderRecent(){
    const items=readRecent();recentBox.hidden=!items.length;if(!items.length){recentList.replaceChildren();return}
    recentList.innerHTML=items.map(item=>'<button class="launcher-recent-item" type="button" data-recent="'+esc(item.id)+'"><span><b>'+esc(item.label||item.id)+'</b><small>'+esc(item.sub||item.act)+'</small></span><span>›</span></button>').join('');
  }
  function quickArticleNumber(item){const match=String(item?.target||'').match(/-art-([0-9]+[a-z]?)/i);return match?.[1]||''}
  function quickItemLabel(item){return item?.label||''}
  function quickChip(item,sectionId,index,moreIndex=-1){
    const extra=moreIndex>=0?' is-more-item':'',style=moreIndex>=0?' style="--quick-in:'+moreIndex+'"':'';
    return '<button class="launcher-chip'+extra+'" type="button" data-quick-item="'+esc(sectionId)+'" data-quick-index="'+index+'"'+style+'>'+esc(quickItemLabel(item))+'</button>'
  }
  function moreControl(sectionId,expanded){return '<button class="launcher-quick-more" type="button" data-quick-more="'+esc(sectionId)+'" aria-expanded="'+String(expanded)+'">'+(expanded?'Schowaj':'Pokaż więcej')+'</button>'}
  function moreControlNode(sectionId,expanded){const template=document.createElement('template');template.innerHTML=moreControl(sectionId,expanded);return template.content.firstElementChild}
  function renderQuickSections(){
    quickSections.innerHTML=QUICK_SECTIONS.map(section=>{
      const open=section.id===openSectionId,moreOpen=openMoreSectionIds.has(section.id),primary=section.items.map((item,index)=>quickChip(item,section.id,index)).join('');
      const more=(section.moreItems||[]).map((item,index)=>quickChip(item,section.id,section.items.length+index,index)).join('');
      const morePart=section.moreItems?.length?(moreOpen?'<div class="launcher-quick-extra-pack" data-quick-extra-pack><div class="launcher-quick-chips launcher-quick-extra-chips">'+more+moreControl(section.id,true)+'</div></div>':moreControl(section.id,false)):'';
      return '<section class="launcher-quick-section'+(open?' is-open':'')+'" data-quick-section="'+esc(section.id)+'"><button class="launcher-quick-toggle" type="button" aria-expanded="'+String(open)+'"><span>'+esc(section.label)+'</span><span class="launcher-quick-chevron" aria-hidden="true">›</span></button><div class="launcher-quick-body" aria-hidden="'+String(!open)+'"><div class="launcher-quick-body-inner"><div class="launcher-quick-chips">'+primary+morePart+'</div></div></div></section>';
    }).join('');
  }
  function quickSectionNode(id){return [...quickSections.querySelectorAll('[data-quick-section]')].find(node=>node.dataset.quickSection===id)||null}
  function animateQuickMore(id){
    const section=quickSectionNode(id),config=QUICK_SECTIONS.find(item=>item.id===id),wasOpen=openMoreSectionIds.has(id),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;if(!section||!config?.moreItems?.length)return;
    if(!wasOpen){
      const control=section.querySelector('[data-quick-more]');if(!control)return;
      const pack=document.createElement('div');pack.className='launcher-quick-extra-pack';pack.dataset.quickExtraPack='';
      pack.innerHTML='<div class="launcher-quick-chips launcher-quick-extra-chips">'+config.moreItems.map((item,index)=>quickChip(item,id,config.items.length+index,index)).join('')+moreControl(id,true)+'</div>';
      openMoreSectionIds.add(id);control.replaceWith(pack);
      if(reduced)return;
      const target=pack.firstElementChild?.scrollHeight||0;pack.style.height='0px';pack.style.opacity='0';pack.style.overflow='hidden';
      const animation=pack.animate([{height:'0px',opacity:0},{height:target+'px',opacity:1}],{duration:360,easing:'cubic-bezier(.22,.68,.24,1)'});
      animation.onfinish=()=>{pack.style.height='auto';pack.style.opacity='';pack.style.overflow=''};
      return
    }
    const pack=section.querySelector('[data-quick-extra-pack]');if(!pack)return;
    if(reduced){openMoreSectionIds.delete(id);pack.replaceWith(moreControlNode(id,false));return}
    const start=pack.getBoundingClientRect().height;pack.style.height=start+'px';pack.style.overflow='hidden';
    pack.querySelectorAll('.launcher-chip.is-more-item').forEach(node=>node.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-5px)'}],{duration:240,easing:'cubic-bezier(.4,0,.3,1)',fill:'forwards'}));
    pack.querySelector('[data-quick-more]')?.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-4px)'}],{duration:220,easing:'cubic-bezier(.4,0,.3,1)',fill:'forwards'});
    const animation=pack.animate([{height:start+'px',opacity:1},{height:'0px',opacity:.12}],{duration:300,easing:'cubic-bezier(.4,0,.22,1)',fill:'forwards'});
    animation.onfinish=()=>{openMoreSectionIds.delete(id);pack.replaceWith(moreControlNode(id,false))};
  }
  function animateQuickSection(section,opening){
    const body=section?.querySelector('.launcher-quick-body'),toggle=section?.querySelector('.launcher-quick-toggle');if(!body||!toggle)return;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;body.getAnimations().forEach(animation=>animation.cancel());
    const start=body.getBoundingClientRect().height;toggle.setAttribute('aria-expanded',String(opening));body.setAttribute('aria-hidden',String(!opening));
    if(reduced){section.classList.toggle('is-open',opening);body.style.height=opening?'auto':'0px';body.style.opacity='';return}
    if(opening){section.classList.add('is-open');body.style.height='auto';const end=body.scrollHeight;body.style.height=start+'px';const animation=body.animate([{height:start+'px',opacity:start?1:0},{height:end+'px',opacity:1}],{duration:360,easing:'cubic-bezier(.22,.68,.24,1)'});animation.onfinish=()=>{body.style.height='auto';body.style.opacity=''}}
    else{body.style.height=start+'px';const animation=body.animate([{height:start+'px',opacity:1},{height:'0px',opacity:0}],{duration:320,easing:'cubic-bezier(.4,0,.22,1)'});animation.onfinish=()=>{section.classList.remove('is-open');body.style.height='0px';body.style.opacity=''}}
  }
  function renderSuggestions(){
    if(!suggestions)return;suggestions.innerHTML=SUGGESTIONS.map(value=>'<button class="launcher-chip" type="button" data-suggestion="'+esc(value)+'">'+esc(value)+'</button>').join('');
  }
  function indexRouter(value){
    router=value;articleById=new Map((router?.articles||[]).map(row=>[row[0],row]));idById=new Map((router?.ids||[]).map(row=>[row[0],row]));actByCode=new Map((router?.acts||[]).map(row=>[row[0],row]));renderQuickSections();return router;
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
      resultList.hidden=false;resultStatus.hidden=false;showAll.hidden=false;recentBox.hidden=!readRecent().length;
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
    if(suggestions)suggestions.closest('.launcher-suggestions').hidden=true;recentBox.hidden=!readRecent().length;resultsBox.hidden=false;resultList.hidden=true;resultList.replaceChildren();showAll.hidden=true;resultStatus.hidden=false;resultStatus.textContent='Szukam pierwszych 10 trafień…';
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
  function clearFabLaunch(){
    clearTimeout(fabIconFadeTimer);clearTimeout(fabDismissTimer);fabIconFadeTimer=0;fabDismissTimer=0;
    if(!fab)return;fab.classList.remove('is-launching','is-icon-fading');
  }
  function beginFabLaunch(){
    if(!fab)return;clearFabLaunch();fab.classList.add('is-ready','is-launching');fab.tabIndex=-1;fab.setAttribute('aria-hidden','true');
    fabIconFadeTimer=setTimeout(()=>fab?.classList.add('is-icon-fading'),300);
    fabDismissTimer=setTimeout(()=>{if(!fab)return;fab.classList.remove('is-launching','is-icon-fading');setFabReady(false)},720);
  }
  function setFabReady(ready){
    if(!fab)return;if(ready)clearFabLaunch();fab.classList.toggle('is-ready',!!ready);fab.tabIndex=ready?0:-1;fab.setAttribute('aria-hidden',String(!ready));if(ready)scheduleFabPosition();
  }
  function scheduleFabPosition(){if(!fab||isOpen())return;cancelAnimationFrame(fabFrame);fabFrame=requestAnimationFrame(syncFabPosition)}
  function syncFabPosition(){
    fabFrame=0;if(!fab||isOpen())return;
    const vv=globalThis.visualViewport,viewportBottom=(vv?.offsetTop||0)+(vv?.height||innerHeight),edge=innerWidth-104,currentLift=parseFloat(fab.style.getPropertyValue('--launcher-fab-lift'))||0,fabRect=fab.getBoundingClientRect(),baseBottom=Math.max(0,viewportBottom-fabRect.bottom-currentLift);let top=viewportBottom;
    document.querySelectorAll('.return.show,.search-return.show,.article-pager,.reader-toast').forEach(node=>{if(node===fab)return;const style=getComputedStyle(node),rect=node.getBoundingClientRect();if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0||rect.width<2||rect.height<2||rect.right<edge||rect.bottom<viewportBottom*.45)return;top=Math.min(top,rect.top)});
    const lift=top<viewportBottom?Math.max(0,viewportBottom-top+8-baseBottom):0,next=lift+'px';if(fab.style.getPropertyValue('--launcher-fab-lift')!==next)fab.style.setProperty('--launcher-fab-lift',next);
  }
  function positionSearchAtTop(){
    if(!isOpen()||document.activeElement!==query)return;shell.classList.add('is-search-mode');const shellBox=shell.getBoundingClientRect(),box=searchWrap.getBoundingClientRect(),topGap=10;const target=Math.max(0,shell.scrollTop+box.top-shellBox.top-topGap);shell.scrollTo({top:target,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  }
  function clickPoint(event,node){
    const rect=node?.getBoundingClientRect?.(),x=Number(event?.clientX),y=Number(event?.clientY);
    return{x:Number.isFinite(x)&&x>0?x:(rect?rect.left+rect.width/2:innerWidth/2),y:Number.isFinite(y)&&y>0?y:(rect?rect.top+rect.height/2:innerHeight/2)}
  }
  function freezeReader(on){
    globalThis.__READER_STATE?.lock?.('launcher',!!on);
    document.documentElement.classList.toggle('launcher-open-root',!!on);
  }
  function waitForTargetStable(id,timeout=760){
    return new Promise(resolve=>{
      const started=performance.now(),view=document.getElementById('actview');let stable=0,last='',frame=0,dirty=false;
      const observer=view?new MutationObserver(()=>{dirty=true;stable=0}):null;observer?.observe(view,{childList:true,subtree:true});
      const finish=()=>{cancelAnimationFrame(frame);observer?.disconnect();resolve()};
      function tick(){
        const node=document.getElementById(id),rect=node?.getBoundingClientRect?.(),state=node?[Math.round(rect.top*2)/2,Math.round(rect.height*2)/2,Math.round(scrollY*2)/2,document.documentElement.scrollHeight].join('|'):'';
        if(node&&!dirty&&state===last&&!globalThis.__READER_STATE?.busy)stable++;else stable=0;
        dirty=false;last=state;
        if(stable>=5||performance.now()-started>=timeout){finish();return}
        frame=requestAnimationFrame(tick);
      }
      frame=requestAnimationFrame(tick);
    });
  }
  function launcherSnapshot(target=null){
    const searchFocused=searchWrap?.matches?.(':focus-within'),clone=shell.cloneNode(true);clone.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));clone.removeAttribute('id');clone.classList.remove('is-parked','is-opening-from-fab','is-fab-expanded','is-revealing-reader','is-search-mode');clone.classList.add('launcher-transition-snapshot');clone.setAttribute('aria-hidden','true');clone.style.clipPath='';clone.style.webkitClipPath='';clone.style.opacity='1';clone.style.visibility='visible';clone.style.pointerEvents='auto';clone.style.touchAction='none';if(searchFocused)clone.querySelector('.launcher-search-box')?.classList.add('is-snapshot-focused');clone.__launcherCapturedAt=performance.now();document.body.append(clone);clone.scrollTop=shell.scrollTop;
    if(target){const key=launchTargetKey(target),mirror=[...clone.querySelectorAll('[data-quick-item],[data-result],[data-recent]')].find(node=>launchTargetKey(node)===key);mirror?.classList.add('is-launching')}
    void clone.offsetWidth;return clone;
  }
  function launchTargetKey(node){
    if(!node)return'';if(node.dataset.quickItem)return'quick:'+node.dataset.quickItem+':'+node.dataset.quickIndex;if(node.dataset.result)return'result:'+node.dataset.result;if(node.dataset.recent)return'recent:'+node.dataset.recent;return'';
  }
  function beginNavigation(target){
    if(navigationBusy)return null;navigationBusy=true;return launcherSnapshot(target);
  }
  function endNavigation(){navigationBusy=false}
  function ensureTransitionGlass(){
    if(transitionGlass?.isConnected)return transitionGlass;
    transitionGlass=document.createElement('div');transitionGlass.className='launcher-transition-glass';transitionGlass.setAttribute('aria-hidden','true');document.body.append(transitionGlass);return transitionGlass;
  }
  function clearExitMask(){
    cancelAnimationFrame(exitRevealFrame);exitRevealFrame=0;
    shell.style.removeProperty('-webkit-mask-image');shell.style.removeProperty('mask-image');shell.style.removeProperty('-webkit-mask-repeat');shell.style.removeProperty('mask-repeat');shell.classList.remove('is-revealing-reader');
    if(transitionGlass){transitionGlass.classList.remove('is-visible');transitionGlass.style.width='0px';transitionGlass.style.height='0px'}
  }
  function revealReader(point,surface=shell){
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return Promise.resolve();
    return new Promise(resolve=>{
      const x=Math.max(0,Math.min(innerWidth,point?.x??innerWidth/2)),y=Math.max(0,Math.min(innerHeight,point?.y??innerHeight/2)),maxX=Math.max(x,innerWidth-x),maxY=Math.max(y,innerHeight-y),radius=Math.hypot(maxX,maxY)+44,duration=760,started=performance.now(),glass=ensureTransitionGlass(),feather=22;
      surface.classList.add('is-revealing-reader');glass.style.left=x+'px';glass.style.top=y+'px';glass.classList.add('is-visible');
      function paint(r){
        const mask='radial-gradient(circle at '+x+'px '+y+'px,transparent 0 '+Math.max(0,r-feather)+'px,rgba(0,0,0,.22) '+Math.max(0,r-feather*.55)+'px,#000 '+r+'px 100%)';
        surface.style.webkitMaskImage=mask;surface.style.maskImage=mask;surface.style.webkitMaskRepeat='no-repeat';surface.style.maskRepeat='no-repeat';
        const size=Math.max(18,r*2);glass.style.width=size+'px';glass.style.height=size+'px';glass.style.opacity=String(Math.max(0,.82-r/radius*.62));
      }
      paint(0);
      function tick(now){const t=Math.min(1,(now-started)/duration),smooth=t*t*(3-2*t),ease=t*.34+smooth*.66;paint(radius*ease);if(t<1)exitRevealFrame=requestAnimationFrame(tick);else{exitRevealFrame=0;glass.classList.remove('is-visible');resolve()}}
      exitRevealFrame=requestAnimationFrame(tick);
    });
  }
  function restoreLauncherView(){
    fabRevealAnimation?.cancel?.();fabRevealAnimation=null;clearExitMask();
    shell.hidden=false;
    shell.classList.remove('is-closing','is-search-mode','is-fab-expanded','is-opening-from-fab','is-revealing-reader');
    shell.style.clipPath='';shell.style.webkitClipPath='';shell.style.opacity='';shell.style.transform='';
    shell.scrollTop=0;
  }
  function parkLauncher(){
    clearFabLaunch();fabRevealAnimation?.cancel?.();fabRevealAnimation=null;clearExitMask();
    shell.style.clipPath='';shell.style.webkitClipPath='';shell.style.opacity='';shell.style.transform='';
    shell.classList.remove('is-closing','is-opening-from-fab','is-fab-expanded','is-search-mode','is-revealing-reader');
    shell.classList.add('is-parked');shell.setAttribute('aria-hidden','true');document.body.classList.remove('launcher-open');document.documentElement.classList.remove('launcher-open-root');
  }
  function close(animate=true){
    if(!isOpen())return;opened=false;globalThis.__POLICE_LAUNCHER_BOOT=false;resultObserver?.disconnect?.();query.blur();shell.setAttribute('aria-hidden','true');
    const finish=()=>{parkLauncher();freezeReader(false);setTimeout(()=>setFabReady(true),35)};if(animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches){shell.classList.add('is-closing');setTimeout(finish,190)}else finish();
  }
  function open({focus=false,fromFab=false}={}){
    if(isOpen())return;
    const fabRect=fromFab&&fab?fab.getBoundingClientRect():null;
    opened=true;delete document.documentElement.dataset.launcherSkip;shell.classList.add('is-runtime-open');globalThis.__POLICE_LAUNCHER_BOOT=true;
    freezeReader(true);restoreLauncherView();renderRecent();renderQuickSections();
    const animateFromFab=!!fabRect&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(animateFromFab)beginFabLaunch();else setFabReady(false);
    if(animateFromFab){
      const x=fabRect.left+fabRect.width/2,y=fabRect.top+fabRect.height/2,start='circle(32px at '+x+'px '+y+'px)',mid='circle(18vmax at '+x+'px '+y+'px)',end='circle(160vmax at '+x+'px '+y+'px)',duration=1600;
      shell.style.setProperty('--launcher-origin-x',x+'px');shell.style.setProperty('--launcher-origin-y',y+'px');shell.style.clipPath=start;shell.style.webkitClipPath=start;shell.classList.add('is-opening-from-fab');
      shell.classList.remove('is-parked');shell.setAttribute('aria-hidden','false');document.body.classList.add('launcher-open');
      requestAnimationFrame(()=>{
        if(!isOpen())return;
        const radial=shell.animate([{clipPath:start,offset:0},{clipPath:start,offset:.085},{clipPath:mid,offset:.48},{clipPath:end,offset:1}],{duration,easing:'cubic-bezier(.36,.02,.2,1)',fill:'forwards'});fabRevealAnimation=radial;
        radial.onfinish=()=>{shell.style.clipPath='none';shell.style.webkitClipPath='none';shell.classList.remove('is-opening-from-fab');clearFabLaunch();setFabReady(false);radial.cancel();if(fabRevealAnimation===radial)fabRevealAnimation=null};
        radial.oncancel=()=>{if(fabRevealAnimation===radial)fabRevealAnimation=null};
      });
    }else{
      shell.classList.remove('is-parked');shell.setAttribute('aria-hidden','false');document.body.classList.add('launcher-open');
    }
    history.replaceState(null,'','#start');if(focus)setTimeout(()=>query.focus(),80);
  }
  async function openTarget(id,actHint='',rememberLabel='',origin=null,transitionSnapshot=null,fallbackQuery=''){
    const snapshot=transitionSnapshot||launcherSnapshot();let finished=false;
    try{
      await ensureRouter();const meta=resultMeta(id),route=idById.get(id),act=meta?.act||route?.[1]||actHint;
      if(!act){snapshot?.remove();finished=true;query.value=fallbackQuery||rememberLabel||id;searchWrap.classList.add('has-value');runSearch();query.focus();return}
      const cfg=globalThis.__LAW_CONFIG?.acts?.[act]||{},label=rememberLabel||meta?.heading||id,sub=meta?.actName||cfg.name||act;if(act)remember(id,act,label,sub);
      globalThis.__POLICE_LAUNCHER_RETURN?.clear?.();query.blur();resultObserver?.disconnect?.();
      opened=false;globalThis.__POLICE_LAUNCHER_BOOT=false;parkLauncher();freezeReader(false);
      await waitForApp();await globalThis.__POLICE_GOTO_ID?.(id,{smooth:false,alignTop:true});await waitForTargetStable(id);freezeReader(true);
      const captured=Number(snapshot?.__launcherCapturedAt)||0,hold=Math.max(0,140-(performance.now()-captured));if(hold)await new Promise(resolve=>setTimeout(resolve,hold));
      await revealReader(origin,snapshot);snapshot.remove();finished=true;freezeReader(false);setTimeout(()=>setFabReady(true),35);
    }finally{
      if(!finished)snapshot?.remove?.();endNavigation();
    }
  }
  function openQuickItem(sectionId,index,origin=null,transitionSnapshot=null){
    const section=QUICK_SECTIONS.find(item=>item.id===sectionId),items=[...(section?.items||[]),...(section?.moreItems||[])],item=items[Number(index)];if(!item){transitionSnapshot?.remove();endNavigation();return}
    openTarget(item.target,'',quickItemLabel(item),origin,transitionSnapshot,item.fallback);
  }
  renderQuickSections();renderSuggestions();renderRecent();
  query.addEventListener('input',scheduleSearch);query.addEventListener('focus',()=>{positionSearchAtTop();setTimeout(positionSearchAtTop,180);setTimeout(positionSearchAtTop,420)});
  clear.addEventListener('click',()=>{query.value='';runSearch();query.focus()});
  suggestions?.addEventListener('click',event=>{const button=event.target.closest('[data-suggestion]');if(!button)return;query.value=button.dataset.suggestion;searchWrap.classList.add('has-value');runSearch();query.focus()});
  quickSections.addEventListener('click',event=>{
    const toggle=event.target.closest('.launcher-quick-toggle');if(toggle){
      const section=toggle.closest('[data-quick-section]'),id=section?.dataset.quickSection||'',opening=!section?.classList.contains('is-open');
      if(!section)return;
      if(opening){const previous=quickSections.querySelector('.launcher-quick-section.is-open');openSectionId=id;if(previous&&previous!==section)animateQuickSection(previous,false);animateQuickSection(section,true)}
      else{openSectionId='';animateQuickSection(section,false)}
      return
    }
    const more=event.target.closest('[data-quick-more]');if(more){animateQuickMore(more.dataset.quickMore);return}
    const item=event.target.closest('[data-quick-item]');if(item){const snapshot=beginNavigation(item);if(snapshot)openQuickItem(item.dataset.quickItem,item.dataset.quickIndex,clickPoint(event,item),snapshot);}
  });
  resultList.addEventListener('click',event=>{const button=event.target.closest('[data-result]');if(button){const snapshot=beginNavigation(button);if(snapshot)openTarget(button.dataset.result,button.dataset.act,'',clickPoint(event,button),snapshot)}});loadMore?.addEventListener('click',scanNextResultPage);
  recentList.addEventListener('click',event=>{const button=event.target.closest('[data-recent]');if(!button)return;const item=readRecent().find(x=>x.id===button.dataset.recent);if(item){const snapshot=beginNavigation(button);if(snapshot)openTarget(item.id,item.act,item.label,clickPoint(event,button),snapshot)}});
  showAll.addEventListener('click',fullSearch);readerButton.addEventListener('click',()=>close());fab?.addEventListener('click',()=>open({fromFab:true}));
  shell.addEventListener('keydown',event=>{if(event.key==='Escape')close()});
  document.getElementById('home')?.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();globalThis.__POLICE_SEARCH_CLEAR?.();open()},{capture:true});
  window.addEventListener('police-law-rendered',event=>{if(isOpen())return;setTimeout(()=>{const act=event.detail?.act||'',hash=decodeURIComponent(location.hash.slice(1));if(!act||!hash||hash==='start')return;const meta=resultMeta(hash);if(meta)remember(hash,act,meta.heading+(meta.title?' · '+meta.title:''),meta.actName)},0)});
  globalThis.__POLICE_LAUNCHER_OPEN=options=>open(options||{});
  globalThis.__POLICE_LAUNCHER_CLOSE=()=>close();
  const standalone=document.documentElement.dataset.pwaStandalone==='1'||window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true;
  const initial=standalone||(document.documentElement.dataset.launcherSkip!=='1'&&!isDeepLink());
  shell.hidden=false;shell.classList.add('is-runtime-open');
  if(initial){delete document.documentElement.dataset.launcherSkip;opened=true;freezeReader(true);restoreLauncherView();shell.classList.remove('is-parked');globalThis.__POLICE_LAUNCHER_BOOT=true;shell.setAttribute('aria-hidden','false');document.body.classList.add('launcher-open');setFabReady(false);history.replaceState(null,'','#start')}else{opened=false;parkLauncher();freezeReader(false);requestAnimationFrame(()=>setFabReady(true))}
  const fabObserver=new MutationObserver(scheduleFabPosition);fabObserver.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','hidden','style']});window.addEventListener('resize',scheduleFabPosition,{passive:true});globalThis.visualViewport?.addEventListener?.('resize',()=>{scheduleFabPosition();if(document.activeElement===query)setTimeout(positionSearchAtTop,40)},{passive:true});
  const warm=()=>ensureRouter();if('requestIdleCallback'in window)requestIdleCallback(warm,{timeout:1600});else setTimeout(warm,500);
})();