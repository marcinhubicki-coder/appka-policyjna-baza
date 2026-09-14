import { sceneFor, chooseLayout, sceneUrl } from './scenes.mjs';
import { mountHintButton } from './hints.mjs';
import { decorateWord } from './word-reveal.mjs';

const app=document.querySelector('#app');
if(!app)throw new Error('Missing #app root');

const questionMemory=new Map();
let scheduled=false;

function currentQuestionNumber(){
  const text=app.querySelector('.game-meta span')?.textContent||'';
  return Number(text.match(/\d+/)?.[0]||0);
}

function maskedFromAria(word){
  const aria=word?.getAttribute('aria-label')||'';
  if(!aria)return '';
  if(/luka/i.test(aria))return aria.replace(/\s*[–—-]\s*luka\s*[–—-]\s*/i,'_').replace(/\s+/g,'');
  return '';
}

function mountScene(scene){
  const layer=document.createElement('div');
  layer.className='spelling-scene spelling-scene-calm';
  layer.setAttribute('aria-hidden','true');
  if(scene){
    const img=document.createElement('img');
    img.src=sceneUrl(scene);
    img.alt='';
    img.decoding='async';
    img.loading='eager';
    img.addEventListener('load',()=>{
      layer.classList.remove('spelling-scene-calm','scene-missing');
      layer.classList.add('scene-loaded');
    },{once:true});
    img.addEventListener('error',()=>{
      img.remove();
      layer.classList.add('scene-missing');
    },{once:true});
    layer.append(img);
  }else{
    layer.classList.add('scene-missing');
  }
  app.prepend(layer);
}

function decorate(){
  scheduled=false;
  if(app.dataset.view!=='game'||app.dataset.mode!=='spelling')return;
  if(app.querySelector('.spelling-title'))return;

  const word=app.querySelector('.word');
  const card=app.querySelector('.question-card');
  const answers=app.querySelector('.answers');
  if(!word||!card||!answers)return;

  const question=currentQuestionNumber();
  let masked=maskedFromAria(word);
  if(masked)questionMemory.set(question,masked);
  else masked=questionMemory.get(question)||'';

  const scene=sceneFor(masked);
  const layout=chooseLayout(masked,question,scene);
  const category=app.querySelector('.badge')?.textContent?.trim()||'';
  const feedback=!!word.querySelector('.filled');
  const options=[...answers.querySelectorAll('.answer')].map(el=>el.textContent.trim()).filter(Boolean);

  app.classList.add('spelling-art-ready');
  app.dataset.artLayout=layout;
  app.dataset.artScene=scene?.key||'calm';
  mountScene(scene);

  const title=document.createElement('h2');
  title.className='spelling-title';
  title.innerHTML='<span>Jak jest</span><span>poprawnie?</span><i aria-hidden="true"></i>';
  card.insertAdjacentElement('beforebegin',title);

  card.classList.add('spelling-question-card');
  app.querySelector('.badges')?.setAttribute('aria-hidden','true');
  app.querySelector('.prompt')?.setAttribute('aria-hidden','true');

  decorateWord(word,options,feedback);
  mountHintButton(app,answers,category);

  const n=question||1;
  const small=app.querySelector('.time-block small');
  if(small)small.textContent=`Przygoda · zadanie ${n}`;

  if(feedback){
    app.classList.add('spelling-has-feedback');
    app.querySelector('.spelling-hint')?.setAttribute('hidden','');
  }else{
    app.classList.remove('spelling-has-feedback');
  }
}

function scheduleDecorate(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(decorate);
}

new MutationObserver(scheduleDecorate).observe(app,{childList:true,subtree:true});
scheduleDecorate();
