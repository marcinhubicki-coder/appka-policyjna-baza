#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { loadLegalData } from "./legal-content.mjs";

const dataPath = process.argv.find((arg) => arg.startsWith("--data="))?.slice(7) || "data.js";
const DATA = loadLegalData(dataPath);
const context = vm.createContext({ DATA });
vm.runInContext(fs.readFileSync("chapter-titles.js", "utf8"), context);
vm.runInContext(fs.readFileSync("uop-summaries.js", "utf8"), context);

let articles = 0;
let source = 0;
let editorial = 0;
let generatedChapterTitles = 0;
const fullyReviewedActs = new Set(["uop", "kw", "kk", "kpk", "kpow", "spb", "prd", "cudz", "nieletni", "z768", "z360", "z805"]);

for (const act of DATA) {
  let previousSection = Symbol("initial");
  let previousSectionTitle = "";
  for (const row of act[3]) {
    articles += 1;
    assert.ok(row[3].trim(), `${row[0]} ma pustą nazwę`);
    assert.ok(row[8] === "s" || row[8] === "e", `${row[0]} nie ma pochodzenia nazwy`);
    assert.doesNotMatch(row[3], /…/, `${row[0]} ma zapisany wielokropek`);
    assert.equal(context.__EDITORIAL.isEditorial(row), row[8] !== "s");
    if (fullyReviewedActs.has(act[0])) {
      assert.ok(row[3].length <= 60, `${row[0]} ma zbyt długą nazwę (${row[3].length})`);
    }
    if (row[8] === "s") source += 1;
    else editorial += 1;

    const section = context.__EDITORIAL.sectionInfo(row, act[0]);
    assert.ok(section.prefix.trim(), `${row[0]} nie ma numeru działu lub rozdziału`);
    assert.ok(section.title.trim(), `${row[0]} nie ma nazwy działu lub rozdziału`);
    const rawSection = String(row[1] || "").trim();
    if (/^Rozdział\s+\d/i.test(rawSection)) {
      assert.doesNotMatch(section.prefix, /^Rozdział\s+\d/i, `${row[0]} zachował arabską numerację rozdziału`);
    }
    if (rawSection !== previousSection) {
      const hasSourceTitle = /^(?:DZIAŁ|ROZDZIAŁ|ODDZIAŁ)\s+[IVXLCDM0-9]+(?:[A-Z])?\)?\s*[.:-]\s*\S/i.test(rawSection);
      if (!hasSourceTitle) generatedChapterTitles += 1;
      previousSection = rawSection;
      previousSectionTitle = section.title;
    } else {
      assert.equal(section.title, previousSectionTitle, `${row[0]} zmienia tytuł w obrębie tego samego rozdziału`);
    }
  }
}

const row = (act, id) => DATA.find((item) => item[0] === act)[3].find((item) => item[0] === id);
assert.equal(row("kk", "kk-art-280")[3], "Rozbój");
assert.equal(row("kpow", "kpow-art-45")[3], "Zatrzymanie sprawcy wykroczenia");
assert.equal(row("uop", "uop-art-15")[3], "Podstawowe uprawnienia policjantów");
assert.equal(row("kw", "kw-art-65")[3], "Wprowadzanie w błąd organu lub instytucji");
assert.equal(row("kw", "kw-art-77")[3], "Niezachowanie ostrożności przy trzymaniu zwierzęcia");
assert.equal(row("kw", "kw-art-86")[3], "Zagrożenie bezpieczeństwa w ruchu drogowym");
assert.equal(row("kw", "kw-art-121")[3], "Szalbierstwo");
assert.equal(row("spb", "spb-art-15")[3], "Kajdanki");
assert.equal(row("z360", "z360-par-11")[3], "Obowiązki konwojenta");
assert.equal(row("z805", "z805-par-11")[3], "Zakaz korupcji");
assert.equal(row("uop", "uop-art-15")[8], "s");
assert.equal(row("kpow", "kpow-art-45")[8], "e");
assert.equal(context.__EDITORIAL.toRoman(14), "XIV");
assert.deepEqual(
  { ...context.__EDITORIAL.sectionInfo(row("uop", "uop-art-3a"), "uop") },
  { prefix: "Rozdział I", title: "Przepisy ogólne", generated: false }
);
assert.equal(context.__EDITORIAL.sectionInfo(row("kpk", "kpk-art-46"), "kpk").title, "Oskarżyciel publiczny");
assert.equal(context.__EDITORIAL.sectionInfo(row("kpow", "kpow-art-46"), "kpow").title, "Zatrzymanie");
assert.deepEqual(
  { ...context.__EDITORIAL.sectionInfo(row("z360", "z360-par-1"), "z360") },
  { prefix: "Rozdział I", title: "Przepisy ogólne", generated: false }
);
assert.doesNotMatch(fs.readFileSync("uop-summaries.js", "utf8"), /MutationObserver|for\s*\(const act of DATA\)|row\[3\]\s*=/);

console.log(JSON.stringify({ status: "ok", acts: DATA.length, articles, source, editorial, generatedChapterTitles }, null, 2));
