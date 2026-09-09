/* Portable JSON backup for article and fragment favorites. */
(function(){
  const KEY='police-law-bookmarks-v1',FORMAT='policyjna-baza-ulubione',VERSION=1,MAX_BYTES=2*1024*1024;
  const exportButton=document.getElementById('favoritesExport'),importButton=document.getElementById('favoritesImport'),fileInput=document.getElementById('favoritesImportFile'),status=document.getElementById('favoritesTransferStatus'),dialog=document.getElementById('favoritesImportDialog'),backdrop=document.getElementById('favoritesImportBackdrop'),cancel=document.getElementById('favoritesImportCancel'),name=document.getElementById('favoritesImportName'),settings=document.getElementById('settingsPanel');
  if(!exportButton||!importButton||!fileInput||!dialog)return;
  let pendingItems=null,pendingFile='',lastFocus=null;
  const IMPORT_KEY=KEY+'-last-import';
  function showImport(meta){setStatus(`Zaimportowano ${meta.count} ${meta.count===1?'ulubiony artykuł':'ulubionych artykułów'}.`,'success');const source=document.createElement('span');source.className='favorites-import-source';source.textContent=meta.file+' · Wczytano '+new Date(meta.at).toLocaleString('pl-PL',{dateStyle:'short',timeStyle:'short'});status.append(source)}
  function read(){try{const value=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(value)?value:[]}catch(_){return[]}}
  function rowIndex(){const rows=new Map();for(const act of Array.isArray(DATA)?DATA:[])for(const row of act[3]||[])rows.set(row[0],{act,row});return rows}
  function normalize(item,index){
    if(!item||typeof item!=='object'||typeof item.id!=='string')return null;
    let hit=index.get(item.id);
    if(!hit)for(const act of DATA){const id=act[4]?.idAliases?.[item.id];if(id){hit=index.get(id);break}}
    if(!hit)return null;const meta=hit.act[4],legacy=item.dataRevision!==meta?.revision;
    const out={id:hit.row[0],act:hit.act[0],num:hit.row[2],topic:hit.row[3]||'',dataRevision:meta?.revision};
    if(item.partsBeforeUpdate)out.partsBeforeUpdate=item.partsBeforeUpdate;
    if(item.needsFragmentReview)out.needsFragmentReview=true;
    if(Array.isArray(item.parts)){
      const valid=(globalThis.__FAVORITES_MODEL?.describe?.(hit.row)||[]).map(part=>part.key),allowed=new Set(valid);
      const parts=[...new Set(item.parts.map(key=>legacy&&Object.hasOwn(meta?.partAliases||{},key)?meta.partAliases[key]:key))];
      if(parts.some(key=>typeof key!=='string'||!allowed.has(key))||!parts.length){out.partsBeforeUpdate=[...item.parts];out.needsFragmentReview=true}
      else if(parts.length<valid.length){out.parts=parts;out.favoriteVersion=2}
    }
    return out;
  }
  function normalizeAll(items){const index=rowIndex(),valid=[],skipped=[];for(const item of items){const next=normalize(item,index);if(next)valid.push(next);else skipped.push(item)}return{valid:merge([],valid),skipped}}
  function mergeParts(current,incoming,row){if(!Array.isArray(current.parts)||!Array.isArray(incoming.parts)){delete current.parts;delete current.favoriteVersion;return current}const valid=globalThis.__FAVORITES_MODEL?.describe?.(row)?.map(part=>part.key)||[],set=new Set([...current.parts,...incoming.parts].filter(part=>valid.includes(part)));if(set.size>=valid.length){delete current.parts;delete current.favoriteVersion}else{current.parts=[...set];current.favoriteVersion=2}return current}
  function merge(current,incoming){const index=rowIndex(),out=current.map(item=>({...item,parts:Array.isArray(item.parts)?[...item.parts]:undefined})),byId=new Map(out.map(item=>[item.id,item]));for(const item of incoming){const found=byId.get(item.id);if(found)mergeParts(found,item,index.get(item.id)?.row);else{const copy={...item,parts:Array.isArray(item.parts)?[...item.parts]:undefined};out.push(copy);byId.set(copy.id,copy)}}return out.map(item=>{if(item.parts===undefined){const copy={...item};delete copy.parts;return copy}return item})}
  function save(items){const backup=KEY+'-before-import';localStorage.setItem(backup,localStorage.getItem(KEY)||'[]');localStorage.setItem(KEY,JSON.stringify(items));window.dispatchEvent(new CustomEvent('police-law-favorites-change'));globalThis.__POLICE_DRAWER_REFRESH?.()}
  function setStatus(text,type=''){status.textContent=text;status.classList.toggle('is-success',type==='success');status.classList.toggle('is-error',type==='error')}
  function filename(){return`policyjna-baza-ulubione-${new Date().toISOString().slice(0,10)}.json`}
  async function exportFavorites(){const payload={format:FORMAT,version:VERSION,exportedAt:new Date().toISOString(),favorites:read()},json=JSON.stringify(payload,null,2),downloadName=filename();try{const file=typeof File==='function'?new File([json],downloadName,{type:'application/json'}):null;if(file&&navigator.share&&navigator.canShare?.({files:[file]})){await navigator.share({title:'Kopia ulubionych',files:[file]});setStatus('Kopia ulubionych została przygotowana.','success');return}const blob=file||new Blob([json],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=downloadName;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);setStatus('Pobrano kopię ulubionych.','success')}catch(error){if(error?.name!=='AbortError')setStatus('Nie udało się wyeksportować ulubionych.','error')}}
  function closeDialog(){document.body.classList.remove('favorites-import-open');dialog.setAttribute('aria-hidden','true');settings&&(settings.inert=false);pendingItems=null;(lastFocus||importButton).focus?.({preventScroll:true});lastFocus=null}
  function openDialog(file,items){pendingItems=items;pendingFile=file.name;lastFocus=document.activeElement;if(name)name.textContent='Wybrano: '+file.name;settings&&(settings.inert=true);document.body.classList.add('favorites-import-open');dialog.setAttribute('aria-hidden','false');requestAnimationFrame(()=>dialog.querySelector('[data-import-mode="merge"]')?.focus({preventScroll:true}))}
  async function chooseFile(){const file=fileInput.files?.[0];fileInput.value='';if(!file)return;if(file.size>MAX_BYTES){setStatus('Plik jest zbyt duży, aby był kopią ulubionych.','error');return}try{const parsed=JSON.parse(await file.text()),items=Array.isArray(parsed)?parsed:parsed?.format===FORMAT&&Array.isArray(parsed.favorites)?parsed.favorites:null;if(!items)throw new Error('format');const normalized=normalizeAll(items);if(items.length&&normalized.valid.length===0)throw new Error('content');openDialog(file,normalized.valid);if(normalized.skipped.length)setStatus(`Pominięto ${normalized.skipped.length} nieznanych wpisów.`)}catch(_){setStatus('Nie udało się odczytać pliku z ulubionymi.','error')}}
  function applyImport(mode){if(!pendingItems)return;try{const items=mode==='replace'?pendingItems:merge(normalizeAll(read()).valid,pendingItems);save(items);const meta={count:pendingItems.length,file:pendingFile,at:new Date().toISOString()};try{localStorage.setItem(IMPORT_KEY,JSON.stringify(meta))}catch(_){}closeDialog();showImport(meta)}catch(_){closeDialog();setStatus('Nie udało się zapisać importowanych ulubionych.','error')}}
  try{const saved=JSON.parse(localStorage.getItem(IMPORT_KEY)||'null');if(saved&&typeof saved.file==='string'&&Number.isFinite(saved.count)&&Number.isFinite(Date.parse(saved.at)))showImport(saved)}catch(_){}
  exportButton.addEventListener('click',exportFavorites);importButton.addEventListener('click',()=>fileInput.click());fileInput.addEventListener('change',chooseFile);dialog.addEventListener('click',event=>{const button=event.target.closest('[data-import-mode]');if(button)applyImport(button.dataset.importMode)});cancel?.addEventListener('click',closeDialog);backdrop?.addEventListener('click',closeDialog);document.addEventListener('keydown',event=>{if(event.key!=='Escape'||!document.body.classList.contains('favorites-import-open'))return;event.preventDefault();event.stopImmediatePropagation();closeDialog()},{capture:true});
})();
