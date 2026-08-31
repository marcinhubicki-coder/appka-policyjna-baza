(function(){
  const button=document.getElementById('offlineDownload'),title=document.getElementById('offlineTitle'),detail=document.getElementById('offlineDetail'),icon=button?.querySelector('.offline-icon');
  if(!button||!title||!detail||!icon)return;
  const controlledAtStart=!!navigator.serviceWorker?.controller;
  let registration=null,ready=false,reloadReady=false,pending=false;
  function state(kind,label,description,symbol){
    ready=kind==='ready';
    button.classList.toggle('ready',kind==='ready'||kind==='update');
    button.classList.toggle('error',kind==='error');
    button.disabled=kind==='working'||kind==='unsupported';
    title.textContent=label;
    detail.textContent=description;
    icon.textContent=symbol;
  }
  function onlineDescription(){return navigator.onLine?'Cała baza jest zapisana na tym urządzeniu':'Tryb offline — korzystasz z zapisanej bazy'}
  function markReady(){pending=false;state('ready','Baza offline gotowa',onlineDescription(),'✓')}
  function markError(message){pending=false;state('error','Spróbuj ponownie',message,'!')}
  function askWorker(worker){
    return new Promise((resolve,reject)=>{
      if(!worker){reject(new Error('Brak aktywnego trybu offline'));return}
      const channel=new MessageChannel(),timer=setTimeout(()=>reject(new Error('Przekroczono czas zapisu bazy')),30000);
      channel.port1.onmessage=event=>{clearTimeout(timer);event.data?.ok?resolve(event.data):reject(new Error(event.data?.error||'Nie udało się zapisać bazy'))};
      worker.postMessage({type:'CACHE_ALL'},[channel.port2]);
    });
  }
  async function cacheAll(){
    if(pending)return;
    if(reloadReady){location.reload();return}
    if(!navigator.onLine&&!ready){markError('Połącz się raz z internetem, aby pobrać bazę');return}
    pending=true;state('working','Zapisuję całą bazę…','Możesz nadal korzystać z aplikacji','…');
    try{
      registration=registration||await navigator.serviceWorker.ready;
      await askWorker(registration.active||navigator.serviceWorker.controller);
      markReady();
    }catch(error){markError(error?.message||'Nie udało się włączyć trybu offline')}
  }
  button.addEventListener('click',async()=>{
    if(reloadReady){location.reload();return}
    if(ready&&registration){state('working','Sprawdzam aktualizację…','Zapisana baza pozostaje dostępna','…');try{await registration.update()}catch(_){}pending=false}
    cacheAll();
  });
  if(!('serviceWorker'in navigator)||!('caches'in window)){
    state('unsupported','Tryb offline niedostępny','Ta przeglądarka nie obsługuje zapisu aplikacji','×');
    return;
  }
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(controlledAtStart){reloadReady=true;pending=false;state('update','Odśwież nową wersję','Aktualizacja została pobrana i jest gotowa','↻')}
    else cacheAll();
  });
  window.addEventListener('online',()=>{if(ready)markReady()});
  window.addEventListener('offline',()=>{if(ready)markReady();else markError('Połącz się raz z internetem, aby pobrać bazę')});
  navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(async reg=>{
    registration=reg;
    try{await navigator.serviceWorker.ready;await cacheAll();reg.update().catch(()=>{})}catch(error){markError(error?.message||'Nie udało się uruchomić trybu offline')}
  }).catch(error=>markError(error?.message||'Nie udało się zarejestrować trybu offline'));
})();
