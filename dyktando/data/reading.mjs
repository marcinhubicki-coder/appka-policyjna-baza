const words = [
 ['rakieta','rakieta','rakietka','roleta','makieta'],
 ['kot','kot','koc','kos','sok'], ['las','las','lis','los','pas'],
 ['motyl','motyl','motor','motel','metal'], ['balon','balon','baton','balkon','salon'],
 ['zebra','zebra','zegar','żebra','brama'], ['paczka','paczka','kaczka','taczka','poczta'],
 ['kredka','kredka','kratka','klatka','kropka']
];
const phrases = [
 ['zielony plecak','zielony plecak','czerwony plecak','zielony parasol','żółty plecak'],
 ['mały biały kot','mały biały kot','duży biały kot','mały szary kot','mały biały pies'],
 ['rower pod drzewem','rower pod drzewem','rower za domem','piłka pod drzewem','rower obok drzewa'],
 ['trzy żółte kwiaty','trzy żółte kwiaty','dwa żółte kwiaty','trzy białe kwiaty','cztery żółte kwiaty'],
 ['ciepła herbata','ciepła herbata','zimna herbata','ciepła zupa','słodka kawa'],
 ['książka na stole','książka na stole','książka pod stołem','zeszyt na stole','książka na półce'],
 ['pies za płotem','pies za płotem','pies przed płotem','kot za płotem','pies za domem'],
 ['duży niebieski balon','duży niebieski balon','mały niebieski balon','duży zielony balon','duży niebieski plecak']
];
const sentences = [
 ['Ola schowała klucze do kieszeni kurtki.','Gdzie Ola schowała klucze?','Do kieszeni kurtki','Do plecaka','Pod poduszkę','Do szuflady'],
 ['Po obiedzie Tomek poszedł z psem do parku.','Kiedy Tomek poszedł do parku?','Po obiedzie','Przed obiadem','Przed śniadaniem','Po kolacji'],
 ['Zosia wzięła parasol, bo za oknem padał deszcz.','Dlaczego Zosia wzięła parasol?','Padał deszcz','Świeciło słońce','Padał śnieg','Było gorąco'],
 ['Na stole były trzy jabłka. Adam zjadł jedno.','Ile jabłek zostało?','Dwa','Jedno','Trzy','Cztery'],
 ['Kasia oddała książkę do biblioteki i wypożyczyła komiks.','Co Kasia zabrała z biblioteki?','Komiks','Atlas','Słownik','Zeszyt'],
 ['Maja nakarmiła kota, a potem podlała kwiaty.','Co Maja zrobiła najpierw?','Nakarmiła kota','Podlała kwiaty','Umyła okno','Nakarmiła psa'],
 ['Piłka wpadła pod ławkę. Kuba wyciągnął ją patykiem.','Czym Kuba wyciągnął piłkę?','Patykiem','Stopą','Łopatką','Ręką'],
 ['Ania jedzie do babci pociągiem, a wraca autobusem.','Czym Ania wraca od babci?','Autobusem','Pociągiem','Samochodem','Rowerem']
];
export const READING = [
 ...words.map(([text,answer,...other])=>({level:1,text,answer,options:[answer,...other],prompt:'Które słowo było pokazane?',exposureMs:2600})),
 ...phrases.map(([text,answer,...other])=>({level:2,text,answer,options:[answer,...other],prompt:'Która fraza była pokazana?',exposureMs:3500})),
 ...sentences.map(([text,prompt,answer,...other])=>({level:3,text,prompt,answer,options:[answer,...other],exposureMs:5500}))
];
