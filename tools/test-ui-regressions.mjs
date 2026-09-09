import assert from "node:assert/strict";
import fs from "node:fs";

const read = file => fs.readFileSync(file, "utf8");
const app = read("app.js");
const appCss = read("app.css");
const cleanup = read("cleanup.js");
const favorites = read("favorites-ui.js");
const favoritesCss = read("favorites-ui.css");
const index = read("index.html");
const menuHotfix = read("menu-hotfix.css");
const menuSync = read("menu-sync-fix.js");
const nav = read("nav.js");
const settings = read("settings.js");
const tocLayout = read("toc-layout-fix.js");
const ux = read("ux-fixes.js");

let checks = 0;
const match = (source, pattern) => { checks += 1; assert.match(source, pattern); };
const noMatch = (source, pattern) => { checks += 1; assert.doesNotMatch(source, pattern); };

// Geometry must remain equivalent to the last stable UI. Article containment
// changed the containing block of fixed controls and made distant offsets
// dependent on estimated heights.
noMatch(appCss, /content-visibility/);
noMatch(appCss, /contain-intrinsic-size/);
match(appCss, /scroll-margin-top:calc\(var\(--topH,72px\) \+ 8px\)/);
match(favoritesCss, /favorite-swipe-open>\.favorite-swipe-action[^}]*position:fixed/);
match(favoritesCss, /favorite-swipe-open\.favorite-swiping>:not\(\.favorite-swipe-action\)[^}]*var\(--favorite-swipe-x\)/);
match(favoritesCss, /favorite-swipe-open\.favorite-swiping>\.favorite-swipe-action[^}]*var\(--favorite-panel-x/);
match(favoritesCss, /body\.favorite-swipe-nav-hidden \.article-pager\{display:none!important\}/);
match(favoritesCss, /body\.favorite-editing #actview \.legal-unit:not\(\.favorite-edit-target\)/);
match(favoritesCss, /body\.favorite-editing #actview \.law-stream-sentinel/);
match(appCss, /html\.settings-open-root\{overflow:hidden!important/);
match(read('reader-ui.css'), /body\.reader-frozen,body\.drawer-open\.reader-frozen\{position:fixed!important/);
match(appCss, /body\.settings-open \.split-handle,body\.settings-open \.split-preview-pane\{display:none!important/);
match(settings, /openedFromDrawer=document\.body\.classList\.contains\('drawer-open'\)/);
match(settings, /function lockBackground\(\)/);
match(settings, /__READER_STATE\?\.lock\('settings',true\)/);
noMatch(settings, /__POLICE_DRAWER_CLOSE|captureDrawerContext|restoreDrawerContext/);
noMatch(favorites, /function syncLegacy\(\)\{[^}]*populateDrawer/);
match(favorites, /exitEditor\(true,true,false\)/);

// The favorite action can be dismissed with the inverse gesture from the
// article text. Its drag starts at the open -112 px position and reaches zero
// only while moving right; a short gesture snaps back to the open state.
match(favorites, /function swipeTarget\(target,x\).*article===activeArticle.*closing:true/);
match(favorites, /\.navrefs,\.favorite-swipe-action/);
match(favorites, /state\.closing\)\{if\(!cancelled&&state\.axis==='x'&&dx>52\)closeSwipe\(\)/);
match(favorites, /if\(state\.prepared\)\{if\(cancelled\|\|dx>=-52\)closeSwipe\(\)/);
match(favorites, /if\(!cancelled&&state\.axis==='x'\)suppressSwipeClickUntil=/);
match(favorites, /settleSwipe\(pointer,0,true\)/);
match(favorites, /Date\.now\(\)>=suppressSwipeClickUntil/);
const swipeOffsetSource = favorites.match(/function swipeOffset\(dx,closing\)\{[^}]+\}/)?.[0];
assert.ok(swipeOffsetSource, "Brak funkcji położenia gestu ulubionych");
const swipeOffset = Function(`${swipeOffsetSource};return swipeOffset`)();
assert.deepEqual([-180, -60, 0, 60].map(dx => swipeOffset(dx, false)), [-112, -60, 0, 0]);
assert.deepEqual([-60, 0, 60, 180].map(dx => swipeOffset(dx, true)), [-112, -112, -52, 0]);
checks += 3;

// The swipe panel only removes the pager when that avoids a scroll. Otherwise
// it keeps the pager, balances short articles and uses the smallest shift that
// can expose the complete action card.
match(favorites, /function swipeScrollDelta\(rect,top,bottom,height\)/);
match(favorites, /function balanceSwipeArticle\(article,height\)/);
match(favorites, /Math\.abs\(deltaWith\)>.5&&Math\.abs\(deltaWithout\)<=.5/);
match(favorites, /window\.scrollBy\(0,delta\)/);
const swipeDeltaSource = favorites.match(/function swipeScrollDelta\(rect,top,bottom,height\)\{[^}]+\}/)?.[0];
assert.ok(swipeDeltaSource, "Brak funkcji minimalnego przesunięcia kafla");
const swipeScrollDelta = Function(`${swipeDeltaSource};return swipeScrollDelta`)();
assert.equal(swipeScrollDelta({ top: 140, bottom: 400 }, 100, 700, 184), 0);
assert.equal(swipeScrollDelta({ top: 580, bottom: 900 }, 100, 700, 184), 64);
assert.equal(swipeScrollDelta({ top: -80, bottom: 230 }, 100, 700, 184), -54);
checks += 4;

// A favorite save must update storage, the article state and the visible star.
match(favorites, /CustomEvent\('police-law-favorites-change'\)/);
assert.match(favorites, /if\(button\.textContent!==star\)button\.textContent=star/);
match(favorites, /window\.addEventListener\('police-law-favorites-change',scheduleRefresh\)/);
match(favorites, /window\.addEventListener\('police-law-stars-ready',scheduleRefresh\)/);
match(nav, /function setBM\(x\).*CustomEvent\('police-law-favorites-change'\)/);
match(menuHotfix, /\.unit-star:not\(\.on\)\{visibility:hidden/);

// Navigation reads the real article under the reading line and uses one shared
// top-alignment path instead of estimated off-screen rectangles.
match(app, /globalThis\.__POLICE_SCROLL_ARTICLE=scrollArticleStart/);
match(app, /alignTop\|\|el\.matches\('\.legal-unit'\)/);
match(nav, /document\.elementFromPoint\(x,y\)/);
match(read('reader-state.js'), /document\.elementFromPoint\(x,y\)/);
match(nav, /globalThis\.__POLICE_SCROLL_ARTICLE\(id,false\)/);
noMatch(menuSync, /pinArticleToTop|settleHeaderAndArticle/);
noMatch(nav, /while\(low<=high\)/);
noMatch(menuSync, /while\(low<=high\)/);

// Render-time data replaces the old DOM repair loops without dropping their
// output: article prefixes, compact markers, title origin and refresh events.
match(app, /function articleHeading\(/);
match(app, /data-compact-marker=/);
match(app, /data-title-origin="\$\{origin\}"/);
match(app, /CustomEvent\('police-law-rendered'/);
noMatch(cleanup, /nodeValue\s*=|replaceWith|stripLegacyTail/);
match(nav, /window\.addEventListener\('police-law-rendered'/);
noMatch(ux, /patchChapters|MutationObserver/);
match(favorites, /window\.addEventListener\('police-law-rendered',scheduleRefresh\)/);
noMatch(index, /compact-markers\.js/);

// Performance contract retained from the optimized build: indexed lookups,
// lazy swipe panels, frame-batched updates and no broad favorites observer.
match(favorites, /function ensureDataIndex\(\)/);
match(favorites, /if\(article\.querySelector\(':scope > \.favorite-swipe-action'\)\)updateSwipePanel/);
match(favorites, /if\(refreshQueued\)return;refreshQueued=true;requestAnimationFrame/);
match(tocLayout, /police-law-favorites-drawer-rendered/);
noMatch(favorites, /new MutationObserver/);

const runtime = ["app.js", "cleanup.js", "favorites-ui.js", "menu-sync-fix.js", "nav.js", "search-ux-v2.js", "slider-preview-fix.js", "toc-layout-fix.js", "uop-summaries.js", "ux-fixes.js"];
const mutationObservers = runtime.reduce((sum, file) => sum + (read(file).match(/new MutationObserver/g)?.length || 0), 0);
checks += 1;
assert.ok(mutationObservers <= 6, `Za dużo aktywnych MutationObserver: ${mutationObservers}`);

console.log(JSON.stringify({
  status: "ok",
  checks,
  comparison: {
    stableUiMutationObservers: 13,
    candidateMutationObservers: mutationObservers,
    articleGeometry: "stable",
    indexedFavoriteLookups: true,
    batchedRefreshes: true
  }
}, null, 2));
