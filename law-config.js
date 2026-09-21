(function(root){
  const config={
    version:1,
    acts:{
      uop:{short:"UoP",name:"Ustawa o Policji",citation:"Dz.U. 2025 poz. 636",pack:"core",defaultEnabled:true,uiSubgroup:"core",uiSubgroupName:"Policja i kodeksy"},
      kw:{short:"KW",name:"Kodeks wykroczeń",citation:"Dz.U. 2025 poz. 734",pack:"core",defaultEnabled:true,uiSubgroup:"core",uiSubgroupName:"Policja i kodeksy"},
      kk:{short:"KK",name:"Kodeks karny",citation:"Dz.U. 2025 poz. 383",pack:"core",defaultEnabled:true,uiSubgroup:"core",uiSubgroupName:"Policja i kodeksy"},
      kpk:{short:"KPK",name:"Kodeks postępowania karnego",citation:"Dz.U. 2026 poz. 490",pack:"core",defaultEnabled:true,uiSubgroup:"core",uiSubgroupName:"Policja i kodeksy"},
      kpow:{short:"KPoW",name:"Kodeks postępowania w sprawach o wykroczenia",citation:"Dz.U. 2025 poz. 860",pack:"core",defaultEnabled:true,uiSubgroup:"core",uiSubgroupName:"Policja i kodeksy"},
      spb:{short:"ŚPB i BP",name:"Ustawa o środkach przymusu bezpośredniego i broni palnej",citation:"Dz.U. 2026 poz. 244",pack:"core",defaultEnabled:true,uiSubgroup:"core",uiSubgroupName:"Policja i kodeksy"},
      kier:{short:"Kierujący",name:"Ustawa o kierujących pojazdami",citation:"Dz.U. 2025 poz. 1226",pack:"traffic",defaultEnabled:false,uiSubgroup:"traffic",uiSubgroupName:"Ruch drogowy"},
      krd:{short:"Kontrola RD",name:"Rozporządzenie MSWiA w sprawie kontroli ruchu drogowego",citation:"Dz.U. 2019 poz. 2141; zm. Dz.U. 2026 poz. 247",pack:"traffic",defaultEnabled:false,topLevel:"par",uiSubgroup:"traffic",uiSubgroupName:"Ruch drogowy"},
      punkty:{short:"Punkty",name:"Rozporządzenie MSWiA w sprawie ewidencji kierujących naruszających przepisy ruchu drogowego",citation:"Dz.U. 2026 poz. 724",pack:"traffic",defaultEnabled:false,topLevel:"par",uiSubgroup:"traffic",uiSubgroupName:"Ruch drogowy"},
      prd:{short:"PRD",name:"Prawo o ruchu drogowym",citation:"Dz.U. 2024 poz. 1251 · snapshot",pack:"traffic",defaultEnabled:true,uiSubgroup:"traffic",uiSubgroupName:"Ruch drogowy"},
      upraw:{short:"Uprawnienia",name:"Rozporządzenie RM w sprawie postępowania przy wykonywaniu niektórych uprawnień policjantów",citation:"Dz.U. 2023 poz. 2535",pack:"interventions",defaultEnabled:false,topLevel:"par",uiSubgroup:"powers",uiSubgroupName:"Uprawnienia i czynności"},
      cudz:{short:"Cudzoziem",name:"Ustawa o cudzoziemcach",citation:"Dz.U. 2025 poz. 1079",pack:"interventions",defaultEnabled:true,uiSubgroup:"people",uiSubgroupName:"Osoby i sytuacje szczególne"},
      nieletni:{short:"Nieletni",name:"Ustawa o wspieraniu i resocjalizacji nieletnich",citation:"Dz.U. 2026 poz. 163",pack:"interventions",defaultEnabled:true,uiSubgroup:"people",uiSubgroupName:"Osoby i sytuacje szczególne"},
      alk:{short:"Alkohol",name:"Ustawa o wychowaniu w trzeźwości i przeciwdziałaniu alkoholizmowi",citation:"Dz.U. 2023 poz. 2151",pack:"interventions",defaultEnabled:false,uiSubgroup:"substances",uiSubgroupName:"Substancje"},
      nark:{short:"Narkotyki",name:"Ustawa o przeciwdziałaniu narkomanii",citation:"Dz.U. 2023 poz. 1939; zm. Dz.U. 2026 poz. 1004",pack:"interventions",defaultEnabled:false,uiSubgroup:"substances",uiSubgroupName:"Substancje"},
      przemoc:{short:"Przemoc",name:"Ustawa o przeciwdziałaniu przemocy domowej",citation:"Dz.U. 2024 poz. 1673; zm. Dz.U. 2026 poz. 160",pack:"interventions",defaultEnabled:false,uiSubgroup:"violence",uiSubgroupName:"Przemoc domowa"},
      psych:{short:"Zdrowie psych.",name:"Ustawa o ochronie zdrowia psychicznego",citation:"Dz.U. 2024 poz. 917",pack:"interventions",defaultEnabled:false,uiSubgroup:"people",uiSubgroupName:"Osoby i sytuacje szczególne"},
      tyton:{short:"Tytoń",name:"Ustawa o ochronie zdrowia przed następstwami używania tytoniu i wyrobów tytoniowych",citation:"Dz.U. 2026 poz. 1214",pack:"interventions",defaultEnabled:false,uiSubgroup:"substances",uiSubgroupName:"Substancje"},
      nk:{short:"Niebieskie Karty",name:"Rozporządzenie RM – procedura „Niebieskie Karty”",citation:"Dz.U. 2023 poz. 1870",pack:"interventions",defaultEnabled:false,topLevel:"par",uiSubgroup:"violence",uiSubgroupName:"Przemoc domowa"},
      nakazy:{short:"Nakazy / zakazy",name:"Rozporządzenie MSWiA – nakazy i zakazy wobec osoby stosującej przemoc domową",citation:"Dz.U. 2023 poz. 1613",pack:"interventions",defaultEnabled:false,topLevel:"par",uiSubgroup:"violence",uiSubgroupName:"Przemoc domowa"},
      protop:{short:"Protokół opuszczenia",name:"Rozporządzenie MSWiA – protokół czynności opuszczenia mieszkania",citation:"Dz.U. 2023 poz. 1612",pack:"interventions",defaultEnabled:false,topLevel:"par",kind:"document",searchable:true},
      zawdrzwi:{short:"Zawiad. drzwi",name:"Rozporządzenie MSWiA – zawiadomienie umieszczane na drzwiach",citation:"Dz.U. 2023 poz. 1607",pack:"interventions",defaultEnabled:false,topLevel:"par",kind:"document",searchable:true},
      zawkoresp:{short:"Zawiad. koresp.",name:"Rozporządzenie MSWiA – zawiadomienie przy niemożności doręczenia korespondencji",citation:"Dz.U. 2023 poz. 1614",pack:"interventions",defaultEnabled:false,topLevel:"par",kind:"document",searchable:true},
      bron:{short:"Broń",name:"Ustawa o broni i amunicji",citation:"Dz.U. 2024 poz. 485",pack:"public-order",defaultEnabled:false,uiSubgroup:"security",uiSubgroupName:"Broń i ochrona"},
      ochrona:{short:"Ochrona",name:"Ustawa o ochronie osób i mienia",citation:"Dz.U. 2025 poz. 532",pack:"public-order",defaultEnabled:false,uiSubgroup:"security",uiSubgroupName:"Broń i ochrona"},
      bim:{short:"Imprezy",name:"Ustawa o bezpieczeństwie imprez masowych",citation:"Dz.U. 2023 poz. 616",pack:"public-order",defaultEnabled:false,uiSubgroup:"order",uiSubgroupName:"Porządek publiczny"},
      zgrom:{short:"Zgromadzenia",name:"Prawo o zgromadzeniach",citation:"Dz.U. 2022 poz. 1389",pack:"public-order",defaultEnabled:false,topLevel:"art",uiSubgroup:"order",uiSubgroupName:"Porządek publiczny"},
      z768:{short:"Z. 768",name:"Zarządzenie KGP nr 768 — służba patrolowa",citation:"Dz. Urz. KGP Nr 15 poz. 119 · tekst ujedn. 12.06.2026",pack:"kgp",defaultEnabled:true,topLevel:"par",uiSubgroup:"kgp",uiSubgroupName:"Służbowe / KGP"},
      z360:{short:"Z. 360",name:"Zarządzenie KGP nr 360 — konwoje i doprowadzenia",citation:"tekst ujednolicony Policji · zmiany do 2020",pack:"kgp",defaultEnabled:true,uiSubgroup:"kgp",uiSubgroupName:"Służbowe / KGP"},
      z805:{short:"Z. 805",name:"Zarządzenie KGP nr 805 — zasady etyki zawodowej",citation:"Dz. Urz. KGP 2004 Nr 1 poz. 3",pack:"kgp",defaultEnabled:true,uiSubgroup:"kgp",uiSubgroupName:"Służbowe / KGP"},
      wroalk:{short:"Nocna sprzedaż",name:"Wrocław – ograniczenie nocnej sprzedaży alkoholu",citation:"Uchwała XXIII/435/25; zm. XXV/512/25",pack:"wroclaw",defaultEnabled:false,topLevel:"par",uiSubgroup:"wro-alcohol",uiSubgroupName:"Alkohol i porządek lokalny"}
    },
    packs:{
      core:{name:"Podstawowe",mandatory:true,order:10,subgroups:[
        {id:"core",name:"Policja i kodeksy",codes:["uop","kw","kpow","kk","kpk","spb"]}
      ]},
      interventions:{name:"Interwencje i prewencja",mandatory:false,order:20,subgroups:[
        {id:"people",name:"Osoby i sytuacje szczególne",codes:["cudz","nieletni","psych"]},
        {id:"substances",name:"Substancje",codes:["alk","nark","tyton"]},
        {id:"violence",name:"Przemoc domowa",codes:["przemoc","nk","nakazy"]},
        {id:"powers",name:"Uprawnienia i czynności",codes:["upraw"]}
      ]},
      traffic:{name:"Ruch drogowy",mandatory:false,order:30,subgroups:[
        {id:"traffic",name:"Ruch drogowy",codes:["prd","kier","krd","punkty"]}
      ]},
      "public-order":{name:"Porządek publiczny",mandatory:false,order:40,subgroups:[
        {id:"order",name:"Zgromadzenia i imprezy",codes:["bim","zgrom"]},
        {id:"security",name:"Broń i ochrona",codes:["bron","ochrona"]}
      ]},
      kgp:{name:"Służbowe / KGP",mandatory:false,order:50,subgroups:[
        {id:"kgp",name:"Służba i procedury KGP",codes:["z768","z360","z805"]}
      ]},
      wroclaw:{name:"Wrocław",mandatory:false,order:60,subgroups:[{id:"wro-alcohol",name:"Alkohol i porządek lokalny",codes:["wroalk"]}]}
    },
    documents:{
      name:"Dokumenty i wzory",
      order:70,
      groups:[
        {id:"violence-docs",name:"Przemoc domowa",codes:["protop","zawdrzwi","zawkoresp"]}
      ]
    }
  };
  root.__LAW_CONFIG=config;
})(typeof window!=="undefined"?window:globalThis);
