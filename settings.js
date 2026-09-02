(function(){
  const button=document.getElementById('settingsButton'),panel=document.getElementById('settingsPanel'),backdrop=document.getElementById('settingsBackdrop'),closeButton=document.getElementById('settingsClose');
  const title=document.getElementById('settingsTitle'),searchSettings=document.getElementById('searchSettings'),filterList=document.getElementById('searchActFilters'),enableAll=document.getElementById('searchEnableAll'),favoritesNotice=document.getElementById('searchFavoritesNotice'),favoritesToggle=document.getElementById('searchFavoritesToggle');
  const performanceSummary=document.getElementById('performanceSummary'),performanceToggle=document.getElementById('performanceToggle'),performanceDetails=document.getElementById('performanceDetails'),performanceMetrics=document.getElementById('performanceMetrics');
  const generalSections=[...document.querySelectorAll('.settings-general')];
  if(!button||!panel||!backdrop||!closeButton)return;
  let previousFocus=null,openedFromDrawer=false,drawerContext=null;

  function isSearchMode(){return document.body.classList.contains('search-active')}
  function closedLabel(){return isSearchMode()?'Otwórz filtry wyszukiwania':'Otwórz ustawienia'}
  function pluralHits(value){const tens=value%100,ones=value%10,word=value===1?'wynik':ones>=2&&ones<=4&&(tens<12||tens>14)?'wyniki':'wyników';return `${value} ${word}`}
  function duration(value){if(!Number.isFinite(value))return 'jeszcze niegotowe';if(value>=1000)return `${(value/1000).toLocaleString('pl-PL',{minimumFractionDigits:1,maximumFractionDigits:2})} s`;return `${Math.max(0,Math.round(value))} ms`}
  function bytes(value){if(!Number.isFinite(value)||value<=0)return null;if(value>=1024*1024)return `${(value/1024/1024).toLocaleString('pl-PL',{maximumFractionDigits:2})} MB`;return `${Math.round(value/1024)} KB`}
  function actLabel(code){try{return META?.[code]?.[0]||code||'—'}catch(_){return code||'—'}}
  function captureDrawerContext(){const view=document.getElementById('actview'),rect=view?.getBoundingClientRect(),top=(document.querySelector('.top')?.getBoundingClientRect().bottom||0)+8;if(!view||!rect)return null;const x=Math.max(1,Math.min(window.innerWidth-1,rect.left+Math.min(28,Math.max(2,rect.width/2)))),article=document.elementFromPoint(x,Math.min(window.innerHeight-1,top+8))?.closest?.('#actview .legal-unit[id]');return{articleId:article?.id||'',offset:article?article.getBoundingClientRect().top-top:0,drawerScroll:document.querySelector('.drawer-scroll')?.scrollTop||0}}
  function restoreDrawerContext(context){globalThis.__POLICE_DRAWER_OPEN?.();requestAnimationFrame(()=>requestAnimationFrame(()=>{const top=(document.querySelector('.top')?.getBoundingClientRect().bottom||0)+8,article=context?.articleId&&document.getElementById(context.articleId);if(article){const delta=article.getBoundingClientRect().top-top-(context.offset||0);if(Math.abs(delta)>.5)window.scrollBy(0,delta)}const drawerScroll=document.querySelector('.drawer-scroll');if(drawerScroll)drawerScroll.scrollTop=context?.drawerScroll||0}))}
  function renderPerformance(){
    const state=globalThis.__POLICE_PERF?.snapshot?.();if(!state)return;
    const m=state.metrics||{},act=actLabel(state.lastAct),summary=m.initialReadyMs==null?'Kończę pomiar bieżącego uruchomienia…':`Start ${duration(m.initialReadyMs)} · ${act} ${duration(m.lastActRenderMs)}`;
    if(performanceSummary)performanceSummary.textContent=summary;
    if(!performanceMetrics)return;
    const dataSize=bytes(state.dataResourceBytes),dataSource=state.dataFromCache?'pamięć urządzenia':'sieć lub nowy cache';
    const rows=[
      ['Uruchomienie',duration(m.initialReadyMs)],
      ['Przygotowanie danych',duration(m.dataLoadMs)],
      ['Pierwszy widok ustawy',`${act} · ${state.lastActInitialArticles||state.lastActArticles||0}/${state.lastActArticles||0} art. · ${duration(m.lastActRenderMs)}`],
      ['Wczytany widok',`${state.streamRenderedArticles||0}/${state.streamTotalArticles||state.lastActArticles||0} art. · partia ${duration(m.lastChunkRenderMs)}`],
      ['Menu artykułów',m.lastDrawerBuildMs==null?'przy pierwszym otwarciu':`${actLabel(state.lastDrawerAct)} · ${state.lastDrawerArticles||0} art. · ${duration(m.lastDrawerBuildMs)}`],
      ['Spis artykułów',m.lastTocBuildMs==null?'przy pierwszym rozwinięciu':`${actLabel(state.lastTocAct)} · ${duration(m.lastTocBuildMs)}`],
      ['Wyszukiwarka',m.searchReadyMs==null?'indeksowanie w tle':`gotowa · ${duration(m.searchWorkMs)} pracy`]
    ];
    if(dataSize)rows.push(['Plik danych',`${dataSize} · ${dataSource}`]);
    const fragment=document.createDocumentFragment();for(const[label,value]of rows){const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;row.append(dt,dd);fragment.append(row)}performanceMetrics.replaceChildren(fragment);
  }
  function renderSearchFilters(){
    const api=globalThis.__POLICE_SEARCH_FILTERS;
    if(!filterList||!api?.list)return;
    const items=api.list();
    const favoritesOnly=!!api.favoritesOnly?.();
    const fragment=document.createDocumentFragment();
    for(const item of items){
      const label=document.createElement('label');label.className='search-filter-row';
      label.title=item.name;
      const copy=document.createElement('span');copy.className='search-filter-copy';
      const short=document.createElement('b');short.textContent=item.short;
      const detail=document.createElement('small');detail.textContent=pluralHits(item.hits);
      const toggle=document.createElement('input');toggle.type='checkbox';toggle.checked=item.enabled;toggle.setAttribute('aria-label',`${item.enabled?'Wyłącz':'Włącz'} ${item.name}`);
      toggle.addEventListener('change',()=>api.setEnabled(item.code,toggle.checked));
      copy.append(short,detail);label.append(copy,toggle);fragment.append(label);
    }
    filterList.replaceChildren(fragment);
    if(enableAll)enableAll.disabled=items.every(item=>item.enabled)&&!favoritesOnly;
    if(favoritesNotice)favoritesNotice.textContent=favoritesOnly?'Wyszukiwanie wyłącznie w ulubionych artykułach.':'Wyszukiwanie we wszystkich ustawach i artykułach.';
    if(favoritesToggle){favoritesToggle.textContent=favoritesOnly?'Wyłącz ulubione':'Szukaj tylko w ulubionych';favoritesToggle.setAttribute('aria-pressed',String(favoritesOnly))}
  }
  function syncMode(){
    const searching=isSearchMode();
    if(title)title.textContent=searching?'Filtry wyszukiwania':openedFromDrawer?'Ustawienia widoku':'Ustawienia';
    for(const section of generalSections)section.hidden=searching||(section.dataset.splitOnly==='true'&&!openedFromDrawer)||(section.dataset.fullOnly==='true'&&openedFromDrawer);
    if(searchSettings)searchSettings.hidden=!searching;
    if(searching)renderSearchFilters();
    else if(openedFromDrawer)renderPerformance();
    if(!document.body.classList.contains('settings-open'))button.setAttribute('aria-label',closedLabel());
  }
  function close(restoreFocus=true){
    if(!document.body.classList.contains('settings-open'))return;
    const reopenDrawer=openedFromDrawer&&!isSearchMode(),context=drawerContext;
    document.body.classList.remove('settings-open');
    panel.setAttribute('aria-hidden','true');
    button.setAttribute('aria-expanded','false');
    button.setAttribute('aria-label',closedLabel());
    if(restoreFocus)(previousFocus||button).focus?.({preventScroll:true});
    previousFocus=null;openedFromDrawer=false;drawerContext=null;
    if(reopenDrawer)restoreDrawerContext(context);
  }
  function open(){
    openedFromDrawer=document.body.classList.contains('drawer-open');
    drawerContext=openedFromDrawer?captureDrawerContext():null;
    previousFocus=document.activeElement;
    if(openedFromDrawer){
      if(typeof globalThis.__POLICE_DRAWER_CLOSE==='function')globalThis.__POLICE_DRAWER_CLOSE();
      else document.getElementById('hamburger')?.click();
    }
    syncMode();
    document.body.classList.add('settings-open');
    panel.setAttribute('aria-hidden','false');
    button.setAttribute('aria-expanded','true');
    button.setAttribute('aria-label',isSearchMode()?'Zamknij filtry wyszukiwania':'Zamknij ustawienia');
    requestAnimationFrame(()=>closeButton.focus({preventScroll:true}));
  }
  enableAll?.addEventListener('click',()=>globalThis.__POLICE_SEARCH_FILTERS?.resetAll?.());
  favoritesToggle?.addEventListener('click',()=>{const api=globalThis.__POLICE_SEARCH_FILTERS;if(api?.favoritesOnly?.())api.disableFavorites?.();else api?.enableFavorites?.()});
  performanceToggle?.addEventListener('click',()=>{if(!performanceDetails)return;const show=performanceDetails.hidden;performanceDetails.hidden=!show;performanceToggle.setAttribute('aria-expanded',String(show));performanceToggle.textContent=show?'Ukryj pomiary':'Pokaż pomiary';if(show)renderPerformance()});
  button.addEventListener('click',()=>document.body.classList.contains('settings-open')?close():open());
  closeButton.addEventListener('click',()=>close());
  backdrop.addEventListener('click',()=>close());
  document.addEventListener('keydown',event=>{if(event.key==='Escape')close()});
  window.addEventListener('police-law-search-state',()=>{syncMode();if(document.body.classList.contains('settings-open'))button.setAttribute('aria-label',isSearchMode()?'Zamknij filtry wyszukiwania':'Zamknij ustawienia')});
  window.addEventListener('police-law-performance',()=>{if(document.body.classList.contains('settings-open')&&openedFromDrawer)renderPerformance()});
  syncMode();
})();
