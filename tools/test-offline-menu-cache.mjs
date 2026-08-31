import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = file => fs.readFileSync(file, "utf8");
const index = read("index.html");
const nav = read("nav.js");
const settings = read("settings.js");
const offline = read("offline.js");
const serviceWorker = read("sw.js");
const appCss = read("app.css");
const menuHotfix = read("menu-hotfix.css");
const ux = read("ux-fixes.js");
const manifest = JSON.parse(read("manifest.webmanifest"));

let checks = 0;
const match = (source, pattern) => { checks += 1; assert.match(source, pattern); };
const noMatch = (source, pattern) => { checks += 1; assert.doesNotMatch(source, pattern); };
const ok = (value, message) => { checks += 1; assert.ok(value, message); };
const equal = (actual, expected, message) => { checks += 1; assert.equal(actual, expected, message); };

// Opening an already prepared drawer may update the active row, but it must
// not recreate hundreds of chapter and article nodes.
match(nav, /const drawerLinks=new Map\(\)/);
match(nav, /drawer\.dataset\.renderCount=/);
match(nav, /normalReady=lastActCode===ACT\?\.\[0\].*childElementCount/);
match(nav, /if\(!allActs&&!normalReady\)populateDrawer\(\);else if\(!allActs\)updateUI\(\)/);
match(nav, /drawerLinks\.set\(R\[0\],a\)/);
match(nav, /drawerLinks\.get\(r\[0\]\)/);
noMatch(nav, /function openDrawer\(\)\{populateDrawer\(\)/);
noMatch(nav, /document\.querySelectorAll\('\.drawer-article'\)\.forEach/);
match(ux, /d\.classList\.contains\('open'\)&&hamburger\)\{hamburger\.click\(\);return\}/);
match(ux, /hamburger\?\.setAttribute\('aria-expanded','false'\)/);

