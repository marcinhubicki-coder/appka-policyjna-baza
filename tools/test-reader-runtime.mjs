import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {gzipSync} from 'node:zlib';
import {JSDOM,VirtualConsole} from 'jsdom';

// Execute the actual page modules against a deterministic DOM. Geometry is
// simulated here; device layout, animation and timings require browser review.
const path=[{prefix:'Dział I',title:'Część pierwsza',level:1},{prefix:'Rozdział 1',title:'Zadania',level:2}];
const row=n=>['uop-art-'+n,'Rozdział 1','Art. '+n,'Zadania Policji',[
  ['uop-art-'+n+'-ust-1','u','ust. 1','Służba Policji. Odwołanie do art. 1 ust. 2.'],
  ['uop-art-'+n+'-ust-2','u','ust. 2','Ochrona ludzi.']
],'','',[],'e',n<=2?path:[path[0],{prefix:'Rozdział 2',title:'Dalsze zadania',level:2}]];
const fixture=[['uop','Ustawa o Policji','https://example.org/source.pdf',[1,2,3,4,5,315].map(row)],['alk','Ustawa alkoholowa','https://example.org/alk.pdf',[['alk-art-1','','Art. 1','Trzeźwość',[['','l','','unikalnehaslo alkoholowe']],'','',[],'e']]]];
const html=fs.readFileSync('index.html','utf8'),errors=[],log=new VirtualConsole();
log.on('jsdomError',e=>errors.push(e));
const dom=new JSDOM(html.replace(/<script[^>]*>[\s\S]*?<\/script>/g,''),{url:'https://reader.test/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:log});
const w=dom.window;
Object.assign(w,{Response,Blob,DecompressionStream,TextDecoder,TextEncoder,innerWidth:390,innerHeight:844});
w.matchMedia=()=>({matches:false,addEventListener(){}});
w.ResizeObserver=class{observe(){}disconnect(){}};w.IntersectionObserver=class{observe(){}disconnect(){}};
w.HTMLCanvasElement.prototype.getContext=()=>({measureText:t=>({width:t.length*6})});
w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLElement.prototype.scrollTo=function(){};w.scrollTo=()=>{};w.scrollBy=()=>{};
w.HTMLElement.prototype.getBoundingClientRect=function(){const far=this.classList.contains('law-stream-sentinel');return{x:0,y:far?10000:120,left:0,right:390,top:far?10000:120,bottom:far?10010:700,width:390,height:580}};
w.HTMLElement.prototype.getClientRects=function(){return this.closest('[hidden]')?[]:[this.getBoundingClientRect()]};
w.document.elementFromPoint=()=>w.document.querySelector('.legal-unit');
w.CSS={escape:x=>String(x).replace(/[^a-zA-Z0-9_-]/g,'\\$&')};
w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
w.__POLICE_B64=[gzipSync(JSON.stringify(fixture)).toString('base64')];
for(const match of html.matchAll(/<script src="([^"]+)"/g))if(!['data.js','offline.js'].includes(match[1]))vm.runInContext(fs.readFileSync(match[1],'utf8'),dom.getInternalVMContext(),{filename:match[1]});
const settle=()=>new Promise(resolve=>setTimeout(resolve,130));
for(let n=0;n<20&&!w.document.querySelector("#hamburger");n++)await settle();
const click=selector=>{const el=w.document.querySelector(selector);assert.ok(el,selector);el.click();return el};
const query=selector=>w.document.querySelector(selector);
assert.equal(errors.length,0,errors.map(e=>e.message).join('\n'));
assert.equal(query('#clear').hidden,true);
assert.equal(w.document.documentElement.classList.contains('keyboard-navigation'),false);
w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Tab',bubbles:true}));
assert.equal(w.document.documentElement.classList.contains('keyboard-navigation'),true);
w.document.body.dispatchEvent(new w.MouseEvent('pointerdown',{bubbles:true}));
assert.equal(w.document.documentElement.classList.contains('keyboard-navigation'),false);
assert.equal(w.__POLICE_PACKAGES.list().find(a=>a.code==='alk').enabled,false);
assert.equal(w.eval('searchIndex.length'),6);
assert.equal(w.__POLICE_PACKAGES.setEnabled('alk',true),true);assert.equal(w.eval('searchIndex.length'),7);
w.__POLICE_PACKAGES.setEnabled('alk',false);assert.equal(w.eval('searchIndex.length'),6);
assert.equal(query('#quickbar [data-act="alk"]').hidden,true);

// The permanent display row survives every reader render and has no duplicate scope button.
click('#hamburger');await settle();
const fixedLabel=query('.drawer > .favorites-label');assert.ok(fixedLabel);assert.equal(query('.favorites-label-text').textContent,'Wyświetlanie');assert.equal(query('.favorites-scope-button'),null);
const eye=query('.favorites-highlight');eye.dispatchEvent(new w.MouseEvent('contextmenu',{bubbles:true,cancelable:true}));
assert.equal(w.__READER_STATE.frozen,true);assert.equal(query('.drawer').inert,true);
const decoration=query('[data-display-option="highlights"]'),night=query('[data-display-option="dark"]');
const favoritesAppearance=query('[data-display-option="favorites"]');assert.equal(favoritesAppearance.getAttribute('aria-checked'),'true');favoritesAppearance.click();assert.equal(w.__FAVORITES_HIGHLIGHT.get(),false);assert.equal(decoration.getAttribute('aria-checked'),'true');favoritesAppearance.click();
assert.equal(decoration.getAttribute('aria-checked'),'true');assert.equal(night.getAttribute('aria-checked'),'false');
assert.ok(decoration.matches('.favorites-scope-toggle'));assert.ok(query('.reader-display-options.favorites-scope-popover'));
decoration.click();night.click();
assert.equal(w.document.documentElement.classList.contains('reader-highlights-off'),true);assert.equal(w.document.documentElement.dataset.readerTheme,'dark');assert.equal(w.localStorage.getItem('reader-dark'),'on');
w.dispatchEvent(new w.Event('scroll'));assert.ok(query('.reader-display-options'),'scroll does not move or close an open long-press menu');
night.click();decoration.click();click('.reader-popover-shade');
assert.equal(w.__READER_STATE.frozen,false);assert.equal(query('.reader-display-options'),null);
w.eval("renderAct('uop', 'uop-art-2', false)");await settle();assert.equal(query('.drawer > .favorites-label'),fixedLabel);click('#hamburger');await settle();

// The same gear opens the production context, with favorites in system settings.
click('#settingsButton');
assert.equal(query('main').inert,true);assert.equal(query('.top').inert,true);assert.equal(w.__READER_STATE.frozen,true);
assert.equal(query('#settingsTitle').textContent,'Ustawienia systemowe');
assert.equal(query('#favoritesTransfer').hidden,false);
assert.equal(query('#lawPackages').hidden,true);
assert.equal(query('#performanceDiagnostics').hidden,true);
assert.equal(query('#favoritesTransferStatus').textContent,'');
click('#settingsClose');click('#hamburger');await settle();click('#settingsButton');
assert.equal(query('#settingsTitle').textContent,'Ustawienia wyświetlania');
assert.equal(query('#favoritesTransfer').hidden,true);
assert.equal(query('#lawPackages').hidden,false);
assert.equal(query('#performanceDiagnostics').hidden,false);
assert.equal(query('.chapter-no').textContent,'Rozdział I');
assert.equal(query('.chapter-title').textContent,'Zadania');
for(const id of ['packageDetails','readerHelpDetails']){
  assert.equal(query('#'+id).hidden,true);
  const toggle=click('[aria-controls="'+id+'"]');
  assert.equal(query('#'+id).hidden,false);assert.equal(toggle.className,query('#performanceToggle').className);
  toggle.click();assert.equal(query('#'+id).hidden,true);
}
assert.equal(w.document.querySelectorAll('#packageList input[type="checkbox"]').length,2);
click('#settingsClose');click('#hamburger');
const originalPills=[...w.document.querySelectorAll('#quickbar button')],originalBadge=originalPills[0].querySelector('.act-pill-count');
query('#q').value='slu';query('#q').dispatchEvent(new w.Event('input'));
assert.equal(w.__POLICE_SEARCH_STATE.pending,true);
assert.equal(originalPills[0].hidden,false,'do not blank the quickbar before search results arrive');
await new Promise(r=>setTimeout(r,180));
query('#q').value='sluzba';query('#q').dispatchEvent(new w.Event('input'));
await new Promise(r=>setTimeout(r,200));assert.equal(w.__POLICE_SEARCH_STATE.pending,true,'each keystroke restarts the 300 ms pause');
await new Promise(r=>setTimeout(r,140));
assert.equal(w.__POLICE_SEARCH_STATE.pending,false);
assert.deepEqual([...w.document.querySelectorAll('#quickbar button')],originalPills,'search reuses the same act buttons');
assert.equal(originalPills[0].querySelector('.act-pill-count'),originalBadge);
await new Promise(r=>setTimeout(r,350));assert.equal(originalBadge.textContent,'6');
click('#settingsButton');assert.equal(query('#settingsTitle').textContent,'Ustawienia wyszukiwania');
assert.equal(query('#searchSettings').hidden,false);
assert.ok([...w.document.querySelectorAll('.settings-general')].every(n=>n.hidden));
w.__POLICE_SEARCH_FILTERS.setEnabled('uop',false);await settle();
assert.equal(query('#quickbar [data-act="uop"]').hidden,true);
w.__POLICE_SEARCH_FILTERS.resetAll();await settle();
assert.equal(query('#quickbar [data-act="uop"]').hidden,false);
click('#settingsClose');
const searchPill=query('#quickbar [data-act="uop"]'),searchPillRect=searchPill.getBoundingClientRect;
assert.equal(searchPill.dataset.hitCount,'6');assert.equal(searchPill.classList.contains('search-has-hit'),true);
assert.match(searchPill.getAttribute('aria-label'),/6 wyników/);
searchPill.getBoundingClientRect=()=>({left:370,right:470,width:100});
query('#quickbar').dispatchEvent(new w.Event('scroll'));await settle();
assert.equal(query('.acts-more').textContent,'+1','overflow counts acts, not search hits');
click('.acts-more');click('.act-picker-item');
assert.equal(query('.act-picker'),null);assert.equal(w.document.body.classList.contains('search-active'),true);
assert.equal(w.document.documentElement.classList.contains('keyboard-navigation'),false,'programmatic modal focus does not enable a ring');
searchPill.getBoundingClientRect=()=>({left:290,right:390,width:100});
query('#quickbar').dispatchEvent(new w.Event('scroll'));await settle();assert.equal(query('.acts-more').disabled,true);
searchPill.getBoundingClientRect=searchPillRect;
w.__POLICE_SEARCH_CLEAR();await settle();
assert.equal(searchPill.dataset.hitCount,undefined);assert.equal(searchPill.classList.contains('search-has-hit'),false);
assert.equal(searchPill.querySelector('.act-pill-count'),originalBadge,'clearing search retains the badge for its closing transition');

// A saved article outside the initial stream must appear immediately.
w.localStorage.setItem('police-law-bookmarks-v1',JSON.stringify([{id:'uop-art-315',act:'uop',num:'Art. 315',parts:['uop-art-315-ust-1']}]))
w.dispatchEvent(new w.CustomEvent('police-law-favorites-change'));click('#hamburger');await settle();click('.favorites-filter');await settle();
assert.deepEqual([...w.document.querySelectorAll('#lawStream .legal-unit')].map(n=>n.id),['uop-art-315']);
assert.equal(query('.favorites-empty-main').hidden,true);
const builds=query('.drawer').dataset.renderCount;
// Reopening the same menu does not rebuild its rows or inflate the stream.
for(let n=0;n<4;n++){click('#hamburger');click('#hamburger');await settle()}
assert.equal(query('.drawer').dataset.renderCount,builds);
assert.equal(w.document.querySelectorAll('#lawStream .legal-unit').length,1);
const editedArticle=query('#uop-art-315');
query('#uop-art-315 .unit-star').dispatchEvent(new w.MouseEvent('pointerdown',{bubbles:true,button:0}));
await new Promise(r=>setTimeout(r,380));
assert.ok(query('.favorite-article-popover'),'long press exposes editor');
click('.favorite-article-popover .favorite-article-menu-button');await settle();
assert.equal(w.document.body.classList.contains('favorite-editing'),true);
click('.favorite-part-toggle[data-index="1"]');assert.equal(w.__FAVORITES_HAS_UNSAVED(),true);
click('.favorite-editor-save');await settle();await settle();
assert.equal(w.document.body.classList.contains('favorite-editing'),false);
assert.equal(w.document.body.classList.contains('drawer-open'),true);
assert.equal(query('#uop-art-315'),editedArticle,'saving fragments must retain the article DOM');
assert.equal(query('.drawer').dataset.renderCount,builds,'saving must not rebuild the menu');
assert.equal(w.__FAVORITES_HAS_UNSAVED(),false);

const q=query('#q');q.value='sluzba';q.dispatchEvent(new w.Event('input'));await new Promise(r=>setTimeout(r,350));
assert.equal(w.__POLICE_SEARCH_STATE.favoritesOnly,true);click('.search-item');await settle();
assert.equal(w.document.body.classList.contains('favorites-all-acts'),true);
assert.equal(w.document.body.classList.contains('favorites-filter-on'),true);
assert.equal(query('#searchReturn').classList.contains('show'),true);
// A reference to an unsaved article must be revealed, then restore favorite scope.
click('#uop-art-315 a[href="#uop-art-1-ust-2"]');await settle();
assert.ok(query('#uop-art-1-ust-2'));assert.equal(w.document.body.classList.contains('favorites-filter-on'),false);
assert.equal(query('#return').classList.contains('show'),true);click('#return button');await settle();
assert.equal(w.document.body.classList.contains('favorites-all-acts'),true);
assert.equal(w.document.body.classList.contains('favorites-filter-on'),true);
assert.ok(query('#uop-art-315'));
// Search filters do not turn off the reader's favorite scope.
click('#searchReturn button');w.__POLICE_SEARCH_FILTERS.disableFavorites();assert.equal(w.document.body.classList.contains('favorites-all-acts'),true);
w.__POLICE_SEARCH_CLEAR();w.__FAVORITES_OPEN_SINGLE('uop','uop-art-1');await settle();
if(w.document.body.classList.contains('drawer-open'))click('#hamburger');
click('#collapseToc');assert.equal(query('.reader-toc').classList.contains('is-open'),true);
assert.equal(query('.reader-toc .reader-dialog-head'),null);assert.equal(query('.reader-toc .reader-close'),null);assert.equal(query('main').inert,true);
assert.equal(w.document.querySelectorAll('.reader-toc-article').length,0,'leaf articles are lazy');
const details=[...w.document.querySelectorAll('.reader-toc-group')];details[0].open=true;await settle();details[1].open=true;await settle();details[2].open=true;await settle();assert.equal(details[0].open,true);assert.equal(details[1].open,false);assert.equal(details[2].open,true);
assert.equal(w.document.querySelectorAll('.reader-toc-article').length,6);
[...w.document.querySelectorAll('.reader-toc-article')].at(-1).click();await settle();
assert.equal(w.location.hash,'#uop-art-315');assert.equal(w.document.body.classList.contains('drawer-open'),false);

const pill=query('#quickbar [data-act="uop"]'),originalRect=pill.getBoundingClientRect;
pill.getBoundingClientRect=()=>({left:370,right:450,width:80});
query('#quickbar').dispatchEvent(new w.Event('scroll'));await settle();
assert.equal(query('.acts-more').textContent,'+1');
click('.acts-more');assert.equal(w.document.querySelectorAll('.act-picker-item').length,1);
assert.equal(query('.act-picker .reader-dialog-head'),null);assert.equal(query('.act-picker .reader-close'),null);assert.equal(query('.act-picker small'),null);
query('.act-picker').dispatchEvent(new w.MouseEvent('click',{clientX:500,clientY:200}));assert.equal(query('.act-picker'),null);
click('.acts-more');click('.act-picker-item');assert.equal(query('.act-picker'),null);
for(const [left,text,amount] of [[366,'+',1],[338,'+',.5],[310,'+',0],[367,'+1',1]]){
  pill.getBoundingClientRect=()=>({left,right:left+80,width:80});query('#quickbar').dispatchEvent(new w.Event('scroll'));await settle();
  assert.equal(query('.acts-more').textContent,text);assert.ok(Math.abs(Number(query('.acts-more').style.getPropertyValue('--cue-amount'))-amount)<1e-9);
  assert.equal(query('.acts-more').disabled,amount===0);
}
pill.getBoundingClientRect=originalRect;
// Reclaim the counter gutter only after release; reverse movement restores it.
const quickbar=query('#quickbar');Object.defineProperty(quickbar,'clientWidth',{value:390,configurable:true});
Object.defineProperty(quickbar,'scrollWidth',{value:1000,configurable:true});quickbar.scrollLeft=500;
pill.getBoundingClientRect=()=>({left:335,right:415,width:80});
quickbar.dispatchEvent(new w.MouseEvent('pointerdown',{bubbles:true,clientX:100,clientY:100}));quickbar.dispatchEvent(new w.Event('scroll'));await settle();
assert.equal(query('.quickbar-wrap').classList.contains('is-tail-resting'),true,'a cue under 45% finishes automatically even during a slow gesture');
quickbar.dispatchEvent(new w.MouseEvent('pointermove',{bubbles:true,clientX:120,clientY:100}));assert.equal(query('.quickbar-wrap').classList.contains('is-tail-resting'),false);
quickbar.dispatchEvent(new w.MouseEvent('pointerup',{bubbles:true,clientX:120,clientY:100}));
quickbar.scrollLeft=610;
pill.getBoundingClientRect=()=>({left:310,right:390,width:80});
quickbar.dispatchEvent(new w.MouseEvent('pointerdown',{bubbles:true,clientX:100,clientY:100}));
const touchStart=new w.Event('touchstart',{bubbles:true});Object.defineProperty(touchStart,'touches',{value:[{clientX:100,clientY:100}]});quickbar.dispatchEvent(touchStart);
quickbar.dispatchEvent(new w.MouseEvent('pointercancel',{bubbles:true,clientX:100,clientY:100}));
quickbar.dispatchEvent(new w.Event('scroll'));await settle();
assert.equal(query('.quickbar-wrap').classList.contains('is-tail-resting'),false);
const touchMove=new w.Event('touchmove',{bubbles:true,cancelable:true});Object.defineProperty(touchMove,'touches',{value:[{clientX:20,clientY:100}]});quickbar.dispatchEvent(touchMove);
const pulled=Number.parseFloat(query('.quickbar-wrap').style.getPropertyValue('--tail-pull'));
assert.ok(pulled<0&&pulled>-48,'the end stretch has gradual resistance');assert.equal(touchMove.defaultPrevented,true);
// Geometry during the stretch must not change the logical hidden-pill count.
pill.style.transform=`matrix(1,0,0,1,${pulled},0)`;pill.getBoundingClientRect=()=>({left:310+pulled,right:390+pulled,width:80});
quickbar.dispatchEvent(new w.Event('scroll'));await settle();assert.equal(query('.acts-more').disabled,true);
const touchEnd=new w.Event('touchend',{bubbles:true});Object.defineProperty(touchEnd,'touches',{value:[]});Object.defineProperty(touchEnd,'changedTouches',{value:[{clientX:20,clientY:100}]});quickbar.dispatchEvent(touchEnd);
assert.equal(query('.quickbar-wrap').classList.contains('is-tail-resting'),true,'release goes directly to the final gutter position');
assert.equal(query('.quickbar-wrap').style.getPropertyValue('--tail-pull'),'0px','stretch and gutter return start together');
pill.style.removeProperty('transform');pill.getBoundingClientRect=()=>({left:310,right:390,width:80});await settle();await settle();
assert.equal(query('.quickbar-wrap').classList.contains('is-tail-resting'),true);
// Fractional Safari end geometry must not resurrect a sliver of the plus.
w.document.body.classList.add('drawer-open');pill.getBoundingClientRect=()=>({left:311.1,right:391.1,width:80});quickbar.scrollLeft=609.5;
quickbar.dispatchEvent(new w.Event('scroll'));await new Promise(r=>setTimeout(r,450));
assert.equal(query('.acts-more').getAttribute('aria-hidden'),'true');assert.equal(query('.quickbar-wrap').classList.contains('is-tail-resting'),true);
w.document.body.classList.remove('drawer-open');
quickbar.dispatchEvent(new w.MouseEvent('pointerdown',{bubbles:true,clientX:100,clientY:100}));
quickbar.dispatchEvent(new w.MouseEvent('pointermove',{bubbles:true,clientX:120,clientY:100}));
assert.equal(query('.quickbar-wrap').classList.contains('is-tail-resting'),false);
delete quickbar.clientWidth;delete quickbar.scrollWidth;quickbar.scrollLeft=0;pill.getBoundingClientRect=originalRect;
quickbar.dispatchEvent(new w.MouseEvent('pointerup',{bubbles:true,clientX:120,clientY:100}));
assert.equal(w.document.querySelectorAll('.unit-comment').length,0);
w.__ARTICLE_COMMENTS={'uop-art-315':{title:'Test administracyjny',body:'<b>Tekst bez HTML</b>',updated:'2026-09-07'}};
w.dispatchEvent(new w.CustomEvent('police-law-articles-rendered'));click('.unit-comment');assert.equal(query('.comment-body').textContent,'<b>Tekst bez HTML</b>');assert.equal(query('.comment-body b'),null);click('.reader-dialog .reader-close');
assert.equal(w.__READER_CORE.hiddenPills([{left:-40,right:40,width:80},{left:40,right:120,width:80}],{left:0,right:81}),0,'pills hidden on the left are never counted');
// Both panels follow the pointer before release and roll back cancelled drags.
const pointerEvent=(target,type,x,y=250)=>target.dispatchEvent(new w.MouseEvent(type,{bubbles:true,cancelable:true,button:0,clientX:x,clientY:y}));
let article=query('#uop-art-315');
pointerEvent(article,'pointerdown',380);pointerEvent(article,'pointermove',340);
assert.equal(article.style.getPropertyValue('--favorite-swipe-x'),'-40px');
assert.equal(article.classList.contains('favorite-swipe-open'),true);
pointerEvent(article,'pointercancel',340);await settle();await settle();
assert.equal(article.classList.contains('favorite-swipe-open'),false);
pointerEvent(article,'pointerdown',380);pointerEvent(article,'pointermove',290);pointerEvent(article,'pointerup',290);await settle();
assert.equal(article.classList.contains('favorite-swipe-open'),true);
pointerEvent(article,'pointerdown',200);pointerEvent(article,'pointermove',270);pointerEvent(article,'pointerup',270);await settle();await settle();
assert.equal(article.classList.contains('favorite-swipe-open'),false);
pointerEvent(article,'pointerdown',10,720);pointerEvent(article,'pointermove',60,720);
assert.equal(query('.reader-toc').classList.contains('is-dragging'),true);
assert.equal(query('.reader-toc').style.getPropertyValue('--toc-x'),'-340px');
pointerEvent(article,'pointercancel',60,720);assert.equal(query('.reader-toc').classList.contains('is-open'),false);
pointerEvent(article,'pointerdown',10,720);pointerEvent(article,'pointermove',150,720);pointerEvent(article,'pointerup',150,720);
assert.equal(query('.reader-toc').classList.contains('is-open'),true);click('.reader-toc-backdrop');
// Search takes ownership from the ToC and nested settings keep the reader frozen.
click('#collapseToc');q.value='sluzba';q.dispatchEvent(new w.Event('input'));
assert.equal(query('.reader-toc').classList.contains('is-open'),false);assert.equal(w.__READER_STATE.frozen,true);
w.__READER_TOC_OPEN();assert.equal(query('.reader-toc').classList.contains('is-open'),false);
click('#settingsButton');assert.equal(query('#searchReturn').inert,true);click('#settingsClose');
assert.equal(w.__READER_STATE.frozen,true);assert.equal(query('main').inert,true);assert.equal(query('.top').inert,false);
click('.reader-search-shade');assert.equal(q.value,'');assert.equal(w.__READER_STATE.frozen,false);assert.equal(query('main').inert,false);
// A short swipe only reveals Delete; the separate action removes a return.
query('#return').classList.add('show');query('#searchReturn').classList.add('show');await settle();
const rb=query('#return'),sb=query('#searchReturn');assert.ok(parseFloat(rb.style.getPropertyValue('--return-bottom'))>parseFloat(sb.style.getPropertyValue('--return-bottom')));
const hashBefore=w.location.hash;
rb.dispatchEvent(new w.MouseEvent('pointerdown',{bubbles:true,button:0,clientX:380,clientY:600}));rb.dispatchEvent(new w.MouseEvent('pointermove',{bubbles:true,cancelable:true,clientX:356,clientY:600}));rb.dispatchEvent(new w.MouseEvent('pointerup',{bubbles:true,clientX:356,clientY:600}));
assert.equal(rb.classList.contains('show'),true);assert.equal(rb.classList.contains('return-revealed'),true);click('#return .return-delete');
assert.equal(rb.classList.contains('show'),false);assert.equal(sb.classList.contains('show'),true);assert.equal(w.location.hash,hashBefore);assert.ok(query('.article-pager'));
w.__POLICE_DISMISS_RETURN('search');
// Import reports the actual selected file and import time, including after reload.
click('#settingsButton');const input=query('#favoritesImportFile'),file={name:'moje-ulubione.json',size:200,text:async()=>JSON.stringify([{id:'uop-art-1',act:'uop'}])};
Object.defineProperty(input,'files',{value:[file],configurable:true});input.dispatchEvent(new w.Event('change'));await settle();click('[data-import-mode="merge"]');
assert.match(query('.favorites-import-source').textContent,/moje-ulubione\.json · Wczytano /);
const imported=JSON.parse(w.localStorage.getItem('police-law-bookmarks-v1-last-import'));assert.equal(imported.file,file.name);assert.ok(Number.isFinite(Date.parse(imported.at)));click('#settingsClose');
// All-law favorites share one visible scope with both pagers and the left list.
w.localStorage.setItem('police-law-bookmarks-v1',JSON.stringify([{id:'uop-art-1',act:'uop'},{id:'uop-art-315',act:'uop'},{id:'alk-art-1',act:'alk'}]));
w.dispatchEvent(new w.CustomEvent('police-law-favorites-change'));w.__FAVORITES_OPEN_ALL('uop','uop-art-1');await settle();await settle();await settle();
assert.deepEqual(Array.from(w.__FAVORITES_NAV.rows(),r=>r[0]),['uop-art-1','uop-art-315','alk-art-1']);
w.__POLICE_DRAWER_OPEN();await settle();await settle();await settle();
click('.favorites-all-law[data-act="uop"] .favorites-all-law-title');await settle();await settle();await settle();
assert.equal(query('.favorites-all-act[data-favorite-act="uop"]').hidden,true);
assert.deepEqual(Array.from(w.__FAVORITES_NAV.rows(),r=>r[0]),['alk-art-1']);
w.__READER_FOLLOW.follow('uop-art-1');assert.ok(query('.favorites-all-law[data-act="uop"]').classList.contains('is-collapsed'));
click('.favorites-all-law[data-act="uop"] .favorites-all-law-title');await settle();await settle();await settle();
assert.equal(query('.favorites-all-act[data-favorite-act="uop"]').hidden,false);
w.__POLICE_DRAWER_CLOSE();await settle();await settle();await settle();
const realActive=w.__READER_STATE.activeArticle,realScroll=w.__POLICE_SCROLL_ARTICLE;let navigated='';
w.__READER_STATE.activeArticle=()=>query('#uop-art-1');w.__POLICE_SCROLL_ARTICLE=id=>{navigated=id};
w.dispatchEvent(new w.CustomEvent('police-law-navigation-settled'));await settle();
assert.equal(query('.reader-favorites-law-nav button').disabled,true);
click('.article-pager .next');assert.equal(navigated,'uop-art-315','article pager skips unsaved articles');
click('.reader-favorites-law-nav button:last-child');assert.equal(navigated,'alk-art-1','law pager crosses law boundaries');
w.__READER_STATE.activeArticle=()=>query('#alk-art-1');w.dispatchEvent(new w.CustomEvent('police-law-navigation-settled'));await settle();
assert.equal(query('.reader-favorites-law-nav button:last-child').disabled,true);assert.equal(query('.article-pager .next').disabled,true);
w.__READER_STATE.activeArticle=realActive;w.__POLICE_SCROLL_ARTICLE=realScroll;
const appearance=fs.readFileSync('reader-display.css','utf8');assert.match(appearance,/search-favorites-only \.act-pill-count/);assert.doesNotMatch(appearance,/search-favorites-only #results/);
assert.equal(errors.length,0,errors.map(e=>e.message).join('\n'));dom.window.close();
console.log('Reader runtime: packages, distant favorites, cached menu, search scope, TOC, picker and comments passed.');
