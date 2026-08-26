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
    // Labels are visually compressed to 90% in CSS, so reserve only their real displayed width.
    root.style.setProperty('--tocNumW',Math.ceil(max*.9+1)+'px');
  }

  function fixChapter(summary){
    const details=summary.closest('.drawer-chapter');
    const id=details?.querySelector('.drawer-article')?.dataset.id;
    let row=null;try{row=ACT?.[3]?.find(item=>item[0]===id)}catch(_){}
    const displayed=summary.textContent.replace(/^\s*▾\s*/,'').trim();
    const raw=String(row?.[1]||displayed).replace(/\s+/g,' ').trim();
    const displayMatch=displayed.match(/^((?:DZIAŁ|ROZDZIAŁ|ODDZIAŁ)\s+[IVXLCDM0-9]+(?:[A-Z])?\)?)(?:\s*[—–-]\s*(.+))?$/i);
    const sourceMatch=raw.match(/^((?:DZIAŁ|ROZDZIAŁ|ODDZIAŁ)\s+[IVXLCDM0-9]+(?:[A-Z])?\)?)(?:\s*[.:-]\s*(.*))?$/i);
    let prefix=sourceMatch?.[1]||displayMatch?.[1]||'Przepisy',title=(sourceMatch?.[2]||displayMatch?.[2]||'').trim().replace(/[.]$/,''),generated=false;
    if(/^Oddział dodany\b/i.test(raw)){prefix='Oddział';title='';}
    if(!title&&row){try{title=window.__EDITORIAL?.chapterSuggestion(ACT[0],row)||'Przepisy szczególne';generated=true}catch(_){title='Przepisy szczególne';generated=true}}
    const key=[prefix,title,generated].join('|');if(summary.dataset.chapterKey===key)return;
    const ico=summary.querySelector('.chapter-ico');
    summary.textContent='';
    if(ico) summary.appendChild(ico);
    else { const i=document.createElement('span'); i.className='chapter-ico'; i.textContent='▾'; summary.appendChild(i); }
    const text=document.createElement('span');
    text.className='chapter-heading';
    const no=document.createElement('span'); no.className='chapter-no'; no.textContent=prefix;
    text.appendChild(no);
    if(title){ const titleEl=document.createElement('span'); titleEl.className='chapter-title'+(generated?' generated':''); titleEl.textContent=title; text.appendChild(titleEl); }
    summary.appendChild(text);
    summary.dataset.chapterKey=key;
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
      list.querySelectorAll('.drawer-article .da-topic').forEach(topic=>topic.classList.add('editorial-topic'));
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
