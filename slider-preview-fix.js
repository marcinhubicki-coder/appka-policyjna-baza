(function(){
  const STORAGE_KEY='police-law-split';
  let handle=null,drag=null,leftPane=null,rightPane=null;

  function clampPct(clientX){
    return Math.max(35,Math.min(55,(clientX/window.innerWidth)*100));
  }
  function currentPct(){
    const raw=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--drawerW'));
    return raw>=35&&raw<=55?raw:45;
  }
  function ensurePreviewPanes(){
    if(leftPane&&rightPane)return;
    leftPane=document.createElement('div');
    rightPane=document.createElement('div');
    leftPane.className='split-preview-pane split-preview-left';
    rightPane.className='split-preview-pane split-preview-right';
    document.body.append(leftPane,rightPane);
  }
  function setPreview(pct){
    document.documentElement.style.setProperty('--splitPreview',pct+'vw');
    handle?.setAttribute('aria-valuenow',String(Math.round(pct)));
  }
  function finish(commit,pointerId){
    if(!drag)return;
    const pct=drag.pct;
    if(commit){
      document.documentElement.style.setProperty('--drawerW',pct+'vw');
      try{localStorage.setItem(STORAGE_KEY,String(pct))}catch(_){}
    }else{
      handle?.setAttribute('aria-valuenow',String(Math.round(currentPct())));
    }
    document.body.classList.remove('split-preview-active');
    document.documentElement.style.removeProperty('--splitPreview');
    try{handle?.releasePointerCapture(pointerId)}catch(_){}
    drag=null;
  }

  function onPointerDown(e){
    const h=e.target.closest?.('.split-handle');
    if(!h||h!==handle||!document.body.classList.contains('drawer-open'))return;
    e.stopImmediatePropagation();
    e.preventDefault();
    ensurePreviewPanes();
    const pct=clampPct(e.clientX);
    drag={pointerId:e.pointerId,pct};
    setPreview(pct);
    document.body.classList.add('split-preview-active');
    try{handle.setPointerCapture(e.pointerId)}catch(_){}
  }
  function onPointerMove(e){
    if(!drag||e.pointerId!==drag.pointerId)return;
    e.stopImmediatePropagation();
    e.preventDefault();
    drag.pct=clampPct(e.clientX);
    setPreview(drag.pct);
  }
  function onPointerUp(e){
    if(!drag||e.pointerId!==drag.pointerId)return;
    e.stopImmediatePropagation();
    e.preventDefault();
    finish(true,e.pointerId);
  }
  function onPointerCancel(e){
    if(!drag||e.pointerId!==drag.pointerId)return;
    e.stopImmediatePropagation();
    finish(false,e.pointerId);
  }

  function install(){
    const h=document.querySelector('.split-handle');
    if(!h)return false;
    if(h.dataset.previewFix==='1')return true;
    handle=h;
    handle.dataset.previewFix='1';
    /* Keep the handle outside the transformed drawer so fixed positioning is truly viewport-fixed. */
    document.body.appendChild(handle);
    ensurePreviewPanes();
    document.addEventListener('pointerdown',onPointerDown,true);
    document.addEventListener('pointermove',onPointerMove,true);
    document.addEventListener('pointerup',onPointerUp,true);
    document.addEventListener('pointercancel',onPointerCancel,true);
    return true;
  }

  const style=document.createElement('style');
  style.textContent=`
    .split-handle{display:none!important}
    body.drawer-open .split-handle{
      display:grid!important;
      position:fixed!important;
      z-index:160!important;
      left:calc(var(--drawerW,45vw) - 5px)!important;
      top:50vh!important;
      top:50svh!important;
      right:auto!important;
      transform:translateY(-50%)!important;
      width:10px!important;
      height:30px!important;
      min-width:10px!important;
      min-height:30px!important;
      border:1px solid #cbd6e0!important;
      border-radius:5px!important;
      background:rgba(255,255,255,.97)!important;
      box-shadow:0 2px 6px rgba(15,23,42,.10)!important;
      touch-action:none!important;
      cursor:ew-resize!important;
      overflow:visible!important;
    }
    body.drawer-open .split-handle::before{
      content:'';
      position:absolute;
      inset:-16px -12px;
      background:transparent;
      border-radius:14px;
    }
    body.drawer-open .split-handle span{
      position:relative;
      z-index:1;
      width:3px!important;
      height:13px!important;
      border-left:1px solid #71869a!important;
      border-right:1px solid #71869a!important;
      pointer-events:none!important;
    }
    body.split-preview-active .split-handle{
      left:calc(var(--splitPreview,45vw) - 5px)!important;
    }
    .split-preview-pane{
      display:none;
      position:fixed;
      z-index:150;
      top:var(--topH,72px);
      bottom:0;
      pointer-events:none;
      background:rgba(100,116,139,.14);
      box-sizing:border-box;
    }
    body.split-preview-active .split-preview-pane{display:block}
    body.split-preview-active .split-preview-left{
      left:0;
      width:var(--splitPreview,45vw);
      border-right:1px dashed rgba(71,85,105,.65);
    }
    body.split-preview-active .split-preview-right{
      left:var(--splitPreview,45vw);
      right:0;
      border-left:1px dashed rgba(71,85,105,.65);
    }
  `;
  document.head.appendChild(style);

  if(!install()){
    const observer=new MutationObserver(()=>{if(install())observer.disconnect()});
    observer.observe(document.body,{childList:true,subtree:true});
  }
})();
