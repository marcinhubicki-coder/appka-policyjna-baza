/* Adds compact display labels without changing legal source text. */
(function(){
  function compact(text){
    const s=String(text||'').trim();
    let m=s.match(/^ust\.\s*(.+)$/i); if(m) return 'u. '+m[1];
    m=s.match(/^pkt\s*(.+)$/i); if(m) return 'p. '+m[1];
    m=s.match(/^lit\.\s*(.+)$/i); if(m) return 'l. '+m[1];
    return s;
  }
  function apply(root=document){
    root.querySelectorAll?.('.subunit .marker').forEach(el=>{
      if(!el.dataset.compactMarker) el.dataset.compactMarker=compact(el.textContent);
    });
  }
  function start(){
    const view=document.getElementById('actview');
    if(!view){setTimeout(start,80);return;}
    apply(view);
    new MutationObserver(()=>apply(view)).observe(view,{childList:true,subtree:true});
  }
  start();
})();
