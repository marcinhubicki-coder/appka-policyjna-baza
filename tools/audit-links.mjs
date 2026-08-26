#!/usr/bin/env node
import {
  createReferenceResolver,
  iterateUnits,
  loadLegalData,
  referenceCandidates,
} from "./legal-content.mjs";

const dataPath = process.argv.find((arg) => arg.startsWith("--data="))?.slice(7) || "data.js";
const data = loadLegalData(dataPath);
const resolver = createReferenceResolver(data);
const rules = globalThis.__LEGAL_LINK_RULES__;
const number = String.raw`\d+[a-z]?`;
const separator = String.raw`(?:\s*,\s*|\s+(?:i|lub|oraz)\s+)`;
const expression = String.raw`${number}(?:\s*[–-]\s*${number})?(?:${separator}${number}(?:\s*[–-]\s*${number})?)*`;
const rangePatterns = [
  new RegExp(String.raw`\bart\.\s*${expression}`, "gi"),
  new RegExp(String.raw`\bust\.\s*${expression}`, "gi"),
  new RegExp(String.raw`§\s*${expression}`, "g"),
  new RegExp(String.raw`\bpkt\s*${expression}`, "gi"),
  new RegExp(String.raw`\blit\.\s*[a-z](?:\s*[–-]\s*[a-z])?(?:${separator}[a-z](?:\s*[–-]\s*[a-z])?)*(?![a-z])`, "gi"),
];

const findings = [];
const totals = { mentions: 0, external: 0, externalLinked: 0, linked: 0, unresolved: 0 };
for (const row of iterateUnits(data)) {
  const external = rules.externalReferenceRanges(row.text);
  const candidates = referenceCandidates(row.text, row.article[0], row.unit[0], row.act[0], resolver);
  for (const pattern of rangePatterns) {
    for (const match of row.text.matchAll(pattern)) {
      if (!/[–-]|,|\s(?:i|lub|oraz)\s/i.test(match[0])) continue;
      const start = match.index;
      const end = start + match[0].length;
      totals.mentions += 1;
      const isExternal = rules.overlapsRange(external, start, end);
      const isLinked = candidates.some((candidate) => candidate.start <= start && candidate.end >= end);
      if (isExternal) {
        totals.external += 1;
        if (isLinked) totals.externalLinked += 1;
      }
      else if (isLinked) totals.linked += 1;
      else {
        totals.unresolved += 1;
        findings.push({
          act: row.act[0],
          article: row.article[2],
          id: row.key,
          reference: match[0],
          text: row.text,
        });
      }
    }
  }
}

console.log(JSON.stringify({ totals, findings }, null, 2));
process.exitCode = findings.length ? 1 : 0;
