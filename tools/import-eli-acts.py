#!/usr/bin/env python3
import argparse, base64, gzip, hashlib, json, re, urllib.request
from copy import deepcopy
from pathlib import Path
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parents[1]

def canonical(value):
    return re.sub(r'\s+','',str(value)).lower()

def clean(value):
    return re.sub(r'\s+',' ',str(value).replace('\xa0',' ')).strip()

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
        "User-Agent":"Mozilla/5.0 (compatible; AppkaPolicyjnaELIImporter/1.0)",
        "Accept-Language":"pl-PL,pl;q=0.9,en;q=0.5"
    })
    with urllib.request.urlopen(req,timeout=45) as r:
        return r.read()

def source_lines(html):
    soup=BeautifulSoup(html,"lxml")
    for node in soup(["script","style","nav"]): node.decompose()
    return [clean(x) for x in soup.get_text("\n").splitlines() if clean(x)]

def add_text(row,text):
    if not text:return
    if row[4] and not row[4][-1][0] and row[4][-1][1]=="l":
        row[4][-1][3]=clean(row[4][-1][3]+" "+text)
    else:
        row[4].append(["","l","",text])

def add_unit(row,rank,marker,text,unit_id):
    if row[4] and not row[4][-1][3] and row[4][-1][0]:
        row[4][-1][3]=text
    else:
        row[4].append([unit_id,rank,marker,text])

def parse_act(src,html):
    code=src["code"];top=src["topLevel"];lines=source_lines(html)
    top_re=(re.compile(r'^§\s*([0-9]+[a-z]?)\.\s*(.*)$',re.I) if top=="par"
            else re.compile(r'^Art\.\s*([0-9]+[a-z]?)(?:\s*[-–]\s*([0-9]+[a-z]?))?\.\s*(.*)$',re.I))
    heading_re=re.compile(r'^(Rozdział|Dział|Oddział)\s+([IVXLCDM]+|\d+[a-z]?)\s*(.*)$',re.I)
    levels={"dział":1,"rozdział":2,"oddział":3}
    rows=[];path=[];pending_heading=None;started=False;current=[];current_parent={};current_point={}
    all_ids=set();range_block={}

    def make_row(num):
        rid=code+("-par-" if top=="par" else "-art-")+canonical(num)
        if rid in all_ids: raise RuntimeError("Powtórzone ID: "+rid)
        all_ids.add(rid)
        label=("§ " if top=="par" else "Art. ")+str(num)
        row=[rid,path[-1]["prefix"] if path else "",label,"",[],"","",[],"e",deepcopy(path),"excerpt"]
        rows.append(row);current_parent[rid]=rid;current_point[rid]="";range_block[rid]=1
        return row

    for raw in lines:
        text=clean(raw)
        top_match=top_re.match(text)
        if not started:
            if not top_match: continue
            first=top_match.group(1)
            if canonical(first)!="1": continue
            started=True
        if started and current and canonical(current[-1][2].replace("Art. ","").replace("§ ",""))==canonical(src["lastTop"]):
            if text.startswith(("Załącznik","Załączniki","Przypisy")) or re.fullmatch(r'\d+\)',text):
                break
        if text.startswith(("Załącznik","Załączniki","Przypisy")) and current:
            break

        h=heading_re.match(text)
        if h and started:
            kind,num,title=h.groups();level=levels[kind.lower()]
            path=[x for x in path if x["level"]<level]
            item={"prefix":kind.capitalize()+" "+num,"title":title,"level":level}
            path.append(item);pending_heading=item if not title else None
            continue
        if pending_heading is not None and not top_match:
            pending_heading["title"]=text;pending_heading=None;continue

        top_match=top_re.match(text)
        if top_match:
            if top=="par":
                start=top_match.group(1);end=None;rest=top_match.group(2)
            else:
                start,end,rest=top_match.groups()
            nums=[start]
            if end and start.isdigit() and end.isdigit():
                nums=[str(n) for n in range(int(start),int(end)+1)]
            current=[make_row(n) for n in nums]
            if rest:
                for row in current:add_text(row,rest)
            continue
        if not current: continue

        ust=re.match(r'^(\d+[a-z]?)\.\s*(.*)$',text,re.I)
        pkt=re.match(r'^(\d+[a-z]?)\)\s*(.*)$',text,re.I)
        lit=re.match(r'^([a-z])\)\s*(.*)$',text,re.I)
        if ust:
            num,body=ust.groups()
            for row in current:
                uid=row[0]+"-ust-"+canonical(num);current_parent[row[0]]=uid;current_point[row[0]]=""
                if uid in all_ids: raise RuntimeError("Powtórzone ID: "+uid)
                all_ids.add(uid);add_unit(row,"u","ust. "+num,body,uid)
            continue
        if pkt:
            num,body=pkt.groups()
            for row in current:
                parent=current_parent[row[0]]
                uid=parent+"-pkt-"+canonical(num)
                if uid in all_ids:
                    range_block[row[0]]+=1;uid=parent+"-blok-"+str(range_block[row[0]])+"-pkt-"+canonical(num)
                all_ids.add(uid);current_point[row[0]]=uid;add_unit(row,"p","pkt "+num,body,uid)
            continue
        if lit:
            letter,body=lit.groups()
            for row in current:
                parent=current_point[row[0]] or current_parent[row[0]]
                uid=parent+"-lit-"+letter.lower()
                if uid in all_ids: uid=uid+"-2"
                all_ids.add(uid);add_unit(row,"i","lit. "+letter.lower(),body,uid)
            continue
        for row in current:
            if row[4] and not row[4][-1][3]:
                row[4][-1][3]=text
            elif row[4]:
                row[4][-1][3]=clean(row[4][-1][3]+" "+text)
            else:
                add_text(row,text)

    if len(rows)<src["minRows"]:
        raise RuntimeError(f'{code}: tylko {len(rows)} pozycji, oczekiwano co najmniej {src["minRows"]}')
    for row in rows:
        body=" ".join(u[3] for u in row[4]).strip()
        if not body: raise RuntimeError(row[0]+": pusty przepis")
        if re.fullmatch(r'\(uchylon[eyab]*\)\.?',body,re.I):
            row[3]="Przepis uchylony";row[10]="status"
        elif re.fullmatch(r'\(pominięt[eyab]*\)\.?',body,re.I):
            row[3]="Przepis pominięty w tekście jednolitym";row[10]="status"
        else:
            words=body.split();row[3]=" ".join(words[:11])+("…" if len(words)>11 else "")
    metadata={
        "provider":"ELI – tekst urzędowy HTML",
        "url":src["url"],
        "officialSource":src["official"],
        "retrieved":CONFIG["asOf"],
        "sha256":hashlib.sha256(html).hexdigest(),
        "revision":"2026-09-20",
        "importKind":"official-ELI",
        "topLevel":top,
        "annexesIncluded":False,
        "articles":len(rows)
    }
    return [code,src["name"],src["official"],rows,metadata]

