/* Test: concise, content-based summaries for Ustawa o Policji only.
   The summary is derived from the rendered article and intentionally kept short. */
(function(){
  const STOP=new Set('a aby albo ani bo bowiem by być był była były co czy dla do gdy i ich im iż jak jako je jego jej jest jeśli już która które który lub ma mają może na nad nie o od oraz po pod przez przy się są ta ten te tego tej to w we wówczas z za ze że'.split(' '));
  const LABELS=[
    [/zatrzym|ujęci|pozbawieni.{0,12}wolności/i,'Zatrzymanie: przesłanki, zasady i prawa osoby zatrzymanej.'],
    [/kontrol.{0,12}osob|bagaż|ładunk/i,'Kontrola osobista, bagażu i ładunków: zakres i zasady.'],
    [/legitym|tożsamo/i,'Legitymowanie i ustalanie tożsamości osób.'],
    [/środk.{0,20}przymus|broni paln/i,'Środki przymusu i broń: zasady oraz uprawnienia Policji.'],
    [/dane osob|informacj|przetwarz|zbior/i,'Dane i informacje: pozyskiwanie, przetwarzanie i udostępnianie.'],
    [/operacyjno.?rozpoznaw|kontrol.{0,12}operacyjn|niejawn/i,'Czynności operacyjne: przesłanki, zakres i kontrola.'],
    [/komendant|powoł|odwoł|stanowisk/i,'Organy Policji: właściwość, powoływanie i organizacja działania.'],
    [/służb.{0,20}policj|policjant|funkcjonarius/i,'Służba policjantów: obowiązki, prawa i organizacja.'],
    [/wynagrod|uposaż|dodatek|świadczen|należno/i,'Uposażenie, dodatki i świadczenia policjantów.'],
    [/urlop|zwolnieni.{0,12}służb|czas służb/i,'Czas służby, urlopy i zwolnienia policjantów.'],
    [/odpowiedzialno|dyscyplin|kara dyscypl/i,'Odpowiedzialność dyscyplinarna: postępowanie i kary.'],
    [/emeryt|rent|zaopatrzeni/i,'Zaopatrzenie i świadczenia funkcjonariuszy.'],
    [/ochron.{0,12}prawn|pomoc prawn/i,'Ochrona prawna policjanta i zasady wsparcia.'],
    [/Policj.{0,30}tworzy|zadani.{0,20}Policj|zakres.{0,20}zadań/i,'Pozycja, zadania i zakres działania Policji.']
  ];
  function clean(s){return (s||'').replace(/\s+/g,' ').replace(/^(ust\.|pkt|lit\.|§)\s*\w+\s*/i,'').trim()}
  function clipSentence(s,max=76){s=clean(s).replace(/,$/,'').trim();if(!s)return'';if(s.length<=max)return /[.!?]$/.test(s)?s:s+'.';const cut=s.slice(0,max+1).replace(/\s+\S*$/,'').replace(/[,:;.-]+$/,'');return cut+'…'}
  function fallback(text){
    const cleaned=clean(text),lead=cleaned.split(/[.;:]/)[0];
    if(lead.length>=24)return clipSentence(lead,72);
    const words=cleaned.split(/\s+/),freq=new Map();
    for(const raw of words){const w=raw.toLowerCase().replace(/[^a-ząćęłńóśźż-]/gi,'');if(w.length<5||STOP.has(w))continue;freq.set(w,(freq.get(w)||0)+1)}
    const keys=[...freq].sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]);
    return keys.length?'Reguluje: '+keys.join(', ')+'.':'Zakres i zasady określone w tym artykule.';
  }
  function summarize(article){
    const text=clean(article.querySelector('.unit-body')?.innerText||'');
    for(const [re,s] of LABELS)if(re.test(text))return clipSentence(s,76);
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