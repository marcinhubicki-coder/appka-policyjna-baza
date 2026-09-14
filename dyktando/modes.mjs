import { CATEGORIES, DURATIONS, shuffle } from './game.mjs';
import { ENGLISH } from './data/english.mjs';
import { READING } from './data/reading.mjs';
import { FLAGS } from './data/flags.mjs';
export const MODES = {
 spelling: {name:'Ortografia',icon:'abc',hint:'Złap właściwą literę',color:'pink',categories:[['all','Wszystkie słowa'],...CATEGORIES.map(c=>[c,c.replace('/', ' / ')])],levels:['Wszystkie','Łatwe','Średnie','Trudne']},
 math: {name:'Matematyka',icon:'1+2',hint:'Małe działania, wielkie odkrycia',color:'blue',categories:[['all','Mieszane'],['add','Dodawanie'],['subtract','Odejmowanie'],['multiply','Mnożenie'],['divide','Dzielenie']],levels:['Łatwe','Średnie','Trudne']},
 english: {name:'Angielski',icon:'🇬🇧',hint:'Słówka i ich pisownia',color:'yellow',categories:[['all','Wszystkie słówka'],['numbers','Liczby'],['objects','Przedmioty'],['verbs','Czasowniki'],['jobs','Zawody'],['home','Dom'],['nature','Natura'],['animals','Zwierzęta']],levels:['Znaczenie','Pisownia','Trudniejsza pisownia']},
 flags: {name:'Flagi',icon:'🌍',hint:'Mała podróż dookoła świata',color:'green',categories:[['all','Cały świat'],['europe','Europa'],['world','Poza Europą']],levels:['Łatwe','Średnie','Trudne']},
 reading: {name:'Czytanie',icon:'book',hint:'Czytaj, zapamiętuj, rozumiej',color:'purple',categories:[['all','Trening czytania']],levels:['Słowa','Frazy','Zdania']}
};
export const modeIds = Object.keys(MODES);
export function cleanConfig(mode, value) {
 const categories = MODES[mode].categories.map(([id])=>id);
 return { category:categories.includes(value?.category)?value.category:'all',
  difficulty:[1,2,3,...(mode==='spelling'?[0]:[])].includes(value?.difficulty)?value.difficulty:(mode==='spelling'?0:1),
  duration:DURATIONS.includes(value?.duration)?value.duration:180 };
}
export function levelLabel(mode, level) { return MODES[mode].levels[mode==='spelling'?level:level-1]; }
export function categoryLabel(mode, category) { return MODES[mode].categories.find(([id])=>id===category)?.[1] || ''; }
const integer = (min,max,random) => min+Math.floor(random()*(max-min+1));
export function mathQuestion(config, random = Math.random) {
 const level=config.difficulty, limit=[0,10,50,100][level];
 const operation=config.category==='all'?shuffle(['add','subtract','multiply','divide'],random)[0]:config.category;
 let a,b,result,symbol;
 if(operation==='add') { a=integer(0,limit-1,random); b=integer(1,limit-a,random); result=a+b;symbol='+'; }
 if(operation==='subtract') { a=integer(1,limit,random); b=integer(0,a,random);result=a-b;symbol='−'; }
 if(operation==='multiply'||operation==='divide') {
  const factor=[0,5,10,12][level]; a=integer(1,factor,random);b=integer(1,factor,random);
  if(operation==='multiply') {result=a*b;symbol='×';}
  else {result=a;a*=b;symbol='÷';}
 }
 const radius=level===3&&result>20?8:5;
 const neighbours=Array.from({length:radius*2+1},(_,i)=>result+i-radius).filter(n=>n>=0&&n!==result);
 const options=[result,...shuffle(neighbours,random).slice(0,5)].map(String);
 return {kind:'math',text:`${a} ${symbol} ${b} = ?`,answer:String(result),options,full:`${a} ${symbol} ${b} = ${result}`,prompt:'Wybierz wynik działania',difficulty:level};
}
export function createSource(mode, config, words, random = Math.random) {
 if(mode==='spelling') return words.filter(w=>(config.category==='all'||w.category===config.category)&&(!config.difficulty||w.difficulty===config.difficulty))
  .map(w=>({...w,kind:'spelling',text:w.masked,full:w.word,prompt:'Co pasuje w lukę?'}));
 if(mode==='math') return ()=>mathQuestion(config,random);
 if(mode==='english') {
  let pool=ENGLISH.filter(w=>config.category==='all'||w.category===config.category);
  if(config.difficulty===3) { const longer=pool.filter(w=>w.word.length>=5);if(longer.length)pool=longer; }
  return pool.map(w=>({kind:'english',text:w.meaning,answer:w.word,full:w.word,
   options:config.difficulty===1?[w.word,...shuffle(ENGLISH.filter(o=>o.category===w.category&&o.word!==w.word),random).slice(0,3).map(o=>o.word)]:[w.word,...w.mistakes],
   prompt:config.difficulty===1?'Jak to jest po angielsku?':'Wybierz poprawną pisownię',difficulty:config.difficulty}));
 }
 if(mode==='flags') {
  const region=FLAGS.filter(f=>config.category==='all'||f.region===config.category);
  let pool=region.filter(f=>f.difficulty<=config.difficulty);if(pool.length<4)pool=region;
  return pool.map(f=>({kind:'flags',text:'Co to za kraj?',image:`assets/flags/${f.code}.svg`,answer:f.name,full:f.name,
   options:[f.name,...shuffle(pool.filter(other=>other!==f),random).slice(0,3).map(other=>other.name)],prompt:'Który kraj ma taką flagę?',difficulty:config.difficulty}));
 }
 if(mode==='reading') return READING.filter(r=>r.level===config.difficulty).map(r=>({...r,kind:'reading',full:r.text,difficulty:r.level}));
 throw Error('Nieznany tryb.');
}
