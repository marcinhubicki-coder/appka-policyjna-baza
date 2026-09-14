export function decorateWord(word, options, feedback){
  if(!word||word.dataset.artWord==='1')return;
  const slot=word.querySelector('.gap,.filled');
  if(!slot)return;

  const before=slot.previousSibling?.textContent||'';
  const after=slot.nextSibling?.textContent||'';
  const revealed=slot.classList.contains('filled');
  const answer=revealed?slot.textContent:'';
  const maxLen=Math.max(1,...options.map(v=>[...v.trim()].length));

  word.textContent='';
  const beforeSpan=document.createElement('span');
  beforeSpan.className='word-part word-before';
  beforeSpan.textContent=before;
  const afterSpan=document.createElement('span');
  afterSpan.className='word-part word-after';
  afterSpan.textContent=after;

  slot.textContent='';
  slot.dataset.maxLen=String(maxLen);
  slot.style.setProperty('--slot-len',String(maxLen));

  if(revealed){
    const text=document.createElement('span');
    text.className='revealed-chunk';
    text.textContent=answer;
    slot.append(text);
    slot.classList.add('revealing');
    const baseEm=maxLen>1?1.72:1.08;
    slot.style.width=`${baseEm}em`;
    requestAnimationFrame(()=>{
      const measure=document.createElement('span');
      measure.className='word-slot-measure';
      measure.textContent=answer;
      word.append(measure);
      const target=Math.max(.72*parseFloat(getComputedStyle(word).fontSize),measure.getBoundingClientRect().width+4);
      measure.remove();
      requestAnimationFrame(()=>{slot.style.width=`${target}px`;});
      setTimeout(()=>{slot.style.width='';},480);
    });
  }else{
    const glass=document.createElement('span');
    glass.className='bubble-glass';
    glass.innerHTML='<span class="bubble-reflect bubble-reflect-a"></span><span class="bubble-reflect bubble-reflect-b"></span>';
    slot.append(glass);
    for(let i=0;i<4;i+=1){
      const sparkle=document.createElement('i');
      sparkle.className=`bubble-sparkle sparkle-${i+1}`;
      sparkle.textContent='✦';
      slot.append(sparkle);
    }
  }

  word.append(beforeSpan,slot,afterSpan);
  word.dataset.artWord='1';
  if(feedback)word.classList.add('word-feedback');
}
