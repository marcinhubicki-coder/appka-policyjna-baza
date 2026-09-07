import fs from 'node:fs';
import assert from 'node:assert/strict';
import {loadLegalData,saveLegalData} from './legal-content.mjs';

const directory=process.argv[2];
assert.ok(directory,'Podaj katalog zweryfikowanych źródeł');
const imported=JSON.parse(fs.readFileSync(`${directory}/imported.json`));
const old=JSON.parse(fs.readFileSync(`${directory}/old-data.json`));
const names={bim:'Ustawa o bezpieczeństwie imprez masowych',alk:'Ustawa o wychowaniu w trzeźwości i przeciwdziałaniu alkoholizmowi'};
const result=structuredClone(old),normalize=text=>text.normalize('NFC').replace(/\s+/g,' ').trim();
for(const [code,bundle] of Object.entries(imported)){
  const original=old.find(act=>act[0]===code),rows=structuredClone(bundle.rows),future=structuredClone(bundle.futureRows);
  // Dates checked against the official consolidated PDF, not inferred from absence.
  if(code==='kpk')for(const [id,date] of [['kpk-art-100b','2028-10-01'],['kpk-art-131a','2029-10-01']]){
    const row=structuredClone(original[3].find(row=>row[0]===id));assert.ok(row,id);row[5]='1';row[6]=date;row[7]=[];
    if(id==='kpk-art-131a')row[4]=[['','l','','Jeżeli doręczenie jest dokonywane w sposób wskazany w art. 131 § 1 pkt 1, w wypadku braku dowodu otrzymania, w rozumieniu ustawy z dnia 18 listopada 2020 r. o doręczeniach elektronicznych, pismo uznaje się za doręczone po upływie 14 dni od dnia wystawienia dowodu wysłania w rozumieniu tej ustawy.']];
    future.push(row);
  }
  // Future-only rows remain addressable, but are visibly marked and separated.
  for(const row of future){if(!row[4].length)row[4]=[['','l','','Przepis przyszły. Pełne brzmienie i termin wejścia w życie sprawdź w oficjalnym PDF.']];row[8]='e';row[9]=[{prefix:'Przepisy przyszłe',title:'Jeszcze nie obowiązują',level:0}];row[10]='own'}
  const byNumber=new Map(rows.concat(future).map(row=>[row[2],row]));
  const idAliases={},partAliases={};
  for(const previous of original?.[3]||[]){
    const current=byNumber.get(previous[2]);assert.ok(current,`${code}: utracony artykuł ${previous[0]}`);
    if(previous[0]!==current[0])idAliases[previous[0]]=current[0];
    const units=new Map(current[4].filter(unit=>unit[0]).map(unit=>[unit[0],unit]));
    previous[4].forEach((unit,index)=>{
      const oldKey=unit[0]||`${previous[0]}@@${index}`;
      const renamed=unit[0]?.replace(previous[0],current[0]);
      if(renamed&&units.has(renamed)){if(renamed!==oldKey)partAliases[oldKey]=renamed;return}
      const matches=current[4].map((next,i)=>({next,i})).filter(({next})=>normalize(next[3])===normalize(unit[3]));
      const target=matches.length===1?(matches[0].next[0]||`${current[0]}@@${matches[0].i}`):null;
      // Explicit null means that a saved positional fragment cannot safely be reused.
      if(target!==oldKey)partAliases[oldKey]=target;
    });
  }
  const official=JSON.parse(fs.readFileSync(`${directory}/${code}-official.json`));
  const metadata={...bundle.source,officialPdf:official.pdf,officialSha256:official.sha256,revision:'2026-09-07',idAliases,partAliases,futureArticles:future.length};
  const act=[code,original?.[1]||names[code],official.pdf,rows.concat(future),metadata];
  const at=result.findIndex(item=>item[0]===code);if(at<0)result.push(act);else result[at]=act;
}
const ids=new Set();for(const act of result)for(const row of act[3])for(const id of [row[0],...row[4].map(unit=>unit[0]).filter(Boolean)]){assert.ok(!ids.has(id),`Powtórzony identyfikator ${id}`);ids.add(id)}
result.find(act=>act[0]==='z360')[2]='https://www.policja.pl/download/1/363141/ZarzadzenieNr360KomendantaGlownegoPolicjizdnia26marca2009rwsprawiemetodiformwyko.pdf';
result.find(act=>act[0]==='z768')[2]='https://policja.pl/download/1/480206/Zarzadzenienr768tekstujednolicony.docx';
assert.equal(result.find(act=>act[0]==='uop')[4].last,'Art. 158');
assert.equal(result.find(act=>act[0]==='kw')[4].last,'Art. 166');
const kk=result.find(act=>act[0]==='kk')[3];
assert.match(kk.find(row=>row[0]==='kk-art-157')[4][0][3],/od 3 miesięcy do lat 5/);
assert.match(kk.find(row=>row[0]==='kk-art-50')[4][0][3],/uchylony/);
saveLegalData(result);
assert.equal(loadLegalData().length,14);
console.log(JSON.stringify(result.map(act=>({act:act[0],articles:act[3].length,current:act[4]?.articles,aliases:Object.keys(act[4]?.partAliases||{}).length})),null,2));
