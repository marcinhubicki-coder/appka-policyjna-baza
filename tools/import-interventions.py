#!/usr/bin/env python3
import argparse, base64, gzip, hashlib, importlib.util, json, re, urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SPEC=importlib.util.spec_from_file_location("inforlex_import",ROOT/"tools/import-inforlex.py")
MOD=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(MOD)

def load_data(path):
    text=path.read_text()
    m=re.search(r'window\.__POLICE_B64\s*=\s*(\[[\s\S]*\]);?\s*$',text)
    if not m: raise RuntimeError("Brak __POLICE_B64")
    b64=''.join(json.loads(m.group(1)))
    return json.loads(gzip.decompress(base64.b64decode(b64)).decode())

def save_data(data,path):
    raw=json.dumps(data,ensure_ascii=False,separators=(',',':')).encode()
    b64=base64.b64encode(gzip.compress(raw,compresslevel=9,mtime=0)).decode()
    path.write_text("window.__POLICE_B64=["+json.dumps(b64)+"];\n")

def fetch(url):
    req=urllib.request.Request(url,headers={
        "User-Agent":"Mozilla/5.0 (compatible; AppkaPolicyjnaImporter/1.0)",
        "Accept-Language":"pl-PL,pl;q=0.9,en;q=0.5"
    })
    with urllib.request.urlopen(req,timeout=45) as r:
        return r.read()

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--config",default="tools/interventions-sources.json")
    ap.add_argument("--data",default="data.js")
    args=ap.parse_args()
    config=json.loads((ROOT/args.config).read_text())
    as_of=config["asOf"]
    data_path=ROOT/args.data
    data=load_data(data_path)
    by_code={act[0]:act for act in data}
    report={"asOf":as_of,"acts":[]}
    for src in config["acts"]:
        code=src["code"];html=fetch(src["url"])
        old_rows=by_code.get(code,[None,None,None,[]])[3]
        bundle=MOD.import_act(code,html,src["url"],old_rows,as_of)
        actual=bundle["source"]["versionFrom"]
        if actual!=src["expectedVersionFrom"]:
            raise RuntimeError(f"{code}: oczekiwano wersji od {src['expectedVersionFrom']}, źródło ma {actual}")
        rows=bundle["rows"]+bundle["futureRows"]
        metadata={**bundle["source"],
            "officialSource":src["official"],
            "officialSha256":None,
            "revision":"2026-09-19",
            "futureArticles":len(bundle["futureRows"]),
            "importKind":"current-inforlex-verified-against-ELI"}
        act=[code,src["name"],src["official"],rows,metadata]
        if code in by_code:
            idx=next(i for i,x in enumerate(data) if x[0]==code);data[idx]=act
        else:
            data.append(act)
        by_code[code]=act
        report["acts"].append({"code":code,"articles":len(rows),"versionFrom":actual,
            "versionTo":bundle["source"]["versionTo"],"sha256":hashlib.sha256(html).hexdigest(),
            "official":src["official"]})
        print(code,len(rows),actual,flush=True)
    # Patrol-oriented smoke checks: catch a structurally valid import whose
    # article boundaries or content were parsed incorrectly.
    def article_text(code, article_id):
        act=next((a for a in data if a[0]==code),None)
        row=next((r for r in (act[3] if act else []) if r[0]==article_id),None)
        if not row: raise RuntimeError(f"Brak oczekiwanego artykułu: {article_id}")
        return " ".join(str(u[3]) for u in row[4]).lower()
    checks=[
        ("nark","nark-art-62",("środk","odurz")),
        ("przemoc","przemoc-art-2",("przemoc","domow")),
        ("psych","psych-art-21",("badani","psychiatr")),
        ("psych","psych-art-23",("bez","zgod")),
        ("tyton","tyton-art-5",("palen","zabran")),
    ]
    for code,article_id,terms in checks:
        text=article_text(code,article_id)
        missing=[term for term in terms if term not in text]
        if missing: raise RuntimeError(f"{article_id}: brak fraz kontrolnych {missing}")

    ids=set()
    for act in data:
        for row in act[3]:
            for ident in [row[0],*[u[0] for u in row[4] if u[0]]]:
                if ident in ids: raise RuntimeError("Powtórzone ID: "+ident)
                ids.add(ident)
    save_data(data,data_path)
    out=ROOT/"reports/interventions-import.json";out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")

if __name__=="__main__":main()
