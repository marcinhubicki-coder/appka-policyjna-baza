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

// A favorite save must update storage, the article state and the visible star.
match(favorites, /CustomEvent\('police-law-favorites-change'\)/);
match(favorites, /button\.classList\.toggle\('on',on\);button\.textContent=on\?'★':'☆'/);
match(favorites, /window\.addEventListener\('police-law-favorites-change',scheduleRefresh\)/);
match(favorites, /window\.addEventListener\('police-law-stars-ready',scheduleRefresh\)/);
match(nav, /function setBM\(x\).*CustomEvent\('police-law-favorites-change'\)/);
match(menuHotfix, /\.unit-star:not\(\.on\)\{visibility:hidden/);

// Navigation reads the real article under the reading line and uses one shared
// top-alignment path instead of estimated off-screen rectangles.
match(app, /globalThis\.__POLICE_SCROLL_ARTICLE=scrollArticleStart/);
match(app, /alignTop\|\|el\.matches\('\.legal-unit'\)/);
match(nav, /document\.elementFromPoint\(x,y\)/);
match(menuSync, /document\.elementFromPoint\(x,y\)/);
match(nav, /globalThis\.__POLICE_SCROLL_ARTICLE\(id,true\)/);
match(menuSync, /globalThis\.__POLICE_SCROLL_ARTICLE\(id,false\)/);
noMatch(nav, /while\(low<=high\)/);
noMatch(menuSync, /while\(low<=high\)/);

// Render-time data replaces the old DOM repair loops without dropping their
// output: article prefixes, compact markers, title origin and refresh events.
match(app, /function articleHeading\(/);
match(app, /data-compact-marker=/);
match(app, /data-title-origin="\$\{origin\}"/);
match(app, /CustomEvent\('police-law-rendered'/);
match(cleanup, /window\.addEventListener\("police-law-rendered"/);
match(nav, /window\.addEventListener\('police-law-rendered'/);
match(ux, /window\.addEventListener\('police-law-rendered',install\)/);
match(favorites, /window\.addEventListener\('police-law-rendered',scheduleRefresh\)/);
noMatch(index, /compact-markers\.js/);

// Performance contract retained from the optimized build: indexed lookups,
// lazy swipe panels, frame-batched updates and no broad favorites observer.
match(favorites, /function ensureDataIndex\(\)/);
match(favorites, /if\(article\.querySelector\(':scope > \.favorite-swipe-action'\)\)updateSwipePanel/);
match(favorites, /if\(refreshQueued\)return;refreshQueued=true;requestAnimationFrame/);
match(tocLayout, /if\(queued\)return;queued=true/);
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
