/* Editorial summaries for every act. They are deliberately separate from legal text. */
(function(){
  const MAX=82;
  const RULES=[
    [/^\s*\((?:uchylony|utracił moc)\)/i,'Przepis uchylony.'],
    [/^\s*(?:traci moc|(?:ustawa|zarządzenie).*wchodzi w życie)/i,'Wejście w życie i przepisy końcowe.'],
    [/użyte (?:w ustawie|w kodeksie|w zarządzeniu).*oznaczają/i,'Definicje pojęć użytych w akcie.'],
    [/(?:ustawa|kodeks|zarządzenie) określa:/i,'Zakres spraw regulowanych aktem.'],
    [/^Tworzy się Policję|podstawowych zadań Policji/i,'Charakter, przeznaczenie i podstawowe zadania Policji.'],
    [/rodzaje służb|w skład Policji wchodzi/i,'Rodzaje służb i jednostki organizacyjne Policji.'],
    [/Uprawnieni do używania lub wykorzystywania środków przymusu/i,'Podmioty uprawnione do użycia środków przymusu i broni.'],
    [/^Ustawa określa zasady i warunki wjazdu cudzoziemców/i,'Wjazd, pobyt i wyjazd cudzoziemców — zakres ustawy.'],
    [/Odpowiedzialności karnej podlega/i,'Warunki odpowiedzialności karnej.'],
    [/Odpowiedzialności za wykroczenie podlega/i,'Warunki odpowiedzialności za wykroczenie.'],
    [/ustawa inna niż w czasie popełnienia (?:przestępstwa|wykroczenia)/i,'Zmiana ustawy i stosowanie przepisów względniejszych dla sprawcy.'],
    [/nowej ustawy czyn objęty prawomocnym wyrokiem.*stanowi wykroczenie/i,'Zmiana kwalifikacji czynu po wejściu w życie nowej ustawy.'],
    [/dopuszczaln.{0,18}prędko|prędkoś.{0,30}dopuszczal|prędkoś.{0,35}znak(?:ów|ami) drogow/i,'Dopuszczalna prędkość i zasady jej ustalania.'],
    [/zatrzymani.{0,25}dowod.{0,15}rejestracyj/i,'Zatrzymanie dowodu rejestracyjnego.'],
    [/kontrol.{0,24}ruchu drogow|uprawnieni.{0,18}Policj.{0,18}ruchu/i,'Kontrola ruchu drogowego i uprawnienia organów.'],
    [/pieszy|droga dla pieszych|przejści.{0,12}dla pieszych/i,'Zasady ruchu pieszych i ich bezpieczeństwo.'],
    [/rower|hulajnog|urządzeni.{0,15}transportu osobistego/i,'Ruch rowerów, hulajnóg i urządzeń transportu osobistego.'],
    [/wyprzedzani/i,'Zasady i ograniczenia wyprzedzania.'],
    [/skrzyżowani|pierwszeństw.{0,18}przejazdu/i,'Pierwszeństwo i zachowanie na skrzyżowaniach.'],
    [/zatrzymani.{0,12}i postój|postój pojazd/i,'Zatrzymanie i postój pojazdów.'],
    [/świat(?:eł|ła) mijania|oświetleni.{0,15}pojazd/i,'Oświetlenie pojazdu i używanie świateł.'],
    [/pojazd.{0,18}uprzywilejowan/i,'Pojazdy uprzywilejowane i zasady ich ruchu.'],
    [/rejestracj.{0,15}pojazd|dopuszczeni.{0,15}do ruchu/i,'Rejestracja i dopuszczanie pojazdów do ruchu.'],
    [/badani.{0,18}techniczn.{0,15}pojazd/i,'Badania techniczne i stan pojazdów.'],
    [/pierwszej pomocy|kwalifikowanej pierwszej pomocy/i,'Pomoc medyczna i postępowanie w razie zagrożenia zdrowia.'],
    [/zatrzym|ujęci|pozbawieni.{0,14}wolności/i,'Zatrzymanie: przesłanki, zasady i prawa osoby zatrzymanej.'],
    [/kontrol.{0,14}osob|bagaż|ładunk/i,'Kontrola osobista, bagażu i ładunków.'],
    [/legitym|ustalani.{0,12}tożsamo/i,'Legitymowanie i ustalanie tożsamości.'],
    [/środk.{0,20}przymus|broni paln/i,'Środki przymusu i broń: przesłanki oraz zasady użycia.'],
    [/operacyjno.?rozpoznaw|kontrol.{0,12}operacyjn|zakup.{0,12}kontrolowan/i,'Czynności operacyjne: przesłanki, zakres i kontrola.'],
    [/dane osob|przetwarzani.{0,15}informacj|zbior.{0,12}danych|ewidencj/i,'Dane i informacje: gromadzenie, przetwarzanie i dostęp.'],
    [/komendant|powołani.{0,15}stanowisk|odwołani.{0,15}stanowisk/i,'Organy i kierownictwo: właściwość oraz organizacja.'],
    [/^(?:Służbę w Policji|Stosunek służbowy|Policjant (?:ma prawo|jest obowiązany|może otrzymać))/i,'Służba funkcjonariuszy: prawa, obowiązki i organizacja.'],
    [/uposaż|dodatek służbow|świadczeni.{0,18}pienięż/i,'Uposażenie, dodatki i świadczenia funkcjonariuszy.'],
    [/urlop|czas służb|zwolnieni.{0,14}od zajęć/i,'Czas służby, urlopy i zwolnienia.'],
    [/odpowiedzialnoś.{0,15}dyscyplin|kara dyscypl/i,'Odpowiedzialność dyscyplinarna i kary.'],
    [/nieletni.{0,30}demoraliz|demoralizacj/i,'Demoralizacja nieletnich i zasady podejmowania działań.'],
    [/środk.{0,15}wychowaw|ośrodk.{0,15}wychowaw/i,'Środki wychowawcze i ich wykonywanie.'],
    [/sąd rodzinny|postępowani.{0,18}nieletni/i,'Postępowanie w sprawach nieletnich.'],
    [/cudzoziemc.{0,24}wjazd|przekracza.{0,12}granic/i,'Wjazd cudzoziemców i przekraczanie granicy.'],
    [/zezwoleni.{0,24}pobyt czasow/i,'Zezwolenie na pobyt czasowy: warunki i postępowanie.'],
    [/zezwoleni.{0,24}pobyt stał/i,'Zezwolenie na pobyt stały: warunki i postępowanie.'],
    [/zobowiązani.{0,22}do powrotu|decyzj.{0,18}powro/i,'Zobowiązanie cudzoziemca do powrotu.'],
    [/wiz.{0,18}(?:Schengen|krajow)|wydani.{0,12}wizy/i,'Wizy: wydawanie, ważność i warunki.'],
    [/pokrzywdzon/i,'Status i uprawnienia pokrzywdzonego.'],
    [/oskarżyciel.{0,15}publiczn|prokurator/i,'Oskarżyciel publiczny i udział prokuratora.'],
    [/oskarżon|podejrzan/i,'Status, prawa i obowiązki podejrzanego lub oskarżonego.'],
    [/świadk|zeznani/i,'Świadkowie: obowiązki, prawa i przesłuchanie.'],
    [/biegł|opini.{0,12}sądow/i,'Biegli, opinie i wiadomości specjalne.'],
    [/dowod|oględzin|eksperyment procesow/i,'Dowody i czynności dowodowe.'],
    [/^Orzekanie następuje w postępowaniu/i,'Tryby orzekania w sprawach o wykroczenia.'],
    [/^Nie wszczyna się postępowania|^Postępowania nie wszczyna się/i,'Przeszkody w prowadzeniu postępowania.'],
    [/tymczasow.{0,12}areszt|środk.{0,15}zapobiegaw/i,'Środki zapobiegawcze i zabezpieczenie postępowania.'],
    [/dochodzeni|śledztw|postępowani.{0,15}przygotowaw/i,'Postępowanie przygotowawcze: tok i zasady.'],
    [/apelacj|zażaleni|środk.{0,15}odwoław/i,'Środki odwoławcze i zasady ich wnoszenia.'],
    [/mandat.{0,12}karn|postępowani.{0,12}mandat/i,'Postępowanie mandatowe.'],
    [/karami są|rodzaj.{0,12}kar/i,'Rodzaje kar i zasady ich stosowania.'],
    [/środkami karnymi|środk.{0,12}karn/i,'Środki karne i zasady ich orzekania.'],
    [/obron.{0,12}konieczn/i,'Obrona konieczna i granice jej stosowania.'],
    [/przedawnieni|karalność.*ustaje/i,'Przedawnienie karalności i wykonania kary.'],
    [/zatarci.{0,12}skazani/i,'Zatarcie skazania i jego skutki.'],
    [/konwoj|konwojent/i,'Konwojowanie osób: organizacja, bezpieczeństwo i obowiązki.'],
    [/doprowadz/i,'Doprowadzanie osób: zasady i sposób postępowania.'],
    [/służb.{0,14}patrol/i,'Służba patrolowa: organizacja, zadania i nadzór.'],
    [/etyk.{0,15}zawod|norm moraln/i,'Zasady etyki zawodowej policjanta.']
  ];
  const SCOPES=new Map([
    ['Charakter, przeznaczenie i podstawowe zadania Policji.',['uop']],
    ['Rodzaje służb i jednostki organizacyjne Policji.',['uop']],
    ['Podmioty uprawnione do użycia środków przymusu i broni.',['spb']],
    ['Wjazd, pobyt i wyjazd cudzoziemców — zakres ustawy.',['cudz']],
    ['Warunki odpowiedzialności karnej.',['kk']],
    ['Warunki odpowiedzialności za wykroczenie.',['kw']],
    ['Zmiana ustawy i stosowanie przepisów względniejszych dla sprawcy.',['kk','kw']],
    ['Zmiana kwalifikacji czynu po wejściu w życie nowej ustawy.',['kw']],
    ['Dopuszczalna prędkość i zasady jej ustalania.',['prd']],
    ['Zatrzymanie dowodu rejestracyjnego.',['prd']],
    ['Kontrola ruchu drogowego i uprawnienia organów.',['prd']],
    ['Zasady ruchu pieszych i ich bezpieczeństwo.',['prd']],
    ['Ruch rowerów, hulajnóg i urządzeń transportu osobistego.',['prd']],
    ['Zasady i ograniczenia wyprzedzania.',['prd']],
    ['Pierwszeństwo i zachowanie na skrzyżowaniach.',['prd']],
    ['Zatrzymanie i postój pojazdów.',['prd']],
    ['Oświetlenie pojazdu i używanie świateł.',['prd']],
    ['Pojazdy uprzywilejowane i zasady ich ruchu.',['prd']],
    ['Rejestracja i dopuszczanie pojazdów do ruchu.',['prd']],
    ['Badania techniczne i stan pojazdów.',['prd']],
    ['Pomoc medyczna i postępowanie w razie zagrożenia zdrowia.',['uop','kpk','kpow','nieletni','z360','z768']],
    ['Zatrzymanie: przesłanki, zasady i prawa osoby zatrzymanej.',['uop','kpk','kpow','cudz','nieletni']],
    ['Kontrola osobista, bagażu i ładunków.',['uop','nieletni']],
    ['Legitymowanie i ustalanie tożsamości.',['uop','prd']],
    ['Środki przymusu i broń: przesłanki oraz zasady użycia.',['uop','spb']],
    ['Czynności operacyjne: przesłanki, zakres i kontrola.',['uop']],
    ['Organy i kierownictwo: właściwość oraz organizacja.',['uop','cudz','nieletni','z768','z360']],
    ['Służba funkcjonariuszy: prawa, obowiązki i organizacja.',['uop','z768']],
    ['Uposażenie, dodatki i świadczenia funkcjonariuszy.',['uop']],
    ['Czas służby, urlopy i zwolnienia.',['uop']],
    ['Odpowiedzialność dyscyplinarna i kary.',['uop']],
    ['Demoralizacja nieletnich i zasady podejmowania działań.',['nieletni']],
    ['Środki wychowawcze i ich wykonywanie.',['nieletni']],
    ['Postępowanie w sprawach nieletnich.',['nieletni']],
    ['Wjazd cudzoziemców i przekraczanie granicy.',['cudz']],
    ['Zezwolenie na pobyt czasowy: warunki i postępowanie.',['cudz']],
    ['Zezwolenie na pobyt stały: warunki i postępowanie.',['cudz']],
    ['Zobowiązanie cudzoziemca do powrotu.',['cudz']],
    ['Wizy: wydawanie, ważność i warunki.',['cudz']],
    ['Status i uprawnienia pokrzywdzonego.',['kpk','kpow']],
    ['Oskarżyciel publiczny i udział prokuratora.',['kpk','kpow']],
    ['Status, prawa i obowiązki podejrzanego lub oskarżonego.',['kpk']],
    ['Świadkowie: obowiązki, prawa i przesłuchanie.',['kpk','kpow']],
    ['Biegli, opinie i wiadomości specjalne.',['kpk','kpow']],
    ['Dowody i czynności dowodowe.',['kpk','kpow','cudz','nieletni']],
    ['Tryby orzekania w sprawach o wykroczenia.',['kpow']],
    ['Przeszkody w prowadzeniu postępowania.',['kpk','kpow']],
    ['Środki zapobiegawcze i zabezpieczenie postępowania.',['kpk']],
    ['Postępowanie przygotowawcze: tok i zasady.',['kpk']],
    ['Środki odwoławcze i zasady ich wnoszenia.',['kpk','kpow','nieletni']],
    ['Postępowanie mandatowe.',['kpow']],
    ['Rodzaje kar i zasady ich stosowania.',['kk','kw']],
    ['Środki karne i zasady ich orzekania.',['kk','kw']],
    ['Obrona konieczna i granice jej stosowania.',['kk','kw']],
    ['Przedawnienie karalności i wykonania kary.',['kk','kw']],
    ['Zatarcie skazania i jego skutki.',['kk','kw']],
    ['Konwojowanie osób: organizacja, bezpieczeństwo i obowiązki.',['z360']],
    ['Doprowadzanie osób: zasady i sposób postępowania.',['z360']],
    ['Służba patrolowa: organizacja, zadania i nadzór.',['z768']],
    ['Zasady etyki zawodowej policjanta.',['z805']]
  ]);
  const CHAPTER_RULES=[
    [/^Użyte .*oznaczają/i,'Definicje'],
    [/^(?:Ustawa|Kodeks|Zarządzenie) określa/i,'Zakres aktu'],
    [/^Odpowiedzialności karnej podlega/i,'Zasady odpowiedzialności karnej'],
    [/^Odpowiedzialności za wykroczenie podlega/i,'Zasady odpowiedzialności za wykroczenie'],
    [/^Obrona konieczna/i,'Obrona konieczna'],
    [/^Karami są/i,'Kary'],
    [/^Środkami karnymi są/i,'Środki karne'],
    [/^Pieszy\b/i,'Ruch pieszych'],
    [/^Kierującego pojazdem obowiązuje ruch prawostronny/i,'Zasady ruchu pojazdów'],
    [/^Włączanie się do ruchu/i,'Włączanie się do ruchu'],
    [/^Kierujący pojazdem jest obowiązany przed wyprzedzaniem/i,'Wyprzedzanie'],
    [/^Kierujący pojazdem, zbliżając się do skrzyżowania/i,'Skrzyżowania i pierwszeństwo'],
    [/^Kierujący rowerem lub hulajnogą/i,'Rowery i hulajnogi'],
    [/^Oskarżycielem publicznym/i,'Oskarżyciel publiczny'],
    [/^Pokrzywdzonym jest/i,'Pokrzywdzony'],
    [/^Za podejrzanego uważa się/i,'Oskarżony i podejrzany'],
    [/^Dowody przeprowadza się/i,'Dowody'],
    [/^Policja ma prawo zatrzymać/i,'Zatrzymanie osoby'],
    [/^Czynności wyjaśniające/i,'Czynności wyjaśniające'],
    [/^Postępowanie mandatowe/i,'Postępowanie mandatowe']
  ];
  function clean(value){return String(value||'').replace(/\s+/g,' ').replace(/^(?:ust\.|pkt|lit\.|§)\s*\w+\s*/i,'').trim()}
  function articleText(row){return clean((row?.[4]||[]).map(unit=>unit?.[3]||'').join(' '))}
  function clip(value,max=MAX){let s=clean(value).replace(/[,:;–-]+$/,'').trim();if(!s)return'';if(s.length>max)s=s.slice(0,max+1).replace(/\s+\S*$/,'').replace(/[,:;.–-]+$/,'')+'…';else if(!/[.!?…]$/.test(s))s+='.';return s}
  function conciseLead(text){
    let lead=clean(text).split(/(?<=[.!?])\s+|;|:/)[0];
    lead=lead.replace(/^W (?:przypadku|razie|zakresie),?\s+(?:gdy|gdyby|którym|określonym)?\s*/i,'');
    if(/^Kto\s+/i.test(lead))lead='Zakaz i odpowiedzialność: '+lead.replace(/^Kto\s+/i,'');
    if(/^Przepisy?\s+/i.test(lead)&&lead.length>MAX)lead='Zakres stosowania przepisów';
    return clip(lead,MAX);
  }
  function summarize(row,actCode){
    const text=articleText(row),scan=text.slice(0,220),existing=clean(row?.[3]);
    if(!text)return existing?clip(existing):'Zakres przepisu.';
    if(actCode==='z805'&&!/^\s*\((?:uchylony|utracił moc)\)/i.test(text))return conciseLead(text);
    for(const [pattern,label] of RULES){const scope=SCOPES.get(label);if((!scope||scope.includes(actCode))&&pattern.test(scan))return label}
    if(existing&&existing.length<=68&&!/[,:]$/.test(existing)&&!/^Kto\b/i.test(existing))return clip(existing);
    return conciseLead(text)||'Zakres i zasady określone w przepisie.';
  }
  function chapterSuggestion(actCode,row){
    const text=articleText(row);
    for(const [pattern,label] of CHAPTER_RULES)if(pattern.test(text))return label;
    const source=clean(row?._sourceTopic||text).replace(/[.…]+$/,'');
    return clip(source||'Zakres przepisów',48).replace(/[.…]+$/,'');
  }
  function prepare(){
    if(typeof DATA==='undefined'||!Array.isArray(DATA))return;
    for(const act of DATA)for(const row of act[3]||[]){
      if(!Object.prototype.hasOwnProperty.call(row,'_sourceTopic'))Object.defineProperty(row,'_sourceTopic',{value:row[3]||'',configurable:true});
      row[3]=summarize(row,act[0]);
      row._editorialSummary=true;
    }
  }
  function apply(){
    if(typeof document==='undefined'||typeof ACT==='undefined'||!Array.isArray(ACT))return;
    const rows=new Map((ACT[3]||[]).map(row=>[row[0],row]));
    document.querySelectorAll('#actview article.legal-unit').forEach(article=>{
      const row=rows.get(article.id),el=article.querySelector(':scope > .unit-head .editorial-title');
      if(!row||!el)return;if(el.textContent!==row[3])el.textContent=row[3];el.dataset.aiSummary='1';el.setAttribute('aria-label','Redakcyjne podsumowanie artykułu');
    });
    document.querySelectorAll('#actview .toc-link').forEach(link=>{
      const row=rows.get((link.getAttribute('href')||'').slice(1)),topic=link.querySelector('.topic');
      if(row&&topic){if(topic.textContent!==row[3])topic.textContent=row[3];topic.dataset.aiSummary='1'}
    });
    document.querySelectorAll('.drawer-article').forEach(link=>{
      const row=rows.get(link.dataset.id),topic=link.querySelector('.da-topic');
      if(row&&topic&&topic.textContent!==row[3])topic.textContent=row[3];
    });
  }
  globalThis.__EDITORIAL={summarize,chapterSuggestion,articleText,clip};
  prepare();
  if(typeof document==='undefined')return;
  const root=document.getElementById('actview');if(!root)return;
  let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;prepare();apply()})}).observe(root,{childList:true,subtree:true});
  apply();
})();
