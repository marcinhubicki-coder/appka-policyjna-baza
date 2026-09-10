import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';

const html=fs.readFileSync('index.html','utf8').replace(/<script[^>]*>[\s\S]*?<\/script>/g,'');
const dom=new JSDOM(html,{url:'https://reader.test/',runScripts:'outside-only'}),w=dom.window;
let y=0,now=0,sequence=0,frames=new Map(),idle=[],scrolls=[];
Object.assign(w,{innerWidth:390,innerHeight:800});
w.matchMedia=()=>({matches:false});w.CSS={escape:x=>x};
w.requestAnimationFrame=fn=>{frames.set(++sequence,fn);return sequence};w.cancelAnimationFrame=id=>frames.delete(id);
w.requestIdleCallback=fn=>idle.push(fn);w.setTimeout=()=>0;
Object.defineProperty(w.performance,'now',{value:()=>now});
Object.defineProperty(w,'scrollY',{get:()=>y});
w.scrollTo=arg=>{y=Math.max(0,arg.top);scrolls.push(y);w.dispatchEvent(new w.Event('scroll'))};w.scrollBy=(_,dy)=>w.scrollTo({top:y+dy});
w.HTMLElement.prototype.scrollIntoView=function(){throw new Error('Unexpected native document scroll')};
const height=()=>w.document.body.classList.contains('drawer-open')?180:300;
const rect=(top,h,width=390)=>({x:0,y:top,left:0,right:width,top,bottom:top+h,height:h,width});
function articleTop(node){let top=100;for(const child of w.document.querySelector('#lawStream')?.children||[]){if(child===node)break;top+=child.matches('.legal-unit')?height():child.hidden?0:parseFloat(child.style.height)||0}return top-y}
w.HTMLElement.prototype.getBoundingClientRect=function(){
 if(this.matches('.top'))return rect(0,100);
 if(this.matches('.legal-unit'))return rect(articleTop(this),height());
 if(this.matches('.subunit'))return rect(articleTop(this.closest('.legal-unit'))+40,height()-40);
 if(this.matches('.law-stream-sentinel'))return rect(articleTop(this),this.hidden?0:parseFloat(this.style.height)||0);
 if(this.matches('#actview,#actcard,#lawStream'))return rect(100-y,totalHeight()-100);
 return rect(0,20);
};
function totalHeight(){let total=100;for(const child of w.document.querySelector('#lawStream')?.children||[])total+=child.matches('.legal-unit')?height():child.hidden?0:parseFloat(child.style.height)||0;return total}
Object.defineProperty(w.document.documentElement,'scrollHeight',{get:totalHeight});
w.document.elementFromPoint=(x,py)=>[...w.document.querySelectorAll('.subunit')].find(el=>{const r=el.getBoundingClientRect();return r.top<=py&&r.bottom>=py})||[...w.document.querySelectorAll('.legal-unit')].find(el=>{const r=el.getBoundingClientRect();return r.top<=py&&r.bottom>=py});
for(const file of ['reader-state.js','app.js']){let source=fs.readFileSync(file,'utf8');if(file==='app.js')source=source.slice(0,source.lastIndexOf('(async()=>'));vm.runInContext(source,dom.getInternalVMContext(),{filename:file})}
w.eval(`DATA=[['uop','Ustawa','https://example.test',Array.from({length:700},(_,i)=>['uop-art-'+(i+1),'Rozdział 1','Art. '+(i+1),'Opis',[['uop-art-'+(i+1)+'-ust-1','u','1','Treść artykułu']]])]];ACT=DATA[0];for(const row of ACT[3]){idMap.set(row[0],'uop');articleMap.set(row[0],{act:'uop',r:row});idMap.set(row[4][0][0],'uop');unitMap.set(row[4][0][0],{act:'uop',article:row[0]})}`);
function pump(limit=180){let turns=0;while((frames.size||idle.length)&&turns++<limit){now+=16;const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(now));const jobs=idle.splice(0);jobs.forEach(fn=>fn({timeRemaining:()=>50}))}assert.ok(turns<limit,'render window converges without adding/pruning forever')}
function ids(){return [...w.document.querySelectorAll('#lawStream>.legal-unit')].map(el=>Number(el.id.split('-').at(-1)))}
w.eval("renderAct('uop',null,false)");pump();assert.ok(ids().length<35);
scrolls=[];w.__POLICE_GOTO_ID('uop-art-478');
assert.ok(w.document.getElementById('uop-art-478'),'target materializes synchronously');
assert.ok(ids().every(n=>n>460&&n<500),'does not generate the intervening 470 articles');
pump();assert.ok(ids().length<35);assert.ok(Math.max(...scrolls)-Math.min(...scrolls)<=103,'only the last 100px are animated');
assert.ok(Math.abs(w.document.getElementById('uop-art-478').getBoundingClientRect().top-108)<1);
// Scroll through the law in both directions; old articles leave the DOM.
for(let i=0;i<35;i++){w.scrollTo({top:y+400});pump();assert.ok(ids().length<35)}
const advanced=ids();assert.ok(advanced[0]>478);assert.equal(w.document.getElementById('uop-art-478'),null);
for(let i=0;i<20;i++){w.scrollTo({top:y-400});pump();assert.ok(ids().length<35)}
assert.ok(ids()[0]<advanced[0]);
// Scrollbar jump lands directly in a distant spacer, in either direction.
w.scrollTo({top:totalHeight()-1000});pump();assert.ok(ids().at(-1)>690);assert.ok(ids().length<35);
w.scrollTo({top:0});pump();assert.equal(ids()[0],1);assert.ok(ids().length<35);
// A new destination supersedes every queued frame from the previous click.
w.__POLICE_GOTO_ID('uop-art-478');w.__POLICE_GOTO_ID('uop-art-12');pump();
assert.equal(w.location.hash,'#uop-art-12');assert.ok(Math.abs(w.document.getElementById('uop-art-12').getBoundingClientRect().top-108)<1);
// Width-only layout preserves the same subunit point in the viewport center.
const anchor=w.__READER_STATE.capture();assert.ok(anchor?.id);
w.__READER_STATE.layout(()=>w.document.body.classList.add('drawer-open'));pump();
const anchored=w.document.getElementById(anchor.id).getBoundingClientRect();assert.ok(Math.abs(anchored.top+anchored.height*anchor.ratio-450)<1);
// Column count changes top-align the active article in either direction.
for(const split of [false,true]){const id=w.__READER_STATE.activeArticle().id;w.__READER_STATE.layout(()=>w.document.body.classList.toggle('drawer-open',split),{articleTop:true});pump();assert.ok(Math.abs(w.document.getElementById(id).getBoundingClientRect().top-108)<1);assert.equal(w.__READER_STATE.activeArticle().id,id)}
// Nested overlays hold one position; unlock is synchronous and cannot race a link.
const lockedAt=y;w.__READER_STATE.lock('search',true);w.__READER_STATE.lock('settings',true);
assert.equal(w.document.querySelector('main').inert,true);assert.equal(w.document.querySelector('.top').inert,true);
w.__READER_STATE.lock('settings',false);assert.equal(w.__READER_STATE.frozen,true);assert.equal(w.document.querySelector('.top').inert,false);
w.__READER_STATE.lock('search',false);assert.equal(y,lockedAt);assert.equal(w.__READER_STATE.frozen,false);
w.__POLICE_GOTO_ID('uop-art-600');pump();assert.ok(Math.abs(w.document.getElementById('uop-art-600').getBoundingClientRect().top-108)<1);
// Switching laws remembers a concrete fragment; an explicit link still wins.
const remembered=w.__READER_STATE.capture();w.__READER_STATE.remember('alk');assert.equal(w.__READER_STATE.recall('alk'),undefined,'a cross-law favorites view cannot save an anchor under the wrong act');
w.eval(`DATA.push(['alk','Alkohol','https://example.test',Array.from({length:20},(_,i)=>['alk-art-'+(i+1),'Rozdział 1','Art. '+(i+1),'Opis',[['alk-art-'+(i+1)+'-ust-1','u','1','Treść']]])]);for(const row of DATA[1][3]){idMap.set(row[0],'alk');articleMap.set(row[0],{act:'alk',r:row});idMap.set(row[4][0][0],'alk');unitMap.set(row[4][0][0],{act:'alk',article:row[0]})}renderAct('alk')`);pump();
w.eval("renderAct('uop')");pump();assert.equal(w.location.hash,'#'+remembered.id);assert.ok(w.document.getElementById(remembered.id));
w.__POLICE_GOTO_ID('uop-art-1');pump();assert.equal(w.location.hash,'#uop-art-1');
console.log('Reader navigation: bounded DOM, spacers, distant jumps, cancellation, center anchor and nested locks passed.');
dom.window.close();
