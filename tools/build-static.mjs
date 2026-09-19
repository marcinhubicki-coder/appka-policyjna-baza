import fs from "node:fs";
import path from "node:path";

const ROOT=process.cwd();
const OUT=path.join(ROOT,"dist");
fs.rmSync(OUT,{recursive:true,force:true});
fs.mkdirSync(OUT,{recursive:true});

const skip=new Set([".git",".github","tools","dist",".vercel","node_modules"]);
function copyEntry(name){
  if(skip.has(name))return;
  const src=path.join(ROOT,name),dst=path.join(OUT,name);
  const stat=fs.statSync(src);
  if(stat.isDirectory()){
    fs.cpSync(src,dst,{recursive:true,filter:(source)=>{
      const base=path.basename(source);
      return !skip.has(base);
    }});
  }else{
    fs.copyFileSync(src,dst);
  }
}
for(const name of fs.readdirSync(ROOT))copyEntry(name);
console.log("Static output:",OUT,fs.readdirSync(OUT).length,"top-level entries");
