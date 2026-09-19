import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

for(const file of ["app.js","reader-core.js","reader-settings.js","settings.js","favorites-ui.js","nav.js","law-config.js","law-data-loader.js","sw.js"]){
  const source=fs.readFileSync(file,"utf8");
  new vm.Script(source,{filename:file});
}
const html=fs.readFileSync("index.html","utf8");
assert.match(html,/law-manifest\.js/,"Brak manifestu w boot sequence");
assert.match(html,/law-data-loader\.js/,"Brak loadera paczek");
assert.match(html,/__LAW_USE_LEGACY/,"Brak awaryjnego trybu legacy");
const app=fs.readFileSync("app.js","utf8");
assert.match(app,/ensureEnabledSearchReady/,"Brak lazy search pack runtime");
assert.match(app,/ensureDiscoveryReady/,"Brak lazy discovery runtime");
assert.match(app,/Także w pozostałej bazie/,"Brak wyników katalogowych poza aktywną listą");
assert.match(app,/__POLICE_RUN_BENCHMARK/,"Brak benchmarku urządzenia");
const sw=fs.readFileSync("sw.js","utf8");
assert.match(sw,/LAW_ASSETS/,"Service worker nie zna paczek prawa");
assert.match(sw,/LAW_MANIFEST\.router/,"Router nie jest gwarantowany offline");
assert.match(sw,/LAW_MANIFEST\.discovery/,"Discovery nie jest gwarantowane offline");
console.log(JSON.stringify({status:"ok",runtime:"offline-packs-v1"},null,2));
