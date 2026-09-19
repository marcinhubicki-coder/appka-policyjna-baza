#!/usr/bin/env python3
import base64, gzip, hashlib, json, re, urllib.request
from copy import deepcopy
from pathlib import Path
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"data.js"
Z768_URL="https://policja.pl/pol/kgp/biuro-prewencji/wydzial-prewencji/sluzba-patrolowa/7980,Zarzadzenie-nr-768-Komendanta-Glownego-Policji-z-dnia-14-sierpnia-2007-r-w-spraw.html"
WRO_BASE="https://edzienniki.duw.pl/WDU_D/2025/3906/akt.pdf"
WRO_AMEND="https://edzienniki.duw.pl/eli/POL_WOJ_DS/2025/4806/ogl/pol/pdf"

def clean(value): return re.sub(r'\s+',' ',str(value).replace('\xa0',' ')).strip()
def load_data(path):
    m=re.search(r'window\.__POLICE_B64\s*=\s*(\[[\s\S]*\]);?\s*$',path.read_text())
    if not m: raise RuntimeError("Brak __POLICE_B64")
    return json.loads(gzip.decompress(base64.b64decode(''.join(json.loads(m.group(1))))).decode())
def save_data(data,path):
    raw=json.dumps(data,ensure_ascii=False,separators=(',',':')).encode()
    path.write_text("window.__POLICE_B64=["+json.dumps(base64.b64encode(gzip.compress(raw,compresslevel=9,mtime=0)).decode())+"];\n")
def fetch(url):
    req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 (compatible; AppkaPolicyjnaOfficialImporter/1.0)","Accept-Language":"pl-PL,pl;q=0.9"})
    with urllib.request.urlopen(req,timeout=45) as r:return r.read()
def replace_act(data,act):
    for i,item in enumerate(data):
        if item[0]==act[0]:data[i]=act;return
    data.append(act)

def wroclaw_act():
    rows=[
      ["wroalk-par-1","","§ 1","Nocny zakaz sprzedaży alkoholu",[["","l","","Na terenie Gminy Wrocław zabrania się sprzedaży napojów alkoholowych przeznaczonych do spożycia poza miejscem sprzedaży w godzinach nocnych, pomiędzy godziną 22:00 a godziną 6:00."]],"","",[],"e",[],"own"],
      ["wroalk-par-1a","","§ 1a","Wyjątek — Port Lotniczy Wrocław",[["","l","","Ograniczenie, o którym mowa w § 1, nie dotyczy strefy zastrzeżonej na terenie Portu Lotniczego Wrocław."]],"","",[],"e",[],"own"],
      ["wroalk-par-2","","§ 2","Uchylenie wcześniejszych ograniczeń",[
        ["wroalk-par-2-pkt-1","p","pkt 1","uchwała nr LX/1422/18 Rady Miejskiej Wrocławia z dnia 23 sierpnia 2018 r. w sprawie ograniczenia sprzedaży napojów alkoholowych w godzinach nocnych (Dz. Urz. Woj. Doln. poz. 4100);"],
        ["wroalk-par-2-pkt-2","p","pkt 2","uchwała nr LXXVII/2011/24 Rady Miejskiej Wrocławia z dnia 11 stycznia 2024 r. w sprawie ograniczenia sprzedaży napojów alkoholowych w godzinach nocnych na terenie niektórych jednostek pomocniczych Gminy Wrocław (Dz. Urz. Woj. Doln. poz. 500)."]
      ],"","",[],"e",[],"own"],
      ["wroalk-par-3","","§ 3","Wykonanie uchwały",[["","l","","Wykonanie uchwały powierza się Prezydentowi Wrocławia."]],"","",[],"e",[],"own"],
      ["wroalk-par-4","","§ 4","Wejście w życie",[["","l","","Uchwała wchodzi w życie po upływie 14 dni od dnia ogłoszenia w Dzienniku Urzędowym Województwa Dolnośląskiego."]],"","",[],"e",[],"own"]
    ]
    meta={"provider":"Dziennik Urzędowy Województwa Dolnośląskiego","officialSource":WRO_BASE,"amendmentSource":WRO_AMEND,"retrieved":"2026-09-20","revision":"2026-09-20","importKind":"official-local-consolidated","topLevel":"par","articles":len(rows)}
    return ["wroalk","Uchwała Rady Miejskiej Wrocławia – ograniczenie nocnej sprzedaży alkoholu",WRO_BASE,rows,meta]

