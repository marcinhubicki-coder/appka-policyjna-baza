import assert from "node:assert/strict";import fs from "node:fs";import vm from "node:vm";
for(const file of ["app.js","reader-core.js","reader-settings.js","settings.js","favorites-ui.js","nav.js","law-config.js","law-data-loader.js","sw.js"]){new vm.Script(fs.readFileSync(file,"utf8"),{filename:file})}
const html=fs.readFileSync("index.html","utf8");assert.match(html,/law-manifest\.js/);assert.match(html,/document-manifest\.js/,"Brak manifestu dokumentów");assert.match(html,/law-data-loader\.js/);assert.match(html,/__LAW_USE_LEGACY/);
const app=fs.readFileSync("app.js","utf8");assert.match(app,/ensureEnabledSearchReady/);assert.match(app,/ensureDiscoveryReady/);assert.match(app,/Także w pozostałej bazie/);assert.match(app,/__POLICE_RUN_BENCHMARK/);assert.match(app,/documentGroups/);assert.match(app,/setPinnedOrder/);
const core=fs.readFileSync("reader-core.js","utf8");assert.match(core,/police-law-pinned-v1/);assert.match(core,/setPinned/);
const sw=fs.readFileSync("sw.js","utf8");assert.match(sw,/DOCUMENT_MANIFEST/);assert.match(sw,/LAW_MANIFEST\.router/);assert.match(sw,/LAW_MANIFEST\.discovery/);
console.log(JSON.stringify({status:"ok",runtime:"offline-packs-v3-documents-pins"},null,2));
