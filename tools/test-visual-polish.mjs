import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=fs.readFileSync('app.js','utf8');
const appCss=fs.readFileSync('app.css','utf8');
const favoriteJs=fs.readFileSync('favorites-ui.js','utf8');
const favoriteCss=fs.readFileSync('favorites-ui.css','utf8');
const menuCss=fs.readFileSync('menu-hotfix.css','utf8');

assert.match(app,/class="toc is-collapsed"/);
assert.match(app,/id="tocgrid" hidden/);
assert.match(app,/>Spis artykułów</);
assert.doesNotMatch(app,/Spis \+ tematy artykułów/);
assert.doesNotMatch(app,/class="topic"/);
assert.match(appCss,/minmax\(50px,1fr\)/);
assert.match(favoriteCss,/drawer-article\.is-favorite\.active/);
assert.match(menuCss,/body:not\(\.drawer-open\) \.section-no/);
assert.match(favoriteJs,/favorite-swipe-active/);
assert.match(favoriteCss,/body\.favorite-swipe-active\{position:fixed/);
assert.match(favoriteCss,/\.favorite-swipe-open>\.favorite-swipe-action\{position:fixed/);
assert.match(favoriteCss,/\.favorite-editor-bar\{position:fixed/);
assert.match(favoriteCss,/favorite-fragment-status\{[^}]*margin:5px 0 7px 6px/);

console.log(JSON.stringify({status:'ok',checks:12},null,2));
