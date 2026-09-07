#!/usr/bin/env python3
"""Import public statute text from saved Inforlex HTML, without site/editorial copy.

Requires beautifulsoup4 and lxml. Never uses the displayed page as plain text:
only article fragments are accepted, footnote anchors are removed structurally,
and original chapter/division headings are stored separately. Source snapshots
are reviewed before merge; this command does not publish or overwrite data.js.
"""
import argparse
import hashlib
import json
import re
from copy import deepcopy
from datetime import date
from pathlib import Path
from bs4 import BeautifulSoup

SUP = str.maketrans('0123456789', '⁰¹²³⁴⁵⁶⁷⁸⁹')
PLAIN = str.maketrans('⁰¹²³⁴⁵⁶⁷⁸⁹', '0123456789')
NUMBER = r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹]+[a-z]*'
ARTICLE = re.compile(r'^Art\.\s*(' + NUMBER + r')\.(?:\s*\[[^\]]*\])?\s*', re.I)
LEVELS = {'część': 0, 'księga': 0, 'dział': 1, 'rozdział': 2, 'oddział': 3}

def clean(value):
    return re.sub(r'\s+', ' ', value.replace('\u00ad', '')).strip()

def canonical(value):
    return re.sub(r'[⁰¹²³⁴⁵⁶⁷⁸⁹]+',lambda m:'s'+m[0].translate(PLAIN),value).lower()

def text_of(node):
    for sup in node.select('sup'):
        sup.replace_with(sup.get_text().translate(SUP))
    for anchor in node.select('a'):
        if (anchor.get('href', '').startswith('#_') or
                re.fullmatch(r'\[\d+\]|\d+\)', anchor.get_text(strip=True))):
            anchor.decompose()
    return clean(node.get_text())

