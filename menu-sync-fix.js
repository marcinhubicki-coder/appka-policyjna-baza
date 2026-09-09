(function(){
  function syncHeaderHeight(){
    const h=document.querySelector('.top');
    if(!h)return;
    const px=Math.ceil(h.getBoundingClientRect().height||h.offsetHeight||0);
    if(px>0)document.documentElement.style.setProperty('--topH',px+'px');
  }
  const header=document.querySelector('.top');
  if(header){syncHeaderHeight();try{new ResizeObserver(syncHeaderHeight).observe(header)}catch(_){}}
  window.addEventListener('orientationchange',()=>setTimeout(syncHeaderHeight,80));
  window.addEventListener('resize',syncHeaderHeight,{passive:true});
  if(window.visualViewport)visualViewport.addEventListener('resize',syncHeaderHeight,{passive:true});
  const style=document.createElement('style');
  style.textContent=`.split-handle{right:-6px!important;width:11px!important;height:32px!important;border-radius:5px!important}.split-handle span{width:3px!important;height:14px!important}`;
  document.head.appendChild(style);
})();
