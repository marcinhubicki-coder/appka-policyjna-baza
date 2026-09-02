import assert from "node:assert/strict";
import fs from "node:fs";

const read = file => fs.readFileSync(file, "utf8");
const app = read("app.js");
const appCss = read("app.css");
const index = read("index.html");
const settings = read("settings.js");
const nav = read("nav.js");
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
match(settings, /detail\.textContent=pluralHits\(item\.hits\)/);
noMatch(settings, /detail\.textContent=`\$\{item\.name\}/);
match(appCss, /body\.search-filters-active \.settings-button/);

// Starting a query from the open two-column favorites view narrows the
// indexed search to favorite article IDs. The scope is explicit and can be
// disabled without clearing the independently persisted act exclusions.
match(app, /document\.body\.classList\.contains\("drawer-open"\)&&api\?\.isActive\?\.\(\)/);
match(app, /favorites&&!favorites\.has\(item\.row\[0\]\)/);
match(app, /favoritesOnly:searchState\.favoritesOnly/);
match(app, /disableFavorites: disableFavoritesSearch|disableFavorites:disableFavoritesSearch/);
match(app, /enableFavorites: enableFavoritesSearch|enableFavorites:enableFavoritesSearch/);
match(index, /<strong[^>]*id="searchFavoritesNotice"[^>]*>Wyszukiwanie we wszystkich ustawach i artykułach\.<\/strong>/);
match(index, /id="searchFavoritesToggle"[^>]*>Szukaj tylko w ulubionych/);
match(index, /id="searchEnableAll"[^>]*>Resetuj filtry/);
match(settings, /api\.favoritesOnly\?\.\(\)/);
match(settings, /api\.disableFavorites\?\.\(\).*api\?\.enableFavorites\?\.\(\)/);
match(settings, /favoritesOnly\?'Wyszukiwanie wyłącznie w ulubionych artykułach\.':'Wyszukiwanie we wszystkich ustawach i artykułach\.'/);
match(settings, /favoritesOnly\?'Wyłącz ulubione':'Szukaj tylko w ulubionych'/);
match(settings, /enableAll\.disabled=items\.every\(item=>item\.enabled\)&&!favoritesOnly/);
match(settings, /__POLICE_SEARCH_FILTERS\?\.resetAll\?\.\(\)/);
match(app, /function resetSearchFilters\(\).*searchExcluded\.clear\(\).*searchFavoritesOnly=false.*favoritesSearchApi\(\)\?\.disable\?\.\(\)/);
match(app, /resetAll:resetSearchFilters/);
match(read("favorites-ui.js"), /__POLICE_FAVORITES_SEARCH=\{isActive:\(\)=>filter\|\|allActs,ids:/);
match(appCss, /\.search-filter-copy\{[^}]*display:flex[^}]*white-space:nowrap/);
match(appCss, /\.search-filter-actions\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
match(appCss, /\.search-filter-head strong\{[^}]*font-size:clamp\(8\.5px,2\.65vw,10\.5px\)[^}]*font-weight:800[^}]*white-space:nowrap/);

// A result jump preserves the exact search view: query, scroll position,
// loaded batches and the favorites scope. The dedicated bar restores it above
// the less important previous/next article pager.
match(index, /class="search-return" id="searchReturn"/);
match(index, /← Wróć do wyszukiwania/);
match(app, /function captureSearchReturn\(\).*scrollTop:results\.scrollTop.*html:results\.innerHTML.*groups:\[\.\.\.searchResultGroups\]/);
match(app, /captureSearchReturn\(\);closeSearch\(true\)/);
match(app, /results\.scrollTop=saved\.scrollTop/);
match(app, /emitSearchState\(true,new Map\(saved\.counts\)\)/);
match(appCss, /\.search-return\{bottom:calc\(66px \+ env\(safe-area-inset-bottom\)\);z-index:91\}/);

// During an active search the hamburger first clears the query/results, then
// performs its normal menu toggle. It cannot silently change the split view
// behind the search overlay.
match(app, /globalThis\.__POLICE_SEARCH_CLEAR=\(\)=>clearSearchInput\(false\)/);
match(nav, /if\(document\.body\.classList\.contains\('search-active'\)\)globalThis\.__POLICE_SEARCH_CLEAR\?\.\(\);drawer\?\.classList\.contains\('open'\)\?closeDrawer\(\):openDrawer\(\)/);
match(nav, /globalThis\.__POLICE_DRAWER_CLOSE=closeDrawer/);
match(settings, /openedFromDrawer=document\.body\.classList\.contains\('drawer-open'\)/);
noMatch(settings, /__POLICE_DRAWER_CLOSE/);

// Each act can progressively reveal more matches without rendering every hit
// up front. Batches contain 10 items, except that a 1–4 item tail is folded
// into the preceding batch.
match(app, /class="search-group-more" type="button" data-search-more=/);
match(app, /function nextSearchBatch\(remaining\)\{const normal=Math\.min\(10,remaining\);return remaining-normal>0&&remaining-normal<5\?remaining:normal\}/);
match(app, /group\.shown\+=batch/);
match(app, /button\.textContent=remainingResultText\(left\)/);
match(appCss, /\.search-group-more\{display:block;width:100%/);
const batchSource = app.match(/function nextSearchBatch\(remaining\)\{[^}]+\}/)?.[0];
assert.ok(batchSource, "Brak funkcji porcjowania wyników");
const nextSearchBatch = Function(`${batchSource};return nextSearchBatch`)();
assert.deepEqual(
  [0, 3, 7, 13, 14, 15, 17, 25].map(nextSearchBatch),
  [0, 3, 7, 13, 14, 10, 10, 10]
);
checks += 1;

// The split-view resize handle must never cover the fixed search overlay.
match(slider, /body\.search-active \.split-handle\{visibility:hidden!important;pointer-events:none!important\}/);

// PWA clients must receive the changed shell instead of keeping the previous
// cache-first build indefinitely.
match(serviceWorker, /CACHE_VERSION='2026-09-02\.5'/);

console.log(JSON.stringify({
  status: "ok",
  checks,
  search: { indexedOnceDuringIdleTime: true, groupedByAct: true, persistentFilters: true, favoritesScope: true },
  layering: { splitHandleHiddenDuringSearch: true }
}, null, 2));
