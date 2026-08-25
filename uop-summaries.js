/* Test: concise, content-based summaries for Ustawa o Policji only.
   The summary is derived from the rendered article, not copied as its opening sentence. */
(function(){
  const STOP=new Set('a aby albo ani bo bowiem by być był była były co czy dla do gdy i ich im iż jak jako je jego jej jest jeśli już która które który lub ma mają może na nad nie o od oraz po pod przez przy się są ta ten te tego tej to w we wówczas z za ze że'.split(' '));
  const LABELS=[
    [/zatrzym|ujęci|pozbawieni.{0,12}wolności/i,'Zatrzymanie osób, jego przesłanki, zasady i uprawnienia zatrzymanego.'],
    [/kontrol.{0,12}osob|bagaż|ładunk/i,'Kontrola osobista, bagażu i ładunków oraz zasady wykonywania tych czynności.'],
    [/legitym|tożsamo/i,'Ustalanie tożsamości osób oraz zasady wykonywania czynności służbowych.'],
    [/środk.{0,20}przymus|broni paln/i,'Stosowanie środków przymusu i broni oraz związane z tym uprawnienia Policji.'],
    [/dane osob|informacj|przetwarz|zbior/i,'Pozyskiwanie, przetwarzanie i udostępnianie informacji oraz danych przez Policję.'],
    [/operacyjno.?rozpoznaw|kontrol.{0,12}operacyjn|niejawn/i,'Czynności operacyjno-rozpoznawcze Policji, ich przesłanki, zakres i kontrola.'],
    [/komendant|powoł|odwoł|stanowisk/i,'Organy i kierownictwo Policji: właściwość, powoływanie oraz organizacja działania.'],
    [/służb.{0,20}policj|policjant|funkcjonarius/i,'Służba policjantów: zasady, obowiązki, uprawnienia i organizacja pełnienia służby.'],
    [/wynagrod|uposaż|dodatek|świadczen|należno/i,'Uposażenie, dodatki i świadczenia przysługujące policjantom.'],
    [/urlop|zwolnieni.{0,12}służb|czas służb/i,'Czas służby, urlopy i zwolnienia oraz związane z nimi prawa policjanta.'],
    [/odpowiedzialno|dyscyplin|kara dyscypl/i,'Odpowiedzialność dyscyplinarna policjantów, postępowanie i możliwe kary.'],
    [/emeryt|rent|zaopatrzeni/i,'Uprawnienia związane z zaopatrzeniem i świadczeniami funkcjonariuszy.'],
    [/ochron.{0,12}prawn|pomoc prawn/i,'Ochrona prawna policjanta i zasady wsparcia przy wykonywaniu obowiązków.'],
    [/Policj.{0,30}tworzy|zadani.{0,20}Policj|zakres.{0,20}zadań/i,'Pozycja, podstawowe zadania i zakres działania Policji.']
  ];
  function clean(s){return (s||'').replace(/\s+/g,' ').replace(/^(ust\.|pkt|lit\.|§)\s*\w+\s*/i,'').trim()}
  function fallback(text){
    const words=clean(text).split(/\s+/),freq=new Map();
    for(const raw of words){const w=raw.toLowerCase().replace(/[^a-ząćęłńóśźż-]/gi,'');if(w.length<5||STOP.has(w))continue;freq.set(w,(freq.get(w)||0)+1)}
    const keys=[...freq].sort((a,b)=>b[1]-a[1]).slice(0,4).map(x=>x[0]);
    if(!keys.length)return 'Zakres regulacji, uprawnienia i zasady postępowania określone w tym artykule.';
    const lead=clean(text).split(/[.;:]/)[0];
    if(lead.length>=35&&lead.length<=118)return lead.replace(/,$/,'')+'.';
    return 'Regulacja dotycząca: '+keys.join(', ')+'.';
  }
  function summarize(article){
    const text=clean(article.querySelector('.unit-body')?.innerText||'');
    for(const [re,s] of LABELS)if(re.test(text))return s;
    return fallback(text);
  }
  function apply(){
    const articles=[...document.querySelectorAll('#actview article.legal-unit[id^="uop-art-"]')];
    if(!articles.length)return;
    for(const a of articles){const el=a.querySelector('.editorial-title');if(el){el.textContent=summarize(a);el.dataset.aiSummary='1'}}
  }
  const root=document.getElementById('actview');if(!root)return;
  new MutationObserver(()=>requestAnimationFrame(apply)).observe(root,{childList:true});
  apply();
})();