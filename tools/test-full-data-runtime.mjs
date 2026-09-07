import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {JSDOM,VirtualConsole} from 'jsdom';

// Real compressed data and page modules; synthetic layout, not a visual test.
const html=fs.readFileSync('index.html','utf8'),errors=[],log=new VirtualConsole();
log.on('jsdomError',error=>errors.push(error));
const dom=new JSDOM(html.replace(/<script[^>]*>[\s\S]*?<\/script>/g,''),{url:'https://reader.test/#kw-art-601',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:log});
const w=dom.window;Object.assign(w,{Response,Blob,DecompressionStream,TextDecoder,TextEncoder,innerWidth:390,innerHeight:844});
w.matchMedia=()=>({matches:false,addEventListener(){}});
w.ResizeObserver=class{observe(){}disconnect(){}};w.IntersectionObserver=class{observe(){}disconnect(){}};
w.HTMLCanvasElement.prototype.getContext=()=>({measureText:text=>({width:text.length*6})});
w.HTMLElement.prototype.scrollIntoView=function(){};w.scrollTo=()=>{};w.scrollBy=()=>{};
w.HTMLElement.prototype.getBoundingClientRect=function(){const far=this.classList.contains('law-stream-sentinel');return{x:0,y:far?10000:120,left:0,right:390,top:far?10000:120,bottom:far?10010:700,width:390,height:580}};
w.HTMLElement.prototype.getClientRects=function(){return this.closest('[hidden]')?[]:[this.getBoundingClientRect()]};
w.document.elementFromPoint=()=>w.document.querySelector('.legal-unit');
w.CSS={escape:value=>String(value).replace(/[^a-zA-Z0-9_-]/g,'\\$&')};
w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
for(const match of html.matchAll(/<script src="([^"]+)"/g))if(match[1]!=='offline.js')vm.runInContext(fs.readFileSync(match[1],'utf8'),dom.getInternalVMContext(),{filename:match[1]});
const settle=()=>new Promise(resolve=>setTimeout(resolve,150));
for(let i=0;i<30&&!w.document.querySelector('.legal-unit');i++)await settle();
assert.equal(w.location.hash,'#kw-art-60s1','Stary adres KW zachowuje cel');
assert.equal(w.__POLICE_PACKAGES.list().length,14);
assert.equal(w.eval('searchIndex.some(item=>item.act==="alk"||item.act==="bim")'),false);
for(const [code,id] of [['uop','uop-art-158'],['kpk','kpk-art-315'],['kpk','kpk-art-682'],['spb','spb-art-45'],['alk','alk-art-51'],['bim','bim-art-80']]){
  assert.equal(w.__POLICE_GOTO_ID(id),true);await settle();
  assert.ok(w.document.getElementById(id),id);assert.equal(w.eval('ACT[0]'),code);
  assert.match(w.document.querySelector('.act-head .source').href,/\/uj\/pol\/pdf$/);
  assert.ok(w.document.querySelectorAll('.legal-unit').length<60,'Początkowy DOM pozostaje porcjowany');
}
w.__POLICE_GOTO_ID('kpk-art-315');await settle();
w.__POLICE_DRAWER_OPEN();await settle();const builds=w.document.querySelector('.drawer').dataset.renderCount;
assert.equal(w.document.querySelectorAll('.drawer-article').length,1018);
w.__POLICE_DRAWER_CLOSE();w.__POLICE_DRAWER_OPEN();assert.equal(w.document.querySelector('.drawer').dataset.renderCount,builds);
w.__POLICE_DRAWER_CLOSE();w.__READER_TOC_OPEN();
assert.ok(w.document.querySelectorAll('.reader-toc-group').length>20);assert.equal(w.document.querySelectorAll('.reader-toc-article').length,0);
assert.equal(errors.length,0,errors.map(e=>e.message).join('\n'));dom.window.close();
console.log('Full-data runtime: all 14 acts loaded; legacy URL, distant targets, PDF sources, bounded DOM and cached KPK menu passed.');
