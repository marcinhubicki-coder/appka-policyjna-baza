#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import { loadLegalData } from "./legal-content.mjs";

const data = loadLegalData(process.argv.find((arg) => arg.startsWith("--data="))?.slice(7) || "data.js");
const reviewed = JSON.parse(fs.readFileSync(new URL("./kk-reviewed-titles.json", import.meta.url), "utf8"));
const act = data.find((item) => item[0] === "kk");
const editorial = act[3].filter((row) => row[8] !== "s");
const row = (id) => act[3].find((article) => article[0] === id);

assert.equal(Object.keys(reviewed).length, 445);
assert.equal(editorial.length, 445);
for (const article of editorial) {
  assert.equal(article[3], reviewed[article[0]], `Niepoprawny tytuł ${article[0]}`);
  assert.ok(article[3].length <= 55, `Za długi tytuł ${article[0]}`);
  assert.doesNotMatch(article[3], /^(?:Kto|Jeżeli|W przypadku gdy|Minister właściwy|Przepisy? art\.)\b/u);
}

assert.equal(reviewed["kk-art-1"], "Odpowiedzialność karna");
assert.equal(reviewed["kk-art-33"], "Grzywna");
assert.equal(reviewed["kk-art-64a"], "Recydywa przestępstw seksualnych");
assert.equal(reviewed["kk-art-190a"], "Stalking");
assert.equal(reviewed["kk-art-191a"], "Naruszenie intymności seksualnej");
assert.equal(reviewed["kk-art-178c"], "Nielegalny wyścig pojazdów mechanicznych");
assert.equal(reviewed["kk-art-178d"], "Brawurowa jazda");
assert.equal(reviewed["kk-art-289"], "Krótkotrwały zabór pojazdu");
assert.equal(row("kk-art-148")[3], "Zabójstwo");
assert.equal(row("kk-art-280")[3], "Rozbój");
assert.equal(row("kk-art-280")[8], "s");

console.log(JSON.stringify({ status: "ok", reviewed: editorial.length }, null, 2));
