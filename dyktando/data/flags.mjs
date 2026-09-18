export const FLAGS = [
 ['pl','Polska','europe',1],['de','Niemcy','europe',1],['fr','Francja','europe',1],['it','Włochy','europe',1],
 ['ua','Ukraina','europe',1],['se','Szwecja','europe',1],['ch','Szwajcaria','europe',1],['jp','Japonia','world',1],
 ['nl','Holandia','europe',2],['be','Belgia','europe',2],['ie','Irlandia','europe',2],['at','Austria','europe',2],
 ['no','Norwegia','europe',2],['dk','Dania','europe',2],['fi','Finlandia','europe',2],['cz','Czechy','europe',2],
 ['ee','Estonia','europe',3],['bd','Bangladesz','world',3],['id','Indonezja','world',3],['ng','Nigeria','world',3]
].map(([code,name,region,difficulty])=>({code,name,region,difficulty}));
