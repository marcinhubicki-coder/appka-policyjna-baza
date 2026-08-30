#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import { loadLegalData } from "./legal-content.mjs";

const dataPath = process.argv.find((arg) => arg.startsWith("--data="))?.slice(7) || "data.js";
const data = loadLegalData(dataPath);
const reviewed = JSON.parse(fs.readFileSync(new URL("./kpk-reviewed-titles.json", import.meta.url), "utf8"));
const act = data.find((item) => item[0] === "kpk");
const editorial = act[3].filter((article) => article[8] !== "s");
const row = (id) => act[3].find((article) => article[0] === id);

assert.equal(Object.keys(reviewed).length, 954);
assert.equal(editorial.length, 954);
for (const article of editorial) {
  assert.equal(article[3], reviewed[article[0]], `Niepoprawny tytuł ${article[0]}`);
  assert.ok(article[3].length <= 55, `Za długi tytuł ${article[0]}`);
  assert.doesNotMatch(article[3], /^(?:Kto|Jeżeli|W przypadku gdy|Minister właściwy|Przepisy? art\.)\b/u);
}

const duplicateTitles = new Map();
for (const [id, title] of Object.entries(reviewed)) {
  const ids = duplicateTitles.get(title) || [];
  ids.push(id);
  duplicateTitles.set(title, ids);
}
for (const [title, ids] of duplicateTitles) {
  if (ids.length > 1) assert.equal(title, "Przepis uchylony", `Powtórzona ogólna nazwa: ${title}`);
}

assert.equal(reviewed["kpk-art-100b"], "System teleinformatyczny Ministerstwa Sprawiedliwości");
assert.equal(reviewed["kpk-art-131a"], "Fikcja doręczenia elektronicznego po 14 dniach");
assert.equal(reviewed["kpk-art-258"], "Przesłanki tymczasowego aresztowania");
assert.equal(reviewed["kpk-art-321"], "Końcowe zaznajomienie z materiałami postępowania");
assert.equal(reviewed["kpk-art-387"], "Dobrowolne poddanie się karze");
assert.equal(reviewed["kpk-art-607ya"], "Zgoda państwa obcego na przekazanie w ramach ENA");

assert.equal(row("kpk-art-217")[3], "Wydanie rzeczy");
assert.equal(row("kpk-art-219")[3], "Przeszukanie");
assert.equal(row("kpk-art-244")[3], "Zatrzymanie osoby");
assert.equal(row("kpk-art-308")[3], "Czynności w niezbędnym zakresie");
for (const id of ["kpk-art-217", "kpk-art-219", "kpk-art-220", "kpk-art-244", "kpk-art-308"]) {
  assert.equal(row(id)[8], "s", `${id} powinien zachować tytuł źródłowy`);
}

console.log(JSON.stringify({ status: "ok", reviewed: editorial.length }, null, 2));
