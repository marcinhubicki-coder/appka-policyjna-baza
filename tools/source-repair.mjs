#!/usr/bin/env node
import fs from "node:fs";
import {
  cleanLegacyData,
  iterateUnits,
  loadLegalData,
  saveLegalData,
} from "./legal-content.mjs";

const sourceDir = process.argv.find((arg) => arg.startsWith("--sources="))?.slice(10)
  || "/tmp/appka-main-sources";
const dataPath = process.argv.find((arg) => arg.startsWith("--data="))?.slice(7) || "data.js";
const outputPath = process.argv.find((arg) => arg.startsWith("--output="))?.slice(9);
const reportPath = process.argv.find((arg) => arg.startsWith("--report="))?.slice(9);

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

function sourceSections(raw, actCode, title) {
  const number = articleNumber(title)
    .replace(/[¹²³]/g, (char) => ({ "¹": "1", "²": "2", "³": "3" })[char])
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

function bestPrefix(sections, text) {
  for (let length = text.length; length >= Math.min(24, text.length); length -= 1) {
    const needle = text.slice(0, length).trimEnd();
    if (needle.length < 24 && text.length >= 24) break;
    for (const section of sections) {
      const index = section.indexOf(needle);
      if (index >= 0) return { section, index, length: needle.length };
    }
  }
  return null;
}

function middleDifference(before, after) {
  let start = 0;
  while (start < before.length && start < after.length && before[start] === after[start]) start += 1;
  let beforeEnd = before.length;
  let afterEnd = after.length;
  while (beforeEnd > start && afterEnd > start
    && before[beforeEnd - 1] === after[afterEnd - 1]) {
    beforeEnd -= 1;
    afterEnd -= 1;
  }
  return {
    start,
    removed: before.slice(start, beforeEnd),
    added: after.slice(start, afterEnd),
  };
}

function numericMarkerRun(value) {
  const tokens = value.trim().match(/(?:\d+[a-z]{0,4}|[a-z])/gi) || [];
  return tokens.length >= 2
    && /^\s*(?:(?:\d+[a-z]{0,4}|[a-z])\s*){2,80}$/i.test(value);
}

function safeRepair(before, after) {
  const diff = middleDifference(before, after);
  if (numericMarkerRun(diff.removed) && /^\s*[),.;:]?\s*$/.test(diff.added)) {
    return { kind: "marker-run", ...diff };
  }
  if (/^\s*\d{1,3}\)\s*$/.test(diff.removed) && /^\s*\)?\s*$/.test(diff.added)) {
    return { kind: "footnote-marker", ...diff };
  }
  if (!diff.removed.trim() && /^\s*\)\s*$/.test(diff.added)) {
    return { kind: "missing-parenthesis", ...diff };
  }
  return null;
}

function markerTokenRuns(value) {
  const atom = /(?:\d+[a-z]{0,4}|[a-z])/gi;
  const tokens = [...value.matchAll(atom)].map((match) => ({
    start: match.index,
    end: match.index + match[0].length,
  }));
  const runs = [];
  let start = 0;
  while (start < tokens.length) {
    let end = start + 1;
    while (end < tokens.length
      && /^\s+$/.test(value.slice(tokens[end - 1].end, tokens[end].start))) end += 1;
    if (end - start >= 2) runs.push(tokens.slice(start, end));
    start = end;
  }
  return runs;
}

function structuralHeadingRemainder(value) {
  return /^\s*(?:CZĘŚĆ|DZIAŁ|Rozdział|Oddział)(?:\s|$)/i.test(value);
}

function trimTrailingHeading(sections, value) {
  const boundaries = [...value.matchAll(/[.;:)](?=\s|$)/g)]
    .map((match) => match.index + 1)
    .reverse();
  for (const boundary of boundaries) {
    if (boundary >= value.length) continue;
    const candidate = value.slice(0, boundary).trimEnd();
    for (const section of sections) {
      const index = section.indexOf(candidate);
      if (index < 0) continue;
      const remainder = section.slice(index + candidate.length);
      if (structuralHeadingRemainder(remainder)) return candidate;
    }
  }
  return null;
}

const sources = new Map();
for (const entry of fs.readdirSync(sourceDir)) {
  if (!entry.endsWith(".txt")) continue;
  sources.set(entry.replace(/\.txt$/, ""), fs.readFileSync(`${sourceDir}/${entry}`, "utf8"));
}

const data = loadLegalData(dataPath);
cleanLegacyData(data);
const cache = new Map();
const proposals = [];

