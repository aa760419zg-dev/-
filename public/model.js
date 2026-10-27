export const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
export function balance(data){return Number(data.opening||0)+data.money.reduce((sum,x)=>sum+(x.kind==='存入'?Number(x.amount):x.source==='共同帳戶'?-Number(x.amount):0),0);}
export function expense(data,month){return data.money.filter(x=>x.kind==='支出'&&x.date.startsWith(month)).reduce((s,x)=>s+Number(x.amount),0);}
export const empty=()=>({version:1,opening:0,threshold:3000,money:[],events:[],pets:[],chores:[],health:[]});
export function validData(d){return d&&d.version===1&&Number.isFinite(d.opening)&&Number.isFinite(d.threshold)&&['money','events','pets','chores','health'].every(k=>Array.isArray(d[k])&&d[k].every(x=>x&&typeof x==='object'&&typeof x.id==='string'&&typeof x.date==='string'));}

// 舊稱呼相容：只轉換成員欄位與系統產生的休假標題，不更動備註。
export function normalizeNames(document){
 const copy=structuredClone(document);
 const names={'我':'阿嘎','先生':'阿嘎','太太':'糖糖'};
 for(const kind of ['money','events','health'])for(const record of copy[kind]){
  const old=record.person;
  if(Object.hasOwn(names,old)){
   record.person=names[old];
   if(kind==='events'&&record.type==='休假'&&record.title===old+'休假')record.title=record.person+'休假';
  }
 }
 return copy;
}

export function exerciseSummary(records,person,month){
 const items=records.filter(x=>x.kind==='運動'&&x.person===person&&x.date.startsWith(month));
 const sum=key=>items.reduce((n,x)=>n+(Number(x[key])||0),0);
 return {items,days:new Set(items.map(x=>x.date)).size,sessions:items.length,minutes:sum('minutes'),activeCalories:sum('activeCalories'),calorieEntries:items.filter(x=>x.activeCalories!==''&&x.activeCalories!=null).length};
}

const isoDay=d=>d.toISOString().slice(0,10);
const utcDay=s=>new Date(s+'T00:00:00Z');
export function choreStatus(chore,now=today()){
 const days=Math.round((utcDay(chore.next)-utcDay(now))/86400000);
 const remind=Number(chore.remindDays??1);
 return {days,group:days<0?'overdue':days===0?'today':days<=remind?'soon':'later',label:days<0?'逾期 '+(-days)+' 天':days===0?'今天處理':days<=remind?days+' 天後到期':chore.next};
}
export function nextChoreDate(chore,completed=today()){
 let next=chore.next;
 const anchor=utcDay(chore.anchor||chore.next).getUTCDate();
 const interval=chore.cadence==='每日'?1:chore.cadence==='每週'?7:Number(chore.interval||1);
 if(!Number.isFinite(utcDay(next).getTime())||!Number.isInteger(interval)||interval<1)throw Error('家務排程日期或週期不正確');
 if(chore.cadence==='每月'){
  do{const d=utcDay(next);const first=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1));const last=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate();first.setUTCDate(Math.min(anchor,last));next=isoDay(first);}while(next<=completed);
 }else{
  const d=utcDay(next),days=Math.max(1,Math.floor((utcDay(completed)-d)/86400000/interval)+1)*interval;
  d.setUTCDate(d.getUTCDate()+days);next=isoDay(d);
 }
 return next;
}
export function choreFrequency(chore){
 if(chore.cadence==='每日')return '每天';
 if(chore.cadence==='每週')return '每週'+['日','一','二','三','四','五','六'][utcDay(chore.anchor||chore.next).getUTCDay()];
 if(chore.cadence==='每月')return '每月 '+utcDay(chore.anchor||chore.next).getUTCDate()+' 日';
 return '每 '+chore.interval+' 天';
}
