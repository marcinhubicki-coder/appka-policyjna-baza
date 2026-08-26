#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { loadLegalData } from "./legal-content.mjs";

const dataPath = process.argv.find((arg) => arg.startsWith("--data="))?.slice(7) || "data.js";
const app = fs.readFileSync("app.js", "utf8");
const prefixEnd = app.indexOf("function saveOrigin");
assert.ok(prefixEnd > 0, "Nie znaleziono końca funkcji linkify");

const element = {};
const context = vm.createContext({
  console,
  document: { getElementById: () => element },
  RAW_DATA: loadLegalData(dataPath),
  window: {},
});
context.window = context;
vm.runInContext(fs.readFileSync("linking-rules.js", "utf8"), context);
vm.runInContext(app.slice(0, prefixEnd), context);
vm.runInContext(`
  DATA = RAW_DATA;
  DATA.forEach(A => A[3].forEach(R => {
    articleMap.set(R[0], {act:A[0], r:R});
    idMap.set(R[0], A[0]);
    R[4].forEach((U, i) => {
      const key = U[0] || \`${"${R[0]}@@${i}"}\`;
      if (U[0]) { idMap.set(U[0], A[0]); unitMap.set(U[0], {act:A[0], article:R[0], u:U}); }
    });
  }));
`, context);

const screenshotText = "CLKP jest podmiotem określonym w art. 7 ust. 1 pkt 8 ustawy z dnia 20 lipca 2018 r. – Prawo o szkolnictwie wyższym i nauce i prowadzi badania naukowe, o których mowa w art. 4 ust. 2 tej ustawy, i prace rozwojowe, o których mowa w art. 4 ust. 3 tej ustawy, w zakresie, o którym mowa w ust. 2.";
context.TEST_TEXT = screenshotText;
const html = vm.runInContext("linkify(TEST_TEXT, 'uop-art-5d', 'uop-art-5d-ust-3', 'uop')", context);
const links = [...html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/g)].map((match) => ({
  href: match[1],
  text: match[2],
}));
assert.deepEqual(links, [{ href: "#uop-art-5d-ust-2", text: "ust. 2" }]);
assert.ok(!html.includes('href="#uop-art-7'), "Błędny link do art. 7 UoP");
assert.ok(!html.includes('href="#uop-art-4'), "Błędny link do art. 4 UoP");

context.TEST_TEXT = "kary wymienione w art. 32 pkt 1–3";
const rangeHtml = vm.runInContext("linkify(TEST_TEXT, 'kk-art-38', 'kk-art-38-par-1', 'kk')", context);
for (const point of [1, 2, 3]) {
  assert.ok(rangeHtml.includes(`href="#kk-art-32-pkt-${point}"`), `Brak linku do pkt ${point}`);
}

context.TEST_TEXT = "określonych w art. 134, art. 135 § 1 oraz art. 310 § 1, 2 i 4 Kodeksu karnego";
const externalSeriesHtml = vm.runInContext("linkify(TEST_TEXT, 'uop-art-19', 'uop-art-19-ust-1-pkt-2', 'uop')", context);
assert.ok(!externalSeriesHtml.includes("<a"), "Lista z obcego kodeksu została błędnie podlinkowana");

context.TEST_TEXT = "uprawnień, o których mowa w ust. 1 pkt 1, 2a, 3, pkt 3a lit. b–d, pkt 3b, 5a–7, 9 i 10";
const inheritedPointHtml = vm.runInContext("linkify(TEST_TEXT, 'uop-art-15', 'uop-art-15-ust-8', 'uop')", context);
for (const point of ["3b", "5a", "5b", "6", "7", "9", "10"]) {
  assert.ok(
    inheritedPointHtml.includes(`href="#uop-art-15-ust-1-pkt-${point}"`),
    `Brak odziedziczonego linku do ust. 1 pkt ${point}`,
  );
}

context.TEST_TEXT = "środki określone w art. 12 ust. 1 pkt 3 lub 4";
const otherArticlePointsHtml = vm.runInContext("linkify(TEST_TEXT, 'spb-art-35', 'spb-art-35-ust-6', 'spb')", context);
assert.ok(!otherArticlePointsHtml.includes('href="#spb-art-35-ust-1-pkt-'), "Punkty obcego art. 12 podlinkowano do art. 35");
for (const point of [3, 4]) {
  assert.ok(otherArticlePointsHtml.includes(`href="#spb-art-12-ust-1-pkt-${point}"`), `Brak linku do art. 12 ust. 1 pkt ${point}`);
}

context.TEST_TEXT = "w przypadkach z ust. 1 oraz na podstawie art. 44 pkt 4–8";
const interruptedScopeHtml = vm.runInContext("linkify(TEST_TEXT, 'nieletni-art-48', 'nieletni-art-48-ust-10', 'nieletni')", context);
assert.ok(!interruptedScopeHtml.includes('href="#nieletni-art-48-ust-1-pkt-4"'), "Kontekst ust. 1 nie został przerwany przez art. 44");
for (const point of [4, 5, 6, 7, 8]) {
  assert.ok(interruptedScopeHtml.includes(`href="#nieletni-art-44-pkt-${point}"`), `Brak linku do art. 44 pkt ${point}`);
}

console.log(JSON.stringify({ status: "ok", links }, null, 2));
