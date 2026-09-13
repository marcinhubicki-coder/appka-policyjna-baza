// All URLs are relative: works at the Vercel root and under /dyktando/.
const BASE=new URL('./',self.location.href);
const PREFIX=`mala-nauka:${BASE.pathname}:`;
const CACHE=PREFIX+'v1-20260913';
const FLAGS=['pl','de','fr','it','ua','se','ch','jp','nl','be','ie','at','no','dk','fi','cz','ee','bd','id','ng'];
const ASSETS=['./','index.html','app.css','app.js','game.mjs','modes.mjs','progress.mjs','manifest.webmanifest',
 'data/english.mjs','data/reading.mjs','data/flags.mjs','assets/lion.svg',
 'assets/icon-192.png','assets/icon-512.png','assets/icon-maskable-512.png','assets/apple-touch-icon.png',
 ...Array.from({length:8},(_,i)=>`data/words-0${i+1}.json`),...FLAGS.map(code=>`assets/flags/${code}.svg`)].map(path=>new URL(path,BASE).href);
self.addEventListener('install',event=>{
 // Activate updates when existing sessions close; never replace code mid-round.
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
});
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname))return;
 // Handle only this app's shell and listed assets, never unrelated routes.
 const canonical=new URL(url.pathname,BASE.origin).href;
 if(!ASSETS.includes(canonical))return;
 event.respondWith((async()=>{
  const cached=await caches.match(canonical,{cacheName:CACHE});
  return cached||fetch(event.request);
 })());
});
