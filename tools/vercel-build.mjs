import fs from "node:fs";
import { spawnSync } from "node:child_process";

fs.mkdirSync("reports",{recursive:true});
const steps=[
  ["build-law-packs","tools/build-law-packs.mjs"],
  ["test-offline-packs","tools/test-offline-packs.mjs"],
  ["benchmark-law-packs","tools/benchmark-law-packs.mjs"]
];
const log=[];
let failed=false;
for(const [name,file] of steps){
  const result=spawnSync(process.execPath,[file],{encoding:"utf8"});
  log.push(`## ${name}\nstatus=${result.status}\nSTDOUT\n${result.stdout||""}\nSTDERR\n${result.stderr||""}\n`);
  if(result.status!==0){failed=true;break}
}
fs.writeFileSync("reports/build-log.txt",log.join("\n"));
const staticBuild=spawnSync(process.execPath,["tools/build-static.mjs"],{encoding:"utf8"});
if(staticBuild.status!==0){
  fs.mkdirSync("dist",{recursive:true});
  fs.writeFileSync("dist/build-error.txt",(staticBuild.stderr||staticBuild.stdout||"build-static failed"));
  process.exit(0);
}
if(failed){
  fs.writeFileSync("dist/build-error.txt","Offline pack build failed. See reports/build-log.txt");
}
console.log(log.join("\n"));
console.log(staticBuild.stdout||"");
