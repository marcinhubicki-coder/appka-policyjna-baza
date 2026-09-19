import { performance } from "node:perf_hooks";\nimport fs from "node:fs";
import { loadLegalData } from "./legal-content.mjs";

const data=loadLegalData("data.js");
const norm=value=>String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/ł/g,"l");
const tidy=value=>String(value??"").replace(/\s+([,.;:])/g,"$1").replace(/[ \t]{2,}/g," ").trim();
const rawRows=[];
for(const act of data)for(const row of act[3])rawRows.push([row[0],act[0],row]);
const prebuilt=rawRows.map(([id,act,row])=>[id,act,norm(row[2]+" "+row[3]+" "+row[4].map(unit=>tidy(unit[3])).join(" "))]);
const queries=["zatrzymanie","policjant","pojazd","nieletni","alkohol","przeszukanie","art 15","srodek przymusu"];
const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
function timed(fn,reps=7){const xs=[];for(let i=0;i<reps;i++){const t=performance.now();fn();xs.push(performance.now()-t)}return Math.round(median(xs)*100)/100}
function buildRuntime(rows){return rows.map(([id,act,row])=>[id,act,norm(row[2]+" "+row[3]+" "+row[4].map(unit=>tidy(unit[3])).join(" "))])}
function runSearch(rows){let hits=0;for(const query of queries){const terms=norm(query).split(/\s+/);for(const row of rows)if(terms.every(term=>row[2].includes(term)))hits++}return hits}
const results=[];
for(const scale of [1,2,4]){
  const raw=Array.from({length:scale},()=>rawRows).flat();
  const ready=Array.from({length:scale},()=>prebuilt).flat();
  results.push({
    scale,
    articles:raw.length,
    runtimeIndexMs:timed(()=>buildRuntime(raw),5),
    prebuiltSearchMs:timed(()=>runSearch(ready),9),
    hits:runSearch(ready)
  });
}
const report={environment:"node-build-trend-only",queries,results};
fs.mkdirSync("reports",{recursive:true});
fs.writeFileSync("reports/offline-search-benchmark.json",JSON.stringify(report,null,2)+"\\n");
console.log(JSON.stringify(report,null,2));
