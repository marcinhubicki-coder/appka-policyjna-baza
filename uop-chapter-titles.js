(function(){
  const TITLES={
    'Rozdział 1':'Przepisy ogólne',
    'Rozdział 2':'Organizacja Policji',
    'Rozdział 3':'Zakres uprawnień Policji',
    'Rozdział 3a':'Bandera i znaki rozpoznawcze',
    'Rozdział 5':'Służba w Policji',
    'Rozdział 6':'Korpusy i stopnie policyjne',
    'Rozdział 7':'Obowiązki i prawa policjanta',
    'Rozdział 8':'Mieszkania funkcjonariuszy Policji',
    'Rozdział 9':'Uposażenie i inne świadczenia pieniężne policjantów',
    'Rozdział 10':'Odpowiedzialność dyscyplinarna i karna policjantów',
    'Rozdział 10a':'Kontyngenty policyjne wydzielone do realizacji zadań poza granicami państwa',
    'Rozdział 10b':'Realizacja wspólnych działań na terytorium państw członkowskich Unii Europejskiej',
    'Rozdział 10c':'Punkty kontaktowe wymiany informacji z państwami członkowskimi Unii Europejskiej oraz krajowe biuro do spraw odzyskiwania mienia',
    'Rozdział 10d':'Psy służbowe i konie służbowe',
    'Rozdział 11':'Przepisy przejściowe i końcowe'
  };
  function norm(s){return String(s||'').replace(/\s+/g,' ').trim()}
  function isPoliceAct(){try{return ACT&&String(ACT[0]).toLowerCase()==='uop'}catch(_){return false}}
  function apply(){
    if(!isPoliceAct())return;
    document.querySelectorAll('#drawerArticles .drawer-chapter > summary').forEach(summary=>{
      const raw=norm(summary.textContent).replace(/^▾\s*/,'');
      const key=(raw.match(/Rozdział\s+\d+[a-z]?/i)||[])[0];
      if(!key)return;
      const canonical='Rozdział '+key.replace(/Rozdział\s+/i,'');
      const title=TITLES[canonical];
      if(!title)return; // Rozdział 4 intentionally has no title in the current official text.
      const ico=summary.querySelector('.chapter-ico')?.outerHTML||'<span class="chapter-ico">▾</span>';
      summary.innerHTML=ico+'<span class="chapter-num">'+canonical+'</span><span class="chapter-title"> — '+title+'</span>';
    });
  }
  const obs=new MutationObserver(()=>apply());
  function start(){const root=document.getElementById('drawerArticles');if(root){obs.observe(root,{childList:true,subtree:true});apply();return}setTimeout(start,100)}
  start();
})();