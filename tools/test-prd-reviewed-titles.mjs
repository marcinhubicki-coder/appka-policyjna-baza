#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import { loadLegalData } from "./legal-content.mjs";

const data = loadLegalData(process.argv.find((arg) => arg.startsWith("--data="))?.slice(7) || "data.js");
const reviewed = JSON.parse(fs.readFileSync(new URL("./prd-reviewed-titles.json", import.meta.url), "utf8"));
const prd = data.find((item) => item[0] === "prd");
const editorial = prd[3].filter((row) => row[8] !== "s");
const row = (id) => prd[3].find((item) => item[0] === id);

assert.equal(Object.keys(reviewed).length, 314);
assert.equal(editorial.length, 314);
for (const article of editorial) {
  assert.equal(article[3], reviewed[article[0]], `Niepoprawny tytuł ${article[0]}`);
  assert.ok(article[3].length <= 60, `Za długi tytuł ${article[0]}`);
  assert.doesNotMatch(article[3], /^(?:Kto|Jeżeli|W przypadku gdy|Minister właściwy|Przepisy? art\.)\b/u);
}

assert.equal(reviewed["prd-art-1"], "Zakres regulacji");
assert.equal(reviewed["prd-art-17"], "Włączanie się do ruchu");
assert.equal(reviewed["prd-art-24"], "Wyprzedzanie");
assert.equal(reviewed["prd-art-44"], "Postępowanie w razie wypadku");
assert.equal(reviewed["prd-art-65ja"], "Zawiadomienie o spotkaniu motoryzacyjnym");
assert.equal(reviewed["prd-art-65p"], "Dopuszczenie pojazdu sportowego do ruchu");
assert.equal(reviewed["prd-art-129c"], "Uprawnienia Straży Leśnej i Straży Parku");
assert.equal(row("prd-art-129")[3], "Uprawnienia Policji w kontroli ruchu drogowego");
assert.equal(row("prd-art-130a")[3], "Usuwanie pojazdów z drogi");
assert.equal(row("prd-art-129")[8], "s");

console.log(JSON.stringify({ status: "ok", reviewed: editorial.length }, null, 2));
