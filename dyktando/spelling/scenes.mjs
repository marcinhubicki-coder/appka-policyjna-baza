export const SCENES = new Map([
  ['r_ża', { key:'rose', asset:'rose.svg', layouts:['full','split'] }],
  ['kr_lik', { key:'bunny', asset:'bunny.svg', layouts:['full','split'] }],
  ['g_ry', { key:'mountains', asset:'mountains.svg', layouts:['full','split'] }],
  ['_mury', { key:'clouds', layouts:['full','split'] }],
  ['_aba', { key:'frog', layouts:['full','split'] }],
  ['samoch_d', { key:'car', layouts:['full','split'] }],
  ['_uragan', { key:'storm', layouts:['full','split'] }],
  ['leka_', { key:'doctor', layouts:['full','split'] }],
  ['g_ebień', { key:'vanity', layouts:['full','split'] }],
  ['kr_l', { key:'king', layouts:['full','split'] }],
  ['sok_ł', { key:'falcon', layouts:['full','split'] }],
]);

const layoutMemory = new Map();
const params = new URLSearchParams(globalThis.location?.search || '');
const forcedLayout = ['full','split'].includes(params.get('layout')) ? params.get('layout') : '';

export function sceneFor(masked){
  return SCENES.get(masked) || null;
}

export function chooseLayout(masked, question, scene){
  const allowed = scene?.layouts?.length ? scene.layouts : ['split'];
  if(forcedLayout && allowed.includes(forcedLayout)) return forcedLayout;
  const memoryKey = `${question}:${masked}`;
  if (!layoutMemory.has(memoryKey)) {
    const picked = allowed[Math.floor(Math.random()*allowed.length)] || 'split';
    layoutMemory.set(memoryKey, picked);
  }
  return layoutMemory.get(memoryKey);
}

export function sceneUrl(scene){
  if(!scene) return '';
  return `assets/scenes/${scene.asset || `${scene.key}.webp`}`;
}
