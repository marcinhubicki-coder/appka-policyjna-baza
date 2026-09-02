/* Lightweight presentation helpers. Article labels are prepared in data.js. */
(function(){
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
  const sectionCache=new WeakMap(),preparedActs=new Set();

  function clean(value){
    return String(value||'').replace(/\u00ad/g,'').replace(/\s+/g,' ')
      .replace(/\s+([,.;:])/g,'$1').trim();
  }
  function articleText(row){
    return clean((row?.[4]||[]).map(unit=>unit?.[3]||'').join(' '));
  }
  function short(value,max=48){
    const text=clean(value).replace(/[.…]+$/,'');
    if(text.length<=max)return text;
    return text.slice(0,max).replace(/\s+\S*$/,'').replace(/[,:;–-]+$/,'').trim();
  }
  function chapterSuggestion(_actCode,row){
    const text=articleText(row);
    for(const [pattern,label] of CHAPTER_RULES)if(pattern.test(text))return label;
    return short(row?.[3]||'Przepisy szczególne');
  }
  function sectionRecord(value,generated=false){
    if(!value)return null;
    if(typeof value==='string')return{title:value,prefix:'',generated};
    return{title:clean(value.title),prefix:clean(value.prefix),generated:!!value.generated};
  }
  function prepareActSections(actCode){
    if(preparedActs.has(actCode))return;
    const act=typeof DATA!=='undefined'&&Array.isArray(DATA)?DATA.find(item=>item?.[0]===actCode):null;
    if(!act)return;
    const titles=globalThis.__CHAPTER_TITLES||{},unset=Symbol('unset');
    let previous=unset,current=null;
    for(const item of act[3]||[]){
      const raw=clean(item?.[1]);
      if(raw!==previous){
        previous=raw;
        current=sectionRecord(titles[item?.[0]])||sectionRecord(chapterSuggestion(actCode,item),true);
      }
      if(current)sectionCache.set(item,current);
    }
    preparedActs.add(actCode);
  }
  function mappedSection(row,actCode){
    prepareActSections(actCode);
    return sectionCache.get(row)||sectionRecord(globalThis.__CHAPTER_TITLES?.[row?.[0]]);
  }
  function toRoman(value){
    let number=Number.parseInt(value,10);if(!Number.isFinite(number)||number<1)return String(value||'');
    const numerals=[[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
    let result='';for(const [amount,symbol] of numerals)while(number>=amount){result+=symbol;number-=amount}return result;
  }
  function sectionInfo(row,actCode){
    const raw=clean(row?.[1]);
    const mapped=mappedSection(row,actCode);
    const match=raw.match(/^((?:Dział|Rozdział|Oddział))\s+([IVXLCDM]+|\d+)([a-z]?)\)?(?:\s*[.:-]\s*(.*))?$/i);
    let prefix='Przepisy',title='',generated=false;
    if(match){
      const kind=match[1][0].toUpperCase()+match[1].slice(1).toLowerCase();
      const number=/^Rozdział$/i.test(kind)&&/^\d+$/.test(match[2])?toRoman(match[2]):match[2].toUpperCase();
      prefix=`${kind} ${number}${match[3]||''}`;
      title=String(match[4]||'').trim().replace(/[.]$/,'');
    }else if(/^Oddział dodany\b/i.test(raw))prefix='Oddział';
    else if(raw)prefix=raw.replace(/[.]$/,'');
    if(mapped?.prefix)prefix=mapped.prefix;
    if(!title&&mapped?.title){title=mapped.title;generated=mapped.generated}
    if(!title&&row){title=chapterSuggestion(actCode,row)||'Przepisy szczególne';generated=true}
    return {prefix,title,generated};
  }
  function isEditorial(row){return row?.[8]!=='s'}

  globalThis.__EDITORIAL={articleText,chapterSuggestion,isEditorial,sectionInfo,toRoman};
})();
