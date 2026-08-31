(function(){
  const button=document.getElementById('settingsButton'),panel=document.getElementById('settingsPanel'),backdrop=document.getElementById('settingsBackdrop'),closeButton=document.getElementById('settingsClose');
  if(!button||!panel||!backdrop||!closeButton)return;
  let previousFocus=null;
  function close(restoreFocus=true){
    if(!document.body.classList.contains('settings-open'))return;
    document.body.classList.remove('settings-open');
    panel.setAttribute('aria-hidden','true');
    button.setAttribute('aria-expanded','false');
    button.setAttribute('aria-label','Otwórz ustawienia');
    if(restoreFocus)(previousFocus||button).focus?.({preventScroll:true});
    previousFocus=null;
  }
  function open(){
    if(document.body.classList.contains('drawer-open'))document.getElementById('hamburger')?.click();
    document.getElementById('results')?.classList.remove('show');
    previousFocus=document.activeElement;
    document.body.classList.add('settings-open');
    panel.setAttribute('aria-hidden','false');
    button.setAttribute('aria-expanded','true');
    button.setAttribute('aria-label','Zamknij ustawienia');
    requestAnimationFrame(()=>closeButton.focus({preventScroll:true}));
  }
  button.addEventListener('click',()=>document.body.classList.contains('settings-open')?close():open());
  closeButton.addEventListener('click',()=>close());
  backdrop.addEventListener('click',()=>close());
  document.addEventListener('keydown',event=>{if(event.key==='Escape')close()});
})();
