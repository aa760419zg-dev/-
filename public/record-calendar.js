import {choreCompletion} from './model.js';
import {pendingPreventives,pendingVisits,doseSlotName} from './pets-model.js';
// Read-only projection: legacy events are deliberately never consulted.
export const categories={money:'收支',pet:'寵物',chore:'家務',health:'運動'};
export function calendarRecords(data,today){
 const rows=[];const pendingVax=new Set(pendingPreventives(data).map(r=>r.id)),pendingFollowups=new Set(pendingVisits(data).map(r=>r.id));const add=(category,collection,record,date,summary,planned=false,extra={})=>{if(/^\d{4}-\d{2}-\d{2}$/.test(date||''))rows.push({key:collection+':'+record.id+':'+date+':'+rows.length,category,collection,id:record.id,date,summary,planned,record,...extra});};
 const who=r=>data.members?.find(m=>m.userId===(r.personUserId||r.userId))||data.members?.find(m=>m.name===(r.person||r.by));
 const pet=r=>data.petProfiles?.find(p=>p.id===r.petId)?.name||r.pet||'寵物';
 for(const r of data.money||[])add('money','money',r,r.date,`${r.title||r.category} · NT$${Number(r.amount).toLocaleString('zh-TW')} · ${who(r)?.name||'未知成員'}`,false,{member:who(r)});
 const petTypes={petVisits:'就診',petPreventives:'預防針／驅蟲',petWeights:'體重',petDoses:'餵藥',pets:'飲食觀察'};
 for(const [collection,label]of Object.entries(petTypes))for(const r of data[collection]||[]){add('pet',collection,r,r.date,`${pet(r)} · ${label} · ${r.hospital||r.item||(r.drug?r.drug+' · '+doseSlotName(data,r):'')||r.title||(r.weight?r.weight+' kg':'')}`,false,{member:who(r)});const next=collection==='petPreventives'&&pendingVax.has(r.id)?r.next:collection==='petVisits'&&pendingFollowups.has(r.id)?(r.next||r.nextVisit||r.followUp):null;if(next)add('pet',collection,r,next<today?today:next,`${pet(r)} · ${collection==='petVisits'?'回診':'預防針／驅蟲'} · ${r.hospital||r.item||''}`,true,{overdue:next<today,scheduledDate:next});}
 for(const r of data.chores||[]){for(const h of r.history||[]){const done=choreCompletion(data,h);add('chore','chores',r,done.date,`${r.title} · ${done.name}完成`,false,{member:done.member});}if(r.next>=today)add('chore','chores',r,r.next,`${r.title} · 待處理`,true);else if(r.next)add('chore','chores',r,today,`${r.title} · 已逾期（${r.next}）`,true,{overdue:true});}
 for(const r of data.health||[])add('health','health',r,r.date,`${r.title||r.kind} · ${r.kind==='InBody'?(r.weight+' kg'):(r.minutes+' 分鐘')} · ${who(r)?.name||'未知成員'}`,false,{member:who(r)});
 return rows;
}
export function recordsOnDate(data,date,{today=date,filters=Object.keys(categories)}={}){return calendarRecords(data,today).filter(r=>r.date===date&&filters.includes(r.category));}
export function searchRecords(data,query,{today,filters=Object.keys(categories)}={}){const q=query.trim().toLocaleLowerCase();if(!q)return [];return calendarRecords(data,today).filter(r=>filters.includes(r.category)&&(r.summary+' '+Object.entries(r.record).filter(([k,v])=>typeof v==='string'&&!['id','petId','userId','personUserId'].includes(k)).map(([,v])=>v).join(' ')).toLocaleLowerCase().includes(q)).sort((a,b)=>b.date.localeCompare(a.date));}
