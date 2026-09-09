/* Search UX v2: highlight visible matches, annotate result location, and center exact hit after selection. */
(function(){
  const q=document.getElementById('q');
  const box=document.getElementById('results');
  if(!q||!box)return;

  const style=document.createElement('style');
  style.textContent=`
    mark.search-live-hit,mark.search-result-hit,mark.search-exact-hit{background:#ffe57a;color:inherit;border-radius:3px;padding:0 .08em;box-shadow:0 0 0 1px rgba(199,156,35,.13)}
    mark.search-exact-hit{background:#ffd84f;box-shadow:0 0 0 3px rgba(226,178,35,.20);transition:background 1.4s ease,box-shadow 1.4s ease}
    mark.search-exact-hit.fade{background:#fff0a3;box-shadow:0 0 0 1px rgba(226,178,35,.08)}
    .search-match-info{display:block!important;margin-top:3px!important;font-size:10px!important;line-height:1.2!important;color:#65788b!important;font-weight:650!important}
    .search-match-info.far{color:#315e87!important}
  `;
  document.head.appendChild(style);

  function normChar(ch){return ch.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pl').replace(/ł/g,'l')}
  function normalizedWithMap(text){let n='',map=[];for(let i=0;i<text.length;i++){const x=normChar(text[i]);for(let j=0;j<x.length;j++){n+=x[j];map.push(i)}}return{n,map}}
  function locate(text,term){const a=normalizedWithMap(String(text||'')),b=normChar(String(term||'').trim());if(!b)return null;const p=a.n.indexOf(b);if(p<0)return null;const s=a.map[p],last=a.map[Math.min(a.map.length-1,p+b.length-1)];return{s,e:last+1}}
  function clearMarks(cls){document.querySelectorAll('mark.'+cls).forEach(m=>m.replaceWith(document.createTextNode(m.textContent||'')))}
  function allowedTextNode(n,root){const p=n.parentElement;if(!p||!root.contains(p))return false;if(p.closest('mark,script,style,.search-match-info'))return false;return true}
  function markFirst(root,term,cls){if(!root||!term)return null;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(!allowedTextNode(n,root))continue;const hit=locate(n.nodeValue||'',term);if(!hit)continue;const tail=n.splitText(hit.s),after=tail.splitText(hit.e-hit.s),m=document.createElement('mark');m.className=cls;m.textContent=tail.nodeValue;tail.replaceWith(m);return m}return null}
  function headerH(){return document.querySelector('.top')?.getBoundingClientRect().height||0}

  function currentRow(id){try{if(typeof articleMap!=='undefined'&&articleMap.get(id)?.r)return articleMap.get(id).r}catch(_){}
    try{for(const A of DATA||[]){const r=(A[3]||[]).find(x=>x[0]===id);if(r)return r}}catch(_){}return null}
  function rowText(r){if(!r)return'';return [r[2],r[3],...(r[4]||[]).map(u=>u?.[3]||'')].join(' ')}
  function resultId(a){const href=a.getAttribute('href')||'';if(href.startsWith('#'))return href.slice(1);return a.dataset.target||''}

  function clearResultDecoration(a){a.querySelectorAll('mark.search-result-hit').forEach(m=>m.replaceWith(document.createTextNode(m.textContent||'')));a.querySelectorAll('.search-match-info').forEach(x=>x.remove())}
  function decorateResults(){const term=q.value.trim();for(const a of box.querySelectorAll('.search-item')){
      if(a.dataset.searchUxTerm===term)continue;
      clearResultDecoration(a);a.dataset.searchUxTerm=term;
      if(term.length<2)continue;
      const visibleHit=markFirst(a,term,'search-result-hit');
      const id=resultId(a),r=currentRow(id),full=rowText(r),hit=locate(full,term);
      if(!hit)continue;
      const info=document.createElement('small');info.className='search-match-info';
      if(visibleHit){info.textContent='trafienie widoczne w podglądzie';}
      else{const ratio=full.length?hit.s/full.length:0;info.classList.add('far');info.textContent=ratio>.18?'↳ trafienie dalej w artykule · kliknij, aby skoczyć do frazy':'↳ trafienie poza podglądem · kliknij, aby skoczyć do frazy';}
      a.appendChild(info);
    }}

  let liveRaf=0;
  function refreshVisibleHighlights(){cancelAnimationFrame(liveRaf);liveRaf=requestAnimationFrame(()=>{
      clearMarks('search-live-hit');
      const term=q.value.trim();if(term.length<2||!document.body.classList.contains('act-selected'))return;
      const h=headerH(),bottom=innerHeight;let count=0;
      for(const u of document.querySelectorAll('#actview .legal-unit')){
        const r=u.getBoundingClientRect();if(r.bottom<h||r.top>bottom)continue;
        const m=markFirst(u,term,'search-live-hit');if(m&&++count>=4)break;
      }
    })}

  globalThis.__POLICE_SEARCH_HIT=(id,term)=>{const el=document.getElementById(id);if(!el)return null;clearMarks('search-exact-hit');const mark=markFirst(el,term,'search-exact-hit');if(mark){setTimeout(()=>mark.classList.add('fade'),2200);setTimeout(()=>{if(mark.isConnected)mark.replaceWith(document.createTextNode(mark.textContent||''))},4200)}return mark};

  let decoRaf=0;
  new MutationObserver(()=>{cancelAnimationFrame(decoRaf);decoRaf=requestAnimationFrame(decorateResults)}).observe(box,{childList:true,subtree:true});
  q.addEventListener('input',()=>{decorateResults();refreshVisibleHighlights()});
  q.addEventListener('focus',()=>{decorateResults();refreshVisibleHighlights()});
  window.addEventListener('scroll',()=>{if(q.value.trim().length>=2)refreshVisibleHighlights()},{passive:true});
  decorateResults();refreshVisibleHighlights();
})();
