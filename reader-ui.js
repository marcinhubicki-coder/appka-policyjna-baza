/* Single-column chapter drawer, complete act picker, packages and sparse comments. */
(function(){
  const core=globalThis.__READER_CORE,bar=document.getElementById('quickbar');
  if(!core||!bar)return;
  function migrationNotice(){
    const state=globalThis.__FAVORITES_MIGRATION,items=JSON.parse(localStorage.getItem('police-law-bookmarks-v1')||'[]');
    const count=Array.isArray(items)?items.filter(item=>item.needsFragmentReview).length:0;
    document.getElementById('favoriteMigrationNotice')?.remove();if(!state?.error&&!count)return;
    const note=document.createElement('p');note.id='favoriteMigrationNotice';note.className='source-warning';note.setAttribute('role','status');
    note.textContent=state?.error?'Nie udało się zabezpieczyć i zaktualizować ulubionych. Wyeksportuj kopię przed dalszą edycją.':`Aktualizacja treści: ${count} zapisów wymaga ponownego wyboru fragmentów. Wyświetlamy całe artykuły; poprzedni wybór zachowano w kopii.`;
    document.getElementById('favoritesTransfer')?.append(note);
  }
  window.addEventListener('police-law-rendered',()=>{try{migrationNotice()}catch(_){}});
  window.addEventListener('police-law-favorites-change',()=>{try{migrationNotice()}catch(_){}});
  const button=(label,className,action)=>{const b=document.createElement('button');b.type='button';b.className=className;b.textContent=label;if(action)b.onclick=action;return b};
  let modal=null,modalFocus=null;
  function closeModal(){if(!modal)return;modal.close();modal.remove();modal=null;modalFocus?.focus?.({preventScroll:true});modalFocus=null}
  function dialog(title){
    closeModal();modalFocus=document.activeElement;modal=document.createElement('dialog');modal.className='reader-dialog';
    const head=document.createElement('div');head.className='reader-dialog-head';const heading=document.createElement('h2');heading.id='readerDialogTitle';heading.textContent=title;
    modal.setAttribute('aria-labelledby',heading.id);const close=button('×','reader-close',closeModal);close.setAttribute('aria-label','Zamknij');head.append(heading,close);
    const body=document.createElement('div');body.className='reader-dialog-body';modal.append(head,body);document.body.append(modal);
    modal.addEventListener('cancel',event=>{event.preventDefault();closeModal()});
    modal.addEventListener('click',event=>{if(event.target!==modal)return;const r=modal.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeModal()});
    modal.showModal();close.focus();return body;
  }
  document.addEventListener('keydown',event=>{if(modal&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeModal()}},true);

  const wrap=document.createElement('div');wrap.className='quickbar-wrap';bar.before(wrap);wrap.append(bar);
  const more=button('+','acts-more',openActPicker);more.setAttribute('aria-label','Wybierz akt z pełnej listy');wrap.append(more);
  let pillsQueued=false;
  function measurePills(){
    const pills=[...bar.querySelectorAll('button[data-act]')],viewport=bar.getBoundingClientRect(),rects=pills.map(p=>p.getBoundingClientRect());
    const hidden=core.hiddenPills(rects,viewport),atEnd=bar.scrollLeft+bar.clientWidth>=bar.scrollWidth-2;
    const text=hidden?'+'+hidden+(atEnd?' ‹':''):'✓';if(more.textContent!==text)more.textContent=text;
    more.dataset.complete=String(!hidden);more.dataset.atEnd=String(atEnd);
    more.setAttribute('aria-label',hidden?`${hidden} aktów poza widokiem${atEnd?' · koniec listy':''}. Wybierz z pełnej listy.`:'Wszystkie akty widoczne. Otwórz listę.');
  }
  function queuePills(){if(pillsQueued)return;pillsQueued=true;requestAnimationFrame(()=>{pillsQueued=false;measurePills()})}
  bar.addEventListener('scroll',queuePills,{passive:true});new ResizeObserver(queuePills).observe(bar);new MutationObserver(queuePills).observe(bar,{childList:true});
  function openActPicker(){
    const body=dialog('Wybierz akt prawny'),searching=!!globalThis.__POLICE_SEARCH_STATE?.active;
    const filters=new Map((globalThis.__POLICE_SEARCH_FILTERS?.list()||[]).map(item=>[item.code,item]));
    for(const act of DATA){
      const meta=META[act[0]]||[act[0],act[1]],state=filters.get(act[0]);
      const item=button('','act-picker-item',()=>{
        const code=act[0];closeModal();const pill=bar.querySelector('[data-act="'+CSS.escape(code)+'"]');
        pill?.click();pill?.scrollIntoView({inline:'center',block:'nearest',behavior:'auto'});queuePills();
      });
      item.setAttribute('aria-current',String(ACT?.[0]===act[0]));
      const short=document.createElement('b');short.textContent=meta[0];const copy=document.createElement('span');copy.textContent=meta[1];
      const detail=document.createElement('small');detail.textContent=searching?(state?.enabled?`${state.hits} wyników`:'Wyłączony z wyszukiwania'):(globalThis.__LAW_PACKAGES.isEnabled(act[0])?`${act[3].length} artykułów`:'Pakiet wyszukiwania wyłączony · można czytać');
      item.disabled=searching&&(!state?.enabled||!state?.hits);copy.append(detail);item.append(short,copy);body.append(item);
    }
  }

  const toc=document.createElement('aside');toc.className='reader-toc';toc.id='readerToc';toc.setAttribute('role','dialog');toc.setAttribute('aria-modal','true');toc.setAttribute('aria-label','Spis treści bieżącej ustawy');toc.inert=true;
  const shade=document.createElement('div');shade.className='reader-toc-backdrop';shade.setAttribute('aria-hidden','true');shade.onclick=()=>closeToc();
  const tocHead=document.createElement('div');tocHead.className='reader-dialog-head';const tocTitle=document.createElement('h2');tocTitle.textContent='Spis treści';
  const tocClose=button('×','reader-close',()=>closeToc());tocClose.setAttribute('aria-label','Zamknij spis treści');tocHead.append(tocTitle,tocClose);
  const tocBody=document.createElement('div');tocBody.className='reader-toc-scroll';toc.append(tocHead,tocBody);document.body.append(shade,toc);
  let tocCode='',tocOpen=false,tocFocus=null,gesture=null,suppressUntil=0;
  function articleNumber(row){return String(row[2]).replace(/^Art\.\s*/i,'A. ')}
  function renderBranch(node){
    const details=document.createElement('details');details.className='reader-toc-group';
    const summary=document.createElement('summary'),prefix=document.createElement('b'),title=document.createElement('span'),range=document.createElement('small');
    prefix.textContent=node.prefix;title.textContent=node.title;range.textContent=articleNumber(node.rows[0])+(node.rows.length>1?' – '+articleNumber(node.rows.at(-1)).replace(/^A\.\s*/,''):'');summary.append(prefix,title,range);
    const children=document.createElement('div');children.className='reader-toc-children';details.append(summary,children);
    if(node.children.length)node.children.forEach(child=>children.append(renderBranch(child)));
    else details.addEventListener('toggle',()=>{
      if(!details.open||children.childElementCount)return;
      for(const row of node.rows){
        const link=button('','reader-toc-article',()=>{closeToc(false);globalThis.__POLICE_GOTO_ID?.(row[0],{smooth:false});});
        const no=document.createElement('b'),description=document.createElement('span');no.textContent=articleNumber(row);description.textContent=row[3];link.append(no,description);
        link.setAttribute('aria-current',String(location.hash==='#'+row[0]));children.append(link);
      }
    });
    return details;
  }
  function buildToc(){
    if(!ACT||tocCode===ACT[0])return;tocCode=ACT[0];tocBody.textContent='';
    const name=document.createElement('div');name.className='reader-toc-name';name.textContent=META[ACT[0]]?.[1]||ACT[1];tocBody.append(name);
    core.sections(ACT[3],row=>globalThis.__EDITORIAL?.sectionInfo(row,ACT[0])||{prefix:row[1]||'Artykuły',title:''}).forEach(node=>tocBody.append(renderBranch(node)));
  }
  function eligible(){return !!ACT&&!document.body.matches('.drawer-open,.search-active,.settings-open,.favorite-editing,.favorite-swipe-active,.favorites-all-acts')&&!modal}
  function openToc(){
    if(!eligible()&&!tocOpen)return;buildToc();tocFocus=document.activeElement;tocOpen=true;
    toc.classList.remove('is-dragging');shade.classList.remove('is-dragging');toc.style.removeProperty('--toc-x');shade.style.removeProperty('--toc-opacity');toc.classList.add('is-open');shade.classList.add('is-open');toc.inert=false;document.body.classList.add('reader-toc-active');tocClose.focus({preventScroll:true});
  }
  function closeToc(focus=true){
    tocOpen=false;toc.classList.remove('is-open','is-dragging');shade.classList.remove('is-open','is-dragging');toc.style.removeProperty('--toc-x');shade.style.removeProperty('--toc-opacity');toc.inert=true;document.body.classList.remove('reader-toc-active');if(focus)tocFocus?.focus?.({preventScroll:true});
  }
  globalThis.__READER_TOC_OPEN=openToc;
  function beginGesture(x,y,target){
    if(tocOpen){if(target.closest('.reader-toc')&&x>toc.getBoundingClientRect().right-38)return{x,y,closing:true,axis:null};return null}
    if(!eligible()||x>28||y<(document.querySelector('.top')?.getBoundingClientRect().bottom||0)||target.closest('button,input,a,summary'))return null;
    return{x,y,closing:false,axis:null};
  }
  function moveGesture(x,y,event){
    if(!gesture)return;const dx=x-gesture.x,dy=y-gesture.y;
    if(!gesture.axis&&Math.max(Math.abs(dx),Math.abs(dy))>9)gesture.axis=Math.abs(dx)>Math.abs(dy)*1.2?'x':'y';
    if(gesture.axis!=='x')return;if(!gesture.closing&&dx<=0&&!gesture.prepared)return;
    event.preventDefault();buildToc();gesture.prepared=true;
    const width=toc.getBoundingClientRect().width,offset=Math.max(-width,Math.min(0,gesture.closing?dx:dx-width));
    toc.classList.add('is-dragging');shade.classList.add('is-dragging');toc.style.setProperty('--toc-x',offset+'px');shade.style.setProperty('--toc-opacity',String(.24*(1+offset/width)));
  }
  function endGesture(x,cancelled=false){
    const state=gesture;gesture=null;if(!state?.prepared)return;
    const dx=x-state.x,width=toc.getBoundingClientRect().width,threshold=Math.min(96,width*.3);suppressUntil=Date.now()+400;
    if(state.closing){if(!cancelled&&dx<-threshold)closeToc();else openToc()}
    else if(!cancelled&&dx>threshold)openToc();else closeToc(false);
  }
  document.addEventListener('touchstart',e=>{if(e.touches.length===1){const p=e.touches[0];gesture=beginGesture(p.clientX,p.clientY,e.target)}},{capture:true,passive:true});
  document.addEventListener('touchmove',e=>{if(e.touches.length===1){const p=e.touches[0];moveGesture(p.clientX,p.clientY,e)}},{capture:true,passive:false});
  document.addEventListener('touchend',e=>endGesture(e.changedTouches[0]?.clientX||0),{capture:true,passive:true});document.addEventListener('touchcancel',()=>endGesture(0,true),true);
  document.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'&&e.button===0)gesture=beginGesture(e.clientX,e.clientY,e.target)},true);
  document.addEventListener('pointermove',e=>{if(e.pointerType!=='touch')moveGesture(e.clientX,e.clientY,e)},true);document.addEventListener('pointerup',e=>{if(e.pointerType!=='touch')endGesture(e.clientX)},true);document.addEventListener('pointercancel',()=>endGesture(0,true),true);
  document.addEventListener('click',e=>{if(Date.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation()}},true);
  document.addEventListener('keydown',e=>{
    if(!tocOpen)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeToc();return}
    if(e.key==='Tab'){const elements=[...toc.querySelectorAll('button,summary')].filter(el=>el.getClientRects().length),first=elements[0],last=elements.at(-1);if(e.shiftKey&&(document.activeElement===first||!toc.contains(document.activeElement))){e.preventDefault();last?.focus()}else if(!e.shiftKey&&(document.activeElement===last||!toc.contains(document.activeElement))){e.preventDefault();first?.focus()}}
  },true);

  function installArticleTools(root=document.getElementById('actview')){
    if(!root)return;
    for(const article of root.querySelectorAll('article.legal-unit')){
      const comment=globalThis.__ARTICLE_COMMENTS?.[article.id],head=article.querySelector('.unit-head');
      if(!head||!comment?.body?.trim()||head.querySelector('.unit-comment'))continue;
      const icon=button('','unit-comment',()=>{const body=dialog(comment.title||'Komentarz do '+article.querySelector('.unit-title').textContent);const copy=document.createElement('div');copy.className='comment-body';copy.textContent=comment.body;body.append(copy);if(comment.updated){const date=document.createElement('p');date.className='comment-updated';date.textContent='Aktualizacja komentarza: '+comment.updated;body.append(date)}});
      icon.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v12H9l-5 4V4Z"/><path d="M8 8h8M8 12h6"/></svg>';icon.setAttribute('aria-label','Komentarz do '+article.querySelector('.unit-title').textContent);head.classList.add('has-comment');head.append(icon);
    }
  }
  function renderPackages(){
    const list=document.getElementById('packageList'),summary=document.getElementById('packageSummary'),api=globalThis.__POLICE_PACKAGES;if(!list||!api)return;
    const items=api.list(),enabled=items.filter(item=>item.enabled);summary.textContent=`Włączone: ${enabled.length} z ${items.length} · ${enabled.reduce((sum,item)=>sum+item.articles,0)} artykułów w wyszukiwaniu.`;
    if(list.dataset.ready){for(const input of list.querySelectorAll('input'))input.checked=items.find(item=>item.code===input.dataset.code)?.enabled;return}
    list.textContent='';
    for(const item of items){
      const label=document.createElement('label');label.className='package-row';const copy=document.createElement('span'),name=document.createElement('b'),detail=document.createElement('small');name.textContent=item.name;detail.textContent=`${item.articles} artykułów`;copy.append(name,detail);
      const input=document.createElement('input');input.type='checkbox';input.dataset.code=item.code;input.checked=item.enabled;input.setAttribute('aria-label','Wyszukiwanie: '+item.name);
      input.onchange=()=>{if(!api.setEnabled(item.code,input.checked)){input.checked=!input.checked;summary.textContent='Nie udało się zapisać wyboru pakietów. Spróbuj ponownie.'}else renderPackages()};label.append(copy,input);list.append(label);
    }
    list.dataset.ready='1';
  }
  function onRendered(){
    if(tocOpen)closeToc(false);queuePills();installArticleTools();renderPackages();
    const old=document.getElementById('collapseToc');if(old){old.textContent='Otwórz spis';old.setAttribute('aria-controls','readerToc');old.onclick=openToc}
  }
  function clearState(){document.getElementById('clear').hidden=!document.getElementById('q').value}
  document.getElementById('q').addEventListener('input',clearState);window.addEventListener('police-law-search-state',()=>{queuePills();clearState()});
  window.addEventListener('police-law-rendered',onRendered);window.addEventListener('police-law-articles-rendered',()=>installArticleTools());window.addEventListener('police-law-favorites-change',()=>requestAnimationFrame(()=>installArticleTools()));window.addEventListener('police-law-packages-change',renderPackages);
  window.addEventListener('resize',()=>{if(tocOpen)closeToc();queuePills()},{passive:true});clearState();
})();
