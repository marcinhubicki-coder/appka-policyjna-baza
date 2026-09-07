/* Measure only new lists. No subtree/body observer and no per-row work on opening. */
(function(){
  function measure(){
    const list=document.getElementById('drawerArticles');if(!list)return;
    const nums=[...list.querySelectorAll('.da-num')];if(!nums.length)return;
    const canvas=measure.canvas||(measure.canvas=document.createElement('canvas')),ctx=canvas.getContext('2d');
    if(!ctx)return;
    const cs=getComputedStyle(nums[0]);ctx.font=cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;
    const width=Math.ceil(Math.max(...nums.map(n=>ctx.measureText(n.textContent.trim()).width))*.9+2)+'px';
    if(document.documentElement.style.getPropertyValue('--tocNumW')!==width)document.documentElement.style.setProperty('--tocNumW',width);
  }
  window.addEventListener('police-law-drawer-rendered',measure);
  window.addEventListener('police-law-favorites-drawer-rendered',measure);
})();
