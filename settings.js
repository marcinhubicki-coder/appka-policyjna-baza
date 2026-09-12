(function(){
  const button=document.getElementById('settingsButton'),panel=document.getElementById('settingsPanel'),backdrop=document.getElementById('settingsBackdrop'),closeButton=document.getElementById('settingsClose');
  const title=document.getElementById('settingsTitle'),searchSettings=document.getElementById('searchSettings'),filterList=document.getElementById('searchActFilters'),enableAll=document.getElementById('searchEnableAll'),favoritesNotice=document.getElementById('searchFavoritesNotice'),favoritesToggle=document.getElementById('searchFavoritesToggle');
  const performanceSummary=document.getElementById('performanceSummary'),performanceToggle=document.getElementById('performanceToggle'),performanceDetails=document.getElementById('performanceDetails'),performanceMetrics=document.getElementById('performanceMetrics');
  const generalSections=[...document.querySelectorAll('.settings-general')];
  if(!button||!panel||!backdrop||!closeButton)return;
  let previousFocus=null,openedFromDrawer=false,openedFromSearch=false;

  function lockBackground(){globalThis.__READER_STATE?.lock('settings',true);globalThis.__READER_TOC_CLOSE?.(false);document.body.classList.remove('split-preview-active','split-dragging')}
  function unlockBackground(){globalThis.__READER_STATE?.lock('settings',false)}

  function isSearchMode(){return document.body.classList.contains('settings-open')?openedFromSearch:document.body.matches('.search-active,.search-editing')}
  function settingsName(){return isSearchMode()?'Ustawienia wyszukiwania':document.body.classList.contains('drawer-open')?'Ustawienia wyświetlania':'Ustawienia systemowe'}
  function closedLabel(){return 'Otwórz: '+settingsName()}
  function pluralHits(value){const tens=value%100,ones=value%10,word=value===1?'wynik':ones>=2&&ones<=4&&(tens<12||tens>14)?'wyniki':'wyników';return `${value} ${word}`}
  function duration(value){if(!Number.isFinite(value))return 'jeszcze niegotowe';if(value>=1000)return `${(value/1000).toLocaleString('pl-PL',{minimumFractionDigits:1,maximumFractionDigits:2})} s`;return `${Math.max(0,Math.round(value))} ms`}
  function bytes(value){if(!Number.isFinite(value)||value<=0)return null;if(value>=1024*1024)return `${(value/1024/1024).toLocaleString('pl-PL',{maximumFractionDigits:2})} MB`;return `${Math.round(value/1024)} KB`}
  function actLabel(code){try{return META?.[code]?.[0]||code||'—'}catch(_){return code||'—'}}
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
    const items=api.list().filter(item=>item.packageEnabled!==false);
    const favoritesOnly=!!api.favoritesOnly?.();
    const old=new Map([...filterList.children].map(row=>[row.dataset.code,row]));
    for(const item of items){
      let label=old.get(item.code);old.delete(item.code);
      if(!label){
      label=document.createElement('label');label.className='search-filter-row';label.dataset.code=item.code;
      label.title=item.name;
      const copy=document.createElement('span');copy.className='search-filter-copy';
      const short=document.createElement('b');short.textContent=item.short;
      const detail=document.createElement('small');
      const toggle=document.createElement('input');toggle.type='checkbox';
      toggle.addEventListener('change',()=>api.setEnabled(item.code,toggle.checked));
      copy.append(short,detail);label.append(copy,toggle);filterList.append(label);
      }
      const detail=label.querySelector('small'),toggle=label.querySelector('input'),text=pluralHits(item.hits),aria=`${item.enabled?'Wyłącz':'Włącz'} ${item.name}`;
      if(detail.textContent!==text)detail.textContent=text;toggle.checked=item.enabled;if(toggle.getAttribute('aria-label')!==aria)toggle.setAttribute('aria-label',aria);
    }
    for(const row of old.values())row.remove();
    items.forEach((item,index)=>{const row=filterList.querySelector('[data-code="'+item.code+'"]');if(row!==filterList.children[index])filterList.insertBefore(row,filterList.children[index]||null)});
    if(enableAll)enableAll.disabled=items.every(item=>item.packageEnabled===false||item.enabled)&&!favoritesOnly;
    if(favoritesNotice)favoritesNotice.textContent=searchScopeLabel(items,favoritesOnly);
    if(favoritesToggle){favoritesToggle.textContent=favoritesOnly?'Wyłącz ulubione':'Szukaj tylko w ulubionych';favoritesToggle.setAttribute('aria-pressed',String(favoritesOnly))}
    globalThis.__READER_SETTINGS?.refreshCues();
  }
  function searchScopeLabel(items,favoritesOnly){
    const enabled=items.filter(item=>item.enabled).length;
    if(!enabled)return 'Wszystkie ustawy wyłączone — włącz ustawę lub zresetuj filtry.';
    const scope=enabled===items.length?'we wszystkich ustawach':`w ${enabled} z ${items.length} ustaw`;
    return favoritesOnly?`Całe ulubione artykuły · ${scope}.`:`Wyszukiwanie ${scope}.`;
  }
  function syncMode(){
    const searching=isSearchMode();
    if(title)title.textContent=searching?'Ustawienia wyszukiwania':openedFromDrawer?'Ustawienia wyświetlania':'Ustawienia systemowe';
    for(const section of generalSections)section.hidden=searching||(section.dataset.splitOnly==='true'&&!openedFromDrawer)||(section.dataset.fullOnly==='true'&&openedFromDrawer);
    if(searchSettings)searchSettings.hidden=!searching;
    panel.dataset.mode=searching?'search':openedFromDrawer?'display':'system';
    if(searching)renderSearchFilters();
    else if(openedFromDrawer)renderPerformance();
    if(!document.body.classList.contains('settings-open'))button.setAttribute('aria-label',closedLabel());
  }
  function close(restoreFocus=true){
    if(!document.body.classList.contains('settings-open'))return;
    document.body.classList.remove('settings-open');
    panel.setAttribute('aria-hidden','true');
    button.setAttribute('aria-expanded','false');
    button.setAttribute('aria-label',closedLabel());
    unlockBackground();
    if(restoreFocus)((previousFocus?.id==='q'&&!openedFromSearch)?button:previousFocus||button).focus?.({preventScroll:true});
    previousFocus=null;openedFromDrawer=false;openedFromSearch=false;
    window.dispatchEvent(new CustomEvent('police-law-settings-close'));
  }
  function open(){
    openedFromDrawer=document.body.classList.contains('drawer-open');
    openedFromSearch=isSearchMode();
    previousFocus=document.activeElement;
    syncMode();
    lockBackground();
    document.body.classList.add('settings-open');
    panel.setAttribute('aria-hidden','false');
    button.setAttribute('aria-expanded','true');
    button.setAttribute('aria-label','Zamknij: '+settingsName());
    window.dispatchEvent(new CustomEvent('police-law-settings-open'));
    requestAnimationFrame(()=>closeButton.focus({preventScroll:true}));
  }
  enableAll?.addEventListener('click',()=>globalThis.__POLICE_SEARCH_FILTERS?.resetAll?.());
  favoritesToggle?.addEventListener('click',()=>{const api=globalThis.__POLICE_SEARCH_FILTERS;if(api?.favoritesOnly?.())api.disableFavorites?.();else api?.enableFavorites?.()});
  performanceToggle?.addEventListener('click',()=>{if(!performanceDetails)return;const show=performanceDetails.hidden;performanceDetails.hidden=!show;performanceToggle.setAttribute('aria-expanded',String(show));performanceToggle.textContent=show?'Ukryj pomiary':'Pokaż pomiary';if(show)renderPerformance()});
  for(const toggle of panel.querySelectorAll('[data-settings-expand]'))toggle.addEventListener('click',()=>{const content=document.getElementById(toggle.getAttribute('aria-controls'));if(!content)return;const show=content.hidden;content.hidden=!show;toggle.setAttribute('aria-expanded',String(show));toggle.textContent=show?toggle.dataset.hideLabel:toggle.dataset.showLabel;globalThis.__READER_SETTINGS?.refreshCues()});
  button.addEventListener('pointerdown',event=>{if(document.activeElement?.id==='q')event.preventDefault()});
  button.addEventListener('click',()=>document.body.classList.contains('settings-open')?close():open());
  closeButton.addEventListener('click',()=>close());
  backdrop.addEventListener('click',()=>close());
  document.addEventListener('keydown',event=>{
    if(!document.body.classList.contains('settings-open')||document.body.classList.contains('favorites-import-open'))return;
    if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();return}
    if(event.key!=='Tab')return;
    const focusable=[...panel.querySelectorAll('button:not(:disabled),input:not(:disabled),a[href],[tabindex="0"]')].filter(node=>node.getClientRects().length&&!node.closest('[hidden]'));
    if(!focusable.length)return;
    const first=focusable[0],last=focusable[focusable.length-1],active=document.activeElement;
    if(event.shiftKey&&(active===first||!panel.contains(active))){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&(active===last||!panel.contains(active))){event.preventDefault();first.focus()}
  },{capture:true});
  window.addEventListener('police-law-packages-change',()=>{if(isSearchMode())renderSearchFilters()});
  window.addEventListener('police-law-search-state',()=>{syncMode();if(document.body.classList.contains('settings-open'))button.setAttribute('aria-label','Zamknij: '+settingsName())});
  window.addEventListener('police-law-performance',()=>{if(document.body.classList.contains('settings-open')&&openedFromDrawer)renderPerformance()});
  for(const event of ['focus','blur'])document.getElementById('q')?.addEventListener(event,()=>{if(!document.body.classList.contains('settings-open'))button.setAttribute('aria-label',closedLabel())});
  syncMode();
})();
