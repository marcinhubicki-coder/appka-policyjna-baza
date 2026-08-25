/* TOC presentation fix: compact A. labels, per-act number column width, two-line chapter headings. */
(function(){
  const root=document.documentElement;
  let busy=false;

  function compactLabel(s){
    return String(s||'').replace(/^Art\.\s*/i,'A. ');
  }

  function measureNumberColumn(list){
    const nums=[...list.querySelectorAll('.drawer-article .da-num')];
    if(!nums.length)return;
    const canvas=measureNumberColumn.canvas||(measureNumberColumn.canvas=document.createElement('canvas'));
    const ctx=canvas.getContext('2d');
    const cs=getComputedStyle(nums[0]);
    ctx.font=`${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    let max=0;
    nums.forEach(n=>{ max=Math.max(max,ctx.measureText(n.textContent.trim()).width); });
    // Width follows the actual longest label in the current act (e.g. A. 15aab in UoP).
    // Only 2px optical breathing room; inter-column spacing is handled by CSS gap.
    root.style.setProperty('--tocNumW',Math.ceil(max+2)+'px');
  }

  function fixChapter(summary){
    if(summary.dataset.twoLineChapter==='1')return;
    const raw=summary.textContent.replace(/^\s*▾\s*/,'').trim();
    const m=raw.match(/^(Rozdział\s+\d+[a-z]?)(?:\s*[—–-]\s*(.+))?$/i);
    if(!m)return;
    const ico=summary.querySelector('.chapter-ico');
    summary.textContent='';
    if(ico) summary.appendChild(ico);
    else { const i=document.createElement('span'); i.className='chapter-ico'; i.textContent='▾'; summary.appendChild(i); }
    const text=document.createElement('span');
    text.className='chapter-heading';
    const no=document.createElement('span'); no.className='chapter-no'; no.textContent=m[1];
    text.appendChild(no);
    if(m[2]){ const title=document.createElement('span'); title.className='chapter-title'; title.textContent=m[2].trim(); text.appendChild(title); }
    summary.appendChild(text);
    summary.dataset.twoLineChapter='1';
  }

  function apply(){
    if(busy)return; busy=true;
    try{
      const list=document.getElementById('drawerArticles');
      if(!list)return;
      list.querySelectorAll('.drawer-article .da-num').forEach(n=>{
        const v=compactLabel(n.textContent);
        if(n.textContent!==v)n.textContent=v;
      });
      list.querySelectorAll('.drawer-chapter summary').forEach(fixChapter);
      measureNumberColumn(list);
    } finally { busy=false; }
  }

  function start(){
    const list=document.getElementById('drawerArticles');
    if(!list){setTimeout(start,80);return;}
    apply();
    new MutationObserver(()=>requestAnimationFrame(apply)).observe(list,{childList:true,subtree:true});
  }
  start();
})();
