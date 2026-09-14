// Mała Nauka service worker: small app shell + on-demand scene cache.
// All URLs are relative so the app works both at the Vercel root and under /dyktando/.
const BASE=new URL('./',self.location.href);
const PREFIX=`mala-nauka:${BASE.pathname}:`;
const APP_CACHE=PREFIX+'app-v7';
const SCENE_CACHE=PREFIX+'scenes-v1';
const FLAGS=['pl','de','fr','it','ua','se','ch','jp','nl','be','ie','at','no','dk','fi','cz','ee','bd','id','ng'];

const CORE=[
 './','index.html','app.css','app.js','spelling-art.css','spelling-mobile.css','spelling-art.js','debug-tools.js',
 'spelling/art.mjs','spelling/scenes.mjs','spelling/preview.mjs','spelling/hints.mjs','spelling/word-reveal.mjs',
 'game.mjs','modes.mjs','progress.mjs','manifest.webmanifest',
 'data/english.mjs','data/reading.mjs','data/flags.mjs','assets/lion.svg',
 'assets/icon-192.png','assets/icon-512.png','assets/icon-maskable-512.png','assets/apple-touch-icon.png',
 ...Array.from({length:8},(_,i)=>`data/words-0${i+1}.json`),
 ...FLAGS.map(code=>`assets/flags/${code}.svg`),
].map(path=>new URL(path,BASE).href);

function isScene(url){
 return url.origin===BASE.origin&&url.pathname.startsWith(new URL('assets/scenes/',BASE).pathname);
}

self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(APP_CACHE);
  await cache.addAll(CORE);
  await self.skipWaiting();
 })());
});

self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys()){
  if(key.startsWith(PREFIX)&&key!==APP_CACHE&&key!==SCENE_CACHE)await caches.delete(key);
 }
 await self.clients.claim();
})()));

self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname))return;

 if(isScene(url)){
  event.respondWith((async()=>{
   const cached=await caches.match(event.request,{cacheName:SCENE_CACHE});
   if(cached)return cached;
   try{
    const response=await fetch(event.request);
    if(response.ok){
     const cache=await caches.open(SCENE_CACHE);
     cache.put(event.request,response.clone()).catch(()=>{});
    }
    return response;
   }catch{
    return new Response('',{status:404,statusText:'Scene unavailable offline'});
   }
  })());
  return;
 }

 const canonical=new URL(url.pathname,BASE.origin).href;
 if(!CORE.includes(canonical))return;

 event.respondWith((async()=>{
  try{
   const response=await fetch(event.request,{cache:'no-store'});
   if(response.ok){
    const cache=await caches.open(APP_CACHE);
    cache.put(canonical,response.clone()).catch(()=>{});
   }
   return response;
  }catch{
   return (await caches.match(canonical,{cacheName:APP_CACHE}))||Response.error();
  }
 })());
});
