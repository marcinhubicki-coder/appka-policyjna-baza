#!/usr/bin/env node
import fs from "node:fs";
import {
  iterateUnits,
  loadLegalData,
  repairSplitArticleData,
  saveLegalData,
} from "./legal-content.mjs";

const dataPath = process.argv.find((arg) => arg.startsWith("--data="))?.slice(7) || "data.js";
const outputPath = process.argv.find((arg) => arg.startsWith("--output="))?.slice(9) || dataPath;
const correctionsPath = new URL("./content-corrections.json", import.meta.url);

const data = loadLegalData(dataPath);
const stats = {
  splitArticles: repairSplitArticleData(data),
  terminalReferences: 0,
  manualReplacements: 0,
  emptyUnitsRemoved: 0,
  editorialUnitsRemoved: 0,
  footnoteTailsTrimmed: 0,
  expandedMarkerRunsRemoved: 0,
  structuralRepairs: 0,
  residualMarkerRunsRemoved: 0,
  headingTailsTrimmed: 0,
};

function valueRank(value) {
  const match = String(value).toLowerCase().match(/^(\d+)?([a-z])?$/);
  if (!match) return null;
  if (!match[1]) return match[2].charCodeAt(0) - 96;
  return Number(match[1]) * 100 + (match[2] ? match[2].charCodeAt(0) - 96 : 0);
}

function referenceItems(expression) {
  return expression.split(/\s*(?:,|\bi\b|\blub\b|\boraz\b)\s*/i)
    .map((item) => item.match(/^(\d+[a-z]?|[a-z])(?:\s*[–-]\s*(\d+[a-z]?|[a-z]))?$/i))
    .filter(Boolean)
    .map((match) => ({ first: match[1].toLowerCase(), last: match[2]?.toLowerCase() || null }));
}

function consumesExpansion(items, tokens) {
  let index = 0;
  for (const item of items) {
    if (!item.last) {
      if (tokens[index] !== item.first) return false;
      index += 1;
      continue;
    }
    if (tokens[index] !== item.first) return false;
    const firstRank = valueRank(item.first);
    const lastRank = valueRank(item.last);
    let previousRank = firstRank;
    while (index < tokens.length) {
      const rank = valueRank(tokens[index]);
      if (rank == null || rank < previousRank || rank > lastRank) return false;
      previousRank = rank;
      const reachedEnd = tokens[index] === item.last;
      index += 1;
      if (reachedEnd) break;
    }
    if (tokens[index - 1] !== item.last) return false;
  }
  return index === tokens.length;
}

function removeExpandedMarkerRuns(text) {
  let value = String(text);
  const run = /\s+((?:\d+[a-z]?|[a-z])\b(?:\s+(?:\d+[a-z]?|[a-z])\b){1,80})(?=\s*(?:[,;:.§)]|[a-ząćęłńóśźż]))/gi;
  const reference = /(\bart\.|\bust\.|\bpkt|\blit\.|§)\s*((?:\d+[a-z]?|[a-z])\b(?:\s*[–-]\s*(?:\d+[a-z]?|[a-z])\b)?(?:\s*(?:,|\bi\b|\blub\b|\boraz\b)\s*(?:\d+[a-z]?|[a-z])\b(?:\s*[–-]\s*(?:\d+[a-z]?|[a-z])\b)?)*)/gi;
  const matches = [...value.matchAll(run)].reverse();
  for (const match of matches) {
    let valid = false;
    let removeStart = match.index;
    const tokenMatches = [...match[1].matchAll(/\d+[a-z]?|[a-z]/gi)];
    const base = match.index + match[0].indexOf(match[1]);
    for (let offset = 0; offset < tokenMatches.length && !valid; offset += 1) {
      const candidateStart = base + tokenMatches[offset].index;
      const before = value.slice(Math.max(0, candidateStart - 700), candidateStart);
      const refs = [...before.matchAll(reference)].map((item) => ({
        kind: item[1].toLowerCase(),
        start: item.index,
        end: item.index + item[0].length,
        items: referenceItems(item[2]),
      }));
      const groups = refs.map((item) => item.items);
      const streams = [groups];
      for (const kind of ["art.", "ust.", "§", "pkt", "lit."]) {
        streams.push(refs.filter((item) => item.kind === kind).map((item) => item.items));
      }
      const depth = (kind) => kind === "art." ? 0 : (kind === "ust." || kind === "§") ? 1 : kind === "pkt" ? 2 : 3;
      streams.push(refs.filter((item, index) => {
        const next = refs[index + 1];
        return !next || next.start - item.end > 8 || depth(next.kind) <= depth(item.kind);
      }).map((item) => item.items));
      const tokens = tokenMatches.slice(offset).map((item) => item[0].toLowerCase());
      for (const stream of streams) {
        for (let start = 0; start < stream.length && !valid; start += 1) {
          for (let end = start + 1; end <= stream.length && !valid; end += 1) {
            valid = consumesExpansion(stream.slice(start, end).flat(), tokens);
            if (valid) removeStart = Math.max(match.index, candidateStart - 1);
          }
        }
      }
    }
    if (!valid) continue;
    value = value.slice(0, removeStart) + value.slice(match.index + match[0].length);
    stats.expandedMarkerRunsRemoved += 1;
  }
  return value.replace(/[ \t]{2,}/g, " ").replace(/\s+([,.;:])/g, "$1").trim();
}

