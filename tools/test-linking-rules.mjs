#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  createReferenceResolver,
  loadLegalData,
  referenceCandidates,
} from "./legal-content.mjs";

const rules = globalThis.__LEGAL_LINK_RULES__;
assert.ok(rules, "Brak reguł linkowania");

const externalExamples = [
  "art. 7 ust. 1 pkt 8 ustawy z dnia 20 lipca 2018 r. – Prawo o szkolnictwie wyższym i nauce",
  "art. 4 ust. 2 tej ustawy",
  "art. 5606 Kodeksu postępowania cywilnego",
  "art. 12 ust. 3 rozporządzenia Parlamentu Europejskiego i Rady",
];
for (const example of externalExamples) {
  const ranges = rules.externalReferenceRanges(example);
  const referenceLength = example.match(/^art\.\s*\d+[a-z]*(?:\s+(?:§|ust\.)\s*\d+[a-z]*)?(?:\s+pkt\s*\d+[a-z]*)?/i)[0].length;
  assert.equal(ranges.length, 1);
  assert.equal(ranges[0].start, 0);
  assert.ok(ranges[0].end >= referenceLength);
}
assert.deepEqual(rules.externalReferenceRanges("art. 4 ust. 2 niniejszej ustawy"), []);
assert.deepEqual(rules.externalReferenceRanges("art. 4 ust. 2"), []);

const dataPath = process.argv.find((arg) => arg.startsWith("--data="))?.slice(7) || "data.js";
const data = loadLegalData(dataPath);
const resolver = createReferenceResolver(data);
const screenshotText = "CLKP jest podmiotem określonym w art. 7 ust. 1 pkt 8 ustawy z dnia 20 lipca 2018 r. – Prawo o szkolnictwie wyższym i nauce i prowadzi badania naukowe, o których mowa w art. 4 ust. 2 tej ustawy, i prace rozwojowe, o których mowa w art. 4 ust. 3 tej ustawy, w zakresie, o którym mowa w ust. 2.";
const candidates = referenceCandidates(
  screenshotText,
  "uop-art-5d",
  "uop-art-5d-ust-3",
  "uop",
  resolver,
);
assert.deepEqual(candidates.map((candidate) => screenshotText.slice(candidate.start, candidate.end)), ["ust. 2"]);

console.log(JSON.stringify({
  externalExamples: externalExamples.length,
  screenshotCandidates: candidates.map((candidate) => screenshotText.slice(candidate.start, candidate.end)),
  status: "ok",
}, null, 2));
