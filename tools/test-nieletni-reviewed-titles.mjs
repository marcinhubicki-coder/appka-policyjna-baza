#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import { loadLegalData } from "./legal-content.mjs";

const data = loadLegalData(process.argv.find((arg) => arg.startsWith("--data="))?.slice(7) || "data.js");
const reviewed = JSON.parse(fs.readFileSync(new URL("./nieletni-reviewed-titles.json", import.meta.url), "utf8"));
const act = data.find((item) => item[0] === "nieletni");
const editorial = act[3].filter((row) => row[8] !== "s");

assert.equal(Object.keys(reviewed).length, 384);
assert.equal(editorial.length, 384);
for (const article of editorial) {
  assert.equal(article[3], reviewed[article[0]], `Niepoprawny tytuł ${article[0]}`);
  assert.ok(article[3].length <= 55, `Za długi tytuł ${article[0]}`);
  assert.doesNotMatch(article[3], /^(?:Kto|Jeżeli|W przypadku gdy|Minister właściwy|Przepisy? art\.)\b/u);
}

assert.equal(reviewed["nieletni-art-6"], "Katalog środków wobec nieletniego");
assert.equal(reviewed["nieletni-art-35"], "Strony w postępowaniu");
assert.equal(reviewed["nieletni-art-50"], "Zatrzymanie w policyjnej izbie dziecka");
assert.equal(reviewed["nieletni-art-72"], "Demoralizacja lub czyn karalny w orzeczeniu");
assert.equal(reviewed["nieletni-art-107"], "Prawa nieletniego w placówce");
assert.equal(reviewed["nieletni-art-142"], "Przedmioty zakazane w placówkach dla nieletnich");
assert.equal(reviewed["nieletni-art-355"], "Doprowadzenie przez Policję na świadczenie zdrowotne");

console.log(JSON.stringify({ status: "ok", reviewed: editorial.length }, null, 2));