function unitIndex() {
  return new Map(iterateUnits(data).map((row) => [row.key, row.unit]));
}

let units = unitIndex();
const corrections = JSON.parse(fs.readFileSync(correctionsPath, "utf8"));
for (const [id, value] of Object.entries(corrections.terminalReferences || {})) {
  const unit = units.get(id);
  if (!unit || !/(?:\b(?:art|ust|pkt|lit)\.|§)\s*$/i.test(unit[3])) continue;
  unit[3] = `${String(unit[3]).trim()} ${value}.`;
  stats.terminalReferences += 1;
}

const replacements = new Map([
  ["kpk-art-60-par-2", "Postępowanie toczy się wówczas z urzędu, a pokrzywdzony, który przedtem wniósł oskarżenie prywatne, korzysta z praw oskarżyciela posiłkowego; do pokrzywdzonego, który przedtem nie wniósł oskarżenia prywatnego, stosuje się art. 54, 55 § 3 i art. 58."],
  ["prd-art-80bd-ust-3-pkt-2", "o którym mowa w ust. 2."],
  ["prd-art-100af-ust-3-pkt-2", "o którym mowa w ust. 2."],
  ["prd-art-100i-ust-3-pkt-2", "o którym mowa w ust. 2."],
  ["prd-art-86-ust-2-pkt-2", "w stacjach kontroli pojazdów prowadzących działalność, o której mowa w art. 83 ust. 2."],
  ["cudz-art-144-ust-5-pkt-3--variant-2", "ministra właściwego do spraw szkolnictwa wyższego i nauki, ministra właściwego do spraw zagranicznych, Komendanta Głównego Straży Granicznej, Komendanta Głównego Policji, Szefa Urzędu, Szefa Krajowej Administracji Skarbowej, Głównego Inspektora Pracy, Prezesa Zakładu Ubezpieczeń Społecznych oraz wojewody właściwego ze względu na siedzibę jednostki prowadzącej studia, a w razie potrzeby także do innych organów, o przekazanie informacji, czy zachodzą okoliczności, o których mowa odpowiednio w ust. 4a."],
  ["cudz-art-294-ust-2", "Obowiązek, o którym mowa w ust. 1, nie dotyczy cudzoziemca, który przybył na terytorium Rzeczypospolitej Polskiej w celu połączenia z rodziną do osoby, która uzyskała status uchodźcy."],
  ["prd-art-100j-pkt-150", "W przypadku braku możliwości wprowadzenia danych do ewidencji, spowodowanego przyczynami niezależnymi od podmiotu, wprowadzenia danych dokonuje się niezwłocznie, nie później niż w terminie 2 dni roboczych od dnia, w którym powstał obowiązek ich wprowadzenia."],
  ["prd-art-130a-ust-5c", "Pojazd usunięty z drogi w przypadkach określonych w ust. 1–2 oraz art. 140ad ust. 7 umieszcza się na wyznaczonym przez starostę parkingu strzeżonym do czasu uiszczenia opłaty za jego usunięcie i parkowanie, z uwzględnieniem ust. 7."],
  ["cudz-art-131@@0", "Poza przypadkami, o których mowa w art. 99 ust. 1 pkt 1–3 i 5–10 oraz ust. 1a, odmawia się wszczęcia postępowania w sprawie udzielenia cudzoziemcowi zezwolenia, o którym mowa w art. 127, gdy w dniu złożenia wniosku o udzielenie tego zezwolenia cudzoziemiec:"],
]);
for (const [id, value] of replacements) {
  const unit = units.get(id);
  if (!unit || unit[3] === value) continue;
  unit[3] = value;
  stats.manualReplacements += 1;
}

