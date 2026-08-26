#!/usr/bin/env node
import {
  buildIndex,
  cleanLegacyData,
  iterateUnits,
  loadLegalData,
} from "./legal-content.mjs";

const dataPath = process.argv.find((arg) => arg.startsWith("--data="))?.slice(7) || "data.js";
const simulateCleanup = process.argv.includes("--after-cleanup");
const json = process.argv.includes("--json");
const data = loadLegalData(dataPath);
const cleanup = simulateCleanup ? cleanLegacyData(data) : null;
const units = iterateUnits(data);
const { idMap } = buildIndex(data);

const rules = [
  ["incomplete-reference", /\b(?:art|ust|pkt|lit)\.\s*(?:[),;:]?\s*)$/i],
  ["incomplete-paragraph", /§\s*$/],
  ["truncated-range", /[–-]\s*$/],
  ["truncated-preposition", /(?:^|\s)(?:do|w|we)\s*$/iu],
  ["truncated-reference-list", /(?:\b(?:art|ust|pkt|lit)\.|§)\s*[0-9a-z–-]+\s+(?:i|lub|oraz|albo)\s*$/iu],
  ["page-artifact", /(?:©\s*Kancelaria|Kancelaria Sejmu|Opracowano na podstawie|Tekst ujednolicony|Strona\s+\d+|\bDziennik Ustaw\b|\b\d{4}-\d{2}-\d{2}\b)/i],
  ["editorial-footnote", /^(?:Zmiany? wymienion(?:ej|ego|ych|e)|Obecnie (?:minister|ogólne określenie|sprawy)|Z dniem \d{1,2}\s+\p{L}+\s+\d{4}\s+r\.\s+na podstawie wyroku|Zdanie .{0,100} uznan[eo]|Artykuł \d+ zawiera|Ustawa została ogłoszona)\b/iu],
  ["embedded-footnote", /\s+\d{1,3}\s+(?:Na podstawie art\.|Zmiany? wymienion|Obecnie (?:minister|ogólne określenie|sprawy)|Z dniem \d{1,2}\s+\p{L}+\s+\d{4}\s+r\.\s+na podstawie wyroku|Aktualne maksymalne wysokości)/iu],
  ["control-character", /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u00AD\u200B-\u200F\u202A-\u202E\u2060\uFEFF\uFFFD]/],
  ["bare-marker-run", /(?:^|[.;:]\s+)(?:\d+[a-z]?\s+){3,}\d+[a-z]?(?=\s|$)/i],
  ["space-before-punctuation", /\s+[,.!?;:]/],
  ["multiple-spaces", /[ \t]{2,}/],
  ["broken-article-number", /\bart\.\s*\d+\s+\d+[a-z]{1,4}\b/i],
  ["suspicious-glyph", /[□■◆�]/],
];

const findings = [];
for (const row of units) {
  for (const [rule, re] of rules) {
    const match = row.text.match(re);
    if (!match) continue;
    findings.push({
      rule,
      act: row.act[0],
      article: row.article[2],
      id: row.key,
      match: match[0],
      text: row.text,
    });
  }
}

const duplicateIds = [];
const seen = new Set();
for (const act of data) {
  for (const article of act[3]) {
    for (const id of [article[0], ...article[4].map((unit) => unit[0]).filter(Boolean)]) {
      if (seen.has(id)) duplicateIds.push(id);
      seen.add(id);
    }
  }
}

const totals = {};
for (const finding of findings) totals[finding.rule] = (totals[finding.rule] || 0) + 1;
const report = {
  acts: data.length,
  articles: data.reduce((sum, act) => sum + act[3].length, 0),
  units: units.length,
  cleanup,
  duplicateIds,
  totals,
  findings,
};

if (json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`Akty: ${report.acts}; artykuły/paragrafy: ${report.articles}; jednostki: ${report.units}`);
  if (cleanup) console.log(`Symulowane czyszczenie: ${JSON.stringify(cleanup)}`);
  for (const [rule, count] of Object.entries(totals)) console.log(`${rule}: ${count}`);
  if (duplicateIds.length) console.log(`Powielone ID: ${duplicateIds.join(", ")}`);
  for (const finding of findings.slice(0, 80)) {
    console.log(`\n[${finding.rule}] ${finding.act} ${finding.article} ${finding.id}`);
    console.log(finding.text);
  }
}

process.exitCode = findings.length || duplicateIds.length ? 1 : 0;
