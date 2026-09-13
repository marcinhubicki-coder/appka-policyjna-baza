import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { Session, DURATIONS } from '../game.mjs';
import { MODES, modeIds, createSource, cleanConfig, mathQuestion } from '../modes.mjs';
import { cleanProgress, migrateProgress, recordResult, localDay } from '../progress.mjs';
const words=(await Promise.all(Array.from({length:8},(_,i)=>readFile(new URL(`../data/words-0${i+1}.json`,import.meta.url),'utf8').then(JSON.parse)))).flat();
function validQuestion(q,count){assert.equal(q.options.length,count);assert.equal(new Set(q.options).size,count);assert.equal(q.options.filter(o=>o===q.answer).length,1);assert.ok(q.full);}
test('all five modes have valid starter questions and local flag assets',async()=>{
 for(const mode of modeIds)for(const [category] of MODES[mode].categories)for(const difficulty of [1,2,3]){
  const source=createSource(mode,{category,difficulty,duration:60},words);
  if(typeof source==='function'){validQuestion(source(),6);continue;}
  if(mode!=='spelling')assert.ok(source.length,`${mode} / ${category} / ${difficulty}`);
  for(const q of source){validQuestion(q,{spelling:2,english:4,flags:4,reading:4}[mode]);if(q.image)await access(new URL('../'+q.image,import.meta.url));}
 }
});
test('math produces correct arithmetic and six nearby, nonnegative unique choices',()=>{
 for(const category of ['add','subtract','multiply','divide','all'])for(const difficulty of [1,2,3])for(let i=0;i<40;i++){
  const q=mathQuestion({category,difficulty});validQuestion(q,6);
  const [,a,op,b,result]=q.full.match(/^(\d+) ([+−×÷]) (\d+) = (\d+)$/);
  const expected=op==='+'?+a + +b:op==='−'?a-b:op==='×'?a*b:a/b;
  assert.equal(Number(result),expected);assert.ok(q.options.every(n=>Number(n)>=0&&Math.abs(n-result)<=8));
 }
});
test('reading hides exposure after its duration, pauses exposure and only then accepts answers',()=>{
 let time=0;const source=createSource('reading',{category:'all',difficulty:3},words),game=new Session(source,60,()=>time);
 assert.equal(game.state,'exposing');assert.equal(game.answer(game.current.answer),false);
 time=1000;game.pause();const left=game.exposureRemaining,remaining=game.remaining;
 time=31000;game.resume();assert.equal(game.exposureRemaining,left);assert.equal(game.remaining,remaining);
 time+=left;game.tick();assert.equal(game.state,'playing');assert.ok(game.answer(game.current.answer));
 const before=game.question;time+=700;game.tick();assert.equal(game.question,before+1);assert.equal(game.state,'exposing');
});
test('wrong feedback, manual next and correct automatic next work for every mode',()=>{
 for(const mode of modeIds){let time=0;const game=new Session(createSource(mode,cleanConfig(mode,{}),words),60,()=>time);
 time+=game.exposureRemaining;game.tick();game.answer(game.options.find(o=>o!==game.current.answer));
 const remaining=game.remaining;time+=70000;game.tick();assert.equal(game.remaining,remaining);assert.equal(game.state,'feedback-wrong');
 game.skipFeedback();time+=game.exposureRemaining;game.tick();assert.ok(game.answer(game.current.answer));
 const before=game.question;time+=700;game.tick();assert.equal(game.question,before+1);assert.equal(game.correct,1);assert.equal(game.wrong,1);
 }
});
test('local history migration, per-mode/time records and daily total survive trimming',()=>{
 const old={category:'all',duration:180,correct:4,wrong:1,date:new Date().toISOString()};
 const progress=migrateProgress([old],{'all:180':12,'u/ó:60':8});assert.equal(progress.best['spelling:180'],12);assert.equal(progress.history[0].mode,'spelling');
 for(let i=0;i<55;i++)recordResult(progress,{...old,mode:'math',difficulty:1});
 assert.equal(progress.history.length,50);assert.equal(progress.today.count,280);assert.equal(progress.best['math:180'],4);assert.equal(progress.best['spelling:180'],12);
 assert.deepEqual(cleanProgress(JSON.parse(JSON.stringify(progress))),progress);
 const tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);recordResult(progress,{...old,mode:'flags',difficulty:1,date:tomorrow.toISOString()});
 assert.equal(progress.today.day,localDay(tomorrow));assert.equal(progress.today.count,5);
});
test('saved configurations and corrupt storage are validated',()=>{
 for(const mode of modeIds){for(const duration of DURATIONS)assert.equal(cleanConfig(mode,{duration}).duration,duration);assert.equal(cleanConfig(mode,{category:'bad',duration:-1,difficulty:8}).category,'all');}
 assert.equal(cleanConfig('spelling',{difficulty:0}).difficulty,0);assert.deepEqual(cleanProgress({history:'bad',best:{'math:60':-3},today:{count:-1}}).history,[]);
});
test('manifest and service worker stay relative and all precached assets exist',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../manifest.webmanifest',import.meta.url),'utf8'));assert.equal(manifest.scope,'./');assert.equal(manifest.start_url,'./');assert.equal(manifest.display,'standalone');
 for(const icon of manifest.icons)await access(new URL('../'+icon.src,import.meta.url));
 const code=await readFile(new URL('../sw.js',import.meta.url),'utf8');assert.ok(!code.includes('unregister'));assert.ok(!code.includes('skipWaiting'));
 const assets=Function('self',code+';return ASSETS;')({location:{href:'https://example.test/dyktando/sw.js'},addEventListener(){}});
 for(const url of assets){assert.ok(url.startsWith('https://example.test/dyktando/'));await access(new URL('../'+url.replace('https://example.test/dyktando/',''),import.meta.url));}
});