def article_text(data,article_id):
    for act in data:
        for row in act[3]:
            if row[0]==article_id:return " ".join(str(u[3]) for u in row[4])
    raise RuntimeError("Brak oczekiwanego przepisu: "+article_id)

def main():
    ap=argparse.ArgumentParser();ap.add_argument("--config",default="tools/eli-sources.json");ap.add_argument("--data",default="data.js")
    args=ap.parse_args()
    global CONFIG
    CONFIG=json.loads((ROOT/args.config).read_text())
    data_path=ROOT/args.data;data=load_data(data_path);by_code={a[0]:a for a in data}
    report={"asOf":CONFIG["asOf"],"acts":[]}
    for src in CONFIG["acts"]:
        html=fetch(src["url"]);act=parse_act(src,html);code=src["code"]
        if code in by_code:
            idx=next(i for i,a in enumerate(data) if a[0]==code);data[idx]=act
        else:data.append(act)
        by_code[code]=act
        report["acts"].append({"code":code,"stage":src["stage"],"rows":len(act[3]),"sha256":hashlib.sha256(html).hexdigest(),"official":src["official"]})
        print(code,len(act[3]),flush=True)
    for src in CONFIG["acts"]:
        for article_id,terms in src.get("checks",[]):
            hay=article_text(data,article_id).lower()
            missing=[t for t in terms if t.lower() not in hay]
            if missing:raise RuntimeError(f"{article_id}: brak fraz kontrolnych {missing}")
    ids=set()
    for act in data:
        for row in act[3]:
            for ident in [row[0],*[u[0] for u in row[4] if u[0]]]:
                if ident in ids:raise RuntimeError("Powtórzone ID: "+ident)
                ids.add(ident)
    save_data(data,data_path)
    out=ROOT/"reports/eli-import.json";out.parent.mkdir(exist_ok=True);out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")

if __name__=="__main__":
    main()
