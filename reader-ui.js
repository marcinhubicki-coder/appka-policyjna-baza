/* Single-column chapter drawer, complete act picker, packages and sparse comments. */
(function(){
  const core=globalThis.__READER_CORE,bar=document.getElementById('quickbar');
  if(!core||!bar)return;
  // Focus remains functional; its visual cue is opt-in through keyboard use.
  document.addEventListener('keydown',event=>{if(event.key==='Tab')document.documentElement.classList.add('keyboard-navigation')},true);
  document.addEventListener('pointerdown',()=>document.documentElement.classList.remove('keyboard-navigation'),true);
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
  function closeModal(){if(!modal)return;modal.close();modal.remove();modal=null;globalThis.__READER_STATE?.lock('dialog',false);modalFocus?.focus?.({preventScroll:true});modalFocus=null}
  function dialog(title,minimal=false){
    closeModal();modalFocus=document.activeElement;modal=document.createElement('dialog');modal.className='reader-dialog';
    const head=document.createElement('div');head.className='reader-dialog-head';const heading=document.createElement('h2');heading.id='readerDialogTitle';heading.textContent=title;
    if(minimal){modal.classList.add('act-picker');modal.setAttribute('aria-label',title)}else modal.setAttribute('aria-labelledby',heading.id);const close=button('×','reader-close',closeModal);close.setAttribute('aria-label','Zamknij');head.append(heading,close);
    const body=document.createElement('div');body.className='reader-dialog-body';if(!minimal)modal.append(head);modal.append(body);document.body.append(modal);
    modal.addEventListener('cancel',event=>{event.preventDefault();closeModal()});
    modal.addEventListener('click',event=>{if(event.target!==modal)return;const r=modal.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeModal()});
    globalThis.__READER_STATE?.lock('dialog',true);modal.showModal();if(!minimal)close.focus();return body;
  }
  document.addEventListener('keydown',event=>{if(modal&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeModal()}},true);

  const wrap=document.createElement('div');wrap.className='quickbar-wrap';bar.before(wrap);wrap.append(bar);
  const more=button('','acts-more',openActPicker),moreLabel=document.createElement('span'),moreSlot=document.createElement('div');moreLabel.textContent='+';more.append(moreLabel);more.dataset.maxCount='+'+DATA.length;more.setAttribute('aria-label','Wybierz akt z pełnej listy');moreSlot.className='acts-more-slot';moreSlot.append(more);wrap.append(moreSlot);
  let pillsQueued=false,tailResting=false,releaseTimer=0,settleTimer=0,settlingUntil=0,lastLeft=0,lastCue=1,pillPointer=null,pillTouch=null,tailPull=0,tailAnchor=null,pillSuppressUntil=0;
  let tailCanSnap=true;
  function atRightEdge(){return bar.clientWidth>0&&bar.scrollWidth>bar.clientWidth&&bar.scrollLeft>=bar.scrollWidth-bar.clientWidth-1.5}
  function renderedPull(){
    const pill=bar.querySelector('button[data-act]:not([hidden])');if(!pill)return 0;
    const matrix=getComputedStyle(pill).transform.match(/^matrix(?:3d)?\((.+)\)$/)?.[1].split(',').map(Number);
    return matrix?(matrix.length===16?matrix[12]:matrix[4])||0:0;
  }
  function setPull(value){tailPull=value;wrap.style.setProperty('--tail-pull',value+'px')}
  function beginTail(point){
    const current=renderedPull();clearTimeout(releaseTimer);
    if(current<-.1){wrap.classList.add('is-tail-dragging');setPull(current);tailAnchor={x:point.x-120*Math.log(Math.max(.001,1+current/48)),y:point.y}}
    else tailAnchor=atRightEdge()?{...point}:null;
  }
  function dragTail(event,point,origin){
    if(!origin)return;
    const dx=point.x-origin.x,dy=point.y-origin.y;
    if(Math.abs(dx)<=Math.abs(dy))return;
    if(!tailAnchor&&dx<0&&atRightEdge())tailAnchor={...point};
    if(tailAnchor){
      const distance=tailAnchor.x-point.x;
      if(distance>0){
        if(event.cancelable)event.preventDefault();
        wrap.classList.add('is-tail-dragging');setPull(-48*(1-Math.exp(-distance/120)));pillSuppressUntil=Date.now()+350;return;
      }
      setPull(0);tailAnchor=null;
    }
    if(dx>3)restTail(false);
  }
  function finishTail(){
    if(pillPointer||pillTouch)return;
    const pulled=tailPull<-.1;tailAnchor=null;
    if(pulled)pillSuppressUntil=Date.now()+350;
    wrap.classList.remove('is-tail-dragging');setPull(0);
    // Both the stretched content and the freed gutter settle in the same frame.
    if(pulled||atRightEdge()){lastCue=0;restTail(true)}else releaseTail();
  }
  function restTail(on){
    if(tailResting===on)return;if(!on)tailCanSnap=false;tailResting=on;clearTimeout(releaseTimer);clearTimeout(settleTimer);
    settlingUntil=performance.now()+360;wrap.classList.toggle('is-tail-resting',on);if(on){more.style.setProperty('--cue-amount','0');more.disabled=true;more.tabIndex=-1;more.setAttribute('aria-hidden','true')}
    settleTimer=setTimeout(()=>{lastLeft=bar.scrollLeft;queuePills()},370);queuePills();
  }
  function releaseTail(){
    clearTimeout(releaseTimer);
    if(tailResting||pillPointer||pillTouch||lastCue!==0||bar.clientWidth<=0||bar.querySelector('[data-count-moving]'))return;
    releaseTimer=setTimeout(()=>{if(!pillPointer&&!pillTouch&&lastCue===0)restTail(true)},0);
  }
  function measurePills(){
    const pills=[...bar.querySelectorAll('button[data-act]')].filter(p=>!p.hidden),viewport=bar.getBoundingClientRect(),pull=renderedPull(),rects=pills.map(p=>{const rect=p.getBoundingClientRect();return{left:rect.left-pull,right:rect.right-pull,width:rect.width}});
    if(viewport.width===0)return;
    const width=more.offsetWidth;if(width>0)wrap.style.setProperty('--more-width',width+'px');
    const right=viewport.right-parseFloat(getComputedStyle(bar).paddingRight||0),cue=atRightEdge()||(tailResting&&performance.now()<settlingUntil)?{text:'+',amount:0,count:0}:core.overflowCue(rects,{right});
    if(tailResting&&!atRightEdge()&&performance.now()>=settlingUntil&&(rects.at(-1)?.right||0)>right+1.5)restTail(false);
    lastCue=cue.amount;
    if(cue.amount>.65)tailCanSnap=true;
    if(!tailResting&&tailCanSnap&&cue.amount>0&&cue.amount<=.45&&bar.scrollWidth>bar.clientWidth&&!bar.querySelector('[data-count-moving]')){restTail(true);return}
    bar.style.setProperty('--pills-fade-left',Math.min(20,Math.max(0,bar.scrollLeft))+'px');
    bar.style.setProperty('--pills-fade-right',Math.min(20,Math.max(0,(rects.at(-1)?.right||0)-right))+'px');
    if(moreLabel.textContent!==cue.text)moreLabel.textContent=cue.text;
    more.style.setProperty('--cue-amount',String(cue.amount));more.disabled=cue.amount===0;more.tabIndex=cue.amount===0?-1:0;more.setAttribute('aria-hidden',String(cue.amount===0));
    more.setAttribute('aria-label',cue.count?cue.count+' ustaw po prawej. Wybierz ustawę.':'Wybierz ustawę');
    releaseTail();
  }
  function queuePills(){if(pillsQueued)return;pillsQueued=true;requestAnimationFrame(()=>{pillsQueued=false;measurePills()})}
  const pillSizes=new ResizeObserver(queuePills);
  function observePills(){pillSizes.disconnect();pillSizes.observe(bar);bar.querySelectorAll('button[data-act]').forEach(pill=>pillSizes.observe(pill));queuePills()}
  bar.addEventListener('scroll',()=>{if(tailResting&&performance.now()>settlingUntil&&bar.scrollLeft<lastLeft-.5)restTail(false);lastLeft=bar.scrollLeft;queuePills();releaseTail()},{passive:true});
  bar.addEventListener('scrollend',releaseTail,{passive:true});
  bar.addEventListener('pointerdown',event=>{pillPointer={x:event.clientX,y:event.clientY};beginTail(pillPointer)},{passive:true});
  bar.addEventListener('pointermove',event=>{if(!pillTouch)dragTail(event,{x:event.clientX,y:event.clientY},pillPointer)},{passive:false});
  function releasePointer(){if(!pillPointer)return;pillPointer=null;finishTail()}
  window.addEventListener('pointerup',releasePointer,{passive:true});window.addEventListener('pointercancel',releasePointer,{passive:true});
  // Native touch scrolling cancels Pointer Events before the finger is lifted.
  bar.addEventListener('touchstart',event=>{const touch=event.touches[0];if(touch){pillTouch={x:touch.clientX,y:touch.clientY};beginTail(pillTouch)}},{passive:true});
  bar.addEventListener('touchmove',event=>{const touch=event.touches[0];if(touch)dragTail(event,{x:touch.clientX,y:touch.clientY},pillTouch)},{passive:false});
  window.addEventListener('touchend',event=>{if(!event.touches.length&&pillTouch){pillTouch=null;finishTail()}},{passive:true});
  window.addEventListener('touchcancel',()=>{if(pillTouch){pillTouch=null;finishTail()}},{passive:true});
  bar.addEventListener('click',event=>{if(event.detail!==0&&Date.now()<pillSuppressUntil){event.preventDefault();event.stopImmediatePropagation()}},true);
  bar.addEventListener('wheel',event=>{if(event.deltaX<0||(event.shiftKey&&event.deltaY<0))restTail(false)},{passive:true});
  bar.addEventListener('keydown',event=>{if(['ArrowLeft','Home'].includes(event.key))restTail(false)});
  window.addEventListener('police-law-quickbar-motion',queuePills);
  new MutationObserver(observePills).observe(bar,{childList:true});observePills();
  function openActPicker(){
    const body=dialog('Wybierz akt prawny',true);
    for(const act of DATA){
      const meta=META[act[0]]||[act[0],act[1]],pill=bar.querySelector('[data-act="'+CSS.escape(act[0])+'"]');
      if(!pill||pill.hidden)continue;
      const item=button('','act-picker-item',()=>{
        const code=act[0];closeModal();const pill=bar.querySelector('[data-act="'+CSS.escape(code)+'"]');
        pill?.click();if(pill){const r=pill.getBoundingClientRect(),box=bar.getBoundingClientRect();bar.scrollTo({left:bar.scrollLeft+r.left-box.left-(box.width-r.width)/2,behavior:'auto'})}queuePills();
      });
      item.setAttribute('aria-current',String(ACT?.[0]===act[0]));
      const short=document.createElement('b');short.textContent=meta[0];const copy=document.createElement('span');copy.textContent=meta[1];

      item.append(short,copy);body.append(item);
    }
    body.querySelector('button')?.focus();
  }

  const toc=document.createElement('aside');toc.className='reader-toc';toc.id='readerToc';toc.setAttribute('role','dialog');toc.setAttribute('aria-modal','true');toc.setAttribute('aria-label','Spis treści bieżącej ustawy');toc.inert=true;
  const shade=document.createElement('div');shade.className='reader-toc-backdrop';shade.setAttribute('aria-hidden','true');shade.onclick=()=>closeToc();
  const tocBody=document.createElement('div');tocBody.className='reader-toc-scroll';toc.append(tocBody);document.body.append(shade,toc);
  let tocCode='',tocOpen=false,tocFocus=null,gesture=null,suppressUntil=0,tocFrame=0,tocMotion=0;
  function stopTocMotion(){cancelAnimationFrame(tocFrame);tocMotion++;toc.querySelectorAll('.reader-toc-children').forEach(el=>el.getAnimations?.().forEach(animation=>animation.cancel()))}
  function revealSection(details,children){
    stopTocMotion();const token=tocMotion;
    if(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
    children.animate?.([{height:'0px',opacity:0,overflow:'hidden',transform:'translateY(-4px)'},{height:children.scrollHeight+'px',opacity:1,overflow:'hidden',transform:'translateY(0)'}],{duration:220,easing:'cubic-bezier(.2,.7,.2,1)'});
    const start=tocBody.scrollTop,began=performance.now();
    function frame(now){if(token!==tocMotion||!tocOpen||!details.open)return;const target=Math.max(0,Math.min(tocBody.scrollHeight-tocBody.clientHeight,tocBody.scrollTop+details.getBoundingClientRect().top-tocBody.getBoundingClientRect().top-8)),t=Math.min(1,(now-began)/240),ease=1-Math.pow(1-t,3);tocBody.scrollTop=start+(target-start)*ease;if(t<1)tocFrame=requestAnimationFrame(frame)}
    tocFrame=requestAnimationFrame(frame);
  }
  tocBody.addEventListener('wheel',stopTocMotion,{passive:true});tocBody.addEventListener('touchstart',stopTocMotion,{passive:true});
  function articleNumber(row){return String(row[2]).replace(/^Art\.\s*/i,'A. ')}
  function renderBranch(node){
    const details=document.createElement('details');details.className='reader-toc-group';
    const summary=document.createElement('summary'),prefix=document.createElement('b'),title=document.createElement('span'),range=document.createElement('small');
    prefix.textContent=node.prefix;title.textContent=node.title;range.textContent=articleNumber(node.rows[0])+(node.rows.length>1?' – '+articleNumber(node.rows.at(-1)).replace(/^A\.\s*/,''):'');summary.append(prefix,title,range);
    const children=document.createElement('div');children.className='reader-toc-children';details.append(summary,children);
    if(node.children.length)node.children.forEach(child=>children.append(renderBranch(child)));
    details.addEventListener('toggle',()=>{
      if(!details.open)return;
      for(const sibling of details.parentElement.children)if(sibling!==details&&sibling.matches('.reader-toc-group')){sibling.open=false;sibling.querySelectorAll('details[open]').forEach(child=>child.open=false)}
      if(!node.children.length&&!children.childElementCount)for(const row of node.rows){
        const link=button('','reader-toc-article',()=>{closeToc(false);globalThis.__POLICE_GOTO_ID?.(row[0],{smooth:false});});
        const no=document.createElement('b'),description=document.createElement('span');no.textContent=articleNumber(row);description.textContent=row[3];link.append(no,description);
        link.setAttribute('aria-current',String(location.hash==='#'+row[0]));children.append(link);
      }
      revealSection(details,children);
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
    toc.classList.remove('is-dragging');shade.classList.remove('is-dragging');toc.style.removeProperty('--toc-x');shade.style.removeProperty('--toc-opacity');toc.classList.add('is-open');shade.classList.add('is-open');toc.inert=false;document.body.classList.add('reader-toc-active');globalThis.__READER_STATE?.lock('toc',true);toc.querySelector('summary,button')?.focus({preventScroll:true});
  }
  function closeToc(focus=true){
    tocOpen=false;stopTocMotion();toc.classList.remove('is-open','is-dragging');shade.classList.remove('is-open','is-dragging');toc.style.removeProperty('--toc-x');shade.style.removeProperty('--toc-opacity');toc.inert=true;document.body.classList.remove('reader-toc-active');globalThis.__READER_STATE?.lock('toc',false);if(focus)tocFocus?.focus?.({preventScroll:true});
  }
  globalThis.__READER_TOC_OPEN=openToc;globalThis.__READER_TOC_CLOSE=closeToc;
  function beginGesture(x,y,target){
    if(tocOpen){if(target.closest('.reader-toc')&&x>toc.getBoundingClientRect().right-38)return{x,y,closing:true,axis:null};return null}
    if(!eligible()||x>28||y<(document.querySelector('.top')?.getBoundingClientRect().bottom||0)||target.closest('button,input,a,summary'))return null;
    return{x,y,closing:false,axis:null};
  }
  function moveGesture(x,y,event){
    if(!gesture)return;const dx=x-gesture.x,dy=y-gesture.y;
    if(!gesture.axis&&Math.max(Math.abs(dx),Math.abs(dy))>9)gesture.axis=Math.abs(dx)>Math.abs(dy)*1.2?'x':'y';
    if(gesture.axis!=='x')return;if(!gesture.closing&&dx<=0&&!gesture.prepared)return;
    event.preventDefault();buildToc();gesture.prepared=true;globalThis.__READER_STATE?.lock('toc',true);
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
  document.addEventListener('click',e=>{if(e.detail!==0&&Date.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation()}},true);
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
    const items=api.list();summary.textContent='';
    if(list.dataset.ready){for(const input of list.querySelectorAll('input'))input.checked=items.find(item=>item.code===input.dataset.code)?.enabled;return}
    list.textContent='';
    for(const item of items){
      const label=document.createElement('label');label.className='search-filter-row';const copy=document.createElement('span'),name=document.createElement('b'),detail=document.createElement('small');copy.className='search-filter-copy';name.textContent=item.short;detail.textContent=item.name;copy.append(name,detail);
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
  document.getElementById('q').addEventListener('focus',()=>{if(tocOpen)closeToc(false)});document.getElementById('q').addEventListener('input',clearState);window.addEventListener('police-law-search-state',()=>{queuePills();clearState()});
  window.addEventListener('police-law-rendered',onRendered);window.addEventListener('police-law-articles-rendered',()=>installArticleTools());window.addEventListener('police-law-favorites-change',()=>requestAnimationFrame(()=>installArticleTools()));window.addEventListener('police-law-packages-change',()=>{renderPackages();queuePills()});
  window.addEventListener('resize',()=>{if(tocOpen)closeToc();queuePills()},{passive:true});clearState();
})();
