(function(){
  const MARKER_RUN=/^\s+((?:\d+[a-z]?|[a-z])(?:\s+(?:\d+[a-z]?|[a-z])){1,40})(?=\s*(?:[,;:.§)]|\b(?:lub|oraz|i|albo|stosuje|nie|może|mogą|podlega|w|we|na|do|przepisy|Policja|sąd|minister|osoba|osoby|który|która|które|których|jeżeli|za|przy|od|z|ze|dla|wykonywania|wykonuje|wykonując)\b))/i;

  function stripLegacyTail(el){
    const n=el.nextSibling;
    if(!n || n.nodeType!==Node.TEXT_NODE) return;
    const m=n.nodeValue.match(MARKER_RUN);
    if(m) n.nodeValue=n.nodeValue.slice(m[0].length);
  }

  function actPrefix(){
    if(typeof ACT==="undefined" || !ACT) return null;
    return ACT[0].startsWith("z") ? `${ACT[0]}-par-` : `${ACT[0]}-art-`;
  }

  function repairSplitArticle(a){
    const txt=(a.textContent||"").trim();
    const m=txt.match(/^art\.\s*(\d+)$/i);
    if(!m) return;
    const n=a.nextSibling;
    if(!n || n.nodeType!==Node.TEXT_NODE) return;
    const hitText=n.nodeValue.match(/^\s+((?:\d+\s+){0,3}\d+[a-z]{1,4})\b/i);
    if(!hitText) return;
    const tokens=hitText[1];
    const parts=tokens.trim().split(/\s+/);
    const prefix=actPrefix();
    const candidates=[m[1]+parts.join("")];
    for(let i=0;i<parts.length;i++) candidates.push(parts.slice(i).join(""));
    let hit=null;
    if(prefix && typeof idMap!=="undefined") hit=candidates.find(x=>idMap.has(prefix+x.toLowerCase()))||null;
    if(hit){
      a.textContent=`art. ${hit}`;
      a.setAttribute("href",`#${prefix}${hit.toLowerCase()}`);
      const ws=n.nodeValue.match(/^\s+/)?.[0].length||0;
      n.nodeValue=n.nodeValue.slice(ws+tokens.length);
      return;
    }
    if(parts.length===1){
      const joined=m[1]+parts[0];
      a.replaceWith(document.createTextNode(`art. ${joined}`));
      const ws=n.nodeValue.match(/^\s+/)?.[0].length||0;
      n.nodeValue=n.nodeValue.slice(ws+tokens.length);
    }
  }

  function cleanup(root=document){
    root.querySelectorAll?.(".navrefs").forEach(stripLegacyTail);
    root.querySelectorAll?.("a.simple").forEach(a=>{
      repairSplitArticle(a);
      if(a.isConnected) stripLegacyTail(a);
    });
    root.querySelectorAll?.(".txt").forEach(el=>{
      for(const n of el.childNodes){
        if(n.nodeType===Node.TEXT_NODE){
          n.nodeValue=n.nodeValue.replace(/\s+([,.;:])/g,"$1").replace(/[ \t]{2,}/g," ");
        }
      }
    });
  }

  const target=document.getElementById("actview");
  if(target){
    window.addEventListener("police-law-rendered",()=>cleanup(target));
    setTimeout(()=>cleanup(target),0);
  }
})();
