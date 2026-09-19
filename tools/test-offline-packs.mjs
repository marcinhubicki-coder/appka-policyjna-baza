import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import zlib from "node:zlib";
import { loadLegalData } from "./legal-content.mjs";

function loadGlobal(file,key){
  const context={globalThis:{}};
  vm.runInNewContext(fs.readFileSync(file,"utf8"),context,{filename:file});
  return context.globalThis[key];
}
const config=loadGlobal("law-config.js","__LAW_CONFIG");
const manifest=loadGlobal("law-manifest.js","__LAW_MANIFEST");
const router=JSON.parse(zlib.gunzipSync(fs.readFileSync(manifest.router)));
const discovery=JSON.parse(zlib.gunzipSync(fs.readFileSync(manifest.discovery)));
const source=loadLegalData("data.js");
const norm=value=>String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/ł/g,"l");
const tidy=value=>String(value??"").replace(/\s+([,.;:])/g,"$1").replace(/[ \t]{2,}/g," ").trim();
const discoveryText=row=>[...new Set((norm(row[2]+" "+row[3]+" "+row[4].map(unit=>tidy(unit[3])).join(" ")).match(/[a-z0-9§]+/g)||[]))].join(" ");
const sourceCodes=source.map(act=>act[0]).sort();
const packedCodes=[];
const searchRows=[];
let articleCount=0,unitCount=0;

for(const [packId,pack] of Object.entries(manifest.packs)){
  const acts=JSON.parse(zlib.gunzipSync(fs.readFileSync(pack.data)));
  const search=JSON.parse(zlib.gunzipSync(fs.readFileSync(pack.search)));
  assert.deepEqual(Array.from(acts,act=>act[0]),Array.from(pack.acts),`Kolejność aktów w ${packId}`);
  assert.equal(search.length,pack.counts.articles,`Liczba indeksowanych artykułów w ${packId}`);
  packedCodes.push(...acts.map(act=>act[0]));
  searchRows.push(...search);
  articleCount+=acts.reduce((sum,act)=>sum+act[3].length,0);
  unitCount+=acts.reduce((sum,act)=>sum+act[3].reduce((n,row)=>n+row[4].length,0),0);
}
assert.deepEqual(packedCodes.sort(),sourceCodes,"Każdy akt musi znaleźć się dokładnie w jednej paczce");
assert.equal(router.acts.length,source.length,"Router musi znać wszystkie akty");
assert.equal(router.articles.length,articleCount,"Router musi znać wszystkie artykuły");
assert.equal(discovery.length,articleCount,"Discovery musi znać wszystkie artykuły");
assert.ok(router.ids.length>=articleCount+unitCount*0.5,"Router ID wygląda na niepełny");
assert.equal(Object.keys(config.acts).filter(code=>sourceCodes.includes(code)).length,sourceCodes.length);
assert.ok(manifest.runtimeVersion,"Manifest musi wersjonować runtime/cache");

const sourceSearch=[];
const sourceDiscovery=[];
for(const act of source)for(const row of act[3]){
  sourceSearch.push([row[0],act[0],norm(row[2]+" "+row[3]+" "+row[4].map(unit=>tidy(unit[3])).join(" "))]);
  sourceDiscovery.push([row[0],discoveryText(row)]);
}
const byId=new Map(searchRows.map(row=>[row[0],row]));
for(const row of sourceSearch)assert.equal(byId.get(row[0])?.[2],row[2],`Prebuilt search różni się dla ${row[0]}`);
const discoveryById=new Map(discovery);
for(const row of sourceDiscovery)assert.equal(discoveryById.get(row[0]),row[1],`Discovery różni się dla ${row[0]}`);
for(const query of ["zatrzymanie","policjant","pojazd","nieletni","alkohol","przeszukanie","art 15"]){
  const terms=norm(query).split(/\s+/);
  const legacy=sourceSearch.filter(row=>terms.every(term=>row[2].includes(term))).map(row=>row[0]).sort();
  const ready=searchRows.filter(row=>terms.every(term=>row[2].includes(term))).map(row=>row[0]).sort();
  assert.deepEqual(ready,legacy,`Niezgodne wyniki dla: ${query}`);
}
console.log(JSON.stringify({status:"ok",packs:Object.keys(manifest.packs).length,acts:sourceCodes.length,articles:articleCount,routerIds:router.ids.length},null,2));
