(function(){
  // Oficjalne tytuły rozdziałów ustawy o Policji (ELI / tekst jednolity).
  // Celowo dotyczą wyłącznie spisu treści; nagłówki artykułów zachowują sam numer rozdziału.
  const UOP_TITLES={
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
    'Rozdział 10a':'Kontyngenty policyjne wydzielone do realizacji zadań poza granicami państwa'
  };

  function isPoliceAct(){
    try{
      const code=String(ACT?.[0]||'').toLowerCase();
      const label=String((typeof META!=='undefined'&&META[ACT?.[0]]?.[0])||'').toLowerCase();
      return code==='uop'||label==='uop'||label.includes('polic');
    }catch(_){return false}
  }

  function apply(){
    if(!isPoliceAct())return;
    document.querySelectorAll('#drawerArticles .drawer-chapter > summary').forEach(summary=>{
      const raw=(summary.textContent||'').replace(/^\s*▾\s*/,'').trim();
      const match=raw.match(/Rozdział\s+\d+[a-z]?/i);
      if(!match)return;
      const key=match[0].replace(/^rozdział/i,'Rozdział');
      const title=UOP_TITLES[key];
      if(!title)return; // Rozdział bez oficjalnego tytułu pozostaje bez dopisku.
      const ico=summary.querySelector('.chapter-ico');
      summary.replaceChildren();
      if(ico)summary.appendChild(ico);
      const text=document.createElement('span');
      text.className='chapter-title-text';
      text.innerHTML='<b>'+key+'</b><small>'+title+'</small>';
      summary.appendChild(text);
    });
  }

  const style=document.createElement('style');
  style.textContent=`
    #drawerArticles .drawer-chapter>summary{align-items:flex-start!important}
    #drawerArticles .chapter-title-text{display:flex;flex-direction:column;min-width:0;line-height:1.08}
    #drawerArticles .chapter-title-text b{font:inherit;font-weight:800}
    #drawerArticles .chapter-title-text small{display:block;margin-top:2px;font-size:.78em;font-weight:600;line-height:1.12;color:#64748b}
  `;
  document.head.appendChild(style);

  const obs=new MutationObserver(()=>apply());
  function start(){
    const root=document.getElementById('drawerArticles');
    if(!root){setTimeout(start,100);return}
    obs.observe(root,{childList:true,subtree:true});
    apply();
  }
  start();
})();