import assert from "node:assert/strict";
import fs from "node:fs";

const read = file => fs.readFileSync(file, "utf8");
const app = read("app.js");
const favorites = read("favorites-ui.js");
const index = read("index.html");
const nav = read("nav.js");
const settings = read("settings.js");
const serviceWorker = read("sw.js");

let checks = 0;
const match = (source, pattern) => { checks += 1; assert.match(source, pattern); };
const noMatch = (source, pattern) => { checks += 1; assert.doesNotMatch(source, pattern); };
const ok = (value, message) => { checks += 1; assert.ok(value, message); };

// The boot clock starts before the monolithic data resource, while metrics are
// kept in-memory and emitted only as lightweight events.
const bootMark = index.indexOf("globalThis.__POLICE_BOOT_AT=performance.now()");
const dataScript = index.indexOf('<script src="data.js"></script>');
ok(bootMark >= 0 && bootMark < dataScript, "Pomiar startu musi poprzedzać data.js");
match(app, /globalThis\.__POLICE_PERF=PERF/);
match(app, /dataDecodeMs:decodedAt-decodeStarted/);
match(app, /lookupBuildMs:completedAt-lookupStarted/);
match(app, /initialReadyMs=paintedAt-PERF\.state\.startedAt/);
match(app, /searchReadyMs:PERF\.now\(\)-PERF\.state\.startedAt/);

// Drawer content is absent after shell construction. It is created on first
// open and refreshed after a law changes only while actually visible.
match(nav, /function openDrawer\(\).*if\(!allActs&&!normalReady\)populateDrawer\(\)/);
noMatch(nav, /bottomNav\.querySelector\('\.next'\)\.onclick=.*?populateDrawer\(\);syncHamburger\(\)/s);
match(nav, /police-law-rendered'.*drawer\?\.classList\.contains\('open'\).*populateDrawer\(\)/);
match(nav, /CustomEvent\('police-law-drawer-rendered'/);
match(favorites, /police-law-drawer-rendered',scheduleRefresh/);

// Diagnostics are available from the two-column settings context without
// replacing the search-filter mode.
match(index, /id="performanceDiagnostics"[^>]*data-split-only="true"|data-split-only="true"[^>]*id="performanceDiagnostics"/);
match(index, /id="performanceMetrics"/);
match(settings, /openedFromDrawer=document\.body\.classList\.contains\('drawer-open'\)/);
match(settings, /section\.dataset\.splitOnly==='true'&&!openedFromDrawer/);
match(settings, /police-law-performance/);
match(serviceWorker, /CACHE_VERSION='2026-09-02\.1'/);

console.log(JSON.stringify({
  status: "ok",
  checks,
  performance: { bootMetrics: true, splitDiagnostics: true, lazyDrawer: true }
}, null, 2));
