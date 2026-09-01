const CACHE_VERSION='2026-09-01.6';
const CACHE_PREFIX='policyjna-baza-';
const CACHE_NAME=CACHE_PREFIX+CACHE_VERSION;
const PRECACHE_URLS=Object.freeze([
  './index.html',
  './manifest.webmanifest',
  './icons/app-icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './app.css',
  './nav.css',
  './menu-hotfix.css',
  './favorites-ui.css',
  './data.js',
  './linking-rules.js',
  './app.js',
  './uop-summaries.js',
  './cleanup.js',
  './nav.js',
  './ux-fixes.js',
  './menu-sync-fix.js',
  './slider-preview-fix.js',
  './toc-layout-fix.js',
  './search-ux-v2.js',
  './favorites-model.js',
  './favorites-ui.js',
  './settings.js',
  './offline.js'
]);

async function cacheAll(){
  const cache=await caches.open(CACHE_NAME);
  for(const url of PRECACHE_URLS){
    if(await cache.match(url,{ignoreSearch:true}))continue;
    const response=await fetch(new Request(url,{cache:'reload'}));
    if(!response.ok)throw new Error(`Nie można zapisać ${url} (${response.status})`);
    await cache.put(url,response);
  }
}

self.addEventListener('install',event=>event.waitUntil(cacheAll().then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_NAME).map(key=>caches.delete(key)));
  await self.clients.claim();
})()));
self.addEventListener('message',event=>{
  if(event.data?.type!=='CACHE_ALL')return;
  const port=event.ports?.[0];
  event.waitUntil(cacheAll().then(()=>port?.postMessage({ok:true,version:CACHE_VERSION})).catch(error=>port?.postMessage({ok:false,error:error?.message||String(error)})));
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    if(request.mode==='navigate'){
      const shell=await cache.match('./index.html');
      if(shell)return shell;
    }
    const cached=await cache.match(request,{ignoreSearch:true});
    if(cached)return cached;
    const response=await fetch(request);
    if(response.ok)await cache.put(request,response.clone());
    return response;
  })());
});
