import { DURATIONS, validResult } from './game.mjs';
import { modeIds, cleanConfig } from './modes.mjs';
export const localDay = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const count = n => Number.isSafeInteger(n) && n >= 0;
export function cleanProgress(value) {
 const history=Array.isArray(value?.history)?value.history.filter(r=>r && modeIds.includes(r.mode)&&DURATIONS.includes(r.duration)&&count(r.correct)&&count(r.wrong)&&typeof r.date==='string'&&Number.isFinite(Date.parse(r.date))).slice(0,50).map(r=>({...r,...cleanConfig(r.mode,r)})):[];
 const best={};
 for(const mode of modeIds) for(const duration of DURATIONS) {
  const key=`${mode}:${duration}`,n=value?.best?.[key];if(count(n))best[key]=n;
 }
 const today=value?.today;
 return {history,best,today:today&&/^\d{4}-\d{2}-\d{2}$/.test(today.day)&&count(today.count)?{day:today.day,count:today.count}:{day:localDay(),count:0}};
}
export function migrateProgress(history,best) {
 const migrated=cleanProgress({history:Array.isArray(history)?history.filter(validResult).map(r=>({...r,mode:'spelling',difficulty:0})):[]});
 for(const duration of DURATIONS) {
  const values=Object.entries(best && typeof best==='object'?best:{}).filter(([key,value])=>key.endsWith(`:${duration}`)&&count(value)).map(([,value])=>value);
  if(values.length)migrated.best[`spelling:${duration}`]=Math.max(...values);
 }
 migrated.today.count=migrated.history.filter(r=>localDay(new Date(r.date))===migrated.today.day).reduce((sum,r)=>sum+r.correct+r.wrong,0);
 return migrated;
}
export function recordResult(progress,result) {
 const key=`${result.mode}:${result.duration}`,record=result.correct>(progress.best[key]??0);
 progress.best[key]=Math.max(progress.best[key]??0,result.correct);
 progress.history=[result,...progress.history].slice(0,50);
 const day=localDay(new Date(result.date));
 progress.today={day,count:(progress.today.day===day?progress.today.count:0)+result.correct+result.wrong};
 return record;
}
