import { SCENES, sceneUrl } from './scenes.mjs';

const params = new URLSearchParams(globalThis.location?.search || '');
const normalize = value => String(value || '').trim().toLocaleLowerCase('pl-PL');

export const SPELLING_PREVIEW = Object.freeze({
  assetsOnly: params.get('assets') === '1',
  word: normalize(params.get('word')),
  scene: normalize(params.get('scene')),
  layout: ['full','split'].includes(params.get('layout')) ? params.get('layout') : '',
});

const availableMasks = new Set();

async function sceneExists(masked, scene){
  try{
    const response = await fetch(sceneUrl(scene), { method:'HEAD', cache:'no-store' });
    if(response.ok) availableMasks.add(masked);
  }catch{
    // Preview-only probe. Missing/offline artwork simply stays unavailable.
  }
}

if(SPELLING_PREVIEW.assetsOnly){
  await Promise.all([...SCENES.entries()].map(([masked, scene]) => sceneExists(masked, scene)));
}

export function filterSpellingPreview(words){
  let pool = Array.isArray(words) ? words : [];

  if(SPELLING_PREVIEW.assetsOnly){
    pool = pool.filter(word => availableMasks.has(word.masked));
  }

  if(SPELLING_PREVIEW.word){
    pool = pool.filter(word => normalize(word.word) === SPELLING_PREVIEW.word);
  }

  if(SPELLING_PREVIEW.scene){
    pool = pool.filter(word => normalize(SCENES.get(word.masked)?.key) === SPELLING_PREVIEW.scene);
  }

  return pool;
}

export function previewSummary(){
  return {
    ...SPELLING_PREVIEW,
    availableScenes:[...availableMasks],
    active:SPELLING_PREVIEW.assetsOnly || !!SPELLING_PREVIEW.word || !!SPELLING_PREVIEW.scene || !!SPELLING_PREVIEW.layout,
  };
}
