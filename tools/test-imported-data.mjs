import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {loadLegalData} from './legal-content.mjs';

const data=loadLegalData(),act=code=>data.find(a=>a[0]===code),row=id=>data.flatMap(a=>a[3]).find(r=>r[0]===id);
const expected={uop:[389,'158'],kw:[208,'166'],kk:[461,'363'],kpk:[1013,'682'],kpow:[133,'121'],spb:[89,'85'],prd:[441,'152'],cudz:[737,'522'],nieletni:[417,'417'],alk:[95,'51'],bim:[103,'80']};
const ids=new Set();
for(const a of data){
  if(expected[a[0]]){
    const [count,last]=expected[a[0]],meta=a[4];assert.equal(meta.articles,count);assert.equal(meta.last,'Art. '+last);
    assert.match(a[2],/^https:\/\/eli.gov.pl\/eli\/DU\/\d+\/\d+\/uj\/pol\/pdf$/);
    assert.match(meta.sha256,/^[a-f0-9]{64}$/);assert.match(meta.officialSha256,/^[a-f0-9]{64}$/);
    assert.ok(meta.versionFrom<=meta.retrieved);assert.ok(!meta.versionTo||meta.versionTo>=meta.retrieved);
    assert.equal(a[3].filter(r=>r[5]!=='1').length,count);
  }
  for(const r of a[3]){
    assert.ok(r[3].trim());assert.ok(r[4].length);
    if(a[4]){assert.equal(r[8],'e');assert.ok(r[9].length,'Brak hierarchii '+r[0]);for(let i=1;i<r[9].length;i++)assert.ok(r[9][i].level>r[9][i-1].level)}
    for(const id of [r[0],...r[4].map(u=>u[0]).filter(Boolean)]){assert.ok(!ids.has(id),'Powtórzony '+id);ids.add(id)}
    for(const u of r[4])assert.doesNotMatch(u[3],/^(?:ROZDZIAŁ|DZIAŁ)\s+[IVX\d]+(?:\s|$)/,'Nagłówek przecieka do treści '+r[0]);
  }
}
assert.equal(row('kk-art-50')[3],'Przepis uchylony');
assert.match(row('kk-art-157')[4].find(u=>u[0]==='kk-art-157-par-1')[3],/od 3 miesięcy do lat 5/);
assert.match(row('kk-art-157')[4].find(u=>u[0]==='kk-art-157-par-2')[3],/do lat 2/);
assert.equal(row('kpk-art-100b')[6],'2028-10-01');assert.equal(row('kpk-art-131a')[6],'2029-10-01');
assert.equal(act('kw')[4].idAliases['kw-art-601'],'kw-art-60s1');
assert.equal(act('prd')[4].annexesIncluded,false);assert.equal(act('prd')[4].annexesAvailable,3);

const key='police-law-bookmarks-v1',raw=JSON.stringify([
  {id:'kw-art-601',act:'kw',num:'Art. 60¹',parts:['kw-art-601-par-1']},
  {id:'uop-art-1',act:'uop',parts:['uop-art-1@@999']},
  {id:'kk-art-157',act:'kk',parts:['kk-art-157-par-1']}
]);
function storage(initial=raw){const map=new Map([[key,initial]]);return{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),map}}
const store=storage(),context=vm.createContext({localStorage:store});vm.runInContext(fs.readFileSync('reader-core.js','utf8'),context);
context.__READER_CORE.migrateFavorites(data);
let migrated=JSON.parse(store.getItem(key));
assert.equal(store.getItem(key+'-before-2026-09-07'),raw);
assert.equal(migrated[0].id,'kw-art-60s1');assert.deepEqual(migrated[0].parts,['kw-art-60s1-par-1']);
assert.equal(migrated[1].parts,undefined);assert.equal(migrated[1].needsFragmentReview,true);assert.deepEqual(migrated[1].partsBeforeUpdate,['uop-art-1@@999']);
assert.deepEqual(migrated[2].parts,['kk-art-157-par-1']);
const once=store.getItem(key);context.__READER_CORE.migrateFavorites(data);assert.equal(store.getItem(key),once);
const blocked=storage();blocked.setItem=()=>{throw Error('quota')};context.__READER_CORE.migrateFavorites(data,blocked);assert.equal(blocked.getItem(key),raw);assert.equal(context.__FAVORITES_MIGRATION.error,true);
assert.equal(context.__LAW_PACKAGES.isEnabled('alk'),false);assert.equal(context.__LAW_PACKAGES.isEnabled('bim'),false);
console.log('Imported data: 11 complete article ranges, hierarchy, penalties, provenance and safe favorite migration passed.');
