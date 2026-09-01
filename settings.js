(function(){
  const button=document.getElementById('settingsButton'),panel=document.getElementById('settingsPanel'),backdrop=document.getElementById('settingsBackdrop'),closeButton=document.getElementById('settingsClose');
  const title=document.getElementById('settingsTitle'),searchSettings=document.getElementById('searchSettings'),filterList=document.getElementById('searchActFilters'),enableAll=document.getElementById('searchEnableAll');
  const generalSections=[...document.querySelectorAll('.settings-general')];
  if(!button||!panel||!backdrop||!closeButton)return;
  let previousFocus=null;

  function isSearchMode(){return document.body.classList.contains('search-active')}
  function closedLabel(){return isSearchMode()?'Otwórz filtry wyszukiwania':'Otwórz ustawienia'}
  function pluralHits(value){const tens=value%100,ones=value%10,word=value===1?'wynik':ones>=2&&ones<=4&&(tens<12||tens>14)?'wyniki':'wyników';return `${value} ${word}`}
  function renderSearchFilters(){
    const api=globalThis.__POLICE_SEARCH_FILTERS;
    if(!filterList||!api?.list)return;
    const items=api.list();
    const fragment=document.createDocumentFragment();
    for(const item of items){
      const label=document.createElement('label');label.className='search-filter-row';
      const copy=document.createElement('span');copy.className='search-filter-copy';
      const short=document.createElement('b');short.textContent=item.short;
      const detail=document.createElement('small');detail.textContent=`${item.name} · ${pluralHits(item.hits)}`;
      const toggle=document.createElement('input');toggle.type='checkbox';toggle.checked=item.enabled;toggle.setAttribute('aria-label',`${item.enabled?'Wyłącz':'Włącz'} ${item.name}`);
      toggle.addEventListener('change',()=>api.setEnabled(item.code,toggle.checked));
      copy.append(short,detail);label.append(copy,toggle);fragment.append(label);
    }
    filterList.replaceChildren(fragment);
    if(enableAll)enableAll.disabled=items.every(item=>item.enabled);
  }
  function syncMode(){
    const searching=isSearchMode();
    if(title)title.textContent=searching?'Filtry wyszukiwania':'Ustawienia';
    for(const section of generalSections)section.hidden=searching;
    if(searchSettings)searchSettings.hidden=!searching;
    if(searching)renderSearchFilters();
    if(!document.body.classList.contains('settings-open'))button.setAttribute('aria-label',closedLabel());
  }
  function close(restoreFocus=true){
    if(!document.body.classList.contains('settings-open'))return;
    document.body.classList.remove('settings-open');
    panel.setAttribute('aria-hidden','true');
    button.setAttribute('aria-expanded','false');
    button.setAttribute('aria-label',closedLabel());
    if(restoreFocus)(previousFocus||button).focus?.({preventScroll:true});
    previousFocus=null;
  }
  function open(){
    if(document.body.classList.contains('drawer-open'))document.getElementById('hamburger')?.click();
    previousFocus=document.activeElement;
    syncMode();
    document.body.classList.add('settings-open');
    panel.setAttribute('aria-hidden','false');
    button.setAttribute('aria-expanded','true');
    button.setAttribute('aria-label',isSearchMode()?'Zamknij filtry wyszukiwania':'Zamknij ustawienia');
    requestAnimationFrame(()=>closeButton.focus({preventScroll:true}));
  }
  enableAll?.addEventListener('click',()=>globalThis.__POLICE_SEARCH_FILTERS?.enableAll?.());
  button.addEventListener('click',()=>document.body.classList.contains('settings-open')?close():open());
  closeButton.addEventListener('click',()=>close());
  backdrop.addEventListener('click',()=>close());
  document.addEventListener('keydown',event=>{if(event.key==='Escape')close()});
  window.addEventListener('police-law-search-state',()=>{syncMode();if(document.body.classList.contains('settings-open'))button.setAttribute('aria-label',isSearchMode()?'Zamknij filtry wyszukiwania':'Zamknij ustawienia')});
  syncMode();
})();