// Settings have a stable, accessible home in the header and enough room in
// the split view for hamburger, search and gear controls.
match(index, /id="settingsButton"[^>]*aria-controls="settingsPanel"|aria-controls="settingsPanel"[^>]*id="settingsButton"/);
match(index, /id="settingsPanel"/);
match(index, /id="offlineDownload"/);
match(index, /src="settings\.js"/);
match(index, /src="offline\.js"/);
match(settings, /aria-hidden','false'/);
match(settings, /event\.key==='Escape'/);
match(appCss, /\.settings-button\{/);
match(appCss, /body\.settings-open \.settings-panel/);
match(menuHotfix, /grid-template-columns:40px minmax\(0,1fr\) 40px/);

// PWA metadata and registration.
match(index, /rel="manifest" href="manifest\.webmanifest"/);
match(index, /rel="apple-touch-icon"/);
match(index, /apple-mobile-web-app-capable/);
match(offline, /serviceWorker\.register\('\.\/sw\.js'/);
match(offline, /updateViaCache:'none'/);
match(offline, /type:'CACHE_ALL'/);
noMatch(offline, /setInterval\(/);
equal(manifest.display, "standalone");
equal(manifest.start_url, "./#act-uop");
ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2, "Manifest powinien zawierać ikony PWA");

// Evaluate only the service worker declarations to obtain the exact cache
// list. Event callbacks are registered but not run in this static contract.
const listeners = {};
const testOrigin = "https://example.test/";
const cacheKey = (input, ignoreSearch = false) => {
  const raw = typeof input === "string" ? input : input.url;
  const url = new URL(raw, testOrigin);
  if (ignoreSearch) url.search = "";
  return url.href;
};
class FakeRequest {
  constructor(url, options = {}) { this.url = new URL(url, testOrigin).href; this.method = "GET"; this.mode = options.mode || "same-origin"; }
}
class FakeCache {
  constructor() { this.entries = new Map(); }
  async match(input, options = {}) { return this.entries.get(cacheKey(input, options.ignoreSearch))?.clone(); }
  async put(input, response) { this.entries.set(cacheKey(input), response.clone()); }
}
const cacheStores = new Map();
const cacheApi = {
  async open(name) { if (!cacheStores.has(name)) cacheStores.set(name, new FakeCache()); return cacheStores.get(name); },
  async keys() { return [...cacheStores.keys()]; },
  async delete(name) { return cacheStores.delete(name); }
};
let networkEnabled = true;
const fakeFetch = async request => {
  if (!networkEnabled) throw new Error("offline");
  const url = new URL(request.url || request, testOrigin);
  const file = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  return fs.existsSync(file) ? new Response(fs.readFileSync(file), { status: 200 }) : new Response("missing", { status: 404 });
};
const sandbox = {
  self: {
    addEventListener(type, listener) { listeners[type] = listener; },
    location: { origin: testOrigin.slice(0, -1) },
    clients: { async claim() {} },
    async skipWaiting() {}
  },
  caches: cacheApi,
  fetch: fakeFetch,
  Request: FakeRequest,
  Response,
  URL,
  console
};
vm.runInNewContext(`${serviceWorker}\nglobalThis.__PWA_TEST__={CACHE_VERSION,CACHE_NAME,PRECACHE_URLS};`, sandbox);
const { CACHE_VERSION, CACHE_NAME, PRECACHE_URLS } = sandbox.__PWA_TEST__;
ok(/^\d{4}-\d{2}-\d{2}\.\d+$/.test(CACHE_VERSION), "Cache PWA musi mieć jawną wersję");
equal(new Set(PRECACHE_URLS).size, PRECACHE_URLS.length, "Lista cache nie może zawierać duplikatów");
for (const url of PRECACHE_URLS) {
  const file = url.replace(/^\.\//, "");
  ok(fs.existsSync(file), `Brak pliku cache: ${file}`);
}
for (const event of ["install", "activate", "message", "fetch"]) ok(typeof listeners[event] === "function", `Brak obsługi ${event}`);
match(serviceWorker, /request\.mode==='navigate'/);
match(serviceWorker, /url\.origin!==self\.location\.origin/);
match(serviceWorker, /keys\.filter\(key=>key\.startsWith\(CACHE_PREFIX\)&&key!==CACHE_NAME\)/);

// Every local asset referenced by the page must be available offline.
const pageAssets = [...index.matchAll(/(?:src|href)="([^"#]+)"/g)]
  .map(match => match[1])
  .filter(url => !/^(?:https?:|data:)/.test(url));
for (const asset of pageAssets) ok(PRECACHE_URLS.includes(`./${asset}`), `Niecache'owany zasób strony: ${asset}`);

const pngSize = file => {
  const data = fs.readFileSync(file);
  equal(data.subarray(1, 4).toString(), "PNG", `${file} nie jest plikiem PNG`);
  return [data.readUInt32BE(16), data.readUInt32BE(20)];
};
equal(pngSize("icons/icon-192.png").join("x"), "192x192");
equal(pngSize("icons/icon-512.png").join("x"), "512x512");
equal(pngSize("icons/apple-touch-icon.png").join("x"), "180x180");

const cacheBytes = PRECACHE_URLS.reduce((sum, url) => sum + fs.statSync(url.replace(/^\.\//, "")).size, 0);
ok(cacheBytes < 2 * 1024 * 1024, `Pakiet offline jest za duży: ${cacheBytes} B`);

// Execute install and an offline navigation against a small CacheStorage mock.
// This verifies that the full list is actually cacheable and that index.html
// is returned after the network disappears.
let installPromise;
listeners.install({ waitUntil(promise) { installPromise = promise; } });
await installPromise;
equal(cacheStores.get(CACHE_NAME)?.entries.size, PRECACHE_URLS.length, "Instalacja PWA nie zapisała wszystkich zasobów");
networkEnabled = false;
let offlineResponsePromise;
listeners.fetch({
  request: { method: "GET", mode: "navigate", url: testOrigin },
  respondWith(promise) { offlineResponsePromise = promise; }
});
const offlineResponse = await offlineResponsePromise;
equal(offlineResponse.status, 200, "Nawigacja offline nie zwróciła strony");
match(await offlineResponse.text(), /<title>Policyjna baza prawa<\/title>/);

console.log(JSON.stringify({
  status: "ok",
  checks,
  menu: { rebuildOnOpen: false, indexedActiveLink: true },
  offline: { version: CACHE_VERSION, assets: PRECACHE_URLS.length, bytes: cacheBytes }
}, null, 2));
