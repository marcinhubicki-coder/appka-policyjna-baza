(function(root){
  "use strict";

  const value=String.raw`\d+[a-z]*`;
  const separator=String.raw`(?:\s*,\s*|\s+(?:i|lub|oraz|albo)\s+)`;
  const numberExpression=String.raw`${value}(?:\s*[–-]\s*${value})?(?:${separator}${value}(?:\s*[–-]\s*${value})?)*`;
  const letterExpression=String.raw`[a-z](?:\s*[–-]\s*[a-z])?(?:${separator}[a-z](?:\s*[–-]\s*[a-z])?)*`;
  const reference=new RegExp(
    String.raw`\bart\.\s*${value}`
      + String.raw`(?:(?:${separator}|\s*[–-]\s*)(?:art\.\s*)?${value})*`
      + String.raw`(?:\s+(?:§|ust\.)\s*${numberExpression})?`
      + String.raw`(?:\s+pkt\s*${numberExpression})?`
      + String.raw`(?:\s+lit\.\s*${letterExpression})?`,
    "gi",
  );
  const externalQualifier=/^\s+(?:(?:tej|powołanej|wymienionej|zmienianej)\s+ustawy\b|ustawy\s+(?:z\s+dnia\b|o\b|–|-|wymienionej\b|powołanej\b|określonej\b|zmienianej\b)|(?:Kodeksu|Prawa)\s+[A-ZĄĆĘŁŃÓŚŹŻ]|(?:Konstytucji|konwencji|rozporządzenia|dyrektywy)\b)/i;
  const externalQualifierAnywhere=/(?:tej|powołanej|wymienionej|zmienianej)\s+ustawy\b|ustawy\s+(?:z\s+dnia\b|o\b|–|-|wymienionej\b|powołanej\b|określonej\b|zmienianej\b)|(?:Kodeksu|Prawa)\s+[A-ZĄĆĘŁŃÓŚŹŻ]|(?:Konstytucji|konwencji|rozporządzenia|dyrektywy)\b/gi;

  function legalReferenceGap(value){
    return !value
      .replace(/\b(?:w|we|i|lub|oraz|albo|art|ust|pkt|lit)\b\.?|§|\d+[a-z]?|\b[a-z]\b|[\s,;:()–-]/gi,"")
      .trim();
  }

  function externalReferenceRanges(text){
    const source=String(text);
    const matches=[...source.matchAll(reference)];
    const direct=[];
    for(let index=0;index<matches.length;index+=1){
      const match=matches[index];
      const end=match.index+match[0].length;
      if(externalQualifier.test(source.slice(end,end+180))) direct.push(index);
    }
    const selected=new Set(direct);
    const extendedEnd=new Map();
    for(const qualifier of source.matchAll(externalQualifierAnywhere)){
      let index=matches.length-1;
      while(index>=0&&matches[index].index+matches[index][0].length>qualifier.index) index-=1;
      if(index<0) continue;
      const gap=source.slice(matches[index].index+matches[index][0].length,qualifier.index);
      if(legalReferenceGap(gap)){
        selected.add(index);
        extendedEnd.set(index,Math.max(extendedEnd.get(index)||0,qualifier.index));
      }
    }
    for(const directIndex of [...selected]){
      let index=directIndex-1;
      while(index>=0){
        const previous=matches[index];
        const next=matches[index+1];
        const gap=source.slice(previous.index+previous[0].length,next.index);
        if(!legalReferenceGap(gap)) break;
        selected.add(index);
        index-=1;
      }
    }
    return [...selected].sort((a,b)=>a-b).map((index)=>({
      start:matches[index].index,
      end:Math.max(matches[index].index+matches[index][0].length,extendedEnd.get(index)||0),
    }));
  }

  function overlapsRange(ranges,start,end){
    return ranges.some((range)=>start<range.end&&end>range.start);
  }

  root.__LEGAL_LINK_RULES__={externalReferenceRanges,overlapsRange};
})(typeof window!=="undefined"?window:globalThis);
