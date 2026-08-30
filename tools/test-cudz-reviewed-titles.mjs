#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import { loadLegalData } from "./legal-content.mjs";

const data = loadLegalData(process.argv.find((arg) => arg.startsWith("--data="))?.slice(7) || "data.js");
const reviewed = JSON.parse(fs.readFileSync(new URL("./cudz-reviewed-titles.json", import.meta.url), "utf8"));
const cudz = data.find((item) => item[0] === "cudz");
const editorial = cudz[3].filter((row) => row[8] !== "s");

assert.equal(Object.keys(reviewed).length, 637);
assert.equal(editorial.length, 637);
for (const article of editorial) {
  assert.equal(article[3], reviewed[article[0]], `Niepoprawny tytuł ${article[0]}`);
  assert.ok(article[3].length <= 55, `Za długi tytuł ${article[0]}`);
  assert.doesNotMatch(article[3], /^(?:Kto|Jeżeli|W przypadku gdy|Minister właściwy|Przepisy? art\.)\b/u);
}

assert.equal(reviewed["cudz-art-35"], "Zatrzymanie za nielegalne przekroczenie granicy");
assert.equal(reviewed["cudz-art-109"], "Zagrożenie bezpieczeństwa a pobyt czasowy");
assert.equal(reviewed["cudz-art-139a"], "Pobyt czasowy pracownika przeniesionego w ramach ICT");
assert.equal(reviewed["cudz-art-289"], "Kontrola legalności pobytu");
assert.equal(reviewed["cudz-art-329"], "Przymusowe wykonanie decyzji powrotowej");
assert.equal(reviewed["cudz-art-398"], "Środki alternatywne do detencji cudzoziemca");
assert.equal(reviewed["cudz-art-465"], "Nielegalny pobyt");

console.log(JSON.stringify({ status: "ok", reviewed: editorial.length }, null, 2));