def import_act(code, html, url, old_rows, as_of):
    soup = BeautifulSoup(html, 'lxml')
    page_text = clean(soup.get_text(' '))
    version = re.search(r'Wersja aktualna\s+od (\d{4}\.\d{2}\.\d{2})(?: do (\d{4}\.\d{2}\.\d{2}))?', page_text)
    if not version:
        raise ValueError(f'{code}: source has no explicit current version')
    start, end = [x.replace('.', '-') if x else None for x in version.groups()]
    if start > as_of or (end and end < as_of):
        raise ValueError(f'{code}: source version {start}–{end} does not cover {as_of}')
    rows, path, pending, preamble = [], [], None, []
    seen, all_ids, stats = set(), set(), {'articleFragments': 0, 'annexesExcluded': 0, 'paragraphs': 0}
    old = {row[0]: row for row in old_rows}
    old_numbers = {row[2]: row for row in old_rows}
    for fragment in soup.select('[data-fragent-code^="ap_"]'):
        code_in_source = fragment['data-fragent-code']
        if fragment.select_one('label#ap_n'):
            preamble.extend(text_of(p) for p in fragment.select('p'))
            continue
        if re.search(r'\dz$', code_in_source):
            stats['annexesExcluded'] += 1
            continue
        stats['articleFragments'] += 1
        row, parent, point, letter, point_block = None, '', '', '', 1
        for paragraph in fragment.find_all(['p', 'table'], recursive=True):
            if paragraph.find_parent('table'):
                continue
            if paragraph.name == 'table':
                # Preserve relationships of table cells within each row.
                text = '\n'.join(' | '.join(clean(c.get_text(' ')) for c in tr.find_all(['td', 'th'], recursive=False)) for tr in paragraph.select('tr'))
            else:
                text = text_of(paragraph)
            if not text:
                continue
            match = ARTICLE.match(text)
            if not row and not match:
                heading = re.match(r'^(CZĘŚĆ|KSIĘGA|DZIAŁ|ROZDZIAŁ|ODDZIAŁ)\b\s*(.*)$', text, re.I)
                if heading:
                    kind, rest = heading.groups();level = LEVELS[kind.lower()]
                    path = [item for item in path if item['level'] < level]
                    number = re.match(r'^([IVXLCDM]+[a-z]?|\d+[a-z]*)\b\.?\s*(.*)$', rest, re.I)
                    prefix = kind.capitalize() + (' '+number[1] if number else '')
                    title = number[2] if number else rest
                    path.append({'prefix': prefix, 'title': title, 'level': level})
                    pending = len(path)-1 if not title else None
                elif pending is not None:
                    path[pending]['title'] = text;pending = None
                elif not rows and code_in_source == 'ap_1':
                    preamble.append(text)
                else:
                    raise ValueError(f'{code}/{code_in_source}: unexpected material before article: {text[:100]}')
                continue
            if match:
                number = match[1];article_id = code+'-art-'+canonical(number)
                if article_id in seen:
                    raise ValueError(f'duplicate article {article_id}')
                seen.add(article_id);all_ids.add(article_id)
                previous = old.get(article_id) or old_numbers.get('Art. '+number)
                # Publisher's bracketed summaries are editorial, not statute text.
                # Preserve our reviewed navigation descriptions; create excerpts for new rows.
                title = previous[3] if previous else ''
                row = [article_id, path[-1]['prefix'] if path else '', 'Art. '+number, title, [], '', '', [], 'e', deepcopy(path), 'own' if previous else 'excerpt']
                rows.append(row);parent = article_id;point='';letter='';point_block=1
                text = text[match.end():]
                if not text:
                    continue
            stats['paragraphs'] += 1
            unit_id, rank, marker = '', 'l', ''
            sub = re.match(r'^(§\s*)?('+NUMBER+r')\.\s+', text)
            point_match = re.match(r'^('+NUMBER+r')\)\s*', text)
            letter_match = re.match(r'^([a-z])\)\s*', text)
            indent = next((int(c[1:]) for c in paragraph.get('class',[]) if re.fullmatch(r'p\d',c)),0)
            if point_match and indent >= 2:
                # Numbered text inside a quoted declaration is not a new legal point.
                rank='i'
            elif sub:
                kind = 'par' if sub[1] else 'ust';number=sub[2]
                parent = row[0]+'-'+kind+'-'+canonical(number);point='';letter='';point_block=1
                unit_id,rank,marker=parent,'u',('§ ' if sub[1] else 'ust. ')+number
                text=text[sub.end():]
            elif point_match:
                number=point_match[1]
                point=parent+('-blok-'+str(point_block) if point_block>1 else '')+'-pkt-'+canonical(number)
                if point in all_ids:
                    # E.g. nieletni art. 331 ust. 1 has two separate 1)–2) lists.
                    point_block+=1;point=parent+'-blok-'+str(point_block)+'-pkt-'+canonical(number)
                letter=''
                unit_id,rank,marker=point,'p','pkt '+number;text=text[point_match.end():]
            elif letter_match:
                number=letter_match[1];letter=(point or parent)+'-lit-'+number
                unit_id,rank,marker=letter,'i','lit. '+number;text=text[letter_match.end():]
            elif text.startswith(('– ', '− ', '- ')):
                rank='i' if point else 'p'
            if unit_id:
                if unit_id in all_ids:
                    raise ValueError(f'duplicate unit {unit_id}')
                all_ids.add(unit_id)
            previous_unit=row[4][-1] if row[4] else None
            if (not unit_id and rank=='l' and indent==0 and previous_unit and
                    previous_unit[1] in ('l','u') and not previous_unit[2].startswith('pkt')):
                # A sanction in its own HTML paragraph belongs to the preceding §/ust.
                previous_unit[3]+='\n'+text
            else:
                row[4].append([unit_id,rank,marker,text])
        if row is None:
            raise ValueError(f'{code}/{code_in_source}: missing article')
    for row in rows:
        body = ' '.join(unit[3] for unit in row[4])
        if not body:
            raise ValueError(f'{row[0]}: empty article')
        if re.fullmatch(r'\(uchylon[ay]\)\.?',body):row[3]='Przepis uchylony';row[10]='status'
        elif re.fullmatch(r'\(pominięty\)\.?',body):row[3]='Przepis pominięty w tekście jednolitym';row[10]='status'
        elif not row[3]:
            words=body.split();excerpt=' '.join(words[:11]);row[3]=excerpt+('…' if len(words)>11 else '')
    if len(rows)<stats['articleFragments']:
        raise ValueError(f'{code}: article count mismatch')
    stats['parsedArticles']=len(rows)
    # Keep previously verified future-only articles clearly separate from current text.
    future=[]
    for previous in old_rows:
        if previous[0] not in seen and previous[5]=='1' and previous[6]>as_of:
            future.append(previous)
    source = {'provider':'Inforlex (tekst aktu)', 'url':url,'retrieved':as_of,
              'versionFrom':start,'versionTo':end,'sha256':hashlib.sha256(html).hexdigest(),
              'first':rows[0][2],'last':rows[-1][2],'articles':len(rows),
              'annexesIncluded':False,'annexesAvailable':stats['annexesExcluded'],
              'preamble':preamble,'editorialTitles':'Własne opisy; nowe pozycje: początek przepisu',
              'stats':stats}
    return {'rows':rows,'futureRows':future,'source':source}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('source_dir',type=Path)
    parser.add_argument('--old',required=True,type=Path);parser.add_argument('--output',required=True,type=Path)
    parser.add_argument('--date',default=date.today().isoformat());args=parser.parse_args()
    old={a[0]:a[3] for a in json.loads(args.old.read_text())}
    urls=json.loads((args.source_dir/'urls.json').read_text());result={}
    for code,url in urls.items():
        result[code]=import_act(code,(args.source_dir/(code+'.html')).read_bytes(),url,old.get(code,[]),args.date)
        print(code, len(result[code]['rows']), result[code]['source']['last'], flush=True)
    args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2))

if __name__=='__main__':main()
