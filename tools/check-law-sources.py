#!/usr/bin/env python3
import hashlib, json, re, sys, urllib.request
from pathlib import Path
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parents[1]
UA={"User-Agent":"Mozilla/5.0 (compatible; AppkaPolicyjnaFreshness/1.0)","Accept-Language":"pl-PL,pl;q=0.9,en;q=0.5"}

def fetch(url):
    req=urllib.request.Request(url,headers=UA)
    with urllib.request.urlopen(req,timeout=45) as r:return r.read()

report={"checked":[],"warnings":[],"errors":[]}
def check_url(kind,code,url,expected=None):
    try:data=fetch(url)
    except Exception as exc:
        report["errors"].append({"code":code,"kind":kind,"error":str(exc)});return None
    item={"code":code,"kind":kind,"url":url,"bytes":len(data),"sha256":hashlib.sha256(data).hexdigest()}
    if expected:item["expected"]=expected
    report["checked"].append(item);return data

infor=json.loads((ROOT/"tools/interventions-sources.json").read_text())
for src in infor["acts"]:
    raw=check_url("inforlex",src["code"],src["url"],src["expectedVersionFrom"])
    if not raw:continue
    soup=BeautifulSoup(raw,"lxml")
    text=re.sub(r'\s+',' ',soup.get_text(' ')).strip()
    m=re.search(r'Wersja aktualna\s+od\s+(\d{4}\.\d{2}\.\d{2})',text)
    actual=m.group(1).replace(".","-") if m else None
    report["checked"][-1]["actualVersionFrom"]=actual
    if actual!=src["expectedVersionFrom"]:
        report["errors"].append({"code":src["code"],"kind":"version-change","expected":src["expectedVersionFrom"],"actual":actual})

eli=json.loads((ROOT/"tools/eli-sources.json").read_text())
for src in eli["acts"]:
    raw=check_url("eli",src["code"],src["url"])
    if raw and len(raw)<1500:report["errors"].append({"code":src["code"],"kind":"eli-too-small","bytes":len(raw)})

zurl="https://policja.pl/pol/kgp/biuro-prewencji/wydzial-prewencji/sluzba-patrolowa/7980,Zarzadzenie-nr-768-Komendanta-Glownego-Policji-z-dnia-14-sierpnia-2007-r-w-spraw.html"
raw=check_url("policja","z768",zurl,"2026-06-12")
if raw:
    text=re.sub(r'\s+',' ',raw.decode("utf-8","ignore"))
    m=re.search(r'tekst ujednolicony wg stanu na dzień\s*(\d{2}\.\d{2}\.\d{4})',text,re.I)
    actual="-".join(reversed(m.group(1).split("."))) if m else None
    report["checked"][-1]["actualVersionFrom"]=actual
    if actual!="2026-06-12":report["errors"].append({"code":"z768","kind":"version-change","expected":"2026-06-12","actual":actual})
    if "e-Notatnik" not in text:report["errors"].append({"code":"z768","kind":"content-check","missing":"e-Notatnik"})

for code,url in [
    ("wroalk-base","https://edzienniki.duw.pl/WDU_D/2025/3906/akt.pdf"),
    ("wroalk-amend","https://edzienniki.duw.pl/eli/POL_WOJ_DS/2025/4806/ogl/pol/pdf")
]:check_url("wroclaw",code,url)

# The municipal BIP page is an auxiliary discovery page, not the legal source.
# Its TLS chain occasionally fails on GitHub runners, so it must not invalidate
# otherwise verified official journal documents.
try:
    data=fetch("https://bip.um.wroc.pl/sprawa-do-zalatwienia/5995/zezwolenie-na-sprzedaz-alkoholu")
    report["checked"].append({"code":"wroclaw-alcohol-index","kind":"wroclaw-aux","url":"https://bip.um.wroc.pl/sprawa-do-zalatwienia/5995/zezwolenie-na-sprzedaz-alkoholu","bytes":len(data),"sha256":hashlib.sha256(data).hexdigest()})
except Exception as exc:
    report["warnings"].append({"code":"wroclaw-alcohol-index","kind":"auxiliary-unavailable","error":str(exc)})

out=ROOT/"reports/source-freshness.json";out.parent.mkdir(exist_ok=True);out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(report,ensure_ascii=False,indent=2))
if report["errors"]:sys.exit(1)
