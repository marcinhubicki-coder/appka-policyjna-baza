import './spelling/art.mjs?v=6';

const params=new URLSearchParams(location.search);
if(params.get('debug')==='1'){
  const badge=document.createElement('div');
  badge.textContent='spelling v0.3.6';
  badge.style.cssText='position:fixed;right:8px;bottom:8px;z-index:99999;padding:5px 8px;border-radius:999px;background:rgba(20,32,70,.78);color:#fff;font:600 11px/1.2 -apple-system,BlinkMacSystemFont,sans-serif;pointer-events:none;backdrop-filter:blur(8px)';
  document.body.append(badge);
}
