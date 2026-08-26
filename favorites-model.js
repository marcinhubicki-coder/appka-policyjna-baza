/* Pure hierarchy helpers used by the favorites fragment editor and its tests. */
(function(root){
  const RANK={l:0,u:1,p:2,i:3};
  const rank=value=>Object.prototype.hasOwnProperty.call(RANK,value)?RANK[value]:0;
  const partKey=(articleId,unit,index)=>unit?.[0]||`${articleId}@@${index}`;
  function describe(row){return (row?.[4]||[]).map((unit,index)=>({key:partKey(row[0],unit,index),index,rank:rank(unit?.[1]),marker:String(unit?.[2]||'')}))}
  function groupKeys(parts,index){const current=parts[index];if(!current)return[];const keys=[current.key];for(let i=index+1;i<parts.length&&parts[i].rank>current.rank;i++)keys.push(parts[i].key);return keys}
  function visibleKeys(parts,selected){const chosen=selected instanceof Set?selected:new Set(selected||[]),visible=new Set(),stack=[];for(const part of parts){while(stack.length&&stack[stack.length-1].rank>=part.rank)stack.pop();if(chosen.has(part.key)){visible.add(part.key);stack.forEach(parent=>visible.add(parent.key))}stack.push(part)}return visible}
  function omissionLabel(count){if(count===1)return'1 pominięty fragment';const last=count%10,lastTwo=count%100;return last>=2&&last<=4&&!(lastTwo>=12&&lastTwo<=14)?`${count} pominięte fragmenty`:`${count} pominiętych fragmentów`}
  root.__FAVORITES_MODEL={rank,partKey,describe,groupKeys,visibleKeys,omissionLabel};
})(typeof globalThis!=='undefined'?globalThis:window);
