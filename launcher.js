(function(){
  const shell=document.getElementById('launcherShell'),query=document.getElementById('launcherQuery'),searchWrap=document.getElementById('launcherSearch'),clear=document.getElementById('launcherClear'),quickSections=document.getElementById('launcherQuickSections'),suggestions=document.getElementById('launcherSuggestions'),resultsBox=document.getElementById('launcherResults'),resultFilters=document.getElementById('launcherResultFilters'),resultList=document.getElementById('launcherResultList'),resultStatus=document.getElementById('launcherResultStatus'),loadMore=document.getElementById('launcherLoadMore'),showAll=document.getElementById('launcherShowAll'),recentBox=document.getElementById('launcherRecent'),recentList=document.getElementById('launcherRecentList'),readerButton=document.getElementById('launcherReader'),fab=document.getElementById('launcherFab');
  if(!shell||!query)return;
  const RECENT_KEY='police-law-launcher-recent-v1',MAX_RESULTS=10,SUGGESTIONS=['Legitymowanie','Zatrzymanie','Kontrola osobista','Przeszukanie','ŚPB','Nietrzeźwy','Przemoc domowa','Nieletni','Ruch drogowy','Narkotyki'];
  const QUICK_SECTIONS=[
    {id:'legitymowanie',label:'Podstawy legitymowania',items:[
      {label:'UoP · A. 15 u. 1 p. 1',short:'UoP · A.15/1/1',medium:'UoP · art. 15/1/1',target:'uop-art-15-ust-1-pkt-1',fallback:'legitymowanie art 15 ust 1 pkt 1'},
      {label:'PRD · A. 129 u. 2 p. 1',short:'PRD · A.129/2/1',medium:'PRD · art. 129/2/1',target:'prd-art-129-ust-2-pkt-1',fallback:'art 129 ust 2 pkt 1 policja ustalanie tożsamości'},
      {label:'Cudzoziemcy · A. 289',short:'Cudz. · A.289',medium:'Cudzoziemcy · A.289',target:'cudz-art-289',fallback:'cudzoziemcy art 289'},
      {label:'Cudzoziemcy · A. 293',short:'Cudz. · A.293',medium:'Cudzoziemcy · A.293',target:'cudz-art-293',fallback:'cudzoziemcy art 293'}
    ]},
    {id:'wykroczenia',label:'Częste wykroczenia',items:[
      {label:'Zakłócanie spokoju',short:'Zakłóc. spokoju',medium:'Zakłócanie spokoju',target:'kw-art-51',fallback:'kw art 51'},
      {label:'Wprowadzanie w błąd',short:'Wprow. w błąd',medium:'Wprowadzanie w błąd',target:'kw-art-65',fallback:'kw art 65'},
      {label:'Niewykonanie polecenia',short:'Niewyk. polecenia',medium:'Niewykonanie polecenia',target:'kw-art-65a',fallback:'kw art 65a'},
      {label:'Zagrożenie w ruchu',short:'Zagroż. w ruchu',medium:'Zagrożenie w ruchu',target:'kw-art-86',fallback:'kw art 86'},
      {label:'Jazda po alkoholu',short:'Jazda po alkoholu',target:'kw-art-87',fallback:'kw art 87'},
      {label:'Jazda bez oświetlenia',short:'Brak oświetlenia',medium:'Jazda bez ośw.',target:'kw-art-88',fallback:'kw art 88'},
      {label:'Znaki i polecenia',short:'Znaki / polecenia',medium:'Znaki i polecenia',target:'kw-art-92',fallback:'kw art 92'},
      {label:'Inne przepisy ruchu',short:'Inne przep. ruchu',medium:'Inne przepisy ruchu',target:'kw-art-97',fallback:'kw art 97'},
      {label:'Kradzież / przywłaszczenie',short:'Kradzież / przywł.',medium:'Kradzież / przywłasz.',target:'kw-art-119',fallback:'kw art 119'},
      {label:'Uszkodzenie rzeczy',short:'Uszkodz. rzeczy',medium:'Uszkodzenie rzeczy',target:'kw-art-124',fallback:'kw art 124'},
      {label:'Nieobyczajny wybryk',short:'Nieobycz. wybryk',medium:'Nieobyczajny wybryk',target:'kw-art-140',fallback:'kw art 140'},
      {label:'Nieprzyzwoite treści',short:'Nieprzyzw. treści',medium:'Nieprzyzwoite treści',target:'kw-art-141',fallback:'kw art 141'},
      {label:'Zaśmiecanie',target:'kw-art-145',fallback:'kw art 145'}
    ],moreItems:[
      {label:'Fałszywy alarm',target:'kw-art-66',fallback:'kw art 66'},
      {label:'Naruszenie nakazu / zakazu',short:'Nakaz / zakaz',medium:'Narusz. nakazu / zakazu',target:'kw-art-66b',fallback:'kw art 66b'},
      {label:'Brak zabezpieczenia miejsca',short:'Brak zabezp.',medium:'Brak zabezp. miejsca',target:'kw-art-72',fallback:'kw art 72'},
      {label:'Brak uprawnień',target:'kw-art-94',fallback:'kw art 94'},
      {label:'Brak dokumentów',target:'kw-art-95',fallback:'kw art 95'},
      {label:'Niewłaściwy nadzór',short:'Nadzór',medium:'Niewłaśc. nadzór',target:'kw-art-106',fallback:'kw art 106'},
      {label:'Złośliwe niepokojenie',short:'Złośl. niepokojenie',medium:'Złośliwe niepokojenie',target:'kw-art-107',fallback:'kw art 107'},
      {label:'Wyłudzenie świadczenia',short:'Wyłudz. świadczenia',medium:'Wyłudzenie świadczenia',target:'kw-art-121',fallback:'kw art 121'},
      {label:'Paserstwo',target:'kw-art-122',fallback:'kw art 122'},
      {label:'Znaleziona rzecz / zwierzę',short:'Rzecz / zwierzę',medium:'Znalez. rzecz / zwierzę',target:'kw-art-125',fallback:'kw art 125'},
      {label:'Urządzenia publiczne',short:'Urządz. publiczne',medium:'Urządzenia publiczne',target:'kw-art-143',fallback:'kw art 143'},
      {label:'Niszczenie zieleni',target:'kw-art-144',fallback:'kw art 144'}
    ]},
    {id:'przestepstwa',label:'Częste przestępstwa',items:[
      {label:'Uszkodzenie ciała',short:'Uszkodz. ciała',medium:'Uszkodzenie ciała',target:'kk-art-157',fallback:'kk art 157'},
      {label:'Bójka / pobicie',target:'kk-art-158',fallback:'kk art 158'},
      {label:'Nietrzeźwy kierujący',short:'Nietrzeźwy kier.',medium:'Nietrzeźwy kierujący',target:'kk-art-178a',fallback:'kk art 178a'},
      {label:'Groźby karalne',short:'Groźby',medium:'Groźby karalne',target:'kk-art-190',fallback:'kk art 190'},
      {label:'Stalking',target:'kk-art-190a',fallback:'kk art 190a'},
      {label:'Zmuszanie',target:'kk-art-191',fallback:'kk art 191'},
      {label:'Mir domowy',target:'kk-art-193',fallback:'kk art 193'},
      {label:'Znęcanie',target:'kk-art-207',fallback:'kk art 207'},
      {label:'Naruszenie nietykalności',short:'Nietykalność',medium:'Narusz. nietykalności',target:'kk-art-217',fallback:'kk art 217'},
      {label:'Nietykalność funkcjonariusza',short:'Nietykaln. funkcj.',medium:'Nietykalność funkcj.',target:'kk-art-222',fallback:'kk art 222'},
      {label:'Czynna napaść',target:'kk-art-223',fallback:'kk art 223'},
      {label:'Znieważenie funkcjonariusza',short:'Znieważ. funkcj.',medium:'Znieważenie funkcj.',target:'kk-art-226',fallback:'kk art 226'},
      {label:'Kradzież',target:'kk-art-278',fallback:'kk art 278'},
      {label:'Kradzież z włamaniem',short:'Włamanie',medium:'Kradzież z włam.',target:'kk-art-279',fallback:'kk art 279'},
      {label:'Rozbój',target:'kk-art-280',fallback:'kk art 280'},
      {label:'Oszustwo',target:'kk-art-286',fallback:'kk art 286'},
      {label:'Zniszczenie mienia',short:'Zniszcz. mienia',medium:'Zniszczenie mienia',target:'kk-art-288',fallback:'kk art 288'}
    ],moreItems:[
      {label:'Zabójstwo',target:'kk-art-148',fallback:'kk art 148'},
      {label:'Ciężki uszczerbek',target:'kk-art-156',fallback:'kk art 156'},
      {label:'Broń w bójce / pobiciu',short:'Bójka + broń',medium:'Broń w bójce',target:'kk-art-159',fallback:'kk art 159'},
      {label:'Narażenie na niebezpieczeństwo',short:'Naraż. na niebezp.',medium:'Narażenie na niebezp.',target:'kk-art-160',fallback:'kk art 160'},
      {label:'Jazda mimo cofnięcia uprawnień',short:'Cofnięte uprawn.',medium:'Cofnięte uprawnienia',target:'kk-art-180a',fallback:'kk art 180a'},
      {label:'Zgwałcenie',target:'kk-art-197',fallback:'kk art 197'},
      {label:'Rozpijanie małoletniego',short:'Rozpijanie małolet.',medium:'Rozpijanie małoletniego',target:'kk-art-208',fallback:'kk art 208'},
      {label:'Nietykalność interweniującego',short:'Nietykaln. interw.',medium:'Nietykalność interw.',target:'kk-art-217a',fallback:'kk art 217a'},
      {label:'Fałszywy alarm',target:'kk-art-224a',fallback:'kk art 224a'},
      {label:'Fałszywe zeznania',target:'kk-art-233',fallback:'kk art 233'},
      {label:'Fałszywe oskarżenie',short:'Fałszywe oskarż.',medium:'Fałszywe oskarżenie',target:'kk-art-234',fallback:'kk art 234'},
      {label:'Fałszywe zawiadomienie',short:'Fałszywe zawiad.',medium:'Fałszywe zawiadomienie',target:'kk-art-238',fallback:'kk art 238'},
      {label:'Poplecznictwo',target:'kk-art-239',fallback:'kk art 239'},
      {label:'Kradzież rozbójnicza',short:'Kradzież rozb.',medium:'Kradzież rozbójnicza',target:'kk-art-281',fallback:'kk art 281'},
      {label:'Wymuszenie rozbójnicze',short:'Wymuszenie rozb.',medium:'Wymuszenie rozbójnicze',target:'kk-art-282',fallback:'kk art 282'},
      {label:'Przywłaszczenie',target:'kk-art-284',fallback:'kk art 284'},
      {label:'Zabór pojazdu',target:'kk-art-289',fallback:'kk art 289'}
    ]},
    {id:'prd',label:'Ruch drogowy · PRD',items:[
      {label:'Prędkość · art. 20',short:'Prędkość · A.20',medium:'Prędkość · art. 20',target:'prd-art-20',fallback:'prd art 20 prędkość'},
      {label:'Piesi · art. 26',short:'Piesi · A.26',medium:'Piesi · art. 26',target:'prd-art-26',fallback:'prd art 26 pieszy'},
      {label:'Wypadek · art. 44',short:'Wypadek · A.44',medium:'Wypadek · art. 44',target:'prd-art-44',fallback:'prd art 44 wypadek'},
      {label:'Zatrzymanie / postój · art. 46',short:'Postój · A.46',medium:'Zatrzymanie / postój',target:'prd-art-46',fallback:'prd art 46 zatrzymanie postój'},
      {label:'Zakazy postoju · art. 49',short:'Zakazy · A.49',medium:'Zakazy postoju',target:'prd-art-49',fallback:'prd art 49 zatrzymanie postój'},
      {label:'Kontrola · art. 129',short:'Kontrola · A.129',medium:'Kontrola · art. 129',target:'prd-art-129',fallback:'prd art 129 kontrola ruchu drogowego'}
    ]}
  ];
  let router=null,discovery=null,articleById=new Map(),idById=new Map(),actByCode=new Map(),routerPromise=null,discoveryPromise=null,searchTimer=0,opened=false,openSectionId='',resultObserver=null,fabFrame=0,searchSession=null,searchToken=0,openMoreSectionIds=new Set(),fabRevealAnimation=null,exitRevealFrame=0,transitionGlass=null,fabCircleFadeTimer=0,fabIconFadeTimer=0,navigationBusy=false;
  const norm=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/ł/g,'l').replace(/\s+/g,' ').trim();
  const searchTokens=value=>norm(value).match(/[a-z0-9]+/g)||[];
  const searchLawTier=code=>code==='kw'||code==='kk'?0:1;
  function boundedEditDistance(a,b,max){
    if(a===b)return 0;if(Math.abs(a.length-b.length)>max)return max+1;
    let prev=Array.from({length:b.length+1},(_,i)=>i),prevPrev=null;
    for(let i=1;i<=a.length;i++){
      const cur=[i];let rowMin=cur[0];
      for(let j=1;j<=b.length;j++){
        let value=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
        if(prevPrev&&i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])value=Math.min(value,prevPrev[j-2]+1);
        cur[j]=value;rowMin=Math.min(rowMin,value);
      }
      if(rowMin>max)return max+1;prevPrev=prev;prev=cur;
    }
    return prev[b.length];
  }
  function fuzzyTermMatch(term,text){
    if(term.length<4)return false;const max=term.length>=8?2:1,tokens=searchTokens(text);
    for(const word of tokens){
      if(Math.abs(word.length-term.length)>max)continue;
      if(word===term||boundedEditDistance(term,word,max)<=max)return true;
    }
    return false;
  }
  function fuzzyMismatchCount(row,meta,session){
    const full=String(row[1]||''),exactHay=full+' '+norm(meta.heading+' '+meta.title+' '+meta.short+' '+meta.actName+' '+(row[2]||'')),fuzzyHay=norm(meta.heading+' '+meta.title+' '+meta.short+' '+meta.actName+' '+(row[2]||'')+' '+full.slice(0,1200));let fuzzy=0;
    for(const term of session.terms){if(exactHay.includes(term))continue;if(!fuzzyTermMatch(term,fuzzyHay))return-1;fuzzy++}
    return fuzzy;
  }
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function isDeepLink(){try{const h=decodeURIComponent(location.hash.slice(1));return !!h&&h!=='start'}catch(_){return false}}
  function isOpen(){return opened}
  function readRecent(){try{const value=JSON.parse(localStorage.getItem(RECENT_KEY)||'[]');return Array.isArray(value)?value.slice(0,4):[]}catch(_){return[]}}
  function writeRecent(list){try{localStorage.setItem(RECENT_KEY,JSON.stringify(list.slice(0,4)))}catch(_){}}
  function remember(id,act,label,sub){
    if(!id||!act)return;const list=readRecent().filter(item=>item.id!==id);list.unshift({id,act,label,sub,at:Date.now()});writeRecent(list);renderRecent();
  }
  function renderRecent(){
    const items=readRecent();recentBox.hidden=!items.length;if(!items.length){recentList.replaceChildren();return}
    recentList.innerHTML=items.map(item=>'<button class="launcher-recent-item" type="button" data-recent="'+esc(item.id)+'"><span><b>'+esc(item.label||item.id)+'</b><small>'+esc(item.sub||item.act)+'</small></span><span>›</span></button>').join('');
  }
  function quickArticleNumber(item){const match=String(item?.target||'').match(/-art-([0-9]+[a-z]?)/i);return match?.[1]||''}
  function quickItemLabel(item){return item?.short||item?.medium||item?.label||''}
  function quickChip(item,sectionId,index,moreIndex=-1){
    const extra=moreIndex>=0?' is-more-item':'',style=moreIndex>=0?' style="--quick-in:'+moreIndex+'"':'',full=item?.label||quickItemLabel(item),medium=item?.medium||full,short=item?.short||medium;
    return '<button class="launcher-chip'+extra+'" type="button" data-quick-item="'+esc(sectionId)+'" data-quick-index="'+index+'" data-qshort="'+esc(short)+'" data-qmedium="'+esc(medium)+'" data-qfull="'+esc(full)+'" aria-label="'+esc(full)+'" title="'+esc(full)+'"'+style+'>'+esc(short)+'</button>'
  }
  function moreControl(sectionId,expanded){return '<button class="launcher-quick-more" type="button" data-quick-more="'+esc(sectionId)+'" aria-expanded="'+String(expanded)+'">'+(expanded?'Schowaj':'Więcej')+'</button>'}
  function moreControlNode(sectionId,expanded){const template=document.createElement('template');template.innerHTML=moreControl(sectionId,expanded);return template.content.firstElementChild}
  function quickVariants(node){
    const values=[node.dataset.qshort,node.dataset.qmedium,node.dataset.qfull].filter(Boolean),seen=new Set(),out=[];
    values.forEach((text,index)=>{if(seen.has(text))return;seen.add(text);out.push({text,level:index})});
    return out.length?out:[{text:node.textContent||'',level:0}]
  }
  function setQuickVariant(node,variant){
    node.textContent=variant.text;node.dataset.quickVariant=String(variant.level);node.style.removeProperty('--quick-pad-x');
  }
  function measureQuickVariants(node){
    const previous=node.textContent,previousLevel=node.dataset.quickVariant||'',result=[];
    node.style.removeProperty('--quick-pad-x');
    quickVariants(node).forEach(variant=>{node.textContent=variant.text;result.push({...variant,width:node.getBoundingClientRect().width})});
    node.textContent=previous;if(previousLevel)node.dataset.quickVariant=previousLevel;else delete node.dataset.quickVariant;
    return result
  }
  function chooseQuickVariants(row,width,metrics,gap=7){
    const available=width-gap*Math.max(0,row.length-1),options=row.map(node=>metrics.get(node)||measureQuickVariants(node));let best=null;
    function visit(index,choice,total,richness){
      if(total>available+.5)return;
      if(index===options.length){
        const shortened=choice.map((variant,i)=>variant.text!==(row[i].dataset.qfull||variant.text)),eligible=shortened.filter(Boolean).length,spare=Math.max(0,available-total),padEach=eligible?Math.min(10,Math.max(0,(spare-5)/eligible)):0,residual=Math.max(0,spare-padEach*eligible);
        const score=richness*10-residual*2.15-padEach*.22+total*.012;
        if(!best||score>best.score)best={nodes:row,choice:[...choice],total,richness,padEach,residual,score,shortened};
        return
      }
      options[index].forEach(variant=>{choice.push(variant);visit(index+1,choice,total+variant.width,richness+variant.level);choice.pop()});
    }
    visit(0,[],0,0);return best;
  }
  function quickCombinations(pool,size,visit,start=0,chosen=[]){
    if(chosen.length===size){visit([...chosen]);return}
    for(let i=start;i<=pool.length-(size-chosen.length);i++){chosen.push(pool[i]);quickCombinations(pool,size,visit,i+1,chosen);chosen.pop()}
  }
  function planQuickRows(nodes,width,gap=7){
    const left=[...nodes],rows=[];left.forEach(node=>setQuickVariant(node,quickVariants(node)[0]));
    const metrics=new Map(left.map(node=>[node,measureQuickVariants(node)]));
    while(left.length){
      if(left.length===1){const node=left.shift(),plan=chooseQuickVariants([node],width,metrics,gap);rows.push(plan||{nodes:[node],choice:[quickVariants(node)[0]],padEach:0,shortened:[false]});continue}
      const pool=left.slice(0,Math.min(9,left.length)),sizes=left.length>=3?[3,2]:[2];let best=null;
      sizes.forEach(size=>quickCombinations(pool,size,row=>{
        const plan=chooseQuickVariants(row,width,metrics,gap);if(!plan)return;
        const indexes=row.map(node=>left.indexOf(node)),orderPenalty=indexes.reduce((sum,index)=>sum+index,0)*.34,rowBonus=size===3?54:20,nearFull=plan.residual<=12?10:plan.residual<=24?4:0,score=rowBonus+nearFull+plan.score-orderPenalty;
        if(!best||score>best.score)best={...plan,score,indexes};
      }));
      if(!best){
        const node=left.shift(),plan=chooseQuickVariants([node],width,metrics,gap);rows.push(plan||{nodes:[node],choice:[quickVariants(node)[0]],padEach:0,shortened:[false]});continue
      }
      best.nodes.forEach(node=>left.splice(left.indexOf(node),1));rows.push(best);
    }
    return rows;
  }
  function applyQuickRowPlan(plan){
    if(!plan)return;
    plan.nodes.forEach((node,index)=>{
      setQuickVariant(node,plan.choice[index]);
      if(plan.shortened?.[index]&&plan.padEach>0)node.style.setProperty('--quick-pad-x',(plan.padEach/2).toFixed(2)+'px');
    });
  }
  function optimizePlainChipCloud(container){
    if(!container)return;const nodes=[...container.querySelectorAll('.launcher-chip')],width=container.clientWidth;if(!nodes.length||width<120)return;
    nodes.forEach(node=>{
      const text=(node.textContent||'').trim();
      if(!node.dataset.qshort)node.dataset.qshort=text;
      if(!node.dataset.qmedium)node.dataset.qmedium=text;
      if(!node.dataset.qfull)node.dataset.qfull=text;
      setQuickVariant(node,quickVariants(node)[0]);
    });
    const rows=planQuickRows(nodes,width),frag=document.createDocumentFragment();
    rows.forEach(plan=>plan.nodes.forEach(node=>frag.append(node)));container.append(frag);rows.forEach(applyQuickRowPlan);
  }
  function optimizeAllLauncherChips(){
    quickSections.querySelectorAll('[data-quick-section]').forEach(section=>{
      if(section.querySelector('.launcher-chip.is-more-item'))optimizeQuickExtraLayout(section);
      else optimizeQuickLayout(section);
    });
    optimizePlainChipCloud(suggestions);
  }
  function optimizeQuickExtraLayout(section){
    const wrap=section?.querySelector('.launcher-quick-body-inner>.launcher-quick-chips'),control=wrap?.querySelector('[data-quick-more]'),primary=wrap?[...wrap.querySelectorAll('.launcher-chip:not(.is-more-item)')]:[],extra=wrap?[...wrap.querySelectorAll('.launcher-chip.is-more-item')]:[],width=wrap?.clientWidth||0;
    if(!wrap||!extra.length||width<120)return;
    extra.forEach(node=>setQuickVariant(node,quickVariants(node)[0]));
    const gap=parseFloat(getComputedStyle(wrap).columnGap||getComputedStyle(wrap).gap)||7,left=[...extra],rows=[];
    if(primary.length&&left.length){
      const lastTop=Math.max(...primary.map(node=>Math.round(node.offsetTop))),lastRow=primary.filter(node=>Math.abs(Math.round(node.offsetTop)-lastTop)<=1),used=lastRow.reduce((sum,node)=>sum+node.getBoundingClientRect().width,0)+gap*Math.max(0,lastRow.length-1),remaining=Math.max(0,width-used-(lastRow.length?gap:0));
      if(remaining>54){
        const pool=left.slice(0,Math.min(8,left.length));let first=null;
        [Math.min(2,pool.length),1].filter(Boolean).forEach(size=>quickCombinations(pool,size,row=>{
          const plan=chooseQuickVariants(row,remaining,new Map(row.map(node=>[node,measureQuickVariants(node)])),gap);if(!plan)return;
          const score=plan.richness*9-plan.residual*2.2+plan.total*.01;
          if(!first||score>first.score)first={...plan,score};
        }));
        if(first){rows.push(first);first.nodes.forEach(node=>left.splice(left.indexOf(node),1))}
      }
    }
    rows.push(...planQuickRows(left,width,gap));
    const frag=document.createDocumentFragment();rows.forEach(plan=>plan.nodes.forEach(node=>frag.append(node)));wrap.append(frag);rows.forEach(applyQuickRowPlan);
    if(control?.getAttribute('aria-expanded')==='true')wrap.append(control);
  }
  function optimizeQuickLayout(section){
    const wrap=section?.querySelector('.launcher-quick-body-inner>.launcher-quick-chips');if(!wrap)return;
    const control=wrap.querySelector('[data-quick-more]'),primary=[...wrap.querySelectorAll('.launcher-chip:not(.is-more-item)')],extra=[...wrap.querySelectorAll('.launcher-chip.is-more-item')],width=wrap.clientWidth;if(width<120)return;
    primary.forEach(node=>setQuickVariant(node,quickVariants(node)[0]));
    const primaryRows=planQuickRows(primary,width),frag=document.createDocumentFragment();
    primaryRows.forEach(plan=>plan.nodes.forEach(node=>frag.append(node)));extra.forEach(node=>frag.append(node));if(control)frag.append(control);wrap.append(frag);
    primaryRows.forEach(applyQuickRowPlan);
    if(extra.length)optimizeQuickExtraLayout(section);
  }
  function renderQuickSections(){
    quickSections.innerHTML=QUICK_SECTIONS.map(section=>{
      const open=section.id===openSectionId,moreOpen=openMoreSectionIds.has(section.id),primary=section.items.map((item,index)=>quickChip(item,section.id,index)).join('');
      const more=(section.moreItems||[]).map((item,index)=>quickChip(item,section.id,section.items.length+index,index)).join('');
      const morePart=section.moreItems?.length?(moreOpen?more+moreControl(section.id,true):moreControl(section.id,false)):'';
      return '<section class="launcher-quick-section'+(open?' is-open':'')+'" data-quick-section="'+esc(section.id)+'"><button class="launcher-quick-toggle" type="button" aria-expanded="'+String(open)+'"><span>'+esc(section.label)+'</span><span class="launcher-quick-chevron" aria-hidden="true">›</span></button><div class="launcher-quick-body" aria-hidden="'+String(!open)+'"><div class="launcher-quick-body-inner"><div class="launcher-quick-chips">'+primary+morePart+'</div></div></div></section>';
    }).join('');
    quickSections.querySelectorAll('[data-quick-section]').forEach(optimizeQuickLayout);
  }
  function quickSectionNode(id){return [...quickSections.querySelectorAll('[data-quick-section]')].find(node=>node.dataset.quickSection===id)||null}
  function animateQuickMore(id){
    const section=quickSectionNode(id),config=QUICK_SECTIONS.find(item=>item.id===id),wasOpen=openMoreSectionIds.has(id),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;if(!section||!config?.moreItems?.length)return;
    const row=section.querySelector('.launcher-quick-body-inner>.launcher-quick-chips'),control=row?.querySelector('[data-quick-more]');if(!row||!control)return;
    if(!wasOpen){
      openMoreSectionIds.add(id);control.textContent='Schowaj';control.setAttribute('aria-expanded','true');
      const frag=document.createDocumentFragment();
      config.moreItems.forEach((item,index)=>{const template=document.createElement('template');template.innerHTML=quickChip(item,id,config.items.length+index,index);frag.append(template.content.firstElementChild)});
      control.before(frag);row.append(control);optimizeQuickExtraLayout(section);
      if(!reduced)[...row.querySelectorAll('.launcher-chip.is-more-item')].forEach((node,index)=>node.animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:260,delay:Math.min(index,10)*22,easing:'cubic-bezier(.22,.68,.24,1)',fill:'both'}));
      return
    }
    openMoreSectionIds.delete(id);const extras=[...row.querySelectorAll('.launcher-chip.is-more-item')];
    const finish=()=>{extras.forEach(node=>node.remove());control.textContent='Więcej';control.setAttribute('aria-expanded','false');row.append(control)};
    if(reduced){finish();return}
    let pending=extras.length;if(!pending){finish();return}
    extras.forEach((node,index)=>{const animation=node.animate([{opacity:1,transform:'none'},{opacity:0,transform:'translateY(-4px)'}],{duration:150,delay:Math.min(extras.length-1-index,8)*12,easing:'cubic-bezier(.4,0,.3,1)',fill:'forwards'});animation.onfinish=()=>{node.remove();pending--;if(!pending){control.textContent='Więcej';control.setAttribute('aria-expanded','false');row.append(control)}}});
  }
  function animateQuickSection(section,opening){
    const body=section?.querySelector('.launcher-quick-body'),toggle=section?.querySelector('.launcher-quick-toggle');if(!body||!toggle)return;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;body.getAnimations().forEach(animation=>animation.cancel());
    const start=body.getBoundingClientRect().height;toggle.setAttribute('aria-expanded',String(opening));body.setAttribute('aria-hidden',String(!opening));
    if(reduced){section.classList.toggle('is-open',opening);body.style.height=opening?'auto':'0px';body.style.opacity='';return}
    if(opening){section.classList.add('is-open');body.style.height='auto';const end=body.scrollHeight;body.style.height=start+'px';const animation=body.animate([{height:start+'px',opacity:start?1:0},{height:end+'px',opacity:1}],{duration:360,easing:'cubic-bezier(.22,.68,.24,1)'});animation.onfinish=()=>{body.style.height='auto';body.style.opacity=''}}
    else{body.style.height=start+'px';const animation=body.animate([{height:start+'px',opacity:1},{height:'0px',opacity:0}],{duration:320,easing:'cubic-bezier(.4,0,.22,1)'});animation.onfinish=()=>{section.classList.remove('is-open');body.style.height='0px';body.style.opacity=''}}
  }
  function renderSuggestions(){
    if(!suggestions)return;suggestions.innerHTML=SUGGESTIONS.map(value=>'<button class="launcher-chip" type="button" data-suggestion="'+esc(value)+'" data-qshort="'+esc(value)+'" data-qmedium="'+esc(value)+'" data-qfull="'+esc(value)+'">'+esc(value)+'</button>').join('');optimizePlainChipCloud(suggestions);
  }
  function indexRouter(value){
    router=value;articleById=new Map((router?.articles||[]).map(row=>[row[0],row]));idById=new Map((router?.ids||[]).map(row=>[row[0],row]));actByCode=new Map((router?.acts||[]).map(row=>[row[0],row]));renderQuickSections();return router;
  }
  async function ensureRouter(){
    if(router)return router;if(routerPromise)return routerPromise;
    if(!globalThis.__LAW_DATA?.loadRouter)return null;
    routerPromise=globalThis.__LAW_DATA.loadRouter().then(indexRouter).catch(error=>{console.warn('Launcher routes unavailable',error);return null}).finally(()=>{routerPromise=null});
    return routerPromise;
  }
  async function ensureDiscovery(){
    if(discovery)return discovery;if(discoveryPromise)return discoveryPromise;
    if(!globalThis.__LAW_DATA?.loadDiscovery)return null;
    discoveryPromise=globalThis.__LAW_DATA.loadDiscovery().then(value=>discovery=value).catch(error=>{console.warn('Launcher search unavailable',error);return null}).finally(()=>{discoveryPromise=null});
    return discoveryPromise;
  }
  async function ensureData(){
    const values=await Promise.all([ensureRouter(),ensureDiscovery()]);
    return values[0]&&values[1]?{router:values[0],discovery:values[1]}:null;
  }
  function resultMeta(id){
    const article=articleById.get(id);if(!article)return null;
    const act=actByCode.get(article[1]),cfg=globalThis.__LAW_CONFIG?.acts?.[article[1]]||{};
    return{id,act:article[1],heading:article[3]||'',title:article[4]||'',short:cfg.short||act?.[2]||article[1],actName:cfg.name||act?.[3]||article[1]};
  }
  function scoreResult(row,meta,needle,terms){
    const heading=norm(meta.heading),title=norm(meta.title),act=norm(meta.short+' '+meta.actName),preview=norm(row[2]||''),text=String(row[1]||'');
    let score=0;if(title===needle)score+=150;else if(title.includes(needle))score+=105;if(heading===needle)score+=135;else if(heading.includes(needle))score+=92;if(act.includes(needle))score+=52;if(preview.includes(needle))score+=26;if(text.includes(needle))score+=19;
    for(const term of terms){if(title.includes(term))score+=18;if(heading.includes(term))score+=16;if(act.includes(term))score+=8;if(preview.includes(term))score+=4;if(text.includes(term))score+=2}
    if(/^art\.?\s*\d+/i.test(needle)&&heading.includes(needle.replace('.','')))score+=34;return score;
  }
  function resultMarkup({row,meta}){return '<button class="launcher-result" type="button" data-result="'+esc(meta.id)+'" data-act="'+esc(meta.act)+'"><span class="launcher-result-head"><b>'+esc(meta.heading+(meta.title?' · '+meta.title:''))+'</b><span class="launcher-result-act">'+esc(meta.short)+'</span></span><span class="launcher-result-title">'+esc(meta.actName)+'</span>'+(row[2]?'<span class="launcher-result-preview">'+esc(row[2])+'</span>':'')+'</button>'}
  function resetSearchSession(){
    searchToken++;searchSession=null;resultObserver?.disconnect?.();if(loadMore)loadMore.hidden=true;if(resultFilters){resultFilters.hidden=true;resultFilters.replaceChildren()}
  }
  function searchFilterEntries(session=searchSession){
    if(!session)return[];
    const best=new Map();
    for(const hit of session.matches){const code=hit.meta.act,current=best.get(code);if(!current||hit.score>current.score)best.set(code,hit)}
    return [...session.counts].filter(([,count])=>count>0).map(([code,count])=>{const hit=best.get(code),meta=hit?.meta||{};return{code,count,label:meta.short||code,score:hit?.score||0}})
      .sort((a,b)=>searchLawTier(a.code)-searchLawTier(b.code)||b.score-a.score||b.count-a.count||a.label.localeCompare(b.label,'pl'));
  }
  function renderResultFilters(){
    if(!resultFilters)return;const session=searchSession,entries=searchFilterEntries(session);
    if(!session||entries.length<2){resultFilters.hidden=true;resultFilters.replaceChildren();return}
    const expanded=!!session.filtersExpanded,limit=4,visible=expanded?entries:entries.slice(0,limit),rest=Math.max(0,entries.length-visible.length),total=session.matches.length,active=session.filter||'';
    const pill=(code,label,count)=>'<button class="launcher-result-filter'+(active===code?' is-active':'')+'" type="button" data-result-filter="'+esc(code)+'" aria-pressed="'+String(active===code)+'"><span>'+esc(label)+'</span><b>'+count+'</b></button>';
    let html=pill('','Wszystkie',total)+visible.map(item=>pill(item.code,item.label,item.count)).join('');
    if(entries.length>limit)html+='<button class="launcher-result-filter launcher-result-filter-more" type="button" data-result-filter-more="1" aria-expanded="'+String(expanded)+'">'+(expanded?'Mniej':'+'+rest)+'</button>';
    resultFilters.innerHTML=html;resultFilters.hidden=false;
  }
  function visibleSearchMatches(session=searchSession){
    if(!session)return[];return session.filter?session.matches.filter(hit=>hit.meta.act===session.filter):session.matches;
  }
  function observeResultMore(){
    resultObserver?.disconnect?.();if(!loadMore||loadMore.hidden||typeof IntersectionObserver!=='function')return;
    resultObserver=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){resultObserver.disconnect();requestAnimationFrame(()=>scanNextResultPage())}},{root:shell,rootMargin:'0px 0px 220px 0px',threshold:.01});
    resultObserver.observe(loadMore);
  }
  function renderSearchResultPage(reset=false){
    const session=searchSession;if(!session||session.loading)return false;const matches=visibleSearchMatches(session);
    if(reset){session.shown=0;resultList.replaceChildren()}
    const end=Math.min(matches.length,session.shown+MAX_RESULTS),batch=matches.slice(session.shown,end);session.shown=end;
    if(batch.length)resultList.insertAdjacentHTML('beforeend',batch.map(resultMarkup).join(''));
    resultList.hidden=false;showAll.hidden=false;recentBox.hidden=!readRecent().length;
    if(!matches.length){resultStatus.hidden=false;resultStatus.textContent=session.filter?'Brak wyników w wybranej ustawie.':'Brak szybkich trafień. Możesz sprawdzić pełne wyniki.'}
    else{resultStatus.hidden=true;resultStatus.textContent=''}
    if(loadMore){const left=matches.length-session.shown;loadMore.hidden=left<=0;loadMore.disabled=false;loadMore.textContent='Pokaż kolejne '+Math.min(MAX_RESULTS,left)}
    if(session.shown<matches.length)observeResultMore();else resultObserver?.disconnect?.();
    return !!batch.length;
  }
  function scanNextResultPage(){return renderSearchResultPage(false)}
  async function collectSearchMatches(session){
    const rows=discovery||[],matches=[],counts=new Map(),seen=new Set();session.loading=true;let scanned=0;
    try{
      for(let cursor=0;cursor<rows.length;cursor++){
        const row=rows[cursor],meta=resultMeta(row[0]);if(meta){
          const hay=String(row[1]||'')+' '+norm(meta.heading+' '+meta.title+' '+meta.short+' '+meta.actName+' '+(row[2]||''));
          if(session.terms.every(term=>hay.includes(term))){
            const hit={row,meta,score:scoreResult(row,meta,session.needle,session.terms),fuzzy:false};matches.push(hit);seen.add(meta.id);counts.set(meta.act,(counts.get(meta.act)||0)+1);
          }
        }
        if(++scanned>=520){scanned=0;await new Promise(resolve=>document.hidden?setTimeout(resolve,0):requestAnimationFrame(resolve));if(searchSession!==session)return false}
      }
      const fuzzyEligible=session.terms.some(term=>term.length>=4)&&matches.length<18;
      if(fuzzyEligible){
        scanned=0;
        for(let cursor=0;cursor<rows.length;cursor++){
          const row=rows[cursor],meta=resultMeta(row[0]);if(!meta||seen.has(meta.id))continue;
          const fuzzyCount=fuzzyMismatchCount(row,meta,session);if(fuzzyCount>0){
            const hit={row,meta,score:scoreResult(row,meta,session.needle,session.terms)+Math.max(4,16-fuzzyCount*5),fuzzy:true};matches.push(hit);seen.add(meta.id);counts.set(meta.act,(counts.get(meta.act)||0)+1);
          }
          if(++scanned>=180){scanned=0;await new Promise(resolve=>document.hidden?setTimeout(resolve,0):requestAnimationFrame(resolve));if(searchSession!==session)return false}
        }
      }
      if(searchSession!==session)return false;
      matches.sort((a,b)=>searchLawTier(a.meta.act)-searchLawTier(b.meta.act)||b.score-a.score||Number(a.fuzzy)-Number(b.fuzzy)||a.meta.act.localeCompare(b.meta.act)||a.meta.id.localeCompare(b.meta.id));
      session.matches=matches;session.counts=counts;session.done=true;session.cursor=rows.length;session.fuzzyUsed=matches.some(hit=>hit.fuzzy);return true;
    }finally{session.loading=false}
  }
  async function runSearch(){
    const value=query.value.trim(),needle=norm(value);searchWrap.classList.toggle('has-value',!!value);
    if(needle.length<2){resetSearchSession();resultsBox.hidden=true;resultList.replaceChildren();if(suggestions)suggestions.closest('.launcher-suggestions').hidden=false;recentBox.hidden=!readRecent().length;return}
    resetSearchSession();const token=searchToken;
    if(suggestions)suggestions.closest('.launcher-suggestions').hidden=true;recentBox.hidden=!readRecent().length;resultsBox.hidden=false;resultList.hidden=true;resultList.replaceChildren();showAll.hidden=true;resultStatus.hidden=true;resultStatus.textContent='';
    const ready=await ensureData();if(token!==searchToken||query.value.trim()!==value)return;
    if(!ready){resultStatus.hidden=false;resultStatus.textContent='Nie udało się wczytać szybkiej wyszukiwarki. Możesz użyć pełnych wyników.';showAll.hidden=false;return}
    const session={token,value,needle,terms:needle.split(/\s+/).filter(Boolean),cursor:0,shown:0,done:false,loading:false,matches:[],counts:new Map(),filter:'',filtersExpanded:false};searchSession=session;
    const collected=await collectSearchMatches(session);if(!collected||searchSession!==session)return;
    renderResultFilters();renderSearchResultPage(true);settleLoadedSearchView(session);
  }
  function scheduleSearch(){clearTimeout(searchTimer);searchTimer=setTimeout(runSearch,110)}
  function fullSearch(){
    const value=query.value.trim();if(norm(value).length<2)return;close(false);waitForApp().then(()=>{const q=document.getElementById('q');if(!q)return;q.value=value;try{q.focus({preventScroll:true})}catch(_){q.focus()}q.dispatchEvent(new Event('input',{bubbles:true}))});
  }
  function waitForApp(){
    if(document.querySelector('#actview .act-head')&&typeof globalThis.__POLICE_GOTO_ID==='function')return Promise.resolve();
    return new Promise(resolve=>{let done=false;const finish=()=>{if(done)return;done=true;window.removeEventListener('police-law-rendered',finish);resolve()};window.addEventListener('police-law-rendered',finish,{once:true});setTimeout(finish,3000)});
  }
  function clearFabLaunch(){
    clearTimeout(fabCircleFadeTimer);clearTimeout(fabIconFadeTimer);fabCircleFadeTimer=0;fabIconFadeTimer=0;
    if(!fab)return;fab.classList.remove('is-launching','is-circle-fading','is-icon-fading');
  }
  function beginFabLaunch(){
    if(!fab)return;clearFabLaunch();fab.classList.add('is-ready','is-launching');fab.tabIndex=-1;fab.setAttribute('aria-hidden','true');
    fabCircleFadeTimer=setTimeout(()=>fab?.classList.add('is-circle-fading'),300);
    fabIconFadeTimer=setTimeout(()=>fab?.classList.add('is-icon-fading'),450);
  }
  function setFabReady(ready){
    if(!fab)return;if(ready)clearFabLaunch();fab.classList.toggle('is-ready',!!ready);fab.tabIndex=ready?0:-1;fab.setAttribute('aria-hidden',String(!ready));if(ready)scheduleFabPosition();
  }
  function scheduleFabPosition(){if(!fab||isOpen())return;cancelAnimationFrame(fabFrame);fabFrame=requestAnimationFrame(syncFabPosition)}
  function syncFabPosition(){
    fabFrame=0;if(!fab||isOpen())return;
    const vv=globalThis.visualViewport,viewportBottom=(vv?.offsetTop||0)+(vv?.height||innerHeight),edge=innerWidth-104,currentLift=parseFloat(fab.style.getPropertyValue('--launcher-fab-lift'))||0,fabRect=fab.getBoundingClientRect(),baseBottom=Math.max(0,viewportBottom-fabRect.bottom-currentLift);let top=viewportBottom;
    document.querySelectorAll('.return.show,.search-return.show,.article-pager,.reader-toast').forEach(node=>{if(node===fab)return;const style=getComputedStyle(node),rect=node.getBoundingClientRect();if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0||rect.width<2||rect.height<2||rect.right<edge||rect.bottom<viewportBottom*.45)return;top=Math.min(top,rect.top)});
    const lift=top<viewportBottom?Math.max(0,viewportBottom-top+8-baseBottom):0,next=lift+'px';if(fab.style.getPropertyValue('--launcher-fab-lift')!==next)fab.style.setProperty('--launcher-fab-lift',next);
  }
  function positionSearchAtTop(force=false){
    if(!isOpen()||!force&&document.activeElement!==query)return;
    shell.classList.add('is-search-mode');
    const shellBox=shell.getBoundingClientRect(),box=searchWrap.getBoundingClientRect(),topGap=10,target=Math.max(0,shell.scrollTop+box.top-shellBox.top-topGap);
    shell.scrollTo({top:target,behavior:'auto'});
  }
  function enterSearchView({focus=false}={}){
    if(focus){try{query.focus({preventScroll:true})}catch(_){query.focus()}}
    else query.blur();
    positionSearchAtTop(true);
    requestAnimationFrame(()=>positionSearchAtTop(true));
    setTimeout(()=>positionSearchAtTop(true),focus?180:80);
    if(focus)setTimeout(()=>positionSearchAtTop(true),420);
  }
  function settleLoadedSearchView(session){
    if(!session||document.activeElement!==query)return;const token=session.token;
    const move=()=>{if(searchSession?.token===token&&document.activeElement===query)positionSearchAtTop(true)};
    requestAnimationFrame(()=>requestAnimationFrame(move));setTimeout(move,110);setTimeout(move,260);
  }
  function clickPoint(event,node){
    const rect=node?.getBoundingClientRect?.(),x=Number(event?.clientX),y=Number(event?.clientY);
    return{x:Number.isFinite(x)&&x>0?x:(rect?rect.left+rect.width/2:innerWidth/2),y:Number.isFinite(y)&&y>0?y:(rect?rect.top+rect.height/2:innerHeight/2)}
  }
  function freezeReader(on){
    globalThis.__READER_STATE?.lock?.('launcher',!!on);
    document.documentElement.classList.toggle('launcher-open-root',!!on);
  }
  function waitForTargetStable(id,timeout=760){
    return new Promise(resolve=>{
      const started=performance.now(),view=document.getElementById('actview');let stable=0,last='',frame=0,dirty=false;
      const observer=view?new MutationObserver(()=>{dirty=true;stable=0}):null;observer?.observe(view,{childList:true,subtree:true});
      const finish=()=>{cancelAnimationFrame(frame);observer?.disconnect();resolve()};
      function tick(){
        const node=document.getElementById(id),rect=node?.getBoundingClientRect?.(),state=node?[Math.round(rect.top*2)/2,Math.round(rect.height*2)/2,Math.round(scrollY*2)/2,document.documentElement.scrollHeight].join('|'):'';
        if(node&&!dirty&&state===last&&!globalThis.__READER_STATE?.busy)stable++;else stable=0;
        dirty=false;last=state;
        if(stable>=5||performance.now()-started>=timeout){finish();return}
        frame=requestAnimationFrame(tick);
      }
      frame=requestAnimationFrame(tick);
    });
  }
  function beginNavigation(){
    if(navigationBusy)return false;
    navigationBusy=true;
    shell.classList.add('is-navigation-freeze');
    shell.setAttribute('aria-busy','true');
    return true;
  }
  function waitForFreezePaint(){
    return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>{void shell.offsetWidth;resolve()})));
  }
  async function prepareReaderUnderLauncher(id){
    await waitForApp();
    // First pass may load/render a different act. Reader stays locked, so its
    // attempted jump cannot move the visible page.
    await globalThis.__POLICE_GOTO_ID?.(id,{smooth:false,alignTop:true});
    // Now the target exists. Reposition in the same task between unlock/relock,
    // while the unchanged launcher still covers the viewport.
    globalThis.__READER_STATE?.lock?.('launcher',false);
    await globalThis.__POLICE_GOTO_ID?.(id,{smooth:false,alignTop:true});
    globalThis.__READER_STATE?.lock?.('launcher',true);
    document.documentElement.classList.add('launcher-open-root');
    await waitForTargetStable(id);
  }
  function endNavigation(){
    navigationBusy=false;
    shell.classList.remove('is-navigation-freeze');
    shell.removeAttribute('aria-busy');
  }
  function ensureTransitionGlass(){
    if(transitionGlass?.isConnected)return transitionGlass;
    transitionGlass=document.createElement('div');transitionGlass.className='launcher-transition-glass';transitionGlass.setAttribute('aria-hidden','true');document.body.append(transitionGlass);return transitionGlass;
  }
  function clearExitMask(){
    cancelAnimationFrame(exitRevealFrame);exitRevealFrame=0;
    shell.style.removeProperty('-webkit-mask-image');shell.style.removeProperty('mask-image');shell.style.removeProperty('-webkit-mask-repeat');shell.style.removeProperty('mask-repeat');shell.classList.remove('is-revealing-reader');
    if(transitionGlass){transitionGlass.classList.remove('is-visible');transitionGlass.style.width='0px';transitionGlass.style.height='0px'}
  }
  function revealReader(point,surface=shell){
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return Promise.resolve();
    return new Promise(resolve=>{
      const x=Math.max(0,Math.min(innerWidth,point?.x??innerWidth/2)),y=Math.max(0,Math.min(innerHeight,point?.y??innerHeight/2)),maxX=Math.max(x,innerWidth-x),maxY=Math.max(y,innerHeight-y),radius=Math.hypot(maxX,maxY)+44,duration=760,started=performance.now(),glass=ensureTransitionGlass(),feather=22;
      surface.classList.add('is-revealing-reader');glass.style.left=x+'px';glass.style.top=y+'px';glass.classList.add('is-visible');
      function paint(r){
        const mask='radial-gradient(circle at '+x+'px '+y+'px,transparent 0 '+Math.max(0,r-feather)+'px,rgba(0,0,0,.22) '+Math.max(0,r-feather*.55)+'px,#000 '+r+'px 100%)';
        surface.style.webkitMaskImage=mask;surface.style.maskImage=mask;surface.style.webkitMaskRepeat='no-repeat';surface.style.maskRepeat='no-repeat';
        const size=Math.max(18,r*2);glass.style.width=size+'px';glass.style.height=size+'px';glass.style.opacity=String(Math.max(0,.82-r/radius*.62));
      }
      paint(0);
      function tick(now){const t=Math.min(1,(now-started)/duration),smooth=t*t*(3-2*t),ease=t*.34+smooth*.66;paint(radius*ease);if(t<1)exitRevealFrame=requestAnimationFrame(tick);else{exitRevealFrame=0;glass.classList.remove('is-visible');resolve()}}
      exitRevealFrame=requestAnimationFrame(tick);
    });
  }
  function restoreLauncherView(){
    fabRevealAnimation?.cancel?.();fabRevealAnimation=null;clearExitMask();
    shell.hidden=false;
    shell.classList.remove('is-closing','is-search-mode','is-opening-from-fab','is-revealing-reader','is-navigation-freeze');
    shell.style.clipPath='';shell.style.webkitClipPath='';shell.style.opacity='';shell.style.transform='';
    shell.scrollTop=0;
  }
  function parkLauncher(){
    clearFabLaunch();fabRevealAnimation?.cancel?.();fabRevealAnimation=null;clearExitMask();
    shell.style.clipPath='';shell.style.webkitClipPath='';shell.style.opacity='';shell.style.transform='';
    shell.classList.remove('is-closing','is-opening-from-fab','is-search-mode','is-revealing-reader','is-navigation-freeze');
    shell.classList.add('is-parked');shell.setAttribute('aria-hidden','true');document.body.classList.remove('launcher-open');document.documentElement.classList.remove('launcher-open-root');
  }
  function close(animate=true){
    if(!isOpen())return;opened=false;globalThis.__POLICE_LAUNCHER_BOOT=false;resultObserver?.disconnect?.();query.blur();shell.setAttribute('aria-hidden','true');
    const finish=()=>{parkLauncher();freezeReader(false);setTimeout(()=>setFabReady(true),35)};if(animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches){shell.classList.add('is-closing');setTimeout(finish,190)}else finish();
  }
  function open({focus=false,fromFab=false}={}){
    if(isOpen())return;
    const fabRect=fromFab&&fab?fab.getBoundingClientRect():null;
    opened=true;delete document.documentElement.dataset.launcherSkip;shell.classList.add('is-runtime-open');globalThis.__POLICE_LAUNCHER_BOOT=true;
    freezeReader(true);restoreLauncherView();renderRecent();renderQuickSections();
    const animateFromFab=!!fabRect&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(animateFromFab)beginFabLaunch();else setFabReady(false);
    if(animateFromFab){
      const x=fabRect.left+fabRect.width/2,y=fabRect.top+fabRect.height/2,start='circle(32px at '+x+'px '+y+'px)',mid='circle(18vmax at '+x+'px '+y+'px)',end='circle(160vmax at '+x+'px '+y+'px)',duration=1600;
      shell.style.setProperty('--launcher-origin-x',x+'px');shell.style.setProperty('--launcher-origin-y',y+'px');shell.style.clipPath=start;shell.style.webkitClipPath=start;shell.classList.add('is-opening-from-fab');
      shell.classList.remove('is-parked');shell.setAttribute('aria-hidden','false');document.body.classList.add('launcher-open');
      requestAnimationFrame(()=>{
        if(!isOpen())return;
        const radial=shell.animate([{clipPath:start,offset:0},{clipPath:start,offset:.085},{clipPath:mid,offset:.48},{clipPath:end,offset:1}],{duration,easing:'cubic-bezier(.36,.02,.2,1)',fill:'forwards'});fabRevealAnimation=radial;
        radial.onfinish=()=>{shell.style.clipPath='none';shell.style.webkitClipPath='none';shell.classList.remove('is-opening-from-fab');clearFabLaunch();setFabReady(false);radial.cancel();if(fabRevealAnimation===radial)fabRevealAnimation=null};
        radial.oncancel=()=>{if(fabRevealAnimation===radial)fabRevealAnimation=null};
      });
    }else{
      shell.classList.remove('is-parked');shell.setAttribute('aria-hidden','false');document.body.classList.add('launcher-open');
    }
    history.replaceState(null,'','#start');if(focus)setTimeout(()=>query.focus(),80);
  }
  async function openTarget(id,actHint='',rememberLabel='',origin=null,fallbackQuery=''){
    let prepared=false,act='',label='',sub='';
    try{
      await waitForFreezePaint();
      await ensureRouter();
      const meta=resultMeta(id),route=idById.get(id);act=meta?.act||route?.[1]||actHint;
      if(!act){
        endNavigation();query.value=fallbackQuery||rememberLabel||id;searchWrap.classList.add('has-value');runSearch();query.focus();return
      }
      const cfg=globalThis.__LAW_CONFIG?.acts?.[act]||{};label=rememberLabel||meta?.heading||id;sub=meta?.actName||cfg.name||act;
      globalThis.__POLICE_LAUNCHER_RETURN?.clear?.();resultObserver?.disconnect?.();globalThis.__POLICE_LAUNCHER_BOOT=false;
      await prepareReaderUnderLauncher(id);
      prepared=true;
      await new Promise(resolve=>setTimeout(resolve,15));
      await revealReader(origin,shell);
      opened=false;
      parkLauncher();
      freezeReader(false);
      query.blur();
      if(act)remember(id,act,label,sub);
      setTimeout(()=>setFabReady(true),35);
    }finally{
      if(!prepared&&navigationBusy){clearExitMask();document.body.classList.add('launcher-open');freezeReader(true)}
      endNavigation();
    }
  }
  function openQuickItem(sectionId,index,origin=null){
    const section=QUICK_SECTIONS.find(item=>item.id===sectionId),items=[...(section?.items||[]),...(section?.moreItems||[])],item=items[Number(index)];if(!item){endNavigation();return}
    openTarget(item.target,'',item.label||quickItemLabel(item),origin,item.fallback);
  }
  renderQuickSections();renderSuggestions();renderRecent();
  query.addEventListener('input',scheduleSearch);query.addEventListener('focus',()=>enterSearchView({focus:true}));
  clear.addEventListener('click',()=>{query.value='';runSearch();enterSearchView({focus:true})});
  suggestions?.addEventListener('click',event=>{const button=event.target.closest('[data-suggestion]');if(!button)return;query.value=button.dataset.suggestion;searchWrap.classList.add('has-value');enterSearchView({focus:false});runSearch().then(()=>positionSearchAtTop(true))});
  quickSections.addEventListener('click',event=>{
    const toggle=event.target.closest('.launcher-quick-toggle');if(toggle){
      const section=toggle.closest('[data-quick-section]'),id=section?.dataset.quickSection||'',opening=!section?.classList.contains('is-open');
      if(!section)return;
      if(opening){const previous=quickSections.querySelector('.launcher-quick-section.is-open');openSectionId=id;if(previous&&previous!==section)animateQuickSection(previous,false);animateQuickSection(section,true)}
      else{openSectionId='';animateQuickSection(section,false)}
      return
    }
    const more=event.target.closest('[data-quick-more]');if(more){animateQuickMore(more.dataset.quickMore);return}
    const item=event.target.closest('[data-quick-item]');if(item&&beginNavigation())openQuickItem(item.dataset.quickItem,item.dataset.quickIndex,clickPoint(event,item));
  });
  resultFilters?.addEventListener('click',event=>{
    const session=searchSession;if(!session)return;
    const more=event.target.closest('[data-result-filter-more]');if(more){session.filtersExpanded=!session.filtersExpanded;renderResultFilters();return}
    const button=event.target.closest('[data-result-filter]');if(!button)return;query.blur();const code=button.dataset.resultFilter||'';session.filter=session.filter===code&&code?'':code;renderResultFilters();renderSearchResultPage(true);
  });
  resultList.addEventListener('click',event=>{const button=event.target.closest('[data-result]');if(button&&beginNavigation())openTarget(button.dataset.result,button.dataset.act,'',clickPoint(event,button))});loadMore?.addEventListener('click',scanNextResultPage);
  recentList.addEventListener('click',event=>{const button=event.target.closest('[data-recent]');if(!button)return;const item=readRecent().find(x=>x.id===button.dataset.recent);if(item&&beginNavigation())openTarget(item.id,item.act,item.label,clickPoint(event,button))});
  showAll.addEventListener('click',fullSearch);readerButton.addEventListener('click',()=>close());fab?.addEventListener('click',()=>open({fromFab:true}));
  shell.addEventListener('keydown',event=>{if(event.key==='Escape')close()});
  document.getElementById('home')?.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();globalThis.__POLICE_SEARCH_CLEAR?.();open()},{capture:true});
  window.addEventListener('police-law-rendered',event=>{if(isOpen())return;setTimeout(()=>{const act=event.detail?.act||'',hash=decodeURIComponent(location.hash.slice(1));if(!act||!hash||hash==='start')return;const meta=resultMeta(hash);if(meta)remember(hash,act,meta.heading+(meta.title?' · '+meta.title:''),meta.actName)},0)});
  globalThis.__POLICE_LAUNCHER_OPEN=options=>open(options||{});
  globalThis.__POLICE_LAUNCHER_CLOSE=()=>close();
  const standalone=document.documentElement.dataset.pwaStandalone==='1'||window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true;
  const initial=standalone||(document.documentElement.dataset.launcherSkip!=='1'&&!isDeepLink());
  shell.hidden=false;shell.classList.add('is-runtime-open');
  if(initial){delete document.documentElement.dataset.launcherSkip;opened=true;freezeReader(true);restoreLauncherView();shell.classList.remove('is-parked');globalThis.__POLICE_LAUNCHER_BOOT=true;shell.setAttribute('aria-hidden','false');document.body.classList.add('launcher-open');setFabReady(false);history.replaceState(null,'','#start')}else{opened=false;parkLauncher();freezeReader(false);requestAnimationFrame(()=>setFabReady(true))}
  let chipLayoutFrame=0;function scheduleChipLayout(){cancelAnimationFrame(chipLayoutFrame);chipLayoutFrame=requestAnimationFrame(()=>{chipLayoutFrame=0;if(isOpen())optimizeAllLauncherChips()})}
  const fabObserver=new MutationObserver(scheduleFabPosition);fabObserver.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','hidden','style']});window.addEventListener('resize',()=>{scheduleFabPosition();scheduleChipLayout()},{passive:true});globalThis.visualViewport?.addEventListener?.('resize',()=>{scheduleFabPosition();scheduleChipLayout();if(document.activeElement===query)setTimeout(positionSearchAtTop,40)},{passive:true});
  const warm=()=>ensureRouter();if('requestIdleCallback'in window)requestIdleCallback(warm,{timeout:1600});else setTimeout(warm,500);
})();