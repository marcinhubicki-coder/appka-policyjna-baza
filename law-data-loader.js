/* Offline-first law/document loader. Law search packs stay independent from
 * document resources, which are offline but deliberately excluded from search.
 */
(function(root){
  const manifest=root.__LAW_MANIFEST,documentManifest=root.__DOCUMENT_MANIFEST||null;
  if(!manifest||root.__LAW_USE_LEGACY)return;
  const packages=root.__LAW_PACKAGES||{isEnabled:()=>true};
  const dataCache=new Map(),searchCache=new Map(),metrics=new Map();
  let routerPromise=null,router=null,discoveryPromise=null,discovery=null;
  const now=()=>root.performance?.now?.()??Date.now();
  function emit(detail){root.dispatchEvent?.(new CustomEvent("police-law-pack-progress",{detail}))}
  async function gunzipJson(url,{packId="meta",kind="meta"}={}){
    const started=now();emit({packId,kind,stage:"fetch",progress:.08});const response=await fetch(url,{cache:"default"});
    if(!response.ok)throw new Error(`Nie można odczytać ${url} (${response.status})`);const buffer=await response.arrayBuffer(),fetchedAt=now();
    emit({packId,kind,stage:"decompress",progress:.42,bytes:buffer.byteLength});if(typeof DecompressionStream!=="function")throw new Error("Ta przeglądarka nie obsługuje rozpakowywania bazy");
    const stream=new Blob([buffer]).stream().pipeThrough(new DecompressionStream("gzip")),raw=await new Response(stream).text(),decodedAt=now();
    emit({packId,kind,stage:"parse",progress:.78,bytes:buffer.byteLength,jsonChars:raw.length});const value=JSON.parse(raw),completedAt=now();
    const stat={bytes:buffer.byteLength,jsonChars:raw.length,fetchMs:fetchedAt-started,decodeMs:decodedAt-fetchedAt,parseMs:completedAt-decodedAt,totalMs:completedAt-started};
    metrics.set(packId+":"+kind,stat);emit({packId,kind,stage:"ready",progress:1,...stat});return value;
  }
  function actInfo(code){return manifest.acts?.[code]||documentManifest?.acts?.[code]||null}
  function isDocument(code){return !!documentManifest?.acts?.[code]}
  function packForAct(code){return manifest.acts?.[code]?.pack||(isDocument(code)?"documents":null)}
  function packInfo(packId){if(packId==="documents")return documentManifest?{name:documentManifest.name||root.__LAW_CONFIG?.documents?.name||"Dokumenty i wzory",acts:Object.keys(documentManifest.acts||{}),mandatory:false,order:documentManifest.order||70,search:documentManifest.search}:null;return manifest.packs?.[packId]||null}
  function enabledPackIds(){const ids=Object.entries(manifest.packs||{}).sort(([,a],[,b])=>(a.order||0)-(b.order||0)).filter(([,pack])=>pack.mandatory||pack.acts.some(code=>packages.isEnabled?.(code)!==false)).map(([id])=>id);if(documentManifest&&Object.keys(documentManifest.acts||{}).some(code=>packages.isEnabled?.(code)!==false))ids.push("documents");return ids}
  async function loadRouter(){if(router)return router;if(!routerPromise)routerPromise=gunzipJson(manifest.router,{packId:"router",kind:"router"}).then(v=>router=v);return routerPromise}
  async function loadDiscovery(){if(discovery)return discovery;if(!discoveryPromise)discoveryPromise=gunzipJson(manifest.discovery,{packId:"discovery",kind:"discovery"}).then(v=>discovery=v);return discoveryPromise}
  async function loadAct(code){if(dataCache.has(code))return dataCache.get(code);const info=actInfo(code);if(!info?.data)throw new Error("Brak danych aktu: "+code);const promise=gunzipJson(info.data,{packId:packForAct(code)||code,kind:(isDocument(code)?"document:":"data:")+code}).catch(error=>{dataCache.delete(code);throw error});dataCache.set(code,promise);const value=await promise;dataCache.set(code,value);return value}
  async function loadData(packId){const pack=packInfo(packId);if(!pack)throw new Error("Nieznany pakiet: "+packId);return Promise.all(pack.acts.map(loadAct))}
  async function loadSearch(packId){if(searchCache.has(packId))return searchCache.get(packId);const pack=packInfo(packId);if(!pack?.search)throw new Error("Brak indeksu pakietu: "+packId);const promise=gunzipJson(pack.search,{packId,kind:"search"}).catch(error=>{searchCache.delete(packId);throw error});searchCache.set(packId,promise);const value=await promise;searchCache.set(packId,value);return value}
  async function ensureActData(code){const packId=packForAct(code);if(!packId)throw new Error("Brak danych dla "+code);return{packId,data:await loadAct(code)}}
  function releaseAct(code){return dataCache.delete(code)}
  function releaseData(packId){const pack=packInfo(packId);if(!pack)return false;let changed=false;for(const code of pack.acts)changed=dataCache.delete(code)||changed;return changed}
  function releaseSearch(packId){if(manifest.packs?.[packId]?.mandatory)return false;return searchCache.delete(packId)}
  function snapshot(){const readyActs=[...dataCache.entries()].filter(([,v])=>!v?.then).map(([id])=>id);return{sourceHash:manifest.sourceHash,runtimeVersion:manifest.runtimeVersion,routerLoaded:!!router,discoveryLoaded:!!discovery,dataActs:readyActs,dataPacks:[...new Set(readyActs.map(packForAct).filter(Boolean))],searchPacks:[...searchCache.entries()].filter(([,v])=>!v?.then).map(([id])=>id),enabledPacks:enabledPackIds(),metrics:Object.fromEntries(metrics)}}
  root.__LAW_DATA={manifest,documentManifest,supported:typeof DecompressionStream==="function"&&typeof fetch==="function",loadRouter,loadDiscovery,loadAct,loadData,loadSearch,ensureActData,actInfo,isDocument,packForAct,packInfo,enabledPackIds,releaseAct,releaseData,releaseSearch,snapshot};
})(typeof window!=="undefined"?window:globalThis);