// W źródłowym PDF art. 60, 60¹, 60² i 60³ KW zostały sklejone w jeden rekord.
const kw = data.find((act) => act[0] === "kw");
const kw60Index = kw?.[3].findIndex((article) => article[0] === "kw-art-60") ?? -1;
if (kw60Index >= 0 && !kw[3].some((article) => article[0] === "kw-art-601")) {
  const merged = kw[3][kw60Index];
  const firstVariant = merged[4].findIndex((unit) => /--variant-2$/.test(unit[0] || ""));
  const article601Units = merged[4].slice(1, firstVariant).map((unit) => {
    const copy = structuredClone(unit);
    copy[0] = copy[0].replace(/^kw-art-60-/, "kw-art-601-");
    if (copy[0] === "kw-art-601-par-7") copy[3] = "(uchylony)";
    return copy;
  });
  const article603Units = merged[4].slice(firstVariant).map((unit) => {
    const copy = structuredClone(unit);
    copy[0] = copy[0].replace(/^kw-art-60-/, "kw-art-603-").replace(/--variant-2$/, "");
    return copy;
  });
  merged[3] = "(uchylony)";
  merged[4] = [["", "l", "", "(uchylony)"]];
  const chapter = merged[1];
  kw[3].splice(kw60Index + 1, 0,
    ["kw-art-601", chapter, "Art. 60¹", article601Units[0]?.[3] || "", article601Units, "", "", []],
    ["kw-art-602", chapter, "Art. 60²", "(uchylony)", [["", "l", "", "(uchylony)"]], "", "", []],
    ["kw-art-603", chapter, "Art. 60³", article603Units[0]?.[3] || "", article603Units, "", "", []],
  );
  stats.structuralRepairs += 1;
}

// Przypisy do tytułu ustawy zostały błędnie wciągnięte jako jednostki art. 7 KK,
// art. 8 KPK i art. 1 ustawy o cudzoziemcach.
const titleFootnotePrefixes = [
  "kk-art-7-par-3-pkt-",
  "kpk-art-8-par-2-pkt-",
  "cudz-art-1-pkt-",
];
const editorialOnly = /^(?:Zmiany? wymienion(?:ej|ego|ych|e)|Obecnie (?:minister|ogólne określenie|sprawy)|Z dniem \d{1,2}\s+\p{L}+\s+\d{4}\s+r\.\s+na podstawie wyroku|Zdanie .{0,100} uznan[eo]|Artykuł \d+ zawiera|Ustawa została ogłoszona)\b/iu;
const footnoteTail = /\s+\d{1,3}\s+(?=(?:Na podstawie art\.|Zmiany? wymienion|Obecnie (?:minister|ogólne określenie|sprawy)|Z dniem \d{1,2}\s+\p{L}+\s+\d{4}\s+r\.\s+na podstawie wyroku|Aktualne maksymalne wysokości))/iu;

for (const act of data) {
  for (const article of act[3]) {
    const kept = [];
    for (const unit of article[4]) {
      const id = unit[0] || "";
      let value = String(unit[3] || "").trim();
      if (!value) {
        stats.emptyUnitsRemoved += 1;
        continue;
      }
      if (titleFootnotePrefixes.some((prefix) => id.startsWith(prefix)) || editorialOnly.test(value)) {
        stats.editorialUnitsRemoved += 1;
        continue;
      }
      const tail = value.search(footnoteTail);
      if (tail >= 0) {
        value = value.slice(0, tail).trimEnd();
        stats.footnoteTailsTrimmed += 1;
      }
      if (id.startsWith("prd-art-130a-ust-6a-lit-")) {
        value = value.replace(/(\d+)160(?=\s*zł)/g, "$1");
      }
      let cleaned = value;
      let previous;
      do {
        previous = cleaned;
        cleaned = removeExpandedMarkerRuns(cleaned);
      } while (cleaned !== previous);
      unit[3] = cleaned;
      kept.push(unit);
    }
    article[4] = kept;
  }
}

