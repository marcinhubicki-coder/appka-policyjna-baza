#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { loadLegalData } from "./legal-content.mjs";

const dataPath = process.argv.find((arg) => arg.startsWith("--data="))?.slice(7) || "data.js";
const DATA = loadLegalData(dataPath);
const context = vm.createContext({ DATA });
vm.runInContext(fs.readFileSync("uop-summaries.js", "utf8"), context);

let articles = 0;
let generatedChapterTitles = 0;
for (const act of DATA) {
  let previousSection = Symbol("initial");
  for (const row of act[3]) {
    articles += 1;
    assert.equal(row._editorialSummary, true, `${row[0]} nie ma oznaczenia podsumowania`);
    assert.ok(row[3].trim(), `${row[0]} ma pusty opis`);
    assert.ok(row[3].length <= 90, `${row[0]} ma zbyt długi opis (${row[3].length})`);
    assert.ok(context.__EDITORIAL.chapterSuggestion(act[0], row).trim(), `${row[0]} nie daje tytułu rozdziału`);
    const rawSection = String(row[1] || "").trim();
    const section = context.__EDITORIAL.sectionInfo(row, act[0]);
    assert.ok(section.prefix.trim(), `${row[0]} nie ma etykiety działu lub rozdziału`);
    assert.ok(section.title.trim(), `${row[0]} nie ma tytułu działu lub rozdziału`);
    if (/^Rozdział\s+\d/i.test(rawSection)) {
      assert.doesNotMatch(section.prefix, /^Rozdział\s+\d/i, `${row[0]} zachował arabską numerację rozdziału`);
    }
    if (rawSection !== previousSection) {
      const hasSourceTitle = /^(?:DZIAŁ|ROZDZIAŁ|ODDZIAŁ)\s+[IVXLCDM0-9]+(?:[A-Z])?\)?\s*[.:-]\s*\S/i.test(rawSection);
      if (!hasSourceTitle) generatedChapterTitles += 1;
      previousSection = rawSection;
    }
  }
}

const prd = DATA.find((act) => act[0] === "prd");
const z360 = DATA.find((act) => act[0] === "z360");
const z360Chapter = context.__EDITORIAL.sectionInfo(z360[3].find((row) => /^Rozdział 2\b/.test(row[1])), "z360");
assert.equal(z360Chapter.prefix, "Rozdział II");
assert.equal(z360Chapter.title, "Wykonywanie konwojów osób");
assert.equal(context.__EDITORIAL.toRoman(14), "XIV");
assert.equal(
  prd[3].find((row) => row[0] === "prd-art-21")[3],
  "Dopuszczalna prędkość i zasady jej ustalania.",
);
assert.equal(
  prd[3].find((row) => row[0] === "prd-art-2")[3],
  "Definicje pojęć użytych w akcie.",
);

console.log(JSON.stringify({ status: "ok", acts: DATA.length, articles, generatedChapterTitles }, null, 2));
