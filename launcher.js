(function(){
  const shell=document.getElementById('launcherShell'),query=document.getElementById('launcherQuery'),searchWrap=document.getElementById('launcherSearch'),clear=document.getElementById('launcherClear'),quickSections=document.getElementById('launcherQuickSections'),resultsBox=document.getElementById('launcherResults'),resultList=document.getElementById('launcherResultList'),resultStatus=document.getElementById('launcherResultStatus'),showAll=document.getElementById('launcherShowAll'),recentBox=document.getElementById('launcherRecent'),recentList=document.getElementById('launcherRecentList'),readerButton=document.getElementById('launcherReader');
  if(!shell||!query)return;
  const RECENT_KEY='police-law-launcher-recent-v1',MAX_RESULTS=10;
  const QUICK_SECTIONS=[
    {id:'legitymowanie',label:'Podstawy legitymowania',items:[
      {label:'UoP · art. 15',target:'uop-art-15',fallback:'legitymowanie'},
      {label:'Rozp. · § 4',target:'upraw-par-4',fallback:'ustala tożsamość osoby legitymowanej'},
      {label:'Rozp. · § 7',target:'upraw-par-7',fallback:'dokumentuje legitymowanie'}
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
    ]}
  ];
  let router=null,discovery=null,articleById=new Map(),actByCode=new Map(),loadPromise=null,searchTimer=0,opened=false,openSectionId='';
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
  async function ensureData(){
    if(router&&discovery)return{router,discovery};if(loadPromise)return loadPromise;
    loadPromise=(async()=>{
      if(!globalThis.__LAW_DATA?.loadRouter||!globalThis.__LAW_DATA?.loadDiscovery)return null;
      const values=await Promise.all([globalThis.__LAW_DATA.loadRouter(),globalThis.__LAW_DATA.loadDiscovery()]);router=values[0];discovery=values[1];
      articleById=new Map((router?.articles||[]).map(row=>[row[0],row]));actByCode=new Map((router?.acts||[]).map(row=>[row[0],row]));return{router,discovery};
    })().catch(error=>{console.warn('Launcher search unavailable',error);return null}).finally(()=>{loadPromise=null});
    return loadPromise;
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
  async function findResults(value){
    const needle=norm(value);if(needle.length<2)return[];
    const ready=await ensureData();if(!ready)return[];
    const terms=needle.split(/\s+/).filter(Boolean),matches=[];
    for(const row of discovery||[]){
      const meta=resultMeta(row[0]);if(!meta)continue;const hay=(String(row[1]||'')+' '+norm(meta.heading+' '+meta.title+' '+meta.short+' '+meta.actName+' '+(row[2]||'')));
      if(!terms.every(term=>hay.includes(term)))continue;matches.push({row,meta,score:scoreResult(row,meta,needle,terms)});
    }
    matches.sort((a,b)=>b.score-a.score||a.meta.act.localeCompare(b.meta.act)||a.meta.id.localeCompare(b.meta.id));return matches.slice(0,MAX_RESULTS);
  }
  function renderResults(items,value){
    resultsBox.hidden=false;resultStatus.hidden=true;resultList.hidden=false;showAll.hidden=false;
    if(!items.length){resultList.replaceChildren();resultStatus.hidden=false;resultStatus.textContent='Brak szybkich trafień. Możesz sprawdzić pełne wyniki.';return}
    resultList.innerHTML=items.map(({row,meta})=>'<button class="launcher-result" type="button" data-result="'+esc(meta.id)+'" data-act="'+esc(meta.act)+'"><span class="launcher-result-head"><b>'+esc(meta.heading+(meta.title?' · '+meta.title:''))+'</b><span class="launcher-result-act">'+esc(meta.short)+'</span></span><span class="launcher-result-title">'+esc(meta.actName)+'</span>'+(row[2]?'<span class="launcher-result-preview">'+esc(row[2])+'</span>':'')+'</button>').join('');
    resultStatus.textContent=items.length+' szybkich trafień dla „'+value+'”';
  }
  async function runSearch(){
    const value=query.value.trim();searchWrap.classList.toggle('has-value',!!value);
    if(norm(value).length<2){resultsBox.hidden=true;resultList.replaceChildren();recentBox.hidden=!readRecent().length;return}
    recentBox.hidden=true;resultsBox.hidden=false;resultList.hidden=true;showAll.hidden=true;resultStatus.hidden=false;resultStatus.textContent='Szukam w całej bazie…';
    const stamp=value,items=await findResults(value);if(query.value.trim()!==stamp)return;renderResults(items,value);
  }
  function scheduleSearch(){clearTimeout(searchTimer);searchTimer=setTimeout(runSearch,110)}
  function fullSearch(){
    const value=query.value.trim();if(norm(value).length<2)return;close(false);waitForApp().then(()=>{const q=document.getElementById('q');if(!q)return;q.value=value;try{q.focus({preventScroll:true})}catch(_){q.focus()}q.dispatchEvent(new Event('input',{bubbles:true}))});
  }
  function waitForApp(){
    if(document.querySelector('#actview .act-head')&&typeof globalThis.__POLICE_GOTO_ID==='function')return Promise.resolve();
    return new Promise(resolve=>{let done=false;const finish=()=>{if(done)return;done=true;window.removeEventListener('police-law-rendered',finish);resolve()};window.addEventListener('police-law-rendered',finish,{once:true});setTimeout(finish,3000)});
  }
  function close(animate=true){
    if(!isOpen())return;opened=false;globalThis.__POLICE_LAUNCHER_BOOT=false;document.body.classList.remove('launcher-open');shell.setAttribute('aria-hidden','true');
    const finish=()=>{shell.hidden=true;shell.classList.remove('is-closing')};if(animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches){shell.classList.add('is-closing');setTimeout(finish,190)}else finish();
  }
  function open({focus=false}={}){
    if(isOpen())return;opened=true;globalThis.__POLICE_LAUNCHER_BOOT=true;shell.hidden=false;shell.setAttribute('aria-hidden','false');shell.classList.remove('is-closing');document.body.classList.add('launcher-open');history.replaceState(null,'','#start');renderRecent();renderQuickSections();if(focus)setTimeout(()=>query.focus(),80);
  }
  async function openTarget(id,actHint='',rememberLabel=''){
    await ensureData();const meta=resultMeta(id),act=meta?.act||actHint;if(!meta&&rememberLabel){query.value=rememberLabel;searchWrap.classList.add('has-value');runSearch();return}
    const label=rememberLabel||meta?.heading||id,sub=meta?.actName||act;if(meta)remember(id,act,meta.heading+(meta.title?' · '+meta.title:''),sub);
    globalThis.__POLICE_LAUNCHER_RETURN?.show?.();close();await waitForApp();await globalThis.__POLICE_GOTO_ID?.(id,{smooth:false,alignTop:true});
  }
  async function openQuickItem(sectionId,index){
    const section=QUICK_SECTIONS.find(item=>item.id===sectionId),item=section?.items?.[Number(index)];if(!item)return;
    await ensureData();if(articleById.has(item.target)){await openTarget(item.target,'',item.label);return}
    query.value=item.fallback||item.label;searchWrap.classList.add('has-value');runSearch();query.focus();
  }
  renderQuickSections();renderRecent();
  query.addEventListener('input',scheduleSearch);
  clear.addEventListener('click',()=>{query.value='';runSearch();query.focus()});
  quickSections.addEventListener('click',event=>{
    const toggle=event.target.closest('.launcher-quick-toggle');if(toggle){const section=toggle.closest('[data-quick-section]'),id=section?.dataset.quickSection||'';openSectionId=openSectionId===id?'':id;renderQuickSections();return}
    const item=event.target.closest('[data-quick-item]');if(item)openQuickItem(item.dataset.quickItem,item.dataset.quickIndex);
  });
  resultList.addEventListener('click',event=>{const button=event.target.closest('[data-result]');if(button)openTarget(button.dataset.result,button.dataset.act)});
  recentList.addEventListener('click',event=>{const button=event.target.closest('[data-recent]');if(!button)return;const item=readRecent().find(x=>x.id===button.dataset.recent);if(item)openTarget(item.id,item.act,item.label)});
  showAll.addEventListener('click',fullSearch);readerButton.addEventListener('click',()=>close());
  shell.addEventListener('keydown',event=>{if(event.key==='Escape')close()});
  document.getElementById('home')?.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();globalThis.__POLICE_SEARCH_CLEAR?.();open()},{capture:true});
  window.addEventListener('police-law-rendered',event=>{if(isOpen())return;setTimeout(()=>{const act=event.detail?.act||'',hash=decodeURIComponent(location.hash.slice(1));if(!act||!hash||hash==='start')return;const meta=resultMeta(hash);if(meta)remember(hash,act,meta.heading+(meta.title?' · '+meta.title:''),meta.actName)},0)});
  globalThis.__POLICE_LAUNCHER_OPEN=options=>open(options||{});
  globalThis.__POLICE_LAUNCHER_CLOSE=()=>close();
  const initial=document.documentElement.dataset.launcherSkip!=='1'&&!isDeepLink();
  if(initial){globalThis.__POLICE_LAUNCHER_BOOT=true;shell.hidden=false;shell.setAttribute('aria-hidden','false');document.body.classList.add('launcher-open');opened=true;history.replaceState(null,'','#start')}else{shell.hidden=true;shell.setAttribute('aria-hidden','true')}
  const warm=()=>ensureData();if('requestIdleCallback'in window)requestIdleCallback(warm,{timeout:1600});else setTimeout(warm,500);
})();