// Załączniki do PRD zostały dopisane do art. 152. Zostają tylko właściwe pkt 1–3.
const prd = data.find((act) => act[0] === "prd");
const prd152 = prd?.[3].find((article) => article[0] === "prd-art-152");
if (prd152) {
  const before = prd152[4].length;
  prd152[4] = prd152[4].filter((unit) => !/^prd-art-152-ust-/.test(unit[0] || ""));
  const point3 = prd152[4].find((unit) => unit[0] === "prd-art-152-pkt-3");
  if (point3) point3[3] = "art. 74 ust. 2 pkt 2 lit. a, art. 77, 87, 88, 90–98 i 100–108, które wchodzą w życie z dniem 1 lipca 1999 r.";
  stats.editorialUnitsRemoved += before - prd152[4].length;
}

for (const row of iterateUnits(data)) {
  let previous;
  do {
    previous = row.unit[3];
    row.unit[3] = removeExpandedMarkerRuns(row.unit[3]);
  } while (row.unit[3] !== previous);
}

// Nieliczne układy, w których artefakt łączy kilka zagnieżdżonych odwołań,
// są korygowane jawnie. Dzięki temu filtr ogólny pozostaje zachowawczy.
const residualMarkerFixes = new Map([
  ["uop-art-28a-ust-6", ["ust. 19 3 4 7 i 21–", "ust. 19 i 21–"]],
  ["kk-art-139@@0", ["art. 130 127 128 130", "art. 130"]],
  ["kk-art-240-par-1", ["art. 189, art. 118a 120 121 122 123 124 127 128 130 134 140 148 148a 156 163 166 189 197 § 3–5", "art. 189, art. 197 § 3–5"]],
  ["kpk-art-300-par-1", ["art. 338b, art. 360, art. 361 i art. 338b 360 361 374 § 1", "art. 338b, art. 360, art. 361 i art. 374 § 1"]],
  ["kpk-art-517c-par-2", ["art. 138 74 75 138 i art. 139", "art. 138 i art. 139"]],
  ["spb-art-49-ust-1", ["art. 38 1 2 3 4 1 oraz art. 39", "art. 38 oraz art. 39"]],
  ["nieletni-art-34@@0", ["art. 59 48 50 59 i art. 98", "art. 59 i art. 98"]],
  ["nieletni-art-133-ust-1-pkt-4", ["art. 252 ust. 1 1 1 1 228 1 i art. 299 ust. 1", "art. 252 ust. 1 i art. 299 ust. 1"]],
]);
units = unitIndex();
for (const [id, [from, to]] of residualMarkerFixes) {
  const unit = units.get(id);
  if (!unit || !unit[3].includes(from)) continue;
  unit[3] = unit[3].replace(from, to);
  stats.residualMarkerRunsRemoved += 1;
}

const headingTails = new Map([
  ["kk-art-139@@0", " Przestępstwa przeciwko obronności"],
  ["kpk-art-216@@0", " Zatrzymanie rzeczy. Przeszukanie"],
  ["kpow-art-40-par-3", " Przeprowadzanie poszczególnych dowodów. Przeszukanie"],
  ["kpow-art-53@@0", " Czynności wyjaśniające"],
  ["kpow-art-94-par-3", " Postępowanie mandatowe"],
  ["spb-art-10a-ust-2-pkt-3", " Środki przymusu bezpośredniego"],
]);
for (const [id, tail] of headingTails) {
  const unit = units.get(id);
  if (!unit || !unit[3].endsWith(tail)) continue;
  unit[3] = unit[3].slice(0, -tail.length).trimEnd();
  stats.headingTailsTrimmed += 1;
}

saveLegalData(data, outputPath);
console.log(JSON.stringify(stats, null, 2));