def parse_z768(html):
    soup=BeautifulSoup(html,"lxml")
    for node in soup(["script","style","nav","header","footer"]):node.decompose()
    raw=[clean(x) for x in soup.get_text("\n").splitlines() if clean(x)]
    lines=[];started=False
    for text in raw:
        text=re.sub(r'\[(\d+)\]','',text).strip()
        if re.match(r'^§\s*1\.',text):started=True
        if not started:continue
        if re.match(r'^\[?1\]?\s*Zmiany tekstu|^Pliki do pobrania',text,re.I):break
        lines.append(text)
    top_re=re.compile(r'^§\s*([0-9]+[a-z]?)\.\s*(.*)$',re.I)
    heading_re=re.compile(r'^Rozdział\s+([IVXLCDM]+|\d+[a-z]?)\.?\s*(.*)$',re.I)
    rows=[];path=[];row=None;parent="";point="";seen=set();block=1
    def add_unit(rank,marker,text,uid=""):
        nonlocal row
        if uid:
            if uid in seen:raise RuntimeError("Powtórzone ID z768: "+uid)
            seen.add(uid)
        row[4].append([uid,rank,marker,clean(text)])
    def body(text):
        nonlocal parent,point,block
        if not text:return
        ust=re.match(r'^(\d+[a-z]?)\.\s*(.*)$',text,re.I);pkt=re.match(r'^(\d+[a-z]?)\)\s*(.*)$',text,re.I);lit=re.match(r'^([a-z])\)\s*(.*)$',text,re.I)
        if ust:
            n,t=ust.groups();parent=row[0]+"-ust-"+n.lower();point="";block=1;add_unit("u","ust. "+n,t,parent)
        elif pkt:
            n,t=pkt.groups();base=parent or row[0];uid=base+"-pkt-"+n.lower()
            if uid in seen:block+=1;uid=base+"-blok-"+str(block)+"-pkt-"+n.lower()
            point=uid;add_unit("p","pkt "+n,t,uid)
        elif lit:
            n,t=lit.groups();base=point or parent or row[0];add_unit("i","lit. "+n.lower(),t,base+"-lit-"+n.lower())
        elif row[4]:row[4][-1][3]=clean(row[4][-1][3]+" "+text)
        else:add_unit("l","",text)
    for text in lines:
        h=heading_re.match(text)
        if h:
            num,title=h.groups();path=[{"prefix":"Rozdział "+num,"title":title,"level":2}];continue
        m=top_re.match(text)
        if m:
            num,rest=m.groups();rid="z768-par-"+num.lower()
            if rid in seen:raise RuntimeError("Powtórzony paragraf "+rid)
            seen.add(rid);row=[rid,path[-1]["prefix"] if path else "","§ "+num,"",[],"","",[],"e",deepcopy(path),"excerpt"];rows.append(row);parent=rid;point="";block=1;body(rest);continue
        if row:body(text)
    if len(rows)!=45 or rows[-1][0]!="z768-par-45":raise RuntimeError(f"Z.768: oczekiwano §1–45, otrzymano {len(rows)}")
    for row in rows:
        text=" ".join(u[3] for u in row[4]).strip()
        if not text:raise RuntimeError(row[0]+": pusty paragraf")
        words=text.split();row[3]=" ".join(words[:11])+("…" if len(words)>11 else "")
    sec2=next(r for r in rows if r[0]=="z768-par-2");text2=" ".join(u[3] for u in sec2[4])
    if "e-Notatnik" not in text2:raise RuntimeError("Z.768 §2: brak aktualnej definicji e-Notatnik")
    meta={"provider":"Policja.pl – tekst ujednolicony","url":Z768_URL,"officialSource":Z768_URL,"retrieved":"2026-09-20","versionFrom":"2026-06-12","sha256":hashlib.sha256(html).hexdigest(),"revision":"2026-09-20","importKind":"official-police-consolidated","topLevel":"par","articles":45}
    return ["z768","Zarządzenie KGP nr 768 — służba patrolowa",Z768_URL,rows,meta]

def main():
    data=load_data(DATA)
    # Verify official local publications are still reachable; the consolidated text below
    # is intentionally explicit so a later amendment cannot silently rewrite the app.
    base=fetch(WRO_BASE);amend=fetch(WRO_AMEND)
    replace_act(data,wroclaw_act())
    zhtml=fetch(Z768_URL);replace_act(data,parse_z768(zhtml))
    save_data(data,DATA)
    report={"asOf":"2026-09-20","wroclaw":{"base":WRO_BASE,"baseSha256":hashlib.sha256(base).hexdigest(),"amendment":WRO_AMEND,"amendmentSha256":hashlib.sha256(amend).hexdigest()},"z768":{"source":Z768_URL,"sha256":hashlib.sha256(zhtml).hexdigest(),"versionFrom":"2026-06-12","sections":45}}
    out=ROOT/"reports/special-import.json";out.parent.mkdir(exist_ok=True);out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
if __name__=="__main__":main()
