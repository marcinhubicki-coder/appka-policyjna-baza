/* Editorial summaries for every act. They are deliberately separate from legal text. */
(function(){
  const MAX=82;
  /* Titles explicitly present in the source material. They must not be paraphrased. */
  const SOURCE_TITLES=new Map(Object.entries({
    'uop-art-14':'Formy wykonywania czynności przez Policję.',
    'uop-art-15':'Podstawowe uprawnienia policjantów.',
    'uop-art-16':'Środki przymusu bezpośredniego.',
    'uop-art-17':'Broń palna.',
    'uop-art-28b':'Zmiana przyszła — od 01.01.2027.',
    'kw-art-51':'Zakłócanie spokoju i porządku publicznego.',
    'kw-art-87':'Prowadzenie po użyciu alkoholu.',
    'kw-art-92a':'Przekroczenie prędkości.',
    'kw-art-97':'Naruszenie innych przepisów ruchu drogowego.',
    'kw-art-119':'Kradzież lub przywłaszczenie.',
    'kw-art-124':'Uszkodzenie rzeczy.',
    'kw-art-141':'Nieobyczajny wybryk / nieprzyzwoite treści.',
    'kw-art-145':'Zaśmiecanie miejsca publicznego.',
    'kk-art-25':'Obrona konieczna.',
    'kk-art-26':'Stan wyższej konieczności.',
    'kk-art-148':'Zabójstwo.',
    'kk-art-157':'Naruszenie czynności narządu ciała / rozstrój zdrowia.',
    'kk-art-178a':'Prowadzenie pojazdu w stanie nietrzeźwości.',
    'kk-art-190':'Groźba karalna.',
    'kk-art-207':'Znęcanie.',
    'kk-art-222':'Naruszenie nietykalności funkcjonariusza.',
    'kk-art-223':'Czynna napaść na funkcjonariusza.',
    'kk-art-224':'Przemoc lub groźba wobec funkcjonariusza.',
    'kk-art-226':'Znieważenie funkcjonariusza.',
    'kk-art-278':'Kradzież.',
    'kk-art-279':'Kradzież z włamaniem.',
    'kk-art-280':'Rozbój.',
    'kk-art-288':'Uszkodzenie mienia.',
    'kpk-art-100a':'Zmiana przyszła — od 01.10.2029.',
    'kpk-art-124a':'Zmiana przyszła — od 01.10.2029.',
    'kpk-art-217':'Wydanie rzeczy.',
    'kpk-art-219':'Przeszukanie.',
    'kpk-art-220':'Tryb przeszukania.',
    'kpk-art-244':'Zatrzymanie osoby.',
    'kpk-art-300a':'Zmiana przyszła — od 01.10.2029.',
    'kpk-art-302a':'Zmiana przyszła — od 01.10.2029.',
    'kpk-art-308':'Czynności w niezbędnym zakresie.',
    'kpow-art-54':'Czynności wyjaśniające.',
    'kpow-art-96':'Uprawnienie do nakładania grzywny mandatem.',
    'kpow-art-97':'Warunki nałożenia mandatu.',
    'spb-art-6':'Zasada niezbędności i proporcjonalności.',
    'spb-art-11':'Przypadki użycia lub wykorzystania ŚPB.',
    'spb-art-12':'Katalog środków przymusu bezpośredniego.',
    'spb-art-45':'Przypadki użycia broni palnej.',
    'spb-art-47':'Przypadki wykorzystania broni palnej.',
    'spb-art-48':'Procedura przed użyciem broni palnej.',
    'prd-art-129':'Uprawnienia Policji w kontroli ruchu drogowego.',
    'prd-art-130a':'Usuwanie pojazdów z drogi.',
    'prd-art-132':'Zatrzymanie dowodu rejestracyjnego.',
    'z768-par-25':'Przygotowanie do służby patrolowej.',
    'z768-par-26':'Odprawa do służby.',
    'z768-par-30':'Zasady patrolowania.',
    'z805-par-22':'Doskonalenie wiedzy, umiejętności i sprawności fizycznej.'
  }));
  /* High-value editorial titles whose legal lead is too formal for quick navigation. */
  const EDITORIAL_OVERRIDES=new Map(Object.entries({
    'uop-art-1':'Charakter, przeznaczenie i podstawowe zadania Policji.',
    'uop-art-2':'Zadania Żandarmerii Wojskowej wykonywane w miejsce Policji.',
    'uop-art-3':'Zadania samorządu w zakresie bezpieczeństwa i porządku publicznego.',
    'kw-art-1':'Warunki odpowiedzialności za wykroczenie.',
    'kw-art-2':'Stosowanie ustawy względniejszej dla sprawcy.',
    'kw-art-2a':'Zmiana kwalifikacji czynu po wejściu w życie nowej ustawy.',
    'kk-art-1':'Warunki odpowiedzialności karnej.',
    'kk-art-3':'Humanitaryzm i poszanowanie godności przy stosowaniu kar.',
    'kpk-art-1':'Zakres stosowania Kodeksu postępowania karnego.',
    'kpk-art-2':'Cele postępowania karnego.',
    'kpow-art-1':'Zakres stosowania postępowania w sprawach o wykroczenia.',
    'kpow-art-2':'Tryby orzekania w sprawach o wykroczenia.',
    'spb-art-1':'Zakres ustawy o środkach przymusu i broni palnej.',
    'spb-art-2':'Podmioty uprawnione do użycia środków przymusu i broni.',
    'prd-art-1':'Zakres Prawa o ruchu drogowym.',
    'prd-art-2':'Definicje pojęć użytych w ustawie.',
    'prd-art-3':'Zasada ostrożności i unikania zagrożeń w ruchu drogowym.',
    'prd-art-4':'Zasada ograniczonego zaufania.',
    'prd-art-5':'Znaki, sygnały i polecenia w ruchu drogowym.',
    'prd-art-11':'Obowiązki pieszego poruszającego się po drodze.',
    'prd-art-13':'Przechodzenie pieszego przez jezdnię lub drogę dla rowerów.',
    'prd-art-19':'Bezpieczna prędkość i odstęp między pojazdami.',
    'prd-art-20':'Dopuszczalne prędkości pojazdów.',
    'prd-art-21':'Zmiana dopuszczalnej prędkości za pomocą znaków.',
    'prd-art-22':'Zmiana kierunku jazdy lub pasa ruchu.',
    'prd-art-23':'Wymijanie, omijanie i cofanie.',
    'prd-art-24':'Zasady i ograniczenia wyprzedzania.',
    'prd-art-25':'Pierwszeństwo i zachowanie na skrzyżowaniu.',
    'prd-art-26':'Zachowanie kierującego wobec pieszych.',
    'prd-art-27':'Zachowanie wobec rowerzystów i użytkowników hulajnóg.',
    'prd-art-28':'Zachowanie na przejazdach kolejowych.',
    'prd-art-29':'Pierwszeństwo pojazdów szynowych.',
    'prd-art-32':'Zasady ruchu rowerów, hulajnóg i urządzeń transportu osobistego.',
    'prd-art-76':'Rozporządzenia dotyczące rejestracji, dokumentów i tablic pojazdów.',
    'prd-art-78a':'Czasowe wycofanie pojazdu z ruchu.',
    'cudz-art-1':'Wjazd, pobyt i wyjazd cudzoziemców — zakres ustawy.',
    'cudz-art-2':'Wyłączenia z zakresu ustawy o cudzoziemcach.',
    'cudz-art-3':'Definicje pojęć użytych w ustawie.',
    'nieletni-art-1':'Zakres stosowania ustawy wobec nieletnich.',
    'nieletni-art-2':'Podstawy działań wobec nieletniego.',
    'nieletni-art-3':'Dobro nieletniego jako nadrzędna zasada postępowania.',
    'z768-par-1':'Zakres organizacji i wykonywania służby patrolowej.',
    'z768-par-2':'Definicje pojęć dotyczących służby patrolowej.',
    'z360-par-1':'Zakres konwojowania, doprowadzania i wzmacniania konwojów.',
    'z805-par-1':'Źródła i obowiązek przestrzegania etyki zawodowej policjanta.'
  }));
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
  function clean(value){return String(value||'').replace(/\u00ad/g,'').replace(/\s+/g,' ').replace(/\s+([,.;:])/g,'$1').replace(/^(?:ust\.|pkt|lit\.|§)\s*\w+\s*/i,'').trim()}
  function rawArticleText(row){return clean((row?.[4]||[]).map(unit=>unit?.[3]||'').join(' '))}
  function meaningfulUnitText(value){
    const original=clean(value),hadRepeal=/^(?:\((?:uchylony|pominięty|utracił moc)\)\s*)+/i.test(original);
    const text=clean(original.replace(/^(?:\((?:uchylony|pominięty|utracił moc)\)\s*)+/i,''));
    if(!text)return'';
    if(hadRepeal&&!/\b(?:jest|są|ma|może|mogą|należy|podlega|prowadzi|określa|stosuje|wydaje|wykonuje|traci|wchodzi)\b/i.test(text))return'';
    return text;
  }
  function articleText(row){return clean((row?.[4]||[]).map(unit=>meaningfulUnitText(unit?.[3]||'')).filter(Boolean).join(' '))}
  function clip(value,max=MAX){
    let s=clean(value).replace(/[,:;–-]+$/,'').trim();if(!s)return'';
    if(s.length>max){
      s=s.slice(0,max).replace(/\s+\S*$/,'').replace(/(?:\s|^)(?:art|ust|pkt|lit|Dz|poz|nr)\.?$/i,'').replace(/[,:;.–-]+$/,'').trim();
      s=s.slice(0,max-1).replace(/[,:;.–-]+$/,'').trim()+'…';
    } else if(!/[.!?…]$/.test(s)){
      if(s.length===max)s=s.slice(0,max-1).replace(/\s+\S*$/,'').replace(/[,:;.–-]+$/,'').trim()+'…';else s+='.';
    }
    if(/^\p{Ll}/u.test(s))s=s[0].toLocaleUpperCase('pl')+s.slice(1);
    return s;
  }
  function firstNorm(text){
    const s=clean(text);
    for(let index=0;index<s.length;index+=1){
      if(!/[.!?]/.test(s[index])||!/\s/.test(s[index+1]||''))continue;
      const after=s.slice(index+1).match(/^\s+([A-ZĄĆĘŁŃÓŚŹŻ„"(])/u);if(!after)continue;
      const before=s.slice(Math.max(0,index-12),index+1);
      if(/(?:\bart|\bust|\bpkt|\blit|\bDz|\bpoz|\bnr|\bim|\bsygn)\.$/i.test(before)||/\b[A-ZĄĆĘŁŃÓŚŹŻ]\.$/u.test(before))continue;
      return s.slice(0,index+1);
    }
    return s;
  }
  function condenseBoilerplate(value){
    let s=clean(value)
      .replace(/\bRzeczypospolitej Polskiej\b/g,'RP')
      .replace(/\bUnii Europejskiej\b/g,'UE')
      .replace(/\bpaństwa członkowskiego UE\b/gi,'państwa UE')
      .replace(/\bwłaściwego sądu lub innego organu\b/gi,'właściwego organu')
      .replace(/\bMinister właściwy do spraw\b/g,'Minister ds.')
      .replace(/\bminist(?:er|rem|rowi|ra) właściw(?:y|ym|emu|ego) do spraw\b/g,'minister ds.')
      .replace(/\bśrodków przymusu bezpośredniego\b/g,'środków przymusu')
      .replace(/,\s*zwan(?:y|a|e|ego|emu|ym|ą|i)\s+(?:dalej\s+)?„[^”]+”\s*,/gi,', ')
      .replace(/^W razie wystąpienia państwa UE,\s*(?:zwanego[^,]+,\s*)?o\s+/i,'Na wniosek państwa UE o ')
      .replace(/^W razie otrzymania od właściwego organu państwa wydania (?:orzeczenia|nakazu) informacji o tym, (?:iż|że)\s*/i,'Po informacji organu państwa wydania, że ')
      .replace(/nakazu i zakazu, zakazu zbliżania, zakazu kontaktowania lub zakazu wstępu/gi,'nakazów lub zakazów ochronnych')
      .replace(/osoby stosującej przemoc domową w rozumieniu przepisów ustawy o przeciwdziałaniu przemocy domowej/gi,'sprawcy przemocy domowej');
    s=s.replace(/^W (?:przypadku|przypadkach),\s*o któr(?:ym|ych) mowa w .{1,220}?,\s*(?=(?:sąd|organ|minister|Policja|Komendant|cudzoziemiec|nieletni|pismo|postępowanie|decyzja|zezwolenie|przepisy|stosuje|wydaje|może|należy)(?:\s|$))/i,'');
    s=s.replace(/,\s*o któr(?:ym|ej|ych) mowa w .{1,220}?,\s*(?=(?:jest|są|ma|mają|może|mogą|należy|podlega|prowadzi|wydaje|stosuje|wykonuje|przetwarza|udostępnia|sąd|organ|minister|Policja|Komendant)(?:\s|$))/gi,' ');
    s=s.replace(/^Nieletni umieszczony w .{20,280}? (?=(?:ma prawo|jest obowiązany|może|otrzymuje|odbywa|przekazuje|korzysta|jest nadal)\b)/i,'Nieletni w placówce ');
    s=s.replace(/^Nieletniemu umieszczonemu w .{20,280}? (?=(?:nie wolno|nie przysługuje|można|zapewnia się|udziela się)\b)/i,'Nieletniemu w placówce ');
    return clean(s);
  }
  function firstListItem(value){
    const text=clean(value).replace(/^(?:\d+[a-z]?|[a-z])\)?[.)]?\s+/i,'');
    return clean(text.split(';')[0]);
  }
  function delegatedRegulationTitle(text){
    const condensed=condenseBoilerplate(text).slice(0,650);
    const match=condensed.match(/^(?:Minister|Rada Ministrów|Prezes Rady Ministrów)\b.{0,300}?\b(może\s+)?określi(?:ć|,|ą)?(?:,?\s*w drodze rozporządzenia)(?::|,)?\s*(.+)$/i);
    if(!match)return'';
    const subject=firstListItem(match[2]).replace(/^wzory?:\s*/i,'wzory: ');
    return clip(`${match[1]?'Możliwe rozporządzenie':'Rozporządzenie'}: ${subject}`);
  }
  function structuredLeadTitle(text){
    const s=condenseBoilerplate(text),regulation=delegatedRegulationTitle(s);if(regulation)return regulation;
    let match=s.match(/^Do zadań (.{2,110}?) należ(?:y|ą)(?: w szczególności)?\s*:\s*(.+)$/i);
    if(match)return clip(`Zadania ${clean(match[1])}: ${firstListItem(match[2])}`);
    match=s.match(/^Przepis(?:y|ów)?\s+.{1,220}?\b(nie stosuje się|nie dotyczą|stosuje się(?: odpowiednio)?)(.*)$/i);
    if(match){
      const target=firstNorm(clean(match[2]).replace(/^również\s+/i,'').replace(/^[:;,]\s*/,''));
      return clip(`${/^nie/i.test(match[1])?'Wyłączenie stosowania':'Stosowanie'} wskazanych przepisów${target?` — ${target}`:''}`);
    }
    match=s.match(/^Do (.{2,180}?) (nie stosuje się|stosuje się(?: odpowiednio)?) przepisy?\b/i);
    if(match)return clip(`${/^nie/i.test(match[2])?'Wyłączenie stosowania':'Stosowanie'} przepisów do ${clean(match[1])}`);
    match=s.match(/^(.{2,150}?\bma prawo do)\s*:\s*(.+)$/i);if(match)return clip(`${clean(match[1])} ${firstListItem(match[2])}`);
    match=s.match(/^(.{2,150}?\bjest obowiązan(?:y|a|e) do)\s*:\s*(.+)$/i);if(match)return clip(`${clean(match[1])} ${firstListItem(match[2])}`);
    match=s.match(/^(.{2,150}?\bnie wolno)\s*:\s*(.+)$/i);if(match)return clip(`${clean(match[1])} ${firstListItem(match[2])}`);
    match=s.match(/^(Zabrania się)\s*:\s*(.+)$/i);if(match)return clip(`${match[1]} ${firstListItem(match[2])}`);
    match=s.match(/^Kto\s*:\s*(.+)$/i);if(match)return clip(`Kto ${firstListItem(match[1])}`);
    return'';
  }
  function conciseLead(text){
    const structured=structuredLeadTitle(text);if(structured)return structured;
    let lead=firstNorm(condenseBoilerplate(text));
    if(!/^Nie\s+podlega\b/i.test(lead))lead=lead.replace(/,?\s+(?:podlega|podlegają)\s+(?:karze|grzywnie)[\s\S]*$/i,'');
    lead=lead.replace(/\s+(?:Tej samej karze|W wypadku mniejszej wagi)[\s\S]*$/i,'');
    return clip(lead,MAX);
  }
  function summarize(row,actCode){
    const id=String(row?.[0]||'');
    if(SOURCE_TITLES.has(id))return SOURCE_TITLES.get(id);
    if(EDITORIAL_OVERRIDES.has(id))return EDITORIAL_OVERRIDES.get(id);
    const raw=rawArticleText(row),text=articleText(row),existing=clean(row?.[3]);
    if(!text){
      if(/pominięty/i.test(raw)&&!/uchylony/i.test(raw))return'Przepis pominięty.';
      if(/uchylony|utracił moc/i.test(raw))return'Przepis uchylony.';
      return existing?clip(existing):'Zakres przepisu.';
    }
    if(/^Użyte (?:w .{0,30})?(?:określenia|wyrażenia).*oznaczają:/i.test(text))return'Definicje pojęć użytych w akcie.';
    if(/^(?:Ustawa|Kodeks|Zarządzenie) określa:/i.test(text))return'Zakres spraw regulowanych aktem.';
    if(/^Dotychczasowe przepisy wykonawcze/i.test(text))return'Czasowe zachowanie mocy dotychczasowych przepisów wykonawczych.';
    if(/^Trac(?:i|ą) moc\b/i.test(text))return'Utrata mocy dotychczasowych przepisów.';
    if(/^(?:Ustawa|Zarządzenie) wchodzi w życie\b/i.test(text))return'Termin wejścia w życie i przewidziane wyjątki.';
    if(/^Karami są:/i.test(text))return'Katalog kar.';
    if(/^Środkami karnymi są:/i.test(text))return'Katalog środków karnych.';
    if(/^W przypadku braku możliwości wprowadzenia danych do ewidencji, spowodowanego/i.test(text))return'Termin uzupełnienia danych po niedostępności ewidencji.';
    if(/^Podmiot, który stwierdzi niezgodność danych zgromadzonych w ewidencji/i.test(text))return'Wyjaśnianie i poprawianie niezgodnych danych w ewidencji.';
    return conciseLead(text)||existing&&clip(existing)||`Zakres ${actCode&&actCode.startsWith('z')?'paragrafu':'artykułu'}.`;
  }
  function chapterSuggestion(actCode,row){
    const text=articleText(row);
    for(const [pattern,label] of CHAPTER_RULES)if(pattern.test(text))return label;
    const source=clean(row?._sourceTopic||text).replace(/[.…]+$/,'');
    return clip(source||'Zakres przepisów',48).replace(/[.…]+$/,'');
  }
  function toRoman(value){
    let number=Number.parseInt(value,10);if(!Number.isFinite(number)||number<1)return String(value||'');
    const numerals=[[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
    let result='';for(const [amount,symbol] of numerals)while(number>=amount){result+=symbol;number-=amount}return result;
  }
  function sectionInfo(row,actCode){
    const raw=String(row?.[1]||'').replace(/\s+/g,' ').trim();
    const match=raw.match(/^((?:Dział|Rozdział|Oddział))\s+([IVXLCDM]+|\d+)([a-z]?)\)?(?:\s*[.:-]\s*(.*))?$/i);
    let prefix='Przepisy',title='',generated=false;
    if(match){
      const kind=match[1][0].toUpperCase()+match[1].slice(1).toLowerCase();
      const number=/^Rozdział$/i.test(kind)&&/^\d+$/.test(match[2])?toRoman(match[2]):match[2].toUpperCase();
      prefix=`${kind} ${number}${match[3]||''}`;
      title=String(match[4]||'').trim().replace(/[.]$/,'');
    } else if(/^Oddział dodany\b/i.test(raw))prefix='Oddział';
    else if(raw)prefix=raw.replace(/[.]$/,'');
    if(!title&&row){title=chapterSuggestion(actCode,row)||'Przepisy szczególne';generated=true}
    return {prefix,title,generated};
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
      const row=rows.get(article.id),head=article.querySelector(':scope > .unit-head'),el=head?.querySelector('.editorial-title');
      if(!row||!head||!el)return;if(el.textContent!==row[3])el.textContent=row[3];el.dataset.aiSummary='1';el.setAttribute('aria-label','Redakcyjne podsumowanie artykułu');
      const section=head.querySelector('.section-label'),info=sectionInfo(row,ACT[0]);
      if(section&&section.dataset.sectionKey!==`${info.prefix}|${info.title}|${info.generated}`){
        section.textContent='';
        const no=document.createElement('span');no.className='section-no';no.textContent=info.prefix;section.appendChild(no);
        if(info.title){const title=document.createElement('span');title.className='section-title'+(info.generated?' generated':'');title.textContent=info.title;section.appendChild(title)}
        section.dataset.sectionKey=`${info.prefix}|${info.title}|${info.generated}`;
      }
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
  globalThis.__EDITORIAL={summarize,chapterSuggestion,sectionInfo,toRoman,articleText,clip};
  prepare();
  if(typeof document==='undefined')return;
  const root=document.getElementById('actview');if(!root)return;
  let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;prepare();apply()})}).observe(root,{childList:true,subtree:true});
  apply();
})();
