/* Shared data rules; no DOM dependencies so import and UI use the same semantics. */
(function(root){
  const KEY='police-law-packages-v1',DEFAULT_OFF=new Set(['bim','alk']);
  let preferences={};
  try{const value=JSON.parse(root.localStorage?.getItem(KEY)||'{}');if(value&&typeof value==='object'&&!Array.isArray(value))preferences=value}catch(_){}
  function isEnabled(code){return typeof preferences[code]==='boolean'?preferences[code]:!DEFAULT_OFF.has(code)}
  function setEnabled(code,on){
    const next={...preferences,[code]:!!on};
    try{root.localStorage.setItem(KEY,JSON.stringify(next))}catch(_){return false}
    preferences=next;return true;
  }
  function hiddenPills(rects,viewport){
    return rects.filter(rect=>Math.max(0,Math.min(rect.right,viewport.right)-Math.max(rect.left,viewport.left))<=rect.width/2).length;
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
  root.__READER_CORE={hiddenPills,sections,migrateFavorites};
  root.__LAW_PACKAGES={isEnabled,setEnabled};
})(typeof window!=='undefined'?window:globalThis);
