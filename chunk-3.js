// Link resolver patch v2 — ranges/lists, exact targets, return UX.
window.addEventListener('load',()=>{
  const P=[]; const put=s=>{const k='@@REF'+P.length+'@@';P.push(s);return k};
  const restore=s=>s.replace(/@@REF(\d+)@@/g,(_,n)=>P[+n]);
  const articleId=id=>{const m=(id||'').match(/^(.*?-art-\d+[a-z]?)/i);return m?m[1]:id};
  const parentFor=(id,type)=>{const a=articleId(id);if(type==='p'){const m=(id||'').match(/^(.*?-art-\d+[a-z]?-ust-\d+[a-z]?)/i);return m?m[1]:a}if(type==='i'){const m=(id||'').match(/^(.*?-art-\d+[a-z]?-ust-\d+[a-z]?-pkt-\d+[a-z]?)/i);return m?m[1]:a}return a};
  const child=(prefix,type,label)=>{const R=act?.[3]?.find(x=>prefix.startsWith(x[0]));if(!R)return null;const key=type==='p'?'-pkt-':type==='i'?'-lit-':'-ust-';return R[4].find(u=>u[1]===type&&u[0]===prefix+key+label)||null};
  const nav=xs=>{xs=[...new Map(xs.filter(Boolean).map(x=>[x[0],x])).values()];if(!xs.length)return'';return '<span class="navrefs">'+xs.map(x=>`<a href="#${x[0]}">${esc(x[2].replace(/^(ust\.|pkt|lit\.)\s*/i,''))}</a>`).join('')+'</span>'};
  const range=(a,b)=>{const A=parseInt(a),B=parseInt(b),o=[];if(!Number.isFinite(A)||!Number.isFinite(B)||B<A||B-A>50)return o;for(let n=A;n<=B;n++)o.push(String(n));return o};
  const clean=s=>(s||'').replace(/(pkt\s+\d+[a-z]?\s*[–-]\s*\d+[a-z]?(?:\s+(?:lub|albo|i)\s+\d+[a-z]?)?)\s+(?:\d+[a-z]?\s+){2,}\d+[a-z]?(?=\s+(?:lub|albo|i|oraz|bądź)\b)/gi,'$1');
  linkify=function(text,aid){
    P.length=0;
    const R=act?.[3]?.find(r=>r[0]===aid);
    const U=R?.[4]?.find(u=>u[3]===text);
    const ctx=U?.[0]||aid, art=articleId(ctx), ids=new Set(Object.keys(idMap));
    let t=esc(clean(text));
    t=t.replace(/art\.\s*(\d+[a-z]?)\s+ust\.\s*(\d+[a-z]?)\s+pkt\s+(\d+[a-z]?)/gi,(m,a,u,p)=>{const pref=art.split('-art-')[0],id=`${pref}-art-${a}-ust-${u}-pkt-${p}`;return ids.has(id)?put(`<a class="simple" href="#${id}">${m}</a>`):m});
    t=t.replace(/ust\.\s*(\d+[a-z]?)\s+pkt\s+(\d+[a-z]?)/gi,(m,u,p)=>{const id=`${art}-ust-${u}-pkt-${p}`;return ids.has(id)?put(`<a class="simple" href="#${id}">${m}</a>`):m});
    t=t.replace(/pkt\s+(\d+[a-z]?)\s*[–-]\s*(\d+[a-z]?)(?:\s+(lub|albo|i)\s+(\d+[a-z]?))?/gi,(m,a,b,c,x)=>{const pref=parentFor(ctx,'p'),labs=range(a,b);if(x)labs.push(x);return put(m+nav(labs.map(n=>child(pref,'p',n))))});
    t=t.replace(/pkt\s+(\d+[a-z]?(?:\s*,\s*\d+[a-z]?){1,})/gi,(m,list)=>{const pref=parentFor(ctx,'p'),labs=list.split(/\s*,\s*/);return put(m+nav(labs.map(n=>child(pref,'p',n))))});
    t=t.replace(/pkt\s+(\d+[a-z]?)(?!\s*[–,-])/gi,(m,n)=>{const u=child(parentFor(ctx,'p'),'p',n);return u?put(`pkt <a class="simple" href="#${u[0]}">${n}</a>`):m});
    t=t.replace(/ust\.\s*(\d+[a-z]?)(?!\s+pkt)(?!\s*[–,-])/gi,(m,n)=>{const id=`${art}-ust-${n}`;return ids.has(id)?put(`ust. <a class="simple" href="#${id}">${n}</a>`):m});
    t=t.replace(/lit\.\s*([a-z])(?!\s*[–,-])/gi,(m,n)=>{const u=child(parentFor(ctx,'i'),'i',n);return u?put(`lit. <a class="simple" href="#${u[0]}">${n}</a>`):m});
    t=t.replace(/art\.\s*(\d+[a-z]?)/gi,(m,n)=>{const pref=art.split('-art-')[0],id=`${pref}-art-${n}`;return ids.has(id)?put(`art. <a class="simple" href="#${id}">${n}</a>`):m});
    return restore(t);
  };
  const h=decodeURIComponent(location.hash.slice(1));
  const code=idMap[h]||(h.startsWith('act-')?h.slice(4):act?.[0]);
  if(code) render(code,idMap[h]?h:null);
});
