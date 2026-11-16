import {expenseLines,moneyCents,recordAccount} from './ledger-model.js';
export function validateSpendingRange(start,end){
 for(const date of [start,end]){const d=new Date(date+'T00:00:00Z');if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==date)throw Error('請選擇有效的起訖日期');}
 if(start>end)throw Error('開始日期不能晚於結束日期');
}
export function spendingPeriod(preset,today){
 validateSpendingRange(today,today);let start=today,end=today;
 const d=new Date(today+'T00:00:00Z');
 if(preset==='previous'){d.setUTCDate(1);d.setUTCDate(0);end=d.toISOString().slice(0,10);d.setUTCDate(1);start=d.toISOString().slice(0,10);}
 else if(preset==='recent'){d.setUTCDate(d.getUTCDate()-89);start=d.toISOString().slice(0,10);}
 else if(preset==='month')start=today.slice(0,7)+'-01';
 else throw Error('請選擇有效的期間');
 return {start,end};
}
// The payer is account, not the member who entered the record. Missing reimbursement
// follows the existing schema's no-reimbursement meaning; old advances are migrated
// to pending by the existing reimbursement migration, never by this read-only query.
export function selfFundedExpense(record,userId){return Boolean(userId)&&record.kind==='支出'&&recordAccount(record)===userId&&record.reimbursement==null;}
const text=value=>String(value??'').normalize('NFKC').toLocaleLowerCase('zh-TW').trim();
export function personalSpending(data,{memberUserId,start,end,query='',categoryId='',category='',subcategoryId='',subcategory=''}={}){
 validateSpendingRange(start,end);
 const member=data.members?.find(m=>m.userId===memberUserId),groups=new Map(),entries=[],needle=text(query),categorySelected=Boolean(categoryId||category||subcategoryId||subcategory),catalogue=new Map((data.categories||[]).map(c=>[c.id,c]));let totalCents=0;
 if(!member)return {entries,total:0,totalCents:0,count:0,categories:[],categorySelected};
 for(const [index,record]of (data.money||[]).entries()){
  if(!selfFundedExpense(record,memberUserId)||record.date<start||record.date>end)continue;
  const lines=expenseLines(record).map(line=>{const root=catalogue.get(line.categoryId),sub=catalogue.get(line.subcategoryId);return {...line,category:root?.name||line.category||'未分類',subcategory:sub?.name||line.subcategory||'',cents:moneyCents(line.amount)};});
  if(needle&&!text([record.title,record.note,...lines.flatMap(l=>[l.category,l.subcategory])].join(' ')).includes(needle))continue;
  const matchedLines=lines.filter(l=>(categoryId?l.categoryId===categoryId:!category||l.category===category)&&(subcategoryId?l.subcategoryId===subcategoryId:!subcategory||l.subcategory===subcategory));
  if(!matchedLines.length)continue;
  const cents=categorySelected?matchedLines.reduce((n,l)=>n+l.cents,0):moneyCents(record.amount);
  totalCents+=cents;entries.push({record,amount:cents/100,totalAmount:moneyCents(record.amount)/100,matchedLines,index});
  for(const line of matchedLines){const key=line.categoryId||'name:'+line.category;let group=groups.get(key);if(!group){group={categoryId:line.categoryId||'',name:line.category,cents:0,subs:new Map()};groups.set(key,group);}group.cents+=line.cents;const subKey=line.subcategoryId||'name:'+line.subcategory,sub=group.subs.get(subKey)||{subcategoryId:line.subcategoryId||'',name:line.subcategory||'未分子分類',cents:0};sub.cents+=line.cents;group.subs.set(subKey,sub);}
 }
 const byAmount=(a,b)=>b.amount-a.amount||a.name.localeCompare(b.name,'zh-TW');
 const categories=[...groups.values()].map(g=>({categoryId:g.categoryId,name:g.name,amount:g.cents/100,subcategories:[...g.subs.values()].map(s=>({subcategoryId:s.subcategoryId,name:s.name,amount:s.cents/100})).sort(byAmount)})).sort(byAmount);
 entries.sort((a,b)=>b.record.date.localeCompare(a.record.date)||b.index-a.index);
 return {entries,total:totalCents/100,totalCents,count:entries.length,categories,categorySelected};
}