for (const row of iterateUnits(data)) {
  const actCode = row.act[0];
  const rawSource = sources.get(actCode);
  if (!rawSource || actCode === "z768") continue;
  const cacheKey = `${actCode}|${row.article[2]}`;
  if (!cache.has(cacheKey)) {
    cache.set(cacheKey, sourceSections(rawSource, actCode, row.article[2]));
  }
  const sections = cache.get(cacheKey);
  const before = normalize(row.text);
  if (!before) continue;
  const withoutHeading = trimTrailingHeading(sections, before);
  if (withoutHeading) {
    proposals.push({
      kind: "trailing-heading",
      act: actCode,
      article: row.article[2],
      id: row.key,
      before,
      after: withoutHeading,
    });
    row.unit[3] = withoutHeading;
    continue;
  }
  if (sections.some((section) => section.includes(before))) continue;
  const prefix = bestPrefix(sections, before);
  if (!prefix) continue;
  const sourceRemainder = prefix.section.slice(prefix.index + prefix.length);

  if (structuralHeadingRemainder(sourceRemainder)
    && /[.;:)]$/.test(before.slice(0, prefix.length))) {
    const after = before.slice(0, prefix.length).trimEnd();
    proposals.push({
      kind: "trailing-heading",
      act: actCode,
      article: row.article[2],
      id: row.key,
      before,
      after,
    });
    row.unit[3] = after;
    continue;
  }

  let accepted = null;
  for (const run of markerTokenRuns(before)) {
    const candidates = [];
    for (let first = 0; first < run.length - 1; first += 1) {
      for (let last = first + 1; last < run.length; last += 1) {
        const start = run[first].start;
        const end = run[last].end;
        if (start < prefix.length) continue;
        const after = (before.slice(0, start) + before.slice(end)).replace(/[ \t]{2,}/g, " ");
        if (!prefix.section.includes(after)) continue;
        const repair = safeRepair(before, after);
        if (repair) candidates.push({ ...repair, after });
      }
    }
    candidates.sort((a, b) => b.after.length - a.after.length);
    accepted = candidates[0] || null;
    if (accepted) break;
  }
  if (!accepted) {
    const after = before.slice(0, prefix.length) + ")" + before.slice(prefix.length);
    if (prefix.section.includes(after)) {
      const repair = safeRepair(before, after);
      if (repair) accepted = { ...repair, after };
    }
  }
  if (!accepted) continue;
  proposals.push({
    kind: accepted.kind,
    act: actCode,
    article: row.article[2],
    id: row.key,
    before,
    after: accepted.after,
    removed: accepted.removed,
    added: accepted.added,
  });
  row.unit[3] = accepted.after;
}

function suspiciousEnding(value) {
  return /(?:\b(?:art|ust|pkt|lit)\.|\b(?:art\.\s*\d+[a-z]*|ust\.\s*\d+[a-z]*|pkt\s*\d+[a-z]*|lit\.\s*[a-z])|§\s*\d*[a-z]*|\b(?:i|lub|oraz|albo)|[–-])\s*$/i.test(value);
}

function sourceMarker(marker) {
  let match = String(marker).match(/^§\s*([^\s]+)/i);
  if (match) return `§ ${match[1]}.`;
  match = String(marker).match(/^ust\.\s*([^\s]+)/i);
  if (match) return `${match[1]}.`;
  match = String(marker).match(/^(?:pkt|lit\.)\s*([^\s]+)/i);
  if (match) return `${match[1]})`;
  return "";
}

function trimCompletion(value, before) {
  let completion = value.trim();
  const heading = completion.search(/\s+(?:CZĘŚĆ|DZIAŁ|Rozdział|Oddział)(?:\s|$)/i);
  if (heading >= 0) completion = completion.slice(0, heading).trimEnd();
  if (/^(?:\d+[a-z]?|[a-z])\)\s/i.test(completion)) return "";
  const pointMarker = completion.search(/\s+(?:\d+[a-z]?|[a-z])\)\s/i);
  if (pointMarker >= 0) completion = completion.slice(0, pointMarker).trimEnd();
  const paragraphMarkers = [...completion.matchAll(/§\s*\d+[a-z]?\./g)];
  if (paragraphMarkers.length > 1) {
    completion = completion.slice(0, paragraphMarkers[1].index).trimEnd();
  }
  const tail = String.raw`(?:§\s*)?\d+[a-z]?`;
  const legalReferenceTail = new RegExp(
    String.raw`^${tail}(?:\s*(?:,|i|lub|oraz|albo)\s*${tail})*\.$`,
    "i",
  );
  if (!legalReferenceTail.test(completion)) return "";
  return completion;
}

for (const act of data) {
  if (act[0] === "z768" || !sources.has(act[0])) continue;
  for (const article of act[3]) {
    const cacheKey = `${act[0]}|${article[2]}`;
    const sections = cache.get(cacheKey)
      || sourceSections(sources.get(act[0]), act[0], article[2]);
    cache.set(cacheKey, sections);
    for (let index = 0; index < article[4].length; index += 1) {
      const unit = article[4][index];
      const before = normalize(unit[3]);
      if (!before || !suspiciousEnding(before)) continue;
      let completed = null;
      for (const section of sections) {
        const start = section.indexOf(before);
        if (start < 0) continue;
        const end = start + before.length;
        for (let nextIndex = index + 1; nextIndex < article[4].length; nextIndex += 1) {
          const next = article[4][nextIndex];
          const nextText = normalize(next[3]);
          if (nextText.length < 18) continue;
          const anchor = nextText.slice(0, Math.min(100, nextText.length));
          const nextStart = section.indexOf(anchor, end);
          if (nextStart < 0) continue;
          let completion = section.slice(end, nextStart);
          const marker = sourceMarker(next[2]);
          if (marker && completion.trimEnd().endsWith(marker)) {
            completion = completion.trimEnd().slice(0, -marker.length);
          }
          completion = trimCompletion(completion, before);
          if (!completion || completion.length > 300) break;
          const after = normalize(`${before} ${completion}`);
          if (!section.includes(after)) break;
          completed = { after, completion };
          break;
        }
        if (completed) break;
      }
      if (!completed) continue;
      proposals.push({
        kind: "incomplete-tail",
        act: act[0],
        article: article[2],
        id: unit[0] || `${article[0]}@@${index}`,
        before,
        after: completed.after,
        added: completed.completion,
      });
      unit[3] = completed.after;
    }
  }
}

const totals = {};
for (const proposal of proposals) totals[proposal.kind] = (totals[proposal.kind] || 0) + 1;
const report = { totals, proposals };
if (reportPath) fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
if (outputPath) saveLegalData(data, outputPath);
console.log(JSON.stringify(report, null, 2));
