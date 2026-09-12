/* Shared catalog controls: packages, saved ordering and passive overflow cues. */
(function(){
  const api=globalThis.__POLICE_PACKAGES,core=globalThis.__READER_CORE;
  const packageList=document.getElementById('packageList'),packageStatus=document.getElementById('packageSummary');
  const orderList=document.getElementById('actOrderList'),save=document.getElementById('saveActOrder'),status=document.getElementById('actOrderStatus');
  if(!api||!orderList||!packageList)return;
  const node=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!=null)el.textContent=text;return el};
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cues=new WeakMap();
  function watchList(list){
    if(cues.has(list))return cues.get(list);
    const frame=node('div','scroll-cue-frame'),footer=node('div','scroll-cue-footer'),cue=node('span','list-overflow-cue');
    cue.setAttribute('aria-hidden','true');footer.append(cue);list.before(frame);frame.append(list,footer);
    let queued=false;
    function measure(){
      queued=false;const box=list.getBoundingClientRect();if(!box.height)return;
      const rows=[...list.children].filter(row=>!row.hidden),rects=rows.map(row=>{const r=row.getBoundingClientRect();return{left:r.top,right:r.bottom,width:r.height}});
      const end=list.scrollHeight<=list.clientHeight+1||list.scrollTop+list.clientHeight>=list.scrollHeight-1;
      const state=end?{text:'+',amount:0,count:0}:core.overflowCue(rects,{right:box.bottom});
      if(cue.textContent!==state.text)cue.textContent=state.text;
      cue.style.setProperty('--list-cue-amount',String(state.amount));cue.dataset.remaining=String(state.count);
      list.style.setProperty('--list-fade',end?'0px':'12px');
      frame.classList.toggle('cue-at-end',end);
    }
    function queue(){if(!queued){queued=true;requestAnimationFrame(measure)}}
    const sizes=new ResizeObserver(queue);sizes.observe(list);sizes.observe(frame);
    new MutationObserver(()=>{sizes.disconnect();sizes.observe(list);sizes.observe(frame);for(const row of list.children)sizes.observe(row);queue()}).observe(list,{childList:true});
    list.addEventListener('scroll',queue,{passive:true});window.addEventListener('resize',queue,{passive:true});
    const control={queue,measure,frame};cues.set(list,control);queue();return control;
  }
  const orderCue=watchList(orderList);watchList(document.getElementById('searchActFilters'));
  let packageSignature='';
  function renderPackages(){
    const items=api.list(),groups=api.groups(),signature=groups.map(group=>group.id+':'+group.codes.join(',')).join('|');
    if(packageSignature!==signature){
      packageSignature=signature;packageList.replaceChildren();
      for(const group of groups){
        const section=node('details','law-package'),heading=node('summary','search-filter-row package-title'),label=node('b','',group.name),toggle=node('input'),children=node('div','package-acts');
        section.dataset.package=group.id;toggle.type='checkbox';toggle.dataset.packageToggle=group.id;toggle.setAttribute('aria-label','Cały pakiet: '+group.name);
        toggle.addEventListener('click',event=>event.stopPropagation());
        toggle.onchange=()=>{const on=group.codes.every(code=>api.list().find(item=>item.code===code)?.enabled);if(!api.setGroup(group.codes,!on))packageStatus.textContent='Nie udało się zapisać pakietu.';else packageStatus.textContent='';renderPackages()};
        heading.append(label,toggle);section.append(heading,children);
        for(const code of group.codes){
          const item=items.find(item=>item.code===code);if(!item)continue;
          const row=node('label','search-filter-row'),copy=node('span','search-filter-copy'),short=node('b','',item.short),name=node('small','',item.name),input=node('input');
          input.type='checkbox';input.dataset.code=code;input.setAttribute('aria-label','Wyszukiwanie: '+item.name);copy.append(short,name);row.append(copy,input);children.append(row);
          input.onchange=()=>{if(!api.setEnabled(code,input.checked))packageStatus.textContent='Nie udało się zapisać wyboru.';else packageStatus.textContent='';renderPackages()};
        }
        packageList.append(section);
      }
    }
    const enabled=new Set(items.filter(item=>item.enabled).map(item=>item.code));
    for(const input of packageList.querySelectorAll('input[data-code]'))input.checked=enabled.has(input.dataset.code);
    for(const group of groups){const input=packageList.querySelector('[data-package-toggle="'+group.id+'"]');if(!input)continue;const count=group.codes.filter(code=>enabled.has(code)).length;input.checked=count===group.codes.length;input.indeterminate=count>0&&count<group.codes.length;input.setAttribute('aria-checked',input.indeterminate?'mixed':String(input.checked))}
  }
  let draft=[],initial=[],slots=[],tiles=new Map(),drag=null,pending=null,holdTimer=0,autoFrame=0,suppressUntil=0;
  const flips=new Map();
  function dirty(){save.disabled=!!drag||draft.join('|')===initial.join('|')}
  function renderOrder(){
    if(drag)return;const items=api.list();if(items.map(item=>item.code).join('|')===initial.join('|')&&slots.length)return;
    draft=items.map(item=>item.code);initial=[...draft];slots=[];tiles.clear();orderList.replaceChildren();
    for(const [i,item] of items.entries()){
      const slot=node('div','order-slot'),number=node('span','order-number',i+1),tile=node('button','order-tile'),copy=node('span','order-copy'),short=node('b','',item.short),name=node('small','',item.name),grip=node('span','order-grip','⠿');
      number.setAttribute('aria-hidden','true');grip.setAttribute('aria-hidden','true');tile.type='button';tile.dataset.code=item.code;tile.setAttribute('aria-label','Przenieś '+item.short);copy.append(short,name);tile.append(copy,grip);slot.append(number,tile);orderList.append(slot);slots.push(slot);tiles.set(item.code,tile);
    }
    dirty();orderCue.queue();
  }
  function placeDraft(animate=true){
    const before=new Map([...tiles].map(([code,tile])=>[code,tile.getBoundingClientRect()]));
    draft.forEach((code,index)=>{const tile=tiles.get(code);if(tile.parentElement!==slots[index])slots[index].append(tile);tile.setAttribute('aria-label',`Przenieś ${api.list().find(item=>item.code===code)?.short||code}, pozycja ${index+1} z ${draft.length}`)});
    if(animate&&!reduced())for(const[code,tile]of tiles){flips.get(code)?.cancel();if(code===drag?.code)continue;const old=before.get(code),r=tile.getBoundingClientRect(),dy=old.top-r.top;if(Math.abs(dy)>.5){const animation=tile.animate?.([{transform:`translateY(${dy}px)`},{transform:'translateY(0)'}],{duration:260,easing:'cubic-bezier(.42,0,.2,1)'});if(animation)flips.set(code,animation)}}
    dirty();orderCue.queue();
  }
  function moveTo(index){if(!drag)return;const old=draft.indexOf(drag.code);index=Math.max(0,Math.min(draft.length-1,index));if(index===old)return;draft.splice(old,1);draft.splice(index,0,drag.code);placeDraft();status.textContent='Pozycja '+(index+1)+' z '+draft.length}
  function clearPending(){clearTimeout(holdTimer);holdTimer=0;pending=null}
  function begin(tile,x,y,keyboard=false){
    if(drag)return;const rect=tile.getBoundingClientRect();clearPending();
    const ghost=keyboard?null:tile.cloneNode(true);if(ghost){ghost.removeAttribute('aria-label');ghost.setAttribute('aria-hidden','true');ghost.tabIndex=-1;ghost.classList.add('order-drag-ghost');Object.assign(ghost.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px'});document.body.append(ghost);tile.classList.add('order-drag-source')}
    drag={code:tile.dataset.code,tile,ghost,origin:[...draft],x,y,offsetY:y-rect.top,rect,keyboard};tile.setAttribute('aria-pressed','true');document.body.classList.add('order-dragging');status.textContent='Przenieś i puść w wybranym miejscu.';dirty();
  }
  function move(x,y){
    if(!drag||drag.keyboard)return;drag.x=x;drag.y=y;drag.ghost.style.top=(y-drag.offsetY)+'px';
    let index=slots.findIndex(slot=>{const r=slot.getBoundingClientRect();return y<=r.top+r.height/2});if(index<0)index=slots.length-1;moveTo(index);
    if(!autoFrame)autoFrame=requestAnimationFrame(autoScroll);
  }
  function autoScroll(){
    autoFrame=0;if(!drag||drag.keyboard)return;const r=orderList.getBoundingClientRect(),zone=34,dy=drag.y<r.top+zone?-Math.min(8,(r.top+zone-drag.y)/4):drag.y>r.bottom-zone?Math.min(8,(drag.y-r.bottom+zone)/4):0;
    if(dy){const old=orderList.scrollTop;orderList.scrollTop+=dy;if(old!==orderList.scrollTop)move(drag.x,drag.y)}
  }
  function finish(cancel=false){
    clearPending();cancelAnimationFrame(autoFrame);autoFrame=0;if(!drag)return;
    const current=drag;drag=null;document.body.classList.remove('order-dragging');current.tile.removeAttribute('aria-pressed');suppressUntil=Date.now()+350;
    if(cancel){draft=current.origin;placeDraft()}
    const cleanup=()=>{current.ghost?.remove();current.tile.classList.remove('order-drag-source');dirty()};
    if(current.ghost&&!reduced()){
      const target=current.tile.getBoundingClientRect(),from=current.ghost.getBoundingClientRect(),animation=current.ghost.animate?.([{transform:'translateY(0)'},{transform:`translateY(${target.top-from.top}px)`}],{duration:240,easing:'cubic-bezier(.42,0,.2,1)'});
      if(animation){animation.onfinish=cleanup;animation.oncancel=cleanup}else cleanup();
    }else cleanup();
    status.textContent=cancel?'Przenoszenie anulowane.':draft.join('|')!==initial.join('|')?'Zapisz nową kolejność.':'';dirty();
  }
  orderList.addEventListener('pointerdown',event=>{if(event.pointerType==='touch'||event.button!==0)return;const tile=event.target.closest('.order-tile');if(!tile)return;pending={tile,x:event.clientX,y:event.clientY,pointerId:event.pointerId}});
  window.addEventListener('pointermove',event=>{if(event.pointerType==='touch')return;if(pending&&Math.hypot(event.clientX-pending.x,event.clientY-pending.y)>5){const p=pending;begin(p.tile,p.x,p.y);try{orderList.setPointerCapture(p.pointerId)}catch(_){}}if(drag&&!drag.keyboard){event.preventDefault();move(event.clientX,event.clientY)}},{passive:false});
  window.addEventListener('pointerup',event=>{if(event.pointerType!=='touch')finish()});window.addEventListener('pointercancel',event=>{if(event.pointerType!=='touch')finish(true)});
  orderList.addEventListener('touchstart',event=>{if(event.touches.length!==1)return;const tile=event.target.closest('.order-tile'),touch=event.touches[0];if(!tile)return;pending={tile,x:touch.clientX,y:touch.clientY};holdTimer=setTimeout(()=>{if(pending)begin(pending.tile,pending.x,pending.y)},320)},{passive:true});
  window.addEventListener('touchmove',event=>{const touch=event.touches[0];if(!touch)return;if(drag&&!drag.keyboard){event.preventDefault();move(touch.clientX,touch.clientY)}else if(pending&&Math.hypot(touch.clientX-pending.x,touch.clientY-pending.y)>8)clearPending()},{passive:false});
  window.addEventListener('touchend',()=>finish());window.addEventListener('touchcancel',()=>finish(true));
  orderList.addEventListener('contextmenu',event=>event.preventDefault());
  orderList.addEventListener('click',event=>{if(Date.now()<suppressUntil){event.preventDefault();event.stopImmediatePropagation()}},true);
  orderList.addEventListener('keydown',event=>{
    const tile=event.target.closest('.order-tile');if(!tile)return;
    if([' ','Enter'].includes(event.key)){event.preventDefault();if(drag)finish();else begin(tile,0,0,true)}
    else if(drag&&['ArrowUp','ArrowDown','Home','End'].includes(event.key)){event.preventDefault();const index=draft.indexOf(drag.code),next=event.key==='Home'?0:event.key==='End'?draft.length-1:index+(event.key==='ArrowUp'?-1:1);moveTo(next);tile.focus({preventScroll:true});tile.scrollIntoView({block:'nearest',behavior:'auto'})}
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&drag){event.preventDefault();event.stopImmediatePropagation();finish(true)}},true);
  save.onclick=()=>{if(drag)return;if(api.setOrder(draft)){initial=[...draft];status.textContent='Kolejność zapisana na tym urządzeniu.';dirty()}else status.textContent='Nie udało się zapisać kolejności. Spróbuj ponownie.'};
  document.getElementById('settingsClose')?.addEventListener('click',()=>finish(true));
  document.getElementById('settingsBackdrop')?.addEventListener('click',()=>finish(true));
  window.addEventListener('police-law-settings-open',()=>{finish(true);initial=[];renderOrder();renderPackages();for(const list of [orderList,document.getElementById('searchActFilters')])cues.get(list)?.queue()});
  window.addEventListener('police-law-settings-close',()=>finish(true));
  window.addEventListener('police-law-rendered',()=>{renderPackages();renderOrder()});
  window.addEventListener('police-law-packages-change',renderPackages);
  globalThis.__READER_SETTINGS={renderPackages,refreshCues(){orderCue.queue();cues.get(document.getElementById('searchActFilters'))?.queue()}};
  renderPackages();renderOrder();
})();
