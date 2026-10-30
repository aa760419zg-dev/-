import {isIncome,recordAccount} from './ledger-model.js';
export {isIncome,recordAccount} from './ledger-model.js';
export {formatDate,formatDateTime,formatDatesInText} from './dates.js';
import {hydratePets,petCollections} from './pets-model.js';
export const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
export function balance(data){return Number(data.opening||0)+data.money.reduce((sum,x)=>sum+(recordAccount(x)==='共同帳戶'?(isIncome(x)?Number(x.amount):x.kind==='支出'?-Number(x.amount):0):0),0);}
export function expense(data,month){return data.money.filter(x=>x.kind==='支出'&&x.date.startsWith(month)).reduce((s,x)=>s+Number(x.amount),0);}
export const empty=()=>({version:1,opening:0,threshold:3000,money:[],events:[],pets:[],chores:[],health:[]});
export function validData(d){return d&&d.version===1&&Number.isFinite(d.opening)&&Number.isFinite(d.threshold)&&['money','events','pets','chores','health'].every(k=>Array.isArray(d[k])&&d[k].every(x=>x&&typeof x==='object'&&typeof x.id==='string'&&typeof x.date==='string'))&&(d.activity===undefined||(Array.isArray(d.activity)&&d.activity.every(e=>e&&typeof e.id==='string'&&typeof e.at==='string')))&&(d.members===undefined||(Array.isArray(d.members)&&d.members.every(m=>m&&typeof m.userId==='string'&&typeof m.name==='string'&&/^#[0-9a-f]{6}$/i.test(m.color))))&&(d.financeVersion===undefined||d.financeVersion===1&&Array.isArray(d.categories)&&Array.isArray(d.recurring))&&(d.categories===undefined||Array.isArray(d.categories)&&d.categories.every(c=>c&&typeof c.id==='string'&&['支出','收入'].includes(c.type)&&typeof c.name==='string'&&typeof c.icon==='string'&&(c.parentId===null||typeof c.parentId==='string')&&Number.isFinite(c.order)&&typeof c.hidden==='boolean'))&&(d.recurring===undefined||Array.isArray(d.recurring)&&d.recurring.every(r=>r&&typeof r.id==='string'&&r.template&&typeof r.template==='object'&&['day','week','month','year'].includes(r.frequency)&&Number.isInteger(Number(r.interval))&&Number(r.interval)>0&&typeof r.startDate==='string'&&typeof r.createdBy==='string'&&typeof r.paused==='boolean'))&&petCollections.every(k=>d[k]===undefined||(Array.isArray(d[k])&&d[k].every(x=>x&&typeof x.id==='string'&&typeof x.date==='string')));}

// 舊稱呼相容：保留封存的 events 原樣，只轉換使用中的成員欄位。
export function normalizeNames(document){
 const copy=structuredClone(document);delete copy.activity;
 const names={'我':'阿嘎','先生':'阿嘎','太太':'糖糖'};
 for(const kind of ['money','health'])for(const record of copy[kind]){
  const old=record.person;
  if(Object.hasOwn(names,old)){
   record.person=names[old];
  }
 }
 return hydratePets(copy);
}

export function exerciseSummary(records,person,month,userId){
 const items=records.filter(x=>x.kind==='運動'&&(userId&&x.personUserId?x.personUserId===userId:x.person===person)&&x.date.startsWith(month));
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
export function choreRule(chore){
 if(chore.repeatUnit&&chore.repeatEvery)return {unit:chore.repeatUnit,every:Number(chore.repeatEvery)};
 if(chore.cadence==='每日')return {unit:'天',every:1};
 if(chore.cadence==='每週')return {unit:'週',every:1};
 if(chore.cadence==='每月')return {unit:'個月',every:1};
 return {unit:'天',every:Number(chore.interval||1)};
}
export const choreIcons=[['💧','濾心',['濾心','濾芯']],['🌬','冷氣',['冷氣','空調']],['🛏','床單',['床單','被單','床被']],['🪴','澆花',['澆花','植物']],['🧹','掃地',['掃地','拖地']],['🐈','貓砂',['貓砂']],['🗑','垃圾',['垃圾']],['🧺','洗衣',['洗衣','衣服']]];
export function choreIcon(value){if(value&&typeof value==='object'&&choreIcons.some(([icon])=>icon===value.icon))return value.icon;const name=typeof value==='string'?value:value?.title||'';return choreIcons.find(([,label,words])=>words.some(word=>name.includes(word)))?.[0]||'🧹';}
export function choreScheduleMode(chore){return ['completion','fixed'].includes(chore.scheduleMode)?chore.scheduleMode:choreRule(chore).unit==='週'?'fixed':'completion';}
export function migrateChores(data){for(const chore of data.chores)if(!['completion','fixed'].includes(chore.scheduleMode))chore.scheduleMode=choreScheduleMode(chore);}
export function choreCompletion(data,entry){const date=typeof entry==='string'?entry:entry?.date;const member=typeof entry==='object'?data.members?.find(m=>m.userId===entry.userId):null;return {date:date||'',name:member?.name||'未知',member};}
export function completeChore(data,id,date,userId,expectedNext){const chore=data.chores.find(c=>c.id===id),member=data.members.find(m=>m.userId===userId);if(!chore)throw Error('家務已被刪除');if(!member)throw Error('找不到目前成員');if(expectedNext&&(typeof expectedNext==='string'?chore.next!==expectedNext:chore.next!==expectedNext.next||chore.date!==expectedNext.date||(chore.history||[]).length!==expectedNext.count))throw Error('這次家務已更新或完成，已顯示最新安排');chore.scheduleMode=choreScheduleMode(chore);chore.anchor=chore.anchor||chore.next;chore.next=nextChoreDate(chore,date);chore.date=date;chore.history=[...(chore.history||[]),{date,userId:member.userId,name:member.name}];}
export function commonChores(date,ids){return [['淨水器濾心',90],['冷氣濾網清洗',30],['床單更換',14],['澆花',3],['掃地拖地',7],['清貓砂',1]].map(([title,every],i)=>{const chore={id:ids[i],title,icon:choreIcon(title),date:'',history:[],repeatEvery:every,repeatUnit:'天',scheduleMode:'completion',cadence:'每日',next:date,anchor:date,pinned:false,remindDays:3,note:''};chore.next=nextChoreDate(chore,date);return chore;});}
export function nextChoreDate(chore,completed=today()){
 let next=chore.next;
 if(choreScheduleMode(chore)==='completion'){const d=utcDay(completed),{unit,every}=choreRule(chore);if(!Number.isFinite(d.getTime())||!Number.isInteger(every)||every<1)throw Error('家務排程日期或週期不正確');if(unit==='個月'){const day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+every);d.setUTCDate(Math.min(day,new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate()));}else d.setUTCDate(d.getUTCDate()+every*(unit==='週'?7:1));return isoDay(d);}
 const anchor=utcDay(chore.anchor||chore.next).getUTCDate();
 const {unit,every}=choreRule(chore);const interval=unit==='週'?every*7:every;
 if(!Number.isFinite(utcDay(next).getTime())||!Number.isInteger(interval)||interval<1)throw Error('家務排程日期或週期不正確');
 if(unit==='個月'){
  do{const d=utcDay(next);const first=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+every,1));const last=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate();first.setUTCDate(Math.min(anchor,last));next=isoDay(first);}while(next<=completed);
 }else{
  const d=utcDay(next),days=Math.max(1,Math.floor((utcDay(completed)-d)/86400000/interval)+1)*interval;
  d.setUTCDate(d.getUTCDate()+days);next=isoDay(d);
 }
 return next;
}
export function choreFrequency(chore){
 const {unit,every}=choreRule(chore);
 if(choreScheduleMode(chore)==='completion')return every===1?(unit==='天'?'每天':unit==='週'?'每週':'每月'):'每 '+every+' '+unit;
 if(unit==='天')return every===1?'每天':'每 '+every+' 天';
 if(unit==='週')return (every===1?'每週':'每 '+every+' 週')+'（週'+['日','一','二','三','四','五','六'][utcDay(chore.anchor||chore.next).getUTCDay()]+'）';
 return (every===1?'每月':'每 '+every+' 個月')+' '+utcDay(chore.anchor||chore.next).getUTCDate()+' 日';
}

// 只解析數字與四則運算；使用分數計算避免 0.1 + 0.2 的浮點誤差。
export function calculateAmount(expression){
 const text=String(expression).replaceAll('×','*').replaceAll('÷','/').replaceAll('−','-').replace(/\s/g,'');
 if(!text||text.length>120||/[^\d.+*/()\-]/.test(text))throw Error('請輸入有效算式，最多 120 字。');
 const tokens=text.match(/(?:\d+(?:\.\d*)?|\.\d+)|[()+*/-]/g)||[];
 if(tokens.join('')!==text)throw Error('算式格式不正確');
 let pos=0;
 const apply=(a,b,op)=>{
  if(op==='+')return [a[0]*b[1]+b[0]*a[1],a[1]*b[1]];
  if(op==='-')return [a[0]*b[1]-b[0]*a[1],a[1]*b[1]];
  if(op==='*')return [a[0]*b[0],a[1]*b[1]];
  if(b[0]===0n)throw Error('不能除以 0');
  let n=a[0]*b[1],d=a[1]*b[0];if(d<0n){n=-n;d=-d;}return [n,d];
 };
 function atom(){
  const token=tokens[pos++];
  if(token==='+'||token==='-'){const v=atom();return [token==='-'?-v[0]:v[0],v[1]];}
  if(token==='('){const value=sum();if(tokens[pos++]!==')')throw Error('請確認括號成對');return value;}
  if(!token||!/^\d*\.?\d+$|^\d+\.$/.test(token))throw Error('算式尚未完成');
  const [whole,decimal='']=token.split('.');return [BigInt((whole||'0')+decimal),10n**BigInt(decimal.length)];
 }
 function product(){let value=atom();while(tokens[pos]==='*'||tokens[pos]==='/'){const op=tokens[pos++];value=apply(value,atom(),op);}return value;}
 function sum(){let value=product();while(tokens[pos]==='+'||tokens[pos]==='-'){const op=tokens[pos++];value=apply(value,product(),op);}return value;}
 const [n,d]=sum();if(pos!==tokens.length)throw Error('算式格式不正確');
 const abs=n<0n?-n:n,cents=(2n*abs*100n+d)/(2n*d);
 if(cents>BigInt(Number.MAX_SAFE_INTEGER))throw Error('金額太大，請分次計算');
 return Number(n<0n?-cents:cents)/100;
}
