import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { loadLegalData } from "./legal-content.mjs";

const ROOT=process.cwd();
const PACK_DIR=path.join(ROOT,"packs");
const ACT_DIR=path.join(ROOT,"acts");
const DOC_DIR=path.join(ROOT,"documents");
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

for(const dir of [PACK_DIR,ACT_DIR,DOC_DIR])fs.rmSync(dir,{recursive:true,force:true});
for(const dir of [PACK_DIR,ACT_DIR,DOC_DIR,REPORT_DIR])fs.mkdirSync(dir,{recursive:true});

const config=loadConfig();
const data=loadLegalData(path.join(ROOT,"data.js"));
const sourceBuffer=fs.readFileSync(path.join(ROOT,"data.js"));
const sourceHash=sha256(sourceBuffer).slice(0,16);
const runtimeVersion=(process.env.VERCEL_GIT_COMMIT_SHA||process.env.GITHUB_SHA||sourceHash).slice(0,16);
const knownActs=new Set(Object.keys(config.acts));
const sourceActs=new Set(data.map(act=>act[0]));
const missingConfig=[...sourceActs].filter(code=>!knownActs.has(code));
const missingData=[...knownActs].filter(code=>!sourceActs.has(code));
if(missingConfig.length)throw new Error("Brak konfiguracji aktów: "+missingConfig.join(", "));
if(missingData.length)console.warn("Akty skonfigurowane bez danych: "+missingData.join(", "));

const isDocument=act=>config.acts[act[0]]?.kind==="document";
const lawActs=data.filter(act=>!isDocument(act));
const documentActs=data.filter(isDocument);

const packDefinitions=Object.entries(config.packs)
  .filter(([,pack])=>!pack.future)
  .sort(([,a],[,b])=>(a.order||0)-(b.order||0));
const packs={};
for(const [packId,pack] of packDefinitions){
  const acts=lawActs.filter(act=>config.acts[act[0]].pack===packId);
  packs[packId]={...pack,acts};
}
for(const act of lawActs){
  const packId=config.acts[act[0]].pack;
  if(!packs[packId])throw new Error(`Akt ${act[0]} wskazuje nieistniejący pakiet ${packId}`);
}

const router={version:3,sourceHash,acts:[],articles:[],ids:[],actArticles:{},migrations:{}};
const discovery=[];
const seenIds=new Set();

for(const act of lawActs){
  const code=act[0],meta=config.acts[code],packId=meta.pack;
  router.acts.push([code,packId,meta.short,meta.name,meta.citation,act[3].length]);
  router.actArticles[code]=act[3].map(row=>row[0]);
  const actMeta=act[4]||{};
  if(actMeta.revision||actMeta.idAliases||actMeta.partAliases){
    router.migrations[code]={
      revision:actMeta.revision||null,
      idAliases:actMeta.idAliases||{},
      partAliases:actMeta.partAliases||{}
    };
  }
  for(const row of act[3]){
    const unitIds=row[4].map((unit,index)=>unit[0]||`${row[0]}@@${index}`);
    router.articles.push([row[0],code,packId,row[2],row[3],unitIds]);
    if(meta.searchable!==false)discovery.push([row[0],discoveryText(row)]);
    if(seenIds.has(row[0]))throw new Error("Powtórzone ID: "+row[0]);
    seenIds.add(row[0]);router.ids.push([row[0],code,packId]);
    for(const unit of row[4]){
      if(!unit[0])continue;
      if(seenIds.has(unit[0]))throw new Error("Powtórzone ID: "+unit[0]);
      seenIds.add(unit[0]);router.ids.push([unit[0],code,packId]);
    }
  }
}
router.acts.sort((a,b)=>a[0].localeCompare(b[0]));
router.articles.sort((a,b)=>a[0].localeCompare(b[0]));
router.ids.sort((a,b)=>a[0].localeCompare(b[0]));
discovery.sort((a,b)=>a[0].localeCompare(b[0]));
const routerBytes=gzipJson(router,path.join(ROOT,"law-router.json.gz"));
const discoveryBytes=gzipJson(discovery,path.join(ROOT,"law-discovery.json.gz"));

