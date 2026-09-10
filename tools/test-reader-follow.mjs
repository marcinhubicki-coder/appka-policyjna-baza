import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
const dom=new JSDOM('<body class="drawer-open"><header class="top"></header><aside class="drawer"><div class="drawer-scroll"><div id="drawerArticles"></div></div></aside><main><div id="actview"></div></main></body>',{url:'https://reader.test/',runScripts:'outside-only'}),w=dom.window;
Object.assign(w,{innerWidth:600,innerHeight:800});w.CSS={escape:x=>x};w.matchMedia=()=>({matches:false});
let now=0,seq=0,frames=new Map(),y=0;w.requestAnimationFrame=fn=>{frames.set(++seq,fn);return seq};w.cancelAnimationFrame=id=>frames.delete(id);Object.defineProperty(w.performance,'now',{value:()=>now});Object.defineProperty(w,'scrollY',{get:()=>y});w.scrollTo=({top})=>{y=top};
const scroller=w.document.querySelector('.drawer-scroll'),list=w.document.querySelector('#drawerArticles'),view=w.document.querySelector('#actview');
Object.defineProperties(scroller,{scrollHeight:{value:2600},clientHeight:{value:650}});
for(let i=0;i<100;i++){const chapter=w.document.createElement('details');chapter.open=false;const link=w.document.createElement('a');link.dataset.id='art-'+i;link.textContent='Art. '+i;link.dataset.index=String(i);chapter.append(link);list.append(chapter)}
for(const id of [39,40,41]){const a=w.document.createElement('article');a.className='legal-unit';a.id='art-'+id;view.append(a)}
const rectangles=new Map([[39,[80,30]],[40,[110,560]],[41,[670,300]]]);
const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
w.HTMLElement.prototype.getBoundingClientRect=function(){if(this.matches('.top'))return rect(0,0,600,100);if(this===view)return rect(240,100,360,700);if(this===scroller)return rect(0,100,240,650);if(this.dataset.index)return rect(0,100+Number(this.dataset.index)*24-scroller.scrollTop,240,24);if(this.matches('article'))return rect(240,...[rectangles.get(Number(this.id.slice(4)))[0],360,rectangles.get(Number(this.id.slice(4)))[1]]);return rect(0,0,10,10)};
w.document.elementFromPoint=()=>view.children[1];
for(const file of ['reader-state.js','reader-follow.js'])vm.runInContext(fs.readFileSync(file,'utf8'),dom.getInternalVMContext(),{filename:file});
function pump(){for(let n=0;frames.size&&n<50;n++){now+=16;const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(now))}assert.equal(frames.size,0)}
function active(){const id=w.__READER_STATE.activeArticle()?.id;w.dispatchEvent(new w.CustomEvent('police-law-active-article',{detail:{id}}));return id}
assert.equal(active(),'art-40','a 10px tail of the previous article cannot own the reader');pump();
const centered=40*24-(650-24)/2;assert.ok(Math.abs(scroller.scrollTop-centered)<1);assert.equal(list.querySelector('[data-id="art-40"]').parentElement.open,true);
scroller.dispatchEvent(new w.MouseEvent('pointerdown',{bubbles:true}));scroller.scrollTop=100;active();pump();assert.equal(scroller.scrollTop,100,'manual list reading takes control');
scroller.dispatchEvent(new w.MouseEvent('pointerup',{bubbles:true}));active();pump();assert.equal(scroller.scrollTop,100,'releasing the list does not pull it back');
y=10;w.dispatchEvent(new w.Event('scroll'));active();pump();assert.ok(Math.abs(scroller.scrollTop-centered)<1,'right reader movement resumes following even for the same article');
rectangles.set(40,[70,110]);rectangles.set(41,[180,620]);assert.equal(active(),'art-41');pump();assert.ok(Math.abs(scroller.scrollTop-(41*24-(650-24)/2))<1);
w.__READER_STATE.lock('popover',true);const frozen=scroller.scrollTop;w.__READER_FOLLOW.follow('art-39');pump();assert.equal(scroller.scrollTop,frozen,'long press freezes automatic list movement');w.__READER_STATE.lock('popover',false);
console.log('Reader following: dominant area, centered list, manual takeover, resumed following and popup freeze passed.');dom.window.close();
