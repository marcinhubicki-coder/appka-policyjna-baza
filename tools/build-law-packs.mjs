import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { loadLegalData } from "./legal-content.mjs";

const ROOT=process.cwd();
const PACK_DIR=path.join(ROOT,"packs");
const REPORT_DIR=path.join(ROOT,"reports");

function loadConfig(){
  const context={globalThis:{}};
  vm.runInNewContext(fs.readFileSync(path.join(ROOT,"law-config.js"),"utf8"),context,{filename:"law-config.js"});
  return context.globalThis.__LAW_CONFIG;
}
function norm(value){
  return String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/ł/g,"l");
}
function tidy(value){
  return String(value??"").replace(/\s+([,.;:])/g,"$1").replace(/[ \t]{2,}/g," ").trim();
}
function articleSearchText(row){
  return norm(row[2]+" "+row[3]+" "+row[4].map(unit=>tidy(unit[3])).join(" "));
}
function discoveryText(row){
  const tokens=articleSearchText(row).match(/[a-z0-9§]+/g)||[];
  return [...new Set(tokens)].join(" ");
}
function gzipJson(value,file){
  const bytes=zlib.gzipSync(Buffer.from(JSON.stringify(value)),{level:9,mtime:0});
  fs.writeFileSync(file,bytes);
  return bytes.length;
}
function sha256(buffer){
  return crypto.createHash("sha256").update(buffer).digest("hex");
}
function stableObjectEntries(object){
  return Object.fromEntries(Object.entries(object).sort(([a],[b])=>a.localeCompare(b)));
}

fs.mkdirSync(PACK_DIR,{recursive:true});
fs.mkdirSync(REPORT_DIR,{recursive:true});

const config=loadConfig();
const data=loadLegalData(path.join(ROOT,"data.js"));
const sourceBuffer=fs.readFileSync(path.join(ROOT,"data.js"));
const sourceHash=sha256(sourceBuffer).slice(0,16);
const knownActs=new Set(Object.keys(config.acts));
const sourceActs=new Set(data.map(act=>act[0]));
const missingConfig=[...sourceActs].filter(code=>!knownActs.has(code));
const missingData=[...knownActs].filter(code=>!sourceActs.has(code));
if(missingConfig.length)throw new Error("Brak konfiguracji aktów: "+missingConfig.join(", "));
if(missingData.length)console.warn("Akty skonfigurowane bez danych: "+missingData.join(", "));

const packDefinitions=Object.entries(config.packs)
  .filter(([,pack])=>!pack.future)
  .sort(([,a],[,b])=>(a.order||0)-(b.order||0));
const packs={};
for(const [packId,pack] of packDefinitions){
  const acts=data.filter(act=>config.acts[act[0]].pack===packId);
  packs[packId]={...pack,acts};
}
for(const act of data){
  const packId=config.acts[act[0]].pack;
  if(!packs[packId])throw new Error(`Akt ${act[0]} wskazuje nieistniejący pakiet ${packId}`);
}

const catalog={
  version:1,
  sourceHash,
  acts:[],
  articles:[],
  ids:[]
};
const seenIds=new Set();
for(const act of data){
  const code=act[0],meta=config.acts[code],packId=meta.pack;
  catalog.acts.push([code,packId,meta.short,meta.name,meta.citation,act[3].length]);
  for(const row of act[3]){
    catalog.articles.push([row[0],code,packId,row[2],row[3],discoveryText(row)]);
    if(seenIds.has(row[0]))throw new Error("Powtórzone ID: "+row[0]);
    seenIds.add(row[0]);catalog.ids.push([row[0],code,packId]);
    for(const unit of row[4]){
      if(!unit[0])continue;
      if(seenIds.has(unit[0]))throw new Error("Powtórzone ID: "+unit[0]);
      seenIds.add(unit[0]);catalog.ids.push([unit[0],code,packId]);
    }
  }
}
catalog.acts.sort((a,b)=>a[0].localeCompare(b[0]));
catalog.articles.sort((a,b)=>a[0].localeCompare(b[0]));
catalog.ids.sort((a,b)=>a[0].localeCompare(b[0]));
const catalogBytes=gzipJson(catalog,path.join(ROOT,"law-catalog.json.gz"));

const manifestPacks={};
const totals={acts:0,articles:0,units:0,dataCompressedBytes:0,searchCompressedBytes:0};
for(const [packId,pack] of Object.entries(packs)){
  const acts=pack.acts;
  const search=[];
  let articles=0,units=0;
  for(const act of acts){
    for(const row of act[3]){
      articles++;units+=row[4].length;
      search.push([row[0],act[0],articleSearchText(row)]);
    }
  }
  const dataFile=`packs/${packId}.data.json.gz`;
  const searchFile=`packs/${packId}.search.json.gz`;
  const dataBytes=gzipJson(acts,path.join(ROOT,dataFile));
  const searchBytes=gzipJson(search,path.join(ROOT,searchFile));
  const codes=acts.map(act=>act[0]);
  manifestPacks[packId]={
    name:pack.name,
    mandatory:!!pack.mandatory,
    order:pack.order||0,
    acts:codes,
    data:dataFile,
    search:searchFile,
    counts:{acts:acts.length,articles,units},
    bytes:{data:dataBytes,search:searchBytes}
  };
  totals.acts+=acts.length;totals.articles+=articles;totals.units+=units;
  totals.dataCompressedBytes+=dataBytes;totals.searchCompressedBytes+=searchBytes;
}

const manifest={
  version:1,
  sourceHash,
  catalog:"law-catalog.json.gz",
  catalogBytes,
  packs:stableObjectEntries(manifestPacks),
  acts:stableObjectEntries(Object.fromEntries(data.map(act=>{
    const code=act[0],meta=config.acts[code];
    return [code,{...meta,articles:act[3].length}];
  })))
};
fs.writeFileSync(path.join(ROOT,"law-manifest.js"),
  `globalThis.__LAW_MANIFEST=Object.freeze(${JSON.stringify(manifest)});\n`);

const stats={
  version:1,
  sourceHash,
  sourceBytes:sourceBuffer.length,
  catalogCompressedBytes:catalogBytes,
  totals,
  packs:Object.fromEntries(Object.entries(manifestPacks).map(([id,pack])=>[id,{counts:pack.counts,bytes:pack.bytes,acts:pack.acts}]))
};
fs.writeFileSync(path.join(REPORT_DIR,"offline-pack-stats.json"),JSON.stringify(stats,null,2)+"\n");
console.log(JSON.stringify(stats,null,2));