const actData={};
for(const act of lawActs){
  const code=act[0],file=`acts/${code}.data.json.gz`,bytes=gzipJson(act,path.join(ROOT,file));
  actData[code]={file,bytes};
}
const documentData={};
for(const act of documentActs){
  const code=act[0],file=`documents/${code}.data.json.gz`,bytes=gzipJson(act,path.join(ROOT,file));
  documentData[code]={file,bytes};
}

const manifestPacks={};
const totals={acts:0,articles:0,units:0,dataCompressedBytes:0,searchCompressedBytes:0};
for(const [packId,pack] of Object.entries(packs)){
  const acts=pack.acts;
  const search=[];
  let articles=0,units=0,dataBytes=0;
  for(const act of acts){
    const meta=config.acts[act[0]];
    dataBytes+=actData[act[0]].bytes;
    for(const row of act[3]){
      articles++;units+=row[4].length;
      if(meta.searchable!==false){
        const preview=tidy(row[4].map(unit=>unit[3]).join(" ")).slice(0,190);
        search.push([row[0],act[0],articleSearchText(row),preview]);
      }
    }
  }
  const searchFile=`packs/${packId}.search.json.gz`;
  const searchBytes=gzipJson(search,path.join(ROOT,searchFile));
  const codes=acts.map(act=>act[0]);
  manifestPacks[packId]={
    name:pack.name,
    mandatory:!!pack.mandatory,
    order:pack.order||0,
    acts:codes,
    search:searchFile,
    counts:{acts:acts.length,articles,units,searchable:search.length},
    bytes:{data:dataBytes,search:searchBytes}
  };
  totals.acts+=acts.length;totals.articles+=articles;totals.units+=units;
  totals.dataCompressedBytes+=dataBytes;totals.searchCompressedBytes+=searchBytes;
}

const manifest={
  version:3,
  sourceHash,
  runtimeVersion,
  router:"law-router.json.gz",
  routerBytes,
  discovery:"law-discovery.json.gz",
  discoveryBytes,
  packs:stableObjectEntries(manifestPacks),
  acts:stableObjectEntries(Object.fromEntries(lawActs.map(act=>{
    const code=act[0],meta=config.acts[code];
    return [code,{...meta,kind:meta.kind||"law",articles:act[3].length,data:actData[code].file,dataBytes:actData[code].bytes}];
  })))
};
fs.writeFileSync(path.join(ROOT,"law-manifest.js"),
  `globalThis.__LAW_MANIFEST=Object.freeze(${JSON.stringify(manifest)});\n`);

const documentManifest={
  version:1,
  sourceHash,
  runtimeVersion,
  groups:config.documents?.groups||[],
  acts:stableObjectEntries(Object.fromEntries(documentActs.map(act=>{
    const code=act[0],meta=config.acts[code];
    return [code,{...meta,kind:"document",rows:act[3].length,data:documentData[code].file,dataBytes:documentData[code].bytes}];
  })))
};
fs.writeFileSync(path.join(ROOT,"document-manifest.js"),
  `globalThis.__DOCUMENT_MANIFEST=Object.freeze(${JSON.stringify(documentManifest)});\n`);

const documentTotals={
  acts:documentActs.length,
  rows:documentActs.reduce((n,act)=>n+act[3].length,0),
  units:documentActs.reduce((n,act)=>n+act[3].reduce((sum,row)=>sum+row[4].length,0),0),
  compressedBytes:Object.values(documentData).reduce((n,item)=>n+item.bytes,0)
};
const stats={
  version:3,
  sourceHash,
  runtimeVersion,
  sourceBytes:sourceBuffer.length,
  routerCompressedBytes:routerBytes,
  discoveryCompressedBytes:discoveryBytes,
  totals,
  documents:documentTotals,
  packs:Object.fromEntries(Object.entries(manifestPacks).map(([id,pack])=>[id,{counts:pack.counts,bytes:pack.bytes,acts:pack.acts}]))
};
fs.writeFileSync(path.join(REPORT_DIR,"offline-pack-stats.json"),JSON.stringify(stats,null,2)+"\n");
console.log(JSON.stringify(stats,null,2));
