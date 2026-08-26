/* Favorites: filter/highlight controls and an article-edge swipe action. */
(function(){
  const KEY='police-law-bookmarks-v1';
  const FILTER_KEY='police-law-favorites-filter-v1';
  const HIGHLIGHT_KEY='police-law-favorites-highlight-v1';
  const view=document.getElementById('actview');
  if(!view)return;

  let filter=false,highlight=false,activeArticle=null,touch=null,pointer=null,queued=false;
  try{filter=localStorage.getItem(FILTER_KEY)==='1';highlight=localStorage.getItem(HIGHLIGHT_KEY)==='1'}catch(_){}

  const read=()=>{try{const value=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(value)?value:[]}catch(_){return[]}};
  const ids=()=>new Set(read().map(item=>item.id));
  const rowFor=id=>{try{return ACT?.[3]?.find(row=>row[0]===id)||null}catch(_){return null}};
  function save(items){try{localStorage.setItem(KEY,JSON.stringify(items))}catch(_){};window.dispatchEvent(new CustomEvent('police-law-favorites-change'))}
  function isFavorite(id){return ids().has(id)}
  function toggleFavorite(id){
    const items=read(),index=items.findIndex(item=>item.id===id),row=rowFor(id);
    if(index>=0)items.splice(index,1);
    else if(row)items.unshift({id,act:ACT[0],num:row[2],topic:row[3]||''});
    save(items);closeSwipe();
    try{if(typeof populateDrawer==='function')populateDrawer();if(typeof updateUI==='function')updateUI()}catch(_){}
    refresh();
  }
  const icon=(name)=>name==='star'
    ?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.75 5.57 6.15.9-4.45 4.33 1.05 6.12L12 17.03l-5.5 2.89 1.05-6.12L3.1 9.47l6.15-.9L12 3Z"/></svg>'
    :'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.45-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.45 5.5-9.5 5.5S2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/></svg>';

  function controls(){
    const list=document.getElementById('drawerArticles'),section=list?.closest('.drawer-section'),label=section?.querySelector(':scope > .drawer-label');
    if(!label)return null;
    let box=label.querySelector('.favorites-controls');
    if(!box){
      label.classList.add('favorites-label');
      const title=document.createElement('span');title.className='favorites-label-text';title.textContent=label.textContent.trim();label.textContent='';label.appendChild(title);
      box=document.createElement('span');box.className='favorites-controls';
      const filterButton=document.createElement('button');filterButton.type='button';filterButton.className='favorites-control favorites-filter';filterButton.innerHTML=icon('star');filterButton.title='Pokaż tylko ulubione';filterButton.setAttribute('aria-label',filterButton.title);filterButton.onclick=()=>{filter=!filter;persist();refresh()};
      const highlightButton=document.createElement('button');highlightButton.type='button';highlightButton.className='favorites-control favorites-highlight';highlightButton.innerHTML=icon('eye');highlightButton.title='Wyróżnij ulubione';highlightButton.setAttribute('aria-label',highlightButton.title);highlightButton.onclick=()=>{highlight=!highlight;persist();refresh()};
      box.append(filterButton,highlightButton);label.appendChild(box);
    }
    return box;
  }
  function persist(){try{localStorage.setItem(FILTER_KEY,filter?'1':'0');localStorage.setItem(HIGHLIGHT_KEY,highlight?'1':'0')}catch(_){}}
  function ensureEmpty(container,className,text){
    let empty=container?.querySelector(':scope > .'+className);
    if(!empty&&container){empty=document.createElement('div');empty.className=className;empty.textContent=text;container.appendChild(empty)}
    return empty;
  }
  function addSwipeAction(article){
    let panel=article.querySelector(':scope > .favorite-swipe-action');
    if(panel)return panel;
    panel=document.createElement('div');panel.className='favorite-swipe-action';panel.setAttribute('aria-hidden','true');panel.inert=true;
    const cue=document.createElement('span');cue.className='favorite-swipe-cue';cue.textContent='←';cue.setAttribute('aria-hidden','true');
    const action=document.createElement('button');action.type='button';action.className='favorite-swipe-toggle';
    const cancel=document.createElement('button');cancel.type='button';cancel.className='favorite-swipe-cancel';cancel.textContent='Anuluj';cancel.onclick=closeSwipe;
    panel.append(cue,action,cancel);article.appendChild(panel);return panel;
  }
  function updateSwipeAction(article,on){
    const button=addSwipeAction(article).querySelector('.favorite-swipe-toggle');
    const state=on?'remove':'add';if(button.dataset.state===state)return;button.dataset.state=state;
    button.innerHTML=icon('star')+'<span>'+(on?'Usuń z<br>ulubionych':'Dodaj do<br>ulubionych')+'</span>';
    button.setAttribute('aria-label',on?'Usuń z ulubionych':'Dodaj do ulubionych');
    button.onclick=()=>toggleFavorite(article.id);
  }
  function closeSwipe(){
    if(!activeArticle)return;
    activeArticle.classList.remove('favorite-swipe-open','favorite-swiping');activeArticle.style.removeProperty('--favorite-swipe-x');
    const panel=activeArticle.querySelector(':scope > .favorite-swipe-action');panel?.setAttribute('aria-hidden','true');if(panel)panel.inert=true;activeArticle=null;
  }
  function openSwipe(article){
    closeSwipe();activeArticle=article;updateSwipeAction(article,isFavorite(article.id));article.classList.add('favorite-swipe-open');
    const panel=article.querySelector(':scope > .favorite-swipe-action');panel?.setAttribute('aria-hidden','false');if(panel)panel.inert=false;
  }
  function refresh(){
    const set=ids(),box=controls();
    document.body.classList.toggle('favorites-filter-on',filter);document.body.classList.toggle('favorites-highlight-on',highlight);
    box?.querySelector('.favorites-filter')?.classList.toggle('on',filter);box?.querySelector('.favorites-highlight')?.classList.toggle('on',highlight);
    box?.querySelector('.favorites-filter')?.setAttribute('aria-pressed',String(filter));box?.querySelector('.favorites-highlight')?.setAttribute('aria-pressed',String(highlight));
    const articles=[...view.querySelectorAll('article.legal-unit')];
    articles.forEach(article=>{const on=set.has(article.id);article.classList.toggle('is-favorite',on);updateSwipeAction(article,on)});
    const drawerRows=[...document.querySelectorAll('.drawer-article')];
    drawerRows.forEach(row=>row.classList.toggle('is-favorite',set.has(row.dataset.id)));
    document.querySelectorAll('.drawer-chapter').forEach(chapter=>chapter.classList.toggle('favorites-chapter-empty',filter&&!chapter.querySelector('.drawer-article.is-favorite')));
    const currentCount=articles.filter(article=>set.has(article.id)).length;
    const mainEmpty=ensureEmpty(view,'favorites-empty-main','Brak ulubionych artykułów w tej ustawie.');mainEmpty.hidden=!filter||currentCount>0;
    const list=document.getElementById('drawerArticles'),drawerEmpty=ensureEmpty(list,'favorites-empty-drawer','Brak ulubionych w tej ustawie.');drawerEmpty.hidden=!filter||currentCount>0;
  }

  function eligibleArticle(target,x){
    if(document.body.classList.contains('drawer-open'))return null;
    if(target.closest('a,button,input,summary,.navrefs'))return null;
    const article=target.closest('article.legal-unit');if(!article)return null;
    const rect=article.getBoundingClientRect();return x>=rect.right-Math.min(54,rect.width*.14)?article:null;
  }
  view.addEventListener('touchstart',event=>{
    if(event.touches.length!==1)return;const point=event.touches[0],article=eligibleArticle(event.target,point.clientX);if(!article)return;
    event.stopPropagation();touch={article,x:point.clientX,y:point.clientY,axis:null};
  },{capture:true,passive:true});
  view.addEventListener('touchmove',event=>{
    if(!touch||event.touches.length!==1)return;event.stopPropagation();const point=event.touches[0],dx=point.clientX-touch.x,dy=point.clientY-touch.y;
    if(!touch.axis&&Math.max(Math.abs(dx),Math.abs(dy))>10)touch.axis=Math.abs(dx)>Math.abs(dy)*1.15?'x':'y';
    if(touch.axis==='x'){event.preventDefault();const amount=Math.max(-112,Math.min(0,dx));touch.article.classList.add('favorite-swiping');touch.article.style.setProperty('--favorite-swipe-x',amount+'px')}
  },{capture:true,passive:false});
  view.addEventListener('touchend',event=>{
    if(!touch)return;event.stopPropagation();const point=event.changedTouches[0],dx=point?point.clientX-touch.x:0,article=touch.article,axis=touch.axis;touch=null;
    article.classList.remove('favorite-swiping');article.style.removeProperty('--favorite-swipe-x');if(axis==='x'&&dx<-52)openSwipe(article);else if(article===activeArticle)closeSwipe();
  },{capture:true,passive:true});
  view.addEventListener('touchcancel',()=>{if(touch){touch.article.classList.remove('favorite-swiping');touch.article.style.removeProperty('--favorite-swipe-x')}touch=null},{capture:true,passive:true});

  view.addEventListener('pointerdown',event=>{
    if(event.pointerType==='touch'||event.button!==0)return;const article=eligibleArticle(event.target,event.clientX);if(!article)return;
    pointer={article,x:event.clientX,y:event.clientY,id:event.pointerId};article.setPointerCapture?.(event.pointerId);
  });
  view.addEventListener('pointermove',event=>{
    if(!pointer||event.pointerId!==pointer.id)return;const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;if(Math.abs(dx)<=Math.abs(dy)||dx>0)return;
    pointer.article.classList.add('favorite-swiping');pointer.article.style.setProperty('--favorite-swipe-x',Math.max(-112,dx)+'px');
  });
  view.addEventListener('pointerup',event=>{
    if(!pointer||event.pointerId!==pointer.id)return;const state=pointer,dx=event.clientX-state.x;pointer=null;state.article.classList.remove('favorite-swiping');state.article.style.removeProperty('--favorite-swipe-x');if(dx<-52)openSwipe(state.article);
  });
  document.addEventListener('click',event=>{if(activeArticle&&!event.target.closest('.favorite-swipe-action')&&!event.target.closest('.favorite-swipe-open'))closeSwipe()});
  window.addEventListener('storage',event=>{if(event.key===KEY)refresh()});window.addEventListener('police-law-favorites-change',refresh);
  new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;refresh()})}).observe(document.body,{childList:true,subtree:true});
  refresh();
})();
