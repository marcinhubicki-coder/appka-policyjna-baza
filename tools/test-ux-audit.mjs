import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const app=fs.readFileSync('app.js','utf8');
const settings=fs.readFileSync('settings.js','utf8');
const favorites=fs.readFileSync('favorites-ui.js','utf8');
const searchUx=fs.readFileSync('search-ux-v2.js','utf8');
const lineFunction=(source,name)=>source.split('\n').find(line=>line.trim().startsWith(`function ${name}(`));
const norm=vm.runInNewContext(`(${lineFunction(app,'norm')})`);
const normChar=vm.runInNewContext(`(${lineFunction(searchUx,'normChar')})`);
for(const [typed,polish] of [['sluzba','SŁUŻBA'],['zolnierz','Żołnierz'],['lodz','Łódź'],['zazolc','zażółć']]){
  assert.equal(norm(typed),norm(polish));
  assert.equal(normChar(typed),normChar(polish));
}
const scopeCode=settings.slice(settings.indexOf('  function searchScopeLabel'),settings.indexOf('  function syncMode'));
const scope=vm.runInNewContext(`${scopeCode};searchScopeLabel`);
const items=Array.from({length:12},()=>({enabled:true}));
assert.equal(scope(items,false),'Wyszukiwanie we wszystkich ustawach.');
items[0].enabled=false;
assert.equal(scope(items,false),'Wyszukiwanie w 11 z 12 ustaw.');
assert.equal(scope(items,true),'Całe ulubione artykuły · w 11 z 12 ustaw.');
assert.match(scope(items.map(()=>({enabled:false})),false),/Wszystkie ustawy wyłączone/);

function classList(){const set=new Set();return {add:(...xs)=>xs.forEach(x=>set.add(x)),remove:(...xs)=>xs.forEach(x=>set.delete(x)),contains:x=>set.has(x),toggle(x,on){if(on===undefined)on=!set.has(x);on?set.add(x):set.delete(x)}}}
function node(){return {dataset:{},attrs:{},classList:classList(),hidden:false,disabled:false,style:{setProperty(){},removeProperty(){}},setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]},addEventListener(k,fn){this[k]=fn},querySelectorAll(){return[]},querySelector(){return null},getClientRects(){return[{}]},closest(){return null},focus(){this.focused=true}}}
const nodes=new Map(),listeners=[];
const document={body:node(),documentElement:node(),activeElement:null,getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)},querySelectorAll(){return[]},addEventListener(type,fn,options){listeners.push({type,fn,options})}};
const context={document,window:{scrollY:500,addEventListener(){},scrollTo(){}},requestAnimationFrame:fn=>fn()};
vm.runInNewContext(settings,context);
const keyListener=listeners.find(x=>x.type==='keydown');
assert.equal(keyListener.options.capture,true);
const event=key=>({key,preventDefault(){this.prevented=true},stopImmediatePropagation(){this.stopped=true}});
document.body.classList.add('drawer-open','settings-open');
const escape=event('Escape');keyListener.fn(escape);
assert.equal(document.body.classList.contains('settings-open'),false);
assert.equal(document.body.classList.contains('drawer-open'),true);
assert.equal(escape.stopped,true);
document.body.classList.add('settings-open','favorites-import-open');
const importEscape=event('Escape');keyListener.fn(importEscape);
assert.equal(document.body.classList.contains('settings-open'),true);
assert.equal(importEscape.stopped,undefined);
document.body.classList.remove('favorites-import-open');
const first=node(),last=node(),panel=nodes.get('settingsPanel');
panel.querySelectorAll=()=>[first,last];panel.contains=el=>el===first||el===last;
document.activeElement=last;const tab=event('Tab');keyListener.fn(tab);assert.equal(first.focused,true);assert.equal(tab.prevented,true);
document.activeElement=first;const back=event('Tab');back.shiftKey=true;keyListener.fn(back);assert.equal(last.focused,true);

const pills=[node(),node(),node()];pills.forEach((p,i)=>p.dataset.act=['uop','kw','kk'][i]);
const pillContext={packages:{isEnabled:()=>true},quickbar:{querySelectorAll:()=>pills},META:{},searchExcluded:new Set(['kw']),searchResultWord:()=> 'wyniki'};
const paint=vm.runInNewContext(`${lineFunction(app,'paintSearchPills')};paintSearchPills`,pillContext);
paint(true,new Map([['uop',3]]));assert.deepEqual(pills.map(x=>x.disabled),[false,true,true]);
paint(false,new Map());assert.deepEqual(pills.map(x=>x.disabled),[false,false,false]);

let errors=0,events=0,writes=0;
const saveContext={KEY:'test',localStorage:{setItem(){throw Error('QuotaExceededError')}},showSaveError(){errors++},window:{dispatchEvent(){events++}},document:{getElementById(){return null}},CustomEvent:class{}};
const save=vm.runInNewContext(`${lineFunction(favorites,'save')};save`,saveContext);
assert.equal(save([]),false);assert.equal(errors,1);assert.equal(events,0);
saveContext.localStorage.setItem=()=>writes++;
assert.equal(save([]),true);assert.equal(writes,1);assert.equal(events,1);
let exited=false;
const editorContext={actForId:()=>null,editor:{article:{id:'a'},parts:[{key:'p1'},{key:'p2'}],selected:new Set(['p1'])},read:()=>[{id:'a'}],save:()=>false,expanded:new Set(),exitEditor(){exited=true},syncLegacy(){}};
const saveEditor=vm.runInNewContext(`${lineFunction(favorites,'saveEditor')};saveEditor`,editorContext);
saveEditor();assert.equal(exited,false);
editorContext.save=()=>true;saveEditor();assert.equal(exited,true);

assert.match(fs.readFileSync('index.html','utf8'),/id="packageList"/);
assert.match(settings,/section\.dataset\.splitOnly==='true'&&!openedFromDrawer/);
assert.deepEqual(pills.map(x=>x.hidden),[false,false,false]);
console.log(JSON.stringify({status:'ok',scenarios:['Polish search and highlighting','all/partial/zero search scope','Escape keeps split view','nested import priority','Tab focus containment','disabled search pills and reset','storage failure preserves editor','package availability visible']},null,2));
