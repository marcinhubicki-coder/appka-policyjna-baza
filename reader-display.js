/* Small, stationary long-press menus and persistent reading appearance. */
(function(){
  let current=null,closeCurrent=null,shade=null;
  function close(pop){if(!current||pop&&pop!==current)return;current=null;closeCurrent=null;shade?.remove();shade=null;globalThis.__READER_STATE?.lock('popover',false)}
  function open(pop,onClose){closeCurrent?.();current=pop;closeCurrent=onClose;shade=document.createElement('div');shade.className='reader-popover-shade';shade.onclick=onClose;document.body.append(shade);globalThis.__READER_STATE?.lock('popover',true)}
  globalThis.__READER_POPOVER={open,close};
  document.addEventListener('keydown',event=>{if(current&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeCurrent?.()}},true);
  let highlights=true,dark=false;
  try{highlights=localStorage.getItem('reader-highlights')!=='off';dark=localStorage.getItem('reader-dark')==='on'}catch(_){}
  function apply(){document.documentElement.classList.toggle('reader-highlights-off',!highlights);document.documentElement.dataset.readerTheme=dark?'dark':'light';try{localStorage.setItem('reader-highlights',highlights?'on':'off');localStorage.setItem('reader-dark',dark?'on':'off')}catch(_){}}
  apply();
  function show(anchor){
    const pop=document.createElement('div');pop.className='favorites-scope-popover reader-display-options';pop.setAttribute('role','dialog');pop.setAttribute('aria-label','Wyświetlanie');
    const dismiss=()=>{pop.remove();close(pop);anchor.focus({preventScroll:true})};
    for(const [name,key,value] of [['Wyróżnienia','highlights',highlights],['Tryb ciemny','dark',dark]]){const row=document.createElement('button'),label=document.createElement('span'),toggle=document.createElement('span');row.type='button';row.className='favorites-scope-toggle';row.setAttribute('role','switch');row.setAttribute('aria-checked',String(value));row.dataset.displayOption=key;label.className='favorites-scope-info';label.textContent=name;toggle.className='favorites-scope-switch';toggle.setAttribute('aria-hidden','true');row.onclick=()=>{const checked=row.getAttribute('aria-checked')!=='true';row.setAttribute('aria-checked',String(checked));if(key==='highlights')highlights=checked;else dark=checked;apply()};row.append(label,toggle);pop.append(row)}
    document.body.append(pop);open(pop,dismiss);
    const r=anchor.getBoundingClientRect(),width=pop.offsetWidth||132,left=Math.max(6,Math.min(innerWidth-width-6,r.left+r.width/2-width/2));pop.style.left=left+'px';pop.style.top=Math.min(innerHeight-pop.offsetHeight-8,r.bottom+8)+'px';pop.style.setProperty('--scope-caret-x',Math.max(14,Math.min(width-14,r.left+r.width/2-left))+'px');requestAnimationFrame(()=>pop.classList.add('show'));
  }
  function install(button){
    if(button.dataset.displayGesture)return;button.dataset.displayGesture='1';let timer=0,start=null;
    const cancel=()=>{clearTimeout(timer);timer=0};
    button.addEventListener('pointerdown',e=>{if(e.button!==0)return;delete button.dataset.longPress;start={x:e.clientX,y:e.clientY};cancel();timer=setTimeout(()=>{button.dataset.longPress='1';show(button)},360)});
    button.addEventListener('pointermove',e=>{if(start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>12)cancel()});
    button.addEventListener('pointerup',()=>{cancel();setTimeout(()=>delete button.dataset.longPress,0)});
    button.addEventListener('pointercancel',cancel);
    button.addEventListener('contextmenu',e=>{e.preventDefault();cancel();show(button)});
  }
  globalThis.__READER_DISPLAY={install,show};
})();
