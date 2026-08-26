#!/usr/bin/env node
import fs from "node:fs";
import {
  cleanLegacyData,
  iterateUnits,
  loadLegalData,
} from "./legal-content.mjs";

const sourceDir = process.argv.find((arg) => arg.startsWith("--sources="))?.slice(10)
  || "/tmp/appka-main-sources";
const dataPath = process.argv.find((arg) => arg.startsWith("--data="))?.slice(7) || "data.js";

function normalize(value) {
  return String(value)
    .normalize("NFC")
    .replace(/[\u00ad\u200b-\u200f\u202a-\u202e\u2060\ufeff]/g, "")
    .replace(/([a-ząćęłńóśźż])-\s*\r?\n\s*([a-ząćęłńóśźż])/gi, "$1$2")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function articleNumber(title) {
  return String(title).replace(/^(?:Art\.|§)\s*/i, "").trim();
}

function articleSections(raw, actCode, title) {
  const number = articleNumber(title).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const heading = actCode.startsWith("z")
    ? new RegExp(`(?:^|[\\n\\f])§\\s*${number}(?:\\.|\\s|$)`, "gim")
    : new RegExp(`(?:^|[\\n\\f])Art\\.\\s*${number}\\.`, "gim");
  const nextHeading = actCode.startsWith("z")
    ? /(?:^|[\n\f])§\s*\d+[a-z]?(?:\.|\s|$)/gim
    : /(?:^|[\n\f])Art\.\s*\d+[a-z¹²³]*\./gim;
  const starts = [...raw.matchAll(heading)].map((match) => {
    const lead = /^[\n\f]/.test(match[0]) ? 1 : 0;
    return match.index + lead;
  });
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

function bestPrefix(sections, text) {
  const value = normalize(text);
  if (!value) return null;
  for (let length = value.length; length >= Math.min(24, value.length); length -= 1) {
    const needle = value.slice(0, length).trimEnd();
    if (needle.length < 24 && value.length >= 24) break;
    const hits = sections.flatMap((section, sectionIndex) => allIndexes(section, needle)
      .map((index) => ({ section, sectionIndex, index })));
    if (hits.length) return { length: needle.length, needle, hits };
  }
  return null;
}

const sourceMap = new Map();
for (const entry of fs.readdirSync(sourceDir)) {
  if (!entry.endsWith(".txt")) continue;
  sourceMap.set(entry.replace(/\.txt$/, ""), fs.readFileSync(`${sourceDir}/${entry}`, "utf8"));
}

const data = loadLegalData(dataPath);
cleanLegacyData(data);
const sectionCache = new Map();
const results = [];

for (const row of iterateUnits(data)) {
  const actCode = row.act[0];
  const raw = sourceMap.get(actCode);
  if (!raw || actCode === "z768") {
    results.push({ status: "skipped-source", act: actCode, article: row.article[2], id: row.key });
    continue;
  }
  const cacheKey = `${actCode}|${row.article[2]}`;
  if (!sectionCache.has(cacheKey)) sectionCache.set(cacheKey, articleSections(raw, actCode, row.article[2]));
  const sections = sectionCache.get(cacheKey);
  if (!sections.length) {
    results.push({ status: "no-section", act: actCode, article: row.article[2], id: row.key, text: row.text });
    continue;
  }
  const value = normalize(row.text);
  const exactHits = sections.flatMap((section, sectionIndex) => allIndexes(section, value)
    .map((index) => ({ section, sectionIndex, index })));
  if (value && exactHits.length) {
    results.push({ status: "exact", act: actCode, article: row.article[2], id: row.key, hitCount: exactHits.length });
    continue;
  }
  const prefix = bestPrefix(sections, value);
  if (prefix) {
    const hit = prefix.hits[0];
    results.push({
      status: prefix.length >= value.length * 0.9 ? "near" : "prefix",
      act: actCode,
      article: row.article[2],
      id: row.key,
      text: row.text,
      normalizedLength: value.length,
      prefixLength: prefix.length,
      hitCount: prefix.hits.length,
      sourceAfter: hit.section.slice(hit.index + prefix.length, hit.index + prefix.length + 240),
    });
    continue;
  }
  results.push({ status: "not-found", act: actCode, article: row.article[2], id: row.key, text: row.text });
}

const totals = {};
const byAct = {};
for (const result of results) {
  totals[result.status] = (totals[result.status] || 0) + 1;
  byAct[result.act] ||= {};
  byAct[result.act][result.status] = (byAct[result.act][result.status] || 0) + 1;
}

console.log(JSON.stringify({ totals, byAct, results }, null, 2));
