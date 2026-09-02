import assert from "node:assert/strict";
import fs from "node:fs";
import { loadLegalData } from "./legal-content.mjs";

const app = fs.readFileSync("app.js", "utf8");
const appCss = fs.readFileSync("app.css", "utf8");
const favoriteJs = fs.readFileSync("favorites-ui.js", "utf8");
const favoriteCss = fs.readFileSync("favorites-ui.css", "utf8");
const menuCss = fs.readFileSync("menu-hotfix.css", "utf8");
const tocLayout = fs.readFileSync("toc-layout-fix.js", "utf8");
const nav = fs.readFileSync("nav.js", "utf8");
const ux = fs.readFileSync("ux-fixes.js", "utf8");
const index = fs.readFileSync("index.html", "utf8");
const chapterTitles = fs.readFileSync("chapter-titles.js", "utf8");

assert.match(app, /class="toc is-collapsed"/);
assert.match(app, /id="tocgrid" hidden/);
assert.match(app, /function tocNumber\(/);
assert.match(app, /function articleHeading\(/);
assert.match(app, /function sectionHeading\(/);
assert.match(app, /data-title-origin="\$\{origin\}"/);
assert.match(app, /class="editorial-title is-\$\{origin\}"/);
assert.match(app, /data-compact-marker=/);
assert.match(app, /class="unit-star" type="button" data-article=/);
assert.match(app, /CustomEvent\('police-law-rendered'/);
assert.match(app, /renderAct\(target\?idMap\.get\(target\):'uop',target,false\)/);

assert.doesNotMatch(appCss, /content-visibility/);
assert.doesNotMatch(appCss, /contain-intrinsic-size/);
assert.match(appCss, /\.editorial-title\.is-editorial\{font-style:italic\}/);
assert.match(appCss, /\.editorial-title\.is-source\{font-style:normal\}/);
assert.match(menuCss, /body\.drawer-open \.drawer-article \.da-topic\{[^}]*font-style:normal!important/);
assert.match(menuCss, /\.section-title\.generated\{font-style:italic!important/);
assert.match(menuCss, /body\.drawer-open \.chapter-title\.generated\{font-style:normal!important/);
assert.doesNotMatch(index, /compact-markers\.js/);

assert.match(ux, /const rows=new Map\(\(ACT\?\.\[3\]\|\|\[\]\)\.map/);
assert.match(ux, /window\.addEventListener\('police-law-rendered',install\)/);
assert.doesNotMatch(ux, /observer\.observe\(view,\{childList:true,subtree:true\}\)/);
assert.match(tocLayout, /function schedule\(\)/);
assert.match(tocLayout, /if\(queued\)return;queued=true/);

assert.match(nav, /document\.elementFromPoint\(x,y\)/);
assert.doesNotMatch(nav, /while\(low<=high\)/);
assert.match(nav, /window\.addEventListener\('police-law-rendered',\(\)=>\{if\(drawer\?\.classList\.contains\('open'\)&&ready\(\)&&ACT\[0\]!==lastActCode\)populateDrawer\(\);installArticleBookmark\(\)\}\)/);
assert.doesNotMatch(nav, /new MutationObserver/);

assert.match(favoriteJs, /function ensureDataIndex\(\)/);
assert.match(favoriteJs, /actById\.set\(row\[0\],act\)/);
assert.match(favoriteJs, /if\(article\.querySelector\(':scope > \.favorite-swipe-action'\)\)updateSwipePanel/);
assert.match(favoriteJs, /function openSwipe\(article\)[\s\S]*?updateSwipePanel\(article,on\)/);
assert.match(favoriteJs, /button\.classList\.toggle\('on',on\);button\.textContent=on\?'★':'☆'/);
assert.match(favoriteJs, /window\.addEventListener\('police-law-rendered',scheduleRefresh\)/);
assert.match(favoriteJs, /window\.addEventListener\('police-law-drawer-rendered',scheduleRefresh\)/);
assert.match(favoriteJs, /window\.addEventListener\('police-law-stars-ready',scheduleRefresh\)/);
assert.doesNotMatch(favoriteJs, /new MutationObserver\(mutations=>/);
assert.match(favoriteJs, /favorite-swipe-active/);
assert.match(favoriteCss, /body\.favorite-swipe-active\{overscroll-behavior:none/);
assert.match(favoriteCss, /body\.favorite-swipe-active \.return,body\.favorite-swipe-active \.search-return\{display:none!important\}/);
assert.match(favoriteCss, /body\.favorite-swipe-nav-hidden \.article-pager\{display:none!important\}/);
assert.match(favoriteCss, /body\.favorite-editing #actview \.legal-unit:not\(\.favorite-edit-target\)/);
assert.match(favoriteCss, /favorite-swipe-balanced::before,\.legal-unit\.favorite-swipe-balanced::after/);
assert.match(favoriteJs, /const deltaWith=swipeScrollDelta\(rect,bounds\.top,withNav,minimum\),deltaWithout=swipeScrollDelta/);
assert.match(favoriteJs, /classList\.toggle\('favorite-swipe-nav-hidden',hideNav\)/);
assert.match(index, /src="chapter-titles\.js"/);
assert.match(chapterTitles, /"uop-art-1": "Przepisy ogólne"/);
assert.match(chapterTitles, /"kpk-art-45": "Oskarżyciel publiczny"/);
assert.match(app, /globalThis\.__POLICE_SCROLL_ARTICLE=scrollArticleStart/);

const data = loadLegalData("data.js");
let links = 0;
for (const act of data) for (const row of act[3]) {
  assert.ok(row[0], `Brak identyfikatora linku w ${act[0]} ${row[2]}`);
  links += 1;
}

console.log(JSON.stringify({ status: "ok", checks: 42, activeArticleLinks: links }, null, 2));
