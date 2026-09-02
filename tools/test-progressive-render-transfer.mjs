#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import { loadLegalData } from "./legal-content.mjs";

const read = file => fs.readFileSync(file, "utf8");
const app = read("app.js");
const appCss = read("app.css");
const cleanup = read("cleanup.js");
const favorites = read("favorites-ui.js");
const transfer = read("favorites-transfer.js");
const index = read("index.html");
const nav = read("nav.js");
const settings = read("settings.js");
const serviceWorker = read("sw.js");
const ux = read("ux-fixes.js");

let checks = 0;
const match = (source, pattern, message) => { checks += 1; assert.match(source, pattern, message); };
const noMatch = (source, pattern, message) => { checks += 1; assert.doesNotMatch(source, pattern, message); };
const ok = (value, message) => { checks += 1; assert.ok(value, message); };

// The law body starts with a bounded window. More articles are appended or
// prepended during idle time before the user reaches either edge.
match(app, /const STREAM_INITIAL_COST=\d+,STREAM_TARGET_BEFORE_COST=\d+,STREAM_TARGET_AFTER_COST=\d+,STREAM_BATCH_COST=\d+/);
match(app, /function streamRange\(rows,target\)/);
match(app, /function startStream\(rows,target\)/);
match(app, /requestIdleCallback\(run,\{timeout:120\}\)/);
match(app, /new IntersectionObserver\(/);
match(app, /window\.addEventListener\('scroll'.*checkStreamMargins/s);
match(app, /state\.before\.after\(template\.content\)/);
match(app, /state\.after\.before\(template\.content\)/);
match(app, /window\.scrollBy\(0,delta\)/);
match(app, /id="lawStreamBefore"/);
match(app, /id="lawStreamAfter"/);
noMatch(app, /for\(const R of ACT\[3\]\)h\+=renderLegalArticle\(R,ACT\[0\]\)/);
match(appCss, /\.law-stream\{[^}]*overflow-anchor:none/);

// Deep links render the target window synchronously; the large table of
// contents remains lazy until it is explicitly expanded.
match(app, /function articleIdForTarget\(id\)/);
match(app, /renderAct\(code,id,false\)/);
match(app, /globalThis\.__POLICE_GOTO_ID=gotoLegalId/);
match(nav, /globalThis\.__POLICE_GOTO_ID\(id,\{smooth:true,alignTop:true\}\)/);
match(nav, /renderAct\(x\.act,x\.id,false\)/);
match(app, /o\.act!==ACT\[0\]\|\|!!\(o\.id&&!document\.getElementById\(o\.id\)\)/);
match(app, /function populateToc\(\)/);
match(app, /if\(show\)populateToc\(\)/);
match(app, /police-law-articles-rendered/);
match(cleanup, /police-law-articles-rendered/);
match(favorites, /police-law-articles-rendered/);
match(ux, /police-law-articles-rendered/);

// Split-view settings retain their context and intentionally differ from the
// full-view installation settings.
match(index, /data-full-only="true"[^>]*>.*Dostęp offline/s);
match(index, /data-full-only="true"[^>]*>.*Aplikacja PWA/s);
match(index, /id="favoritesTransfer"[^>]*data-split-only="true"|data-split-only="true"[^>]*id="favoritesTransfer"/);
match(index, /id="lawPackages"[^>]*data-split-only="true"|data-split-only="true"[^>]*id="lawPackages"/);
match(settings, /captureDrawerContext\(\)/);
match(settings, /restoreDrawerContext\(context\)/);
match(settings, /globalThis\.__POLICE_DRAWER_OPEN\?\.\(\)/);
match(settings, /section\.dataset\.fullOnly==='true'&&openedFromDrawer/);

// Favorites use a portable JSON file, native picker/share paths and explicit
// merge or replacement semantics. There is no redundant destructive warning.
match(index, /id="favoritesExport"/);
match(index, /id="favoritesImport"/);
match(index, /accept="\.json,application\/json"/);
match(index, /data-import-mode="merge"[^>]*>Dodaj do obecnych/);
match(index, /data-import-mode="replace"[^>]*>Zastąp obecne/);
noMatch(index, /Obecne ulubione zostaną usunięte/);
match(transfer, /FORMAT='policyjna-baza-ulubione',VERSION=1/);
match(transfer, /navigator\.canShare\?\.\(\{files:\[file\]\}\)/);
match(transfer, /fileInput\.click\(\)/);
match(transfer, /mode==='replace'\?pendingItems:merge/);
match(transfer, /function mergeParts\(current,incoming,row\)/);
match(transfer, /valid:merge\(\[\],valid\)/);
match(serviceWorker, /CACHE_VERSION='2026-09-02\.2'/);
match(serviceWorker, /'\.\/favorites-transfer\.js'/);

// Exercise the same bounded-cost contract against every real act. This is a
// data-size guard: even the 954-article KPK must not create its whole DOM on
// first paint.
const constants = app.match(/STREAM_INITIAL_COST=(\d+),STREAM_TARGET_BEFORE_COST=(\d+),STREAM_TARGET_AFTER_COST=(\d+),STREAM_BATCH_COST=(\d+)/);
ok(constants, "Brak budżetów renderowania strumieniowego");
const initialBudget = Number(constants[1]);
const visualCost = row => {
  const units = row?.[4] || [];
  const chars = units.reduce((sum, unit) => sum + String(unit?.[3] || "").length, 0);
  return Math.max(2, 1 + units.length + chars / 720);
};
const initialCount = rows => {
  let end = -1, cost = 0;
  while (end + 1 < rows.length && (end + 1 < 5 || cost < initialBudget)) {
    end += 1;
    cost += visualCost(rows[end]);
  }
  return end + 1;
};
const data = loadLegalData("data.js");
const windows = Object.fromEntries(data.map(act => [act[0], { initial: initialCount(act[3]), total: act[3].length }]));
for (const [code, value] of Object.entries(windows)) {
  ok(value.initial > 0 && value.initial <= value.total, `Niepoprawne okno startowe ${code}`);
  if (value.total >= 30) ok(value.initial < value.total, `Duża ustawa ${code} renderuje się w całości`);
}
ok(windows.kpk.total >= 900 && windows.kpk.initial <= 15, "KPK nie ma ograniczonego pierwszego widoku");

console.log(JSON.stringify({
  status: "ok",
  checks,
  windows,
  features: { progressiveLawDom: true, lazyToc: true, splitSettings: true, favoritesTransfer: true }
}, null, 2));
