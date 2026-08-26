import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadLegalData} from './legal-content.mjs';

const app=fs.readFileSync('app.js','utf8');
const appCss=fs.readFileSync('app.css','utf8');
const favoriteJs=fs.readFileSync('favorites-ui.js','utf8');
const favoriteCss=fs.readFileSync('favorites-ui.css','utf8');
const menuCss=fs.readFileSync('menu-hotfix.css','utf8');

assert.match(app,/class="toc is-collapsed"/);
assert.match(app,/id="tocgrid" hidden/);
assert.match(app,/>Spis Artykułów</);
assert.doesNotMatch(app,/Spis \+ tematy artykułów/);
assert.doesNotMatch(app,/class="topic"/);
assert.match(app,/function tocNumber\(/);
assert.match(app,/href="#\$\{R\[0\]\}"/);
assert.match(app,/<b>\$\{esc\(tocNumber\(R\[2\]\)\)\}<\/b>/);
assert.match(appCss,/minmax\(44px,1fr\)/);
assert.match(favoriteCss,/drawer-article\.is-favorite\.active/);
assert.match(favoriteCss,/drawer-article\.is-favorite\.active\{background:#eaf2ff;box-shadow:none/);
assert.match(menuCss,/body:not\(\.drawer-open\) \.section-no/);
assert.match(favoriteJs,/favorite-swipe-active/);
assert.match(favoriteCss,/body\.favorite-swipe-active\{position:fixed/);
assert.match(favoriteCss,/favorite-swipe-closing>\.favorite-swipe-action/);
assert.match(favoriteCss,/\.favorite-editor-bar\{position:fixed/);
assert.match(favoriteCss,/favorite-fragment-status\{[^}]*margin:5px 0 7px 6px/);
assert.match(favoriteJs,/M\.describe\(row\)\.length<=1/);
assert.match(favoriteJs,/captureEditorAnchor/);
assert.match(favoriteJs,/Wszystkie ustawy/);
assert.match(favoriteJs,/favorites-all-visible/);
assert.match(favoriteCss,/favorites-scope-popover/);
assert.match(favoriteCss,/favorites-all-law-title/);

const data=loadLegalData('data.js');
let links=0;
for(const act of data)for(const row of act[3]){
  assert.ok(row[0],`Brak identyfikatora linku w ${act[0]} ${row[2]}`);
  assert.equal(String(row[2]).replace(/^Art\.\s*/i,'').replace(/^§\s*/,''),String(row[2]).match(/^(?:Art\.|§)\s*(.*)$/i)?.[1]||String(row[2]));
  links++;
}

console.log(JSON.stringify({status:'ok',checks:23,activeArticleLinks:links},null,2));
