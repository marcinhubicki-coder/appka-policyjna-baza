#!/usr/bin/env node
import fs from "node:fs";
import {
  cleanLegacyData,
  iterateUnits,
  loadLegalData,
} from "./legal-content.mjs";

const sourceDir = process.argv.find((arg) => arg.startsWith("--sources="))?.slice(10)
  || "/tmp/appka-policyjna-audit";
const dataPath = process.argv.find((arg) => arg.startsWith("--data="))?.slice(7) || "data.js";
const writeCorrections = process.argv.find((arg) => arg.startsWith("--write-corrections="))?.slice(20);

const sources = new Map();
for (const code of ["uop", "kw", "kk", "kpk", "kpow", "spb", "prd", "cudz", "nieletni", "z768", "z360"]) {
  const path = `${sourceDir}/${code}.txt`;
  if (fs.existsSync(path)) sources.set(code, fs.readFileSync(path, "utf8"));
}

function normalize(value) {
  return String(value)
    .normalize("NFC")
    .replace(/[\u00ad\u200b-\u200f\u202a-\u202e\u2060\ufeff]/g, "")
    .replace(/([a-ząćęłńóśźż])-\s*\r?\n\s*([a-ząćęłńóśźż])/gi, "$1$2")
    .replace(/\s+/g, " ")
    .trim();
}

function articleNumber(title) {
  return String(title).replace(/^(?:Art\.|§)\s*/i, "").trim();
}

function sourceSections(raw, actCode, title) {
  const number = articleNumber(title).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const heading = actCode.startsWith("z")
    ? new RegExp(`(?:^|\\n)§\\s*${number}(?:\\.|\\s|$)`, "gim")
    : new RegExp(`(?:^|\\n|\\f)Art\\.\\s*${number}\\.`, "gim");
  const nextHeading = actCode.startsWith("z")
    ? /(?:^|\n)§\s*\d+[a-z]?(?:\.|\s|$)/gim
    : /(?:^|\n|\f)Art\.\s*\d+[a-z¹²³]*\./gim;
  const starts = [...raw.matchAll(heading)].map((match) => match.index + (match[0][0] === "\n" || match[0][0] === "\f" ? 1 : 0));
  return starts.map((start) => {
    nextHeading.lastIndex = start + 1;
    const next = nextHeading.exec(raw);
    return normalize(raw.slice(start, next?.index ?? raw.length));
  });
}

function allIndexes(haystack, needle) {
  const indexes = [];
  let start = 0;
  while (needle && (start = haystack.indexOf(needle, start)) >= 0) {
    indexes.push(start);
    start += Math.max(1, needle.length);
  }
  return indexes;
}

function findMatches(source, text) {
  const normalized = normalize(text);
  for (const length of [320, 260, 220, 180, 150, 120, 100, 80, 65, 50]) {
    const needle = normalized.slice(-length);
    const indexes = allIndexes(source, needle);
    if (indexes.length) {
      return indexes.map((index) => ({
        index,
        needle,
        after: source.slice(index + needle.length, index + needle.length + 260),
      }));
    }
  }
  return [];
}

const data = loadLegalData(dataPath);
cleanLegacyData(data);
const results = [];

for (const row of iterateUnits(data)) {
  const incomplete = row.text.match(/(?:\b(?:art|ust|pkt|lit)\.|§)\s*$/i);
  if (!incomplete) continue;
  const rawSource = sources.get(row.act[0]);
  if (!rawSource) {
    results.push({ status: "no-source", act: row.act[0], id: row.key, text: row.text });
    continue;
  }
  const sections = sourceSections(rawSource, row.act[0], row.article[2]);
  const scoped = sections.flatMap((section) => findMatches(section, row.text));
  const matches = scoped.length ? scoped : findMatches(normalize(rawSource), row.text);
  if (!matches.length) {
    results.push({ status: "not-found", act: row.act[0], id: row.key, text: row.text });
    continue;
  }

  const parsed = matches.map((match) => {
    const simple = match.after.match(/^\s*(\d+[a-z]?|[a-z])\s*([.;,):])/i);
    return {
      ...match,
      value: simple?.[1] || null,
      punctuation: simple?.[2] || null,
    };
  });
  const signatures = new Set(parsed.map((match) => `${match.value || "?"}${match.punctuation || "?"}`));
  const first = parsed[0];
  let status = "ambiguous";
  if (parsed.length === 1 && first.value) status = "unique-simple";
  else if (first.value && signatures.size === 1) status = "same-simple";
  else if (parsed.length === 1) status = "unique-complex";

  results.push({
    status,
    act: row.act[0],
    article: row.article[2],
    id: row.key,
    matchCount: parsed.length,
    value: first.value,
    punctuation: first.punctuation,
    needleLength: first.needle.length,
    scoped: scoped.length > 0,
    after: first.after,
    alternatives: parsed.slice(1, 6).map((match) => match.after),
    text: row.text,
  });
}

const totals = {};
for (const result of results) totals[result.status] = (totals[result.status] || 0) + 1;
if (writeCorrections) {
  const terminalReferences = Object.fromEntries(results
    .filter((result) => (result.status === "unique-simple" || result.status === "same-simple")
      && result.punctuation === ".")
    .map((result) => [result.id, result.value]));
  fs.writeFileSync(writeCorrections, `${JSON.stringify({ terminalReferences }, null, 2)}\n`);
}
console.log(JSON.stringify({ totals, results }, null, 2));
