import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

const dom=new JSDOM('<div id="quickbar"><button data-act="uop" class="search-has-hit" data-hit-count="6"><span class="act-pill-count" aria-hidden="true"></span></button><button data-act="kw" class="search-has-hit" data-hit-count="2"><span class="act-pill-count" aria-hidden="true"></span></button></div><div id="results"><section class="search-group" data-search-act="uop"></section><section class="search-group" data-search-act="kw"></section></div>',{runScripts:'outside-only'});
const w=dom.window,queue=new Map(),animations=[];let now=0,serial=0,reduced=false;
w.matchMedia=()=>({get matches(){return reduced}});
w.setTimeout=(fn,ms=0)=>{const id=++serial;queue.set(id,{at:now+ms,fn});return id};
w.clearTimeout=id=>queue.delete(id);w.requestAnimationFrame=fn=>w.setTimeout(()=>fn(now),16);w.cancelAnimationFrame=w.clearTimeout;
Object.defineProperty(w.performance,'now',{value:()=>now});
function tick(ms){const end=now+ms;for(;;){const next=[...queue.entries()].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;now=next[1].at;queue.delete(next[0]);next[1].fn()}now=end}
w.Element.prototype.animate=function(frames,options){const animation={frames,options,cancel(){w.clearTimeout(id)}};const id=w.setTimeout(()=>animation.onfinish?.(),options.duration);animations.push(animation);return animation};
const pills=[...w.document.querySelectorAll('button')],badge=pills[0].firstElementChild,results=w.document.getElementById('results'),groups=[...results.children];
Object.defineProperties(results,{scrollHeight:{value:1400},clientHeight:{value:400}});
results.getBoundingClientRect=()=>({top:100});
groups.forEach((group,i)=>group.getBoundingClientRect=()=>({top:100+i*700-results.scrollTop}));
w.eval(fs.readFileSync('quickbar-motion.js','utf8'));
function emit(active=true,pending=false){const detail={active,pending};w.__POLICE_SEARCH_STATE=detail;w.dispatchEvent(new w.CustomEvent('police-law-search-state',{detail}))}
emit();tick(149);assert.equal(badge.classList.contains('count-ready'),false);
tick(1);assert.equal(badge.classList.contains('count-ready'),true);assert.equal(animations.length,0);
tick(179);assert.equal(animations.length,0);tick(1);
assert.deepEqual([...badge.querySelectorAll('.act-count-reel>span')].map(n=>n.textContent),['6','7','8','9']);
assert.equal(animations[0].frames[0].transform,'translateY(-51px)');assert.equal(animations[0].frames[1].transform,'translateY(0)');
tick(360);assert.equal(badge.textContent,'6');assert.equal(badge.hasAttribute('data-count-moving'),false);
assert.equal(pills.filter(p=>p.classList.contains('on')).length,1);

// A new keystroke stops a scheduled or running decorative sequence.
pills[0].dataset.hitCount='12';emit();tick(200);emit(true,true);tick(600);assert.equal(badge.textContent,'12');
pills[0].dataset.hitCount='8';emit();tick(400);emit(false);tick(1000);assert.equal(badge.classList.contains('count-ready'),false);assert.equal(badge.hasAttribute('data-count-moving'),false,'cancelled counts do not hold the counter gutter open');
reduced=true;pills[0].dataset.hitCount='3';emit();assert.equal(badge.textContent,'3');assert.equal(badge.classList.contains('count-ready'),true);reduced=false;

// A result jump decelerates, marks one act, and yields to a manual gesture.
assert.equal(w.__POLICE_SEARCH_SCROLL('kw'),true);tick(140);const middle=results.scrollTop;
assert.ok(middle>350&&middle<700);tick(160);assert.ok(Math.abs(results.scrollTop-699)<1);
assert.equal(pills[1].classList.contains('on'),true);
w.__POLICE_SEARCH_SCROLL('uop');tick(64);results.dispatchEvent(new w.Event('pointerdown'));const stopped=results.scrollTop;tick(400);assert.equal(results.scrollTop,stopped);
results.scrollTop=0;results.dispatchEvent(new w.Event('scroll'));tick(16);assert.equal(pills[0].classList.contains('on'),true);
assert.equal(pills.filter(p=>p.classList.contains('on')).length,1);
dom.window.close();console.log('Quickbar motion: delayed expansion, descending reel, cancellation, reduced motion, active act and eased scrolling passed.');
