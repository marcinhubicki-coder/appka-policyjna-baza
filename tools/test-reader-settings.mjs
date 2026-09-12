import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

const dom=new JSDOM('<div id="packageList"></div><small id="packageSummary"></small><div id="actOrderList"></div><button id="saveActOrder"></button><small id="actOrderStatus"></small><div id="searchActFilters"></div><button id="settingsClose"></button><div id="settingsBackdrop"></div>',{url:'https://reader.test',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
w.matchMedia=()=>({matches:false});w.ResizeObserver=class{observe(){}disconnect(){}};w.HTMLElement.prototype.scrollIntoView=function(){};
w.eval(fs.readFileSync('reader-core.js','utf8'));
let codes=['uop','kw','prd','alk'],saved=null;const enabled=new Set(['uop','kw','prd']);
w.__POLICE_PACKAGES={list:()=>codes.map(code=>({code,short:code.toUpperCase(),name:'Ustawa '+code,enabled:enabled.has(code)})),groups:()=>[{id:'basic',name:'Podstawowe',codes:['uop','kw']},{id:'traffic',name:'Ruch drogowy',codes:['prd']},{id:'special',name:'Ustawy szczególne',codes:['alk']}],setEnabled(code,on){on?enabled.add(code):enabled.delete(code);return true},setGroup(group,on){group.forEach(code=>on?enabled.add(code):enabled.delete(code));return true},setOrder(order){codes=[...order];saved=[...order];return true}};
w.HTMLElement.prototype.getBoundingClientRect=function(){const slot=this.closest('.order-slot');const index=slot?[...slot.parentNode.children].indexOf(slot):0;const top=slot?100+index*44:100;return{left:20,right:300,width:280,top,bottom:top+(slot?39:176),height:slot?39:176}};
w.eval(fs.readFileSync('reader-settings.js','utf8'));
const query=s=>w.document.querySelector(s),key=(element,value)=>element.dispatchEvent(new w.KeyboardEvent('keydown',{key:value,bubbles:true,cancelable:true}));
const list=query('#actOrderList'),numbers=[...list.querySelectorAll('.order-number')],tile=query('.order-tile[data-code="uop"]');
assert.equal(query('[data-package-toggle="basic"]').checked,true);
query('[data-code="kw"][type="checkbox"]').click();assert.equal(query('[data-package-toggle="basic"]').indeterminate,true,'a partial package is mixed');
query('[data-package-toggle="basic"]').click();assert.equal(enabled.has('kw'),true,'mixed package click enables all');assert.equal(query('[data-package-toggle="basic"]').indeterminate,false);
query('[data-package-toggle="basic"]').click();assert.equal(enabled.has('uop'),false);assert.equal(enabled.has('kw'),false);
query('[data-package-toggle="basic"]').click();assert.equal(enabled.has('uop'),true);assert.equal(enabled.has('kw'),true);
tile.focus();key(tile,' ');key(tile,'End');key(tile,'Enter');
assert.deepEqual([...list.querySelectorAll('.order-tile')].map(el=>el.dataset.code),['kw','prd','alk','uop']);assert.equal(saved,null,'draft must not affect the live catalog');
assert.deepEqual([...list.querySelectorAll('.order-number')],numbers,'the numeric rail never moves with the tiles');
assert.deepEqual(numbers.map(el=>el.textContent),['1','2','3','4']);
assert.equal(query('#saveActOrder').disabled,false);query('#saveActOrder').click();assert.deepEqual(saved,['kw','prd','alk','uop']);assert.equal(query('#saveActOrder').disabled,true);
key(tile,' ');key(tile,'Home');key(tile,'Escape');assert.deepEqual([...list.querySelectorAll('.order-tile')].map(el=>el.dataset.code),saved,'cancel restores the draft before pickup');
// Mouse dragging also moves the existing tile, without moving the number nodes.
tile.dispatchEvent(new w.MouseEvent('pointerdown',{button:0,clientX:80,clientY:245,bubbles:true}));
w.dispatchEvent(new w.MouseEvent('pointermove',{clientX:80,clientY:112,bubbles:true,cancelable:true}));
assert.ok(query('.order-drag-ghost'));w.dispatchEvent(new w.MouseEvent('pointerup',{clientX:80,clientY:112}));
assert.equal(list.querySelector('.order-tile'),tile);assert.equal(query('.order-drag-ghost'),null);assert.equal(tile.classList.contains('order-drag-source'),false);
assert.deepEqual([...list.querySelectorAll('.order-number')],numbers);
// Persistence remains atomic, including denied local storage and stale/new acts.
assert.equal(w.__LAW_PACKAGES.setMany(['uop','kw'],false),true);assert.equal(w.__LAW_PACKAGES.isEnabled('kw'),false);
assert.equal(w.__LAW_PACKAGES.setOrder(['kw','uop','stale']),true);
assert.deepEqual(Array.from(w.__LAW_PACKAGES.order(['uop','kw','new'])),['kw','uop','new']);
const descriptor=Object.getOwnPropertyDescriptor(w.Storage.prototype,'setItem');Object.defineProperty(w.Storage.prototype,'setItem',{value(){throw Error('quota')}});
assert.equal(w.__LAW_PACKAGES.setMany(['uop','kw'],true),false);assert.equal(w.__LAW_PACKAGES.isEnabled('uop'),false);
assert.equal(w.__LAW_PACKAGES.setOrder(['uop','kw']),false);assert.deepEqual(Array.from(w.__LAW_PACKAGES.order(['uop','kw'])),['kw','uop']);Object.defineProperty(w.Storage.prototype,'setItem',descriptor);
await new Promise(r=>setTimeout(r,40));dom.window.close();
console.log('Reader settings: package mixed state, bulk toggles, draft/save, keyboard and pointer reorder, fixed numbers, cancellation and safe persistence passed.');
