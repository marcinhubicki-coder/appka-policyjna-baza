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
let uniqueArticleTitles = 0;
let editorialEllipses = 0;
for (const act of DATA) {
  let previousSection = Symbol("initial");
  const titleCounts = new Map();
  for (const row of act[3]) {
    articles += 1;
    assert.equal(row._editorialSummary, true, `${row[0]} nie ma oznaczenia podsumowania`);
    assert.ok(row[3].trim(), `${row[0]} ma pusty opis`);
    assert.ok(row[3].length <= 82, `${row[0]} ma zbyt długi opis (${row[3].length})`);
    assert.match(row[3], /[.!?…]$/, `${row[0]} nie ma domkniętej interpunkcji`);
    assert.doesNotMatch(row[3], /^(?:Kto|Nie|Przepisy? art)\.$/i, `${row[0]} ma pusty lub urwany temat`);
    assert.doesNotMatch(row[3], /\b(?:art|ust|pkt|lit|Dz|poz|nr)\.?…$/i, `${row[0]} urywa się na oznaczeniu prawnym`);
    titleCounts.set(row[3], (titleCounts.get(row[3]) || 0) + 1);
    if (row[3].endsWith("…")) editorialEllipses += 1;
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
  uniqueArticleTitles += titleCounts.size;
  for (const [title, count] of titleCounts) {
    if (/^(?:Przepis uchylony|Przepis pominięty|Zmiana przyszła)/.test(title)) continue;
    assert.ok(count <= 8, `${act[0]} powtarza ogólny tytuł ${count} razy: ${title}`);
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
  "Zmiana dopuszczalnej prędkości za pomocą znaków.",
);
assert.equal(
  prd[3].find((row) => row[0] === "prd-art-2")[3],
  "Definicje pojęć użytych w ustawie.",
);
assert.equal(DATA.find((act) => act[0] === "uop")[3].find((row) => row[0] === "uop-art-14")[3], "Formy wykonywania czynności przez Policję.");
assert.equal(DATA.find((act) => act[0] === "kw")[3].find((row) => row[0] === "kw-art-51")[3], "Zakłócanie spokoju i porządku publicznego.");
assert.equal(DATA.find((act) => act[0] === "kk")[3].find((row) => row[0] === "kk-art-148")[3], "Zabójstwo.");
assert.equal(DATA.find((act) => act[0] === "kpk")[3].find((row) => row[0] === "kpk-art-244")[3], "Zatrzymanie osoby.");
assert.equal(DATA.find((act) => act[0] === "z805")[3].find((row) => row[0] === "z805-par-22")[3], "Doskonalenie wiedzy, umiejętności i sprawności fizycznej.");
assert.equal(prd[3].find((row) => row[0] === "prd-art-76")[3], "Rozporządzenia dotyczące rejestracji, dokumentów i tablic pojazdów.");
assert.equal(prd[3].find((row) => row[0] === "prd-art-78a")[3], "Czasowe wycofanie pojazdu z ruchu.");
assert.equal(prd[3].find((row) => row[0] === "prd-art-86a")[3], "Przepis uchylony.");

console.log(JSON.stringify({ status: "ok", acts: DATA.length, articles, uniqueArticleTitles, editorialEllipses, generatedChapterTitles }, null, 2));
