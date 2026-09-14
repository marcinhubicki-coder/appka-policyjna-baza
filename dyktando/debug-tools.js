const TEST_HOST = location.hostname.endsWith('.vercel.app') || new URLSearchParams(location.search).get('debug') === '1';
const BUILD_MARKER = 'spelling v0.3.7';

async function clearRuntime({clearLocal=false}={}){
  try{
    if('serviceWorker' in navigator){
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(reg => reg.unregister()));
    }
  }catch{}
  try{
    if('caches' in window){
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
    }
  }catch{}
  if(clearLocal){
    try{
      for(const key of Object.keys(localStorage)){
        if(key.startsWith('malaNauka.') || key.startsWith('maleDyktando.')) localStorage.removeItem(key);
      }
    }catch{}
    try{sessionStorage.clear();}catch{}
  }
  const url = new URL(location.href);
  url.searchParams.set('_fresh', String(Date.now()));
  location.replace(url.toString());
}

function mountTools(){
  if(!TEST_HOST) return;
  const app = document.querySelector('#app');
  if(!app || app.dataset.view !== 'settings' || app.querySelector('[data-test-tools]')) return;

  const section = document.createElement('section');
  section.className = 'card';
  section.dataset.testTools = '1';
  section.innerHTML = `
    <h2 style="margin-bottom:6px">Narzędzia testowe</h2>
    <p class="muted" style="margin-bottom:12px">${BUILD_MARKER} · użyj, gdy preview/PWA wygląda jak starsza wersja.</p>
    <div class="stack">
      <button type="button" class="secondary" data-debug-action="refresh">Wymuś świeżą wersję</button>
      <button type="button" class="danger" data-debug-action="reset">Wyczyść cache i ustawienia lokalne</button>
    </div>`;

  const installation = app.querySelector('.installation');
  if(installation) installation.insertAdjacentElement('afterend', section);
  else app.append(section);
}

new MutationObserver(mountTools).observe(document.querySelector('#app'), {childList:true,subtree:true,attributes:true,attributeFilter:['data-view']});
mountTools();

document.addEventListener('click', event => {
  const button = event.target.closest('[data-debug-action]');
  if(!button) return;
  const action = button.dataset.debugAction;
  if(action === 'refresh') clearRuntime({clearLocal:false});
  if(action === 'reset'){
    if(confirm('To usunie lokalne wyniki, ustawienia i cache tej wersji testowej. Kontynuować?')) clearRuntime({clearLocal:true});
  }
});
