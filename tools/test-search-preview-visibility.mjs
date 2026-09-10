import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

const dom=new JSDOM('<input id="q" value="organiza"><div id="results"><a class="search-item" href="#nieletni-art-66"><b>Art. 66 · Przekazanie sprawy nieletniego szkole</b><small>Sąd rodzinny może przekazać sprawę szkole albo organizacji.</small></a></div>',{runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window;let markTop=66,resize;
w.ResizeObserver=class{constructor(callback){resize=callback}observe(){}};
w.DATA=[['nieletni','Nieletni','',[['nieletni-art-66','','Art. 66','Przekazanie sprawy nieletniego szkole',[['','','','Sąd rodzinny może przekazać sprawę szkole albo organizacji.']]]]]];
const rect=(top,height)=>({top,bottom:top+height,left:0,right:120,width:120,height});
w.HTMLElement.prototype.getBoundingClientRect=function(){return this.matches('mark')?rect(markTop,14):rect(20,40)};
w.HTMLElement.prototype.getClientRects=function(){return[this.getBoundingClientRect()]};
w.eval(fs.readFileSync('search-ux-v2.js','utf8'));
const info=()=>w.document.querySelector('.search-match-info').textContent;
assert.match(info(),/poza podglądem/,'a match below the second line is not visible');
markTop=40;resize();await new Promise(resolve=>setTimeout(resolve,50));
assert.equal(info(),'trafienie widoczne w podglądzie','a resize reevaluates the actual painted match');
markTop=66;resize();await new Promise(resolve=>setTimeout(resolve,50));assert.match(info(),/poza podglądem/);
dom.window.close();console.log('Search preview: clipped matches and visibility after resize passed.');
