#!/usr/bin/env node
import assert from "node:assert/strict";
import { loadLegalData } from "./legal-content.mjs";

const dataPath = process.argv.find((arg) => arg.startsWith("--data="))?.slice(7) || "data.js";
const data = loadLegalData(dataPath);
const act = (code) => data.find((item) => item[0] === code);
const article = (code, id) => act(code)[3].find((item) => item[0] === id);
const unit = (code, articleId, unitId) => article(code, articleId)[4].find((item) => item[0] === unitId);
const text = (code, articleId, unitId) => unit(code, articleId, unitId)?.[3];

assert.equal(article("kw", "kw-art-52aa")[3], "Nielegalny zlot lub udział w nielegalnym wyścigu");
assert.match(text("kw", "kw-art-52aa", "kw-art-52aa-par-4"), /jako widz, uczestniczy/u);
assert.equal(article("kw", "kw-art-86c")[3], "Driftowanie na drodze publicznej");

assert.equal(article("kk", "kk-art-178c")[3], "Nielegalny wyścig pojazdów mechanicznych");
assert.equal(article("kk", "kk-art-178d")[3], "Brawurowa jazda");
assert.match(article("kk", "kk-art-178d")[4][0][3], /^Kto prowadzi pojazd mechaniczny rażąco przekraczając/u);
assert.match(text("kk", "kk-art-42", "kk-art-42-par-1a"), /art\. 178c § 1 pkt 2, art\. 178d/u);

assert.ok(unit("kpk", "kpk-art-607k", "kpk-art-607k-par-6"));
assert.ok(unit("kpk", "kpk-art-607k", "kpk-art-607k-par-7"));
assert.match(text("kpk", "kpk-art-607t", "kpk-art-607t-par-1"), /ma miejsce zamieszkania lub stale przebywa/u);
assert.equal(article("kpk", "kpk-art-607ya")[3], "Zgoda państwa obcego na przekazanie w ramach ENA");
assert.match(text("kpk", "kpk-art-607ya", "kpk-art-607ya-par-2"), /ulega on zawieszeniu do czasu uzyskania zgody\.$/u);
assert.doesNotMatch(text("kpk", "kpk-art-607m", "kpk-art-607m-par-3"), /^W wypadku,/u);

assert.ok(unit("prd", "prd-art-60", "prd-art-60-ust-5-pkt-2"));
assert.equal(article("prd", "prd-art-65ja")[3], "Zawiadomienie o spotkaniu motoryzacyjnym");
assert.ok(unit("prd", "prd-art-135", "prd-art-135-ust-1-pkt-2-lit-c"));
assert.ok(unit("prd", "prd-art-135a", "prd-art-135a-ust-1-pkt-2-lit-c"));

assert.match(text("kpow", "kpow-art-45", "kpow-art-45-par-1"), /^Policja i Straż Graniczna mają prawo/u);
assert.ok(unit("kpow", "kpow-art-96", "kpow-art-96-par-1e"));
assert.ok(unit("kpow", "kpow-art-98", "kpow-art-98-par-6"));

console.log(JSON.stringify({ status: "ok", amendments: 2, newArticles: 6 }, null, 2));
