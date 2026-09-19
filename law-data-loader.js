/* Offline-first law pack loader. Pack files are precached by the service worker,
 * while startup routing, full-text discovery and opened law data are decompressed separately.
 */
(function(root){
  const manifest=root.__LAW_MANIFEST;
  if(!manifest||root.__LAW_USE_LEGACY)return;

  const packages=root.__LAW_PACKAGES||{isEnabled:()=>true};
  const dataCache=new Map(),searchCache=new Map(),metrics=new Map();
  let routerPromise=null,router=null,discoveryPromise=null,discovery=null;

  const now=()=>root.performance?.now?.()??Date.now();
  function emit(detail){
    root.dispatchEvent?.(new CustomEvent("police-law-pack-progress",{detail}));
  }
  async function gunzipJson(url,{packId="meta",kind="meta"}={}){
    const started=now();
    emit({packId,kind,stage:"fetch",progress:.08});
    const response=await fetch(url,{cache:"default"});
    if(!response.ok)throw new Error(`Nie można odczytać ${url} (${response.status})`);
    const buffer=await response.arrayBuffer();
    const fetchedAt=now();
    emit({packId,kind,stage:"decompress",progress:.42,bytes:buffer.byteLength});
    if(typeof DecompressionStream!=="function")throw new Error("Ta przeglądarka nie obsługuje rozpakowywania bazy");
    const stream=new Blob([buffer]).stream().pipeThrough(new DecompressionStream("gzip"));
    const raw=await new Response(stream).text();
    const decodedAt=now();
    emit({packId,kind,stage:"parse",progress:.78,bytes:buffer.byteLength,jsonChars:raw.length});
    const value=JSON.parse(raw);
    const completedAt=now();
    const stat={
      bytes:buffer.byteLength,
      jsonChars:raw.length,
      fetchMs:fetchedAt-started,
      decodeMs:decodedAt-fetchedAt,
      parseMs:completedAt-decodedAt,
      totalMs:completedAt-started
    };
    metrics.set(packId+":"+kind,stat);
    emit({packId,kind,stage:"ready",progress:1,...stat});
    return value;
  }
  function packForAct(code){return manifest.acts?.[code]?.pack||null}
  function packInfo(packId){return manifest.packs?.[packId]||null}
  function enabledPackIds(){
    return Object.entries(manifest.packs||{})
      .sort(([,a],[,b])=>(a.order||0)-(b.order||0))
      .filter(([,pack])=>pack.mandatory||pack.acts.some(code=>packages.isEnabled?.(code)!==false))
      .map(([id])=>id);
  }
  async function loadRouter(){
    if(router)return router;
    if(!routerPromise)routerPromise=gunzipJson(manifest.router,{packId:"router",kind:"router"}).then(value=>router=value);
    return routerPromise;
  }
  async function loadDiscovery(){
    if(discovery)return discovery;
    if(!discoveryPromise)discoveryPromise=gunzipJson(manifest.discovery,{packId:"discovery",kind:"discovery"}).then(value=>discovery=value);
    return discoveryPromise;
  }
  async function loadData(packId){
    if(dataCache.has(packId))return dataCache.get(packId);
    const pack=packInfo(packId);if(!pack)throw new Error("Nieznany pakiet: "+packId);
    const promise=gunzipJson(pack.data,{packId,kind:"data"}).catch(error=>{dataCache.delete(packId);throw error});
    dataCache.set(packId,promise);
    const value=await promise;dataCache.set(packId,value);return value;
  }
  async function loadSearch(packId){
    if(searchCache.has(packId))return searchCache.get(packId);
    const pack=packInfo(packId);if(!pack)throw new Error("Nieznany pakiet: "+packId);
    const promise=gunzipJson(pack.search,{packId,kind:"search"}).catch(error=>{searchCache.delete(packId);throw error});
    searchCache.set(packId,promise);
    const value=await promise;searchCache.set(packId,value);return value;
  }
  async function ensureActData(code){
    const packId=packForAct(code);if(!packId)throw new Error("Brak pakietu dla "+code);
    return{packId,data:await loadData(packId)};
  }
  function releaseData(packId){
    if(packInfo(packId)?.mandatory)return false;
    return dataCache.delete(packId);
  }
  function releaseSearch(packId){
    if(packInfo(packId)?.mandatory)return false;
    return searchCache.delete(packId);
  }
  function snapshot(){
    return{
      sourceHash:manifest.sourceHash,
      runtimeVersion:manifest.runtimeVersion,
      routerLoaded:!!router,
      discoveryLoaded:!!discovery,
      dataPacks:[...dataCache.entries()].filter(([,value])=>!value?.then).map(([id])=>id),
      searchPacks:[...searchCache.entries()].filter(([,value])=>!value?.then).map(([id])=>id),
      enabledPacks:enabledPackIds(),
      metrics:Object.fromEntries(metrics)
    };
  }
  root.__LAW_DATA={
    manifest,
    supported:typeof DecompressionStream==="function"&&typeof fetch==="function",
    loadRouter,loadDiscovery,loadData,loadSearch,ensureActData,
    packForAct,packInfo,enabledPackIds,
    releaseData,releaseSearch,snapshot
  };
})(typeof window!=="undefined"?window:globalThis);
