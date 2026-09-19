(function(root){
  const config={
    version:1,
    acts:{
      uop:{short:"UoP",name:"Ustawa o Policji",citation:"Dz.U. 2025 poz. 636",pack:"core",defaultEnabled:true},
      kw:{short:"KW",name:"Kodeks wykroczeń",citation:"Dz.U. 2025 poz. 734",pack:"core",defaultEnabled:true},
      kk:{short:"KK",name:"Kodeks karny",citation:"Dz.U. 2025 poz. 383",pack:"core",defaultEnabled:true},
      kpk:{short:"KPK",name:"Kodeks postępowania karnego",citation:"Dz.U. 2026 poz. 490",pack:"core",defaultEnabled:true},
      kpow:{short:"KPoW",name:"Kodeks postępowania w sprawach o wykroczenia",citation:"Dz.U. 2025 poz. 860",pack:"core",defaultEnabled:true},
      spb:{short:"ŚPB i BP",name:"Ustawa o środkach przymusu bezpośredniego i broni palnej",citation:"Dz.U. 2026 poz. 244",pack:"core",defaultEnabled:true},
      prd:{short:"PRD",name:"Prawo o ruchu drogowym",citation:"Dz.U. 2024 poz. 1251 · snapshot",pack:"traffic",defaultEnabled:true},
      cudz:{short:"Cudzoziem",name:"Ustawa o cudzoziemcach",citation:"Dz.U. 2025 poz. 1079",pack:"interventions",defaultEnabled:true},
      nieletni:{short:"Nieletni",name:"Ustawa o wspieraniu i resocjalizacji nieletnich",citation:"Dz.U. 2026 poz. 163",pack:"interventions",defaultEnabled:true},
      alk:{short:"Alkohol",name:"Ustawa o wychowaniu w trzeźwości i przeciwdziałaniu alkoholizmowi",citation:"Dz.U. 2023 poz. 2151",pack:"interventions",defaultEnabled:false},
      nark:{short:"Narkotyki",name:"Ustawa o przeciwdziałaniu narkomanii",citation:"Dz.U. 2023 poz. 1939; zm. Dz.U. 2026 poz. 1004",pack:"interventions",defaultEnabled:false},
      przemoc:{short:"Przemoc",name:"Ustawa o przeciwdziałaniu przemocy domowej",citation:"Dz.U. 2024 poz. 1673; zm. Dz.U. 2026 poz. 160",pack:"interventions",defaultEnabled:false},
      psych:{short:"Zdrowie psych.",name:"Ustawa o ochronie zdrowia psychicznego",citation:"Dz.U. 2024 poz. 917",pack:"interventions",defaultEnabled:false},
      tyton:{short:"Tytoń",name:"Ustawa o ochronie zdrowia przed następstwami używania tytoniu i wyrobów tytoniowych",citation:"Dz.U. 2026 poz. 1214",pack:"interventions",defaultEnabled:false},
      nk:{short:"Niebieskie Karty",name:"Rozporządzenie RM – procedura „Niebieskie Karty”",citation:"Dz.U. 2023 poz. 1870",pack:"interventions",defaultEnabled:false,topLevel:"par"},
      nakazy:{short:"Nakazy / zakazy",name:"Rozporządzenie MSWiA – nakazy i zakazy wobec osoby stosującej przemoc domową",citation:"Dz.U. 2023 poz. 1613",pack:"interventions",defaultEnabled:false,topLevel:"par"},
      protop:{short:"Protokół opuszczenia",name:"Rozporządzenie MSWiA – protokół czynności opuszczenia mieszkania",citation:"Dz.U. 2023 poz. 1612",pack:"interventions",defaultEnabled:false,topLevel:"par"},
      zawdrzwi:{short:"Zawiad. drzwi",name:"Rozporządzenie MSWiA – zawiadomienie umieszczane na drzwiach",citation:"Dz.U. 2023 poz. 1607",pack:"interventions",defaultEnabled:false,topLevel:"par"},
      zawkoresp:{short:"Zawiad. koresp.",name:"Rozporządzenie MSWiA – zawiadomienie przy niemożności doręczenia korespondencji",citation:"Dz.U. 2023 poz. 1614",pack:"interventions",defaultEnabled:false,topLevel:"par"},
      bim:{short:"Imprezy",name:"Ustawa o bezpieczeństwie imprez masowych",citation:"Dz.U. 2023 poz. 616",pack:"public-order",defaultEnabled:false},
      zgrom:{short:"Zgromadzenia",name:"Prawo o zgromadzeniach",citation:"Dz.U. 2022 poz. 1389",pack:"public-order",defaultEnabled:false,topLevel:"art"},
      z768:{short:"Z. 768",name:"Zarządzenie KGP nr 768 — służba patrolowa",citation:"tekst bazowy MVP",pack:"kgp",defaultEnabled:true},
      z360:{short:"Z. 360",name:"Zarządzenie KGP nr 360 — konwoje i doprowadzenia",citation:"publikacja Policji",pack:"kgp",defaultEnabled:true},
      z805:{short:"Z. 805",name:"Zarządzenie KGP nr 805 — zasady etyki zawodowej",citation:"publikacja Policji",pack:"kgp",defaultEnabled:true}
    },
    packs:{
      core:{name:"Podstawowe",mandatory:true,order:10},
      interventions:{name:"Interwencje i prewencja",mandatory:false,order:20},
      traffic:{name:"Ruch drogowy",mandatory:false,order:30},
      "public-order":{name:"Porządek publiczny",mandatory:false,order:40},
      kgp:{name:"Służbowe / KGP",mandatory:false,order:50},
      wroclaw:{name:"Wrocław",mandatory:false,order:60,future:true}
    }
  };
  root.__LAW_CONFIG=config;
})(typeof window!=="undefined"?window:globalThis);
