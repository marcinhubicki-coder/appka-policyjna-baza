/* Shared data rules; no DOM dependencies so import and UI use the same semantics. */
(function(root){
  const KEY='police-law-packages-v1',ORDER_KEY='police-law-act-order-v1',PIN_KEY='police-law-pinned-v1',DEFAULT_OFF=new Set(['bim','alk']);
  let preferences={};
  try{const value=JSON.parse(root.localStorage?.getItem(KEY)||'{}');if(value&&typeof value==='object'&&!Array.isArray(value))preferences=value}catch(_){}
  function defaultEnabled(code){const configured=root.__LAW_CONFIG?.acts?.[code]?.defaultEnabled;return typeof configured==='boolean'?configured:!DEFAULT_OFF.has(code)}
  function isEnabled(code){return typeof preferences[code]==='boolean'?preferences[code]:defaultEnabled(code)}
  function setEnabled(code,on){
    return setMany([code],on);
  }
  function setMany(codes,on){
    const next={...preferences};for(const code of codes)next[code]=!!on;
    try{root.localStorage.setItem(KEY,JSON.stringify(next))}catch(_){return false}
    preferences=next;return true;
  }
  let savedOrder=[];
  try{const value=JSON.parse(root.localStorage?.getItem(ORDER_KEY)||'[]');if(Array.isArray(value))savedOrder=[...new Set(value.filter(code=>typeof code==='string'))]}catch(_){}
  function order(codes){const available=new Set(codes);return [...savedOrder.filter(code=>available.has(code)),...codes.filter(code=>!savedOrder.includes(code))]}
  function setOrder(codes){try{root.localStorage.setItem(ORDER_KEY,JSON.stringify(codes))}catch(_){return false}savedOrder=[...codes];return true}
  let savedPins=null;try{const value=JSON.parse(root.localStorage?.getItem(PIN_KEY)||'null');if(Array.isArray(value))savedPins=[...new Set(value.filter(code=>typeof code==='string'))]}catch(_){}
  function quickbarEligible(code){const meta=root.__LAW_CONFIG?.acts?.[code];return meta?.kind!=='document'&&meta?.quickbarEligible!==false}
  function pinned(codes){const available=new Set(codes),base=savedPins??order(codes).filter(code=>quickbarEligible(code)&&isEnabled(code)).slice(0,9);return base.filter(code=>available.has(code)&&quickbarEligible(code))}
  function isPinned(code,codes){return pinned(codes).includes(code)}
  function savePins(next){try{root.localStorage.setItem(PIN_KEY,JSON.stringify(next))}catch(_){return false}savedPins=[...next];return true}
  function setPinned(code,on,codes){if(!quickbarEligible(code))return false;const current=pinned(codes),has=current.includes(code);if(on&&!has)current.push(code);else if(!on&&has)current.splice(current.indexOf(code),1);return savePins(current)}
  function setPinnedOrder(next,codes){const current=pinned(codes);if(next.length!==current.length||new Set(next).size!==next.length||next.some(code=>!current.includes(code)))return false;return savePins(next)}
  // Peak speed near the middle, with a longer, very gentle landing.
  function readingEase(t){t=Math.max(0,Math.min(1,t));return 70*t**4-224*t**5+280*t**6-160*t**7+35*t**8}
  const CUE_START=.3;
  function hiddenPills(rects,viewport){
    return rects.filter(rect=>rect.width>0&&rect.left+rect.width*CUE_START>viewport.right).length;
  }
  function overflowCue(rects,viewport){
    const count=hiddenPills(rects,viewport),last=rects.at(-1);
    const visible=last?.width?Math.max(0,Math.min(1,(viewport.right-last.left)/last.width)):1;
    const amount=count?1:Math.max(0,Math.min(1,(1-visible)/(1-CUE_START)));
    return {count,text:count?'+'+count:'+',amount};
  }
  function sections(rows,sectionInfo){
    const roots=[];
    for(const row of rows){
      const path=row[9]?.length?row[9]:[sectionInfo(row)];let children=roots;
      for(const part of path){
        const key=part.prefix+'|'+part.title;let node=children.at(-1);
        if(!node||node.key!==key){node={key,prefix:part.prefix,title:part.title,rows:[],children:[]};children.push(node)}
        node.rows.push(row);children=node.children;
      }
    }
    return roots;
  }
  function migrateFavorites(data,storage=root.localStorage){
    const key='police-law-bookmarks-v1',revision='2026-09-07',done='police-law-bookmarks-data-revision';
    if(!data.some(act=>act[4]?.revision===revision))return;
    try{
      if(storage.getItem(done)===revision)return;
      const raw=storage.getItem(key)||'[]',items=JSON.parse(raw);
      if(!Array.isArray(items))throw Error('Nieprawidłowa lista ulubionych');
      const acts=new Map(data.map(act=>[act[0],act]));
      const next=items.map(item=>{
        const act=acts.get(item.act),meta=act?.[4];if(!meta)return item;
        if(item.dataRevision===revision)return item;
        const copy={...item,id:meta.idAliases?.[item.id]||item.id,dataRevision:revision};
        const row=act[3].find(row=>row[0]===copy.id);if(!row)return copy;
        copy.num=row[2];copy.topic=row[3];
        if(Array.isArray(item.parts)){
          const valid=new Set(row[4].map((unit,index)=>unit[0]||`${row[0]}@@${index}`));
          const parts=item.parts.map(key=>Object.hasOwn(meta.partAliases||{},key)?meta.partAliases[key]:key);
          if(parts.some(key=>!key||!valid.has(key))){copy.partsBeforeUpdate=[...item.parts];delete copy.parts;copy.needsFragmentReview=true}
          else copy.parts=[...new Set(parts)];
        }
        return copy;
      });
      // A failed backup stops migration. Never overwrite the original backup.
      const backup=key+'-before-'+revision;if(storage.getItem(backup)===null)storage.setItem(backup,raw);
      storage.setItem(key,JSON.stringify(next));storage.setItem(done,revision);
      root.__FAVORITES_MIGRATION={review:next.filter(item=>item.needsFragmentReview).length};
    }catch(error){root.__FAVORITES_MIGRATION={error:true}}
  }
  function migrateFavoritesCatalog(catalog,storage=root.localStorage){
    const key='police-law-bookmarks-v1',revision='2026-09-07',done='police-law-bookmarks-data-revision';
    if(!catalog?.migrations||!Object.values(catalog.migrations).some(meta=>meta?.revision===revision))return;
    try{
      if(storage.getItem(done)===revision)return;
      const raw=storage.getItem(key)||'[]',items=JSON.parse(raw);
      if(!Array.isArray(items))throw Error('Nieprawidłowa lista ulubionych');
      const articles=new Map((catalog.articles||[]).map(row=>[row[0],row]));
      const next=items.map(item=>{
        const meta=catalog.migrations[item.act];if(!meta)return item;
        if(item.dataRevision===revision)return item;
        const copy={...item,id:meta.idAliases?.[item.id]||item.id,dataRevision:revision};
        const row=articles.get(copy.id);if(!row)return copy;
        copy.num=row[3];copy.topic=row[4];
        if(Array.isArray(item.parts)){
          const valid=new Set(row[6]||[]);
          const parts=item.parts.map(part=>Object.hasOwn(meta.partAliases||{},part)?meta.partAliases[part]:part);
          if(parts.some(part=>!part||!valid.has(part))){copy.partsBeforeUpdate=[...item.parts];delete copy.parts;copy.needsFragmentReview=true}
          else copy.parts=[...new Set(parts)];
        }
        return copy;
      });
      const backup=key+'-before-'+revision;if(storage.getItem(backup)===null)storage.setItem(backup,raw);
      storage.setItem(key,JSON.stringify(next));storage.setItem(done,revision);
      root.__FAVORITES_MIGRATION={review:next.filter(item=>item.needsFragmentReview).length};
    }catch(error){root.__FAVORITES_MIGRATION={error:true}}
  }
  root.__READER_CORE={hiddenPills,overflowCue,sections,migrateFavorites,migrateFavoritesCatalog,readingEase};
  root.__LAW_PACKAGES={isEnabled,setEnabled,setMany,order,setOrder,pinned,isPinned,setPinned,setPinnedOrder,quickbarEligible};
})(typeof window!=='undefined'?window:globalThis);
