import assert from "node:assert/strict";
import fs from "node:fs";

const read = file => fs.readFileSync(file, "utf8");
const app = read("app.js");
const appCss = read("app.css");
const index = read("index.html");
const settings = read("settings.js");
const slider = read("slider-preview-fix.js");
const serviceWorker = read("sw.js");

let checks = 0;
const match = (source, pattern) => { checks += 1; assert.match(source, pattern); };
const noMatch = (source, pattern) => { checks += 1; assert.doesNotMatch(source, pattern); };

// Search text is normalized once during idle time. A query walks that compact
// index and does not rebuild article text on every keystroke.
match(app, /const searchIndex=\[\]/);
match(app, /searchIndex\.push\(\{act:A\[0\],row:R,text:null\}\)/);
match(app, /function searchText\(item\).*item\.text=norm\(/);
match(app, /requestIdleCallback\(warmSearchIndex/);
match(app, /for\(const item of searchIndex\)/);
const searchBody = app.slice(app.indexOf("function search(){"), app.indexOf("globalThis.__POLICE_SEARCH_REFRESH"));
noMatch(searchBody, /R\[4\]\.map\([^)]*=>[^)]*\[3\][^)]*\)\.join/);
match(app, /setTimeout\(search,140\)/);

// Results are grouped by act, and the quickbar temporarily becomes a hit map
// whose buttons jump to the corresponding group.
match(app, /class="search-act-heading" id="search-act-\$\{esc\(group\.act\)\}"/);
match(app, /class="search-group" data-search-act=/);
match(app, /globalThis\.__POLICE_SEARCH_GOTO_ACT=gotoSearchAct/);
match(app, /search-has-hit","search-no-hit","search-excluded/);
match(appCss, /body\.search-active \.quickbar\{display:flex!important\}/);
match(appCss, /\.search-act-heading\{position:sticky/);
match(index, /id="results" role="region"/);

// Exclusions are persistent, have an accessible toggle UI, and visibly mark
// the gear while any act is omitted.
match(app, /police-law-search-excluded-v1/);
match(app, /localStorage\.setItem\(SEARCH_FILTER_KEY/);
match(app, /__POLICE_SEARCH_FILTERS=\{list:searchActList,setEnabled:setSearchActEnabled,enableAll\(\)/);
match(index, /id="searchSettings"[^>]*hidden/);
match(index, /id="searchActFilters"/);
match(index, /id="searchEnableAll"/);
match(settings, /Filtry wyszukiwania/);
match(settings, /toggle\.type='checkbox'/);
match(settings, /api\.setEnabled\(item\.code,toggle\.checked\)/);
match(appCss, /body\.search-filters-active \.settings-button/);

// The split-view resize handle must never cover the fixed search overlay.
match(slider, /body\.search-active \.split-handle\{visibility:hidden!important;pointer-events:none!important\}/);

// PWA clients must receive the changed shell instead of keeping the previous
// cache-first build indefinitely.
match(serviceWorker, /CACHE_VERSION='2026-09-01\.1'/);

console.log(JSON.stringify({
  status: "ok",
  checks,
  search: { indexedOnceDuringIdleTime: true, groupedByAct: true, persistentFilters: true },
  layering: { splitHandleHiddenDuringSearch: true }
}, null, 2));
