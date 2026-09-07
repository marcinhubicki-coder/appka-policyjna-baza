/* Header and split controls. Article/TOC content is formatted once by its renderer. */
(function(){
  function start(){
    const drawer=document.querySelector('.drawer'),header=document.querySelector('.top');
    if(!drawer||!header)return setTimeout(start,80);
    const sync=()=>{const next=Math.ceil(header.getBoundingClientRect().height)+'px';if(document.documentElement.style.getPropertyValue('--topH')!==next)document.documentElement.style.setProperty('--topH',next)};
    sync();new ResizeObserver(sync).observe(header);
    const controls=drawer.querySelector('.drawer-tools'),expand=drawer.querySelector('.drawer-expand');
    if(controls&&expand){
      controls.querySelectorAll('button').forEach(button=>{if(button!==expand)button.hidden=true});
      expand.innerHTML='<span aria-hidden="true">↘</span>';
      expand.title='Wróć do pełnego widoku';expand.setAttribute('aria-label',expand.title);
      expand.onclick=()=>globalThis.__POLICE_DRAWER_CLOSE?.();
    }
    document.body.classList.add('act-selected');
  }
  start();
})();
