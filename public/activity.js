import {validatePlaces,assertPlaceMutation,newlyUnlocked} from './places-model.js';
import {validateMahjong,mahjongTitle} from './mahjong-model.js';
import {assertExerciseMutation} from './exercise-model.js';
import {validateReimbursements,commonBalance,assertSettledEdit,migrationSummary} from './reimbursements.js';
export const areas={places:'📍吃喝玩樂',placeVisits:'📍吃喝玩樂',mahjongPlayers:mahjongTitle,mahjongSessions:mahjongTitle,mahjongSettings:mahjongTitle,exercisePlans:'運動',settlements:'帳本',money:'帳本',categories:'分類',recurring:'固定收支',events:'行程',chores:'家務',petProfiles:'寵物資料',petWeights:'體重',petMedications:'用藥計畫',petDoses:'餵藥',petVisits:'就診',petPreventives:'預防針',pets:'飲食觀察',health:'運動',members:'帳戶設定'};
const clone=value=>value==null?null:structuredClone(value);
export function equal(a,b){
 if(a===b)return true;if(a==null||b==null||typeof a!=='object'||typeof b!=='object')return false;
 if(Array.isArray(a)||Array.isArray(b))return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>equal(v,b[i]));
 const ak=Object.keys(a).filter(k=>a[k]!==undefined),bk=Object.keys(b).filter(k=>b[k]!==undefined);return ak.length===bk.length&&ak.every(k=>Object.hasOwn(b,k)&&equal(a[k],b[k]));
}
const recordsFor=(data,key)=>key==='mahjongPlayers'?(data.mahjong?.players||[]):key==='mahjongSessions'?(data.mahjong?.sessions||[]):data[key]||[];
const recordKey=(collection,record)=>collection==='members'?record.userId:record.id;
export function snapshot(data){const {activity,...document}=data;return clone(document);}
const accountSettings=data=>({opening:data.opening,threshold:data.threshold,...(data.settings!==undefined?{preferences:clone(data.settings)}:{})});
export function changesBetween(before,after){
 const changes=[];
 for(const collection of Object.keys(areas)){
  if(collection==='mahjongSettings'){if(!equal(before.mahjong?.settings??null,after.mahjong?.settings??null))changes.push({collection,id:'settings',before:clone(before.mahjong?.settings),after:clone(after.mahjong?.settings)});continue;}
  if(collection==='exercisePlans'){for(const id of new Set([...Object.keys(before.exercisePlans||{}),...Object.keys(after.exercisePlans||{})]))if(!equal(before.exercisePlans?.[id]??null,after.exercisePlans?.[id]??null))changes.push({collection,id,before:clone(before.exercisePlans?.[id]),after:clone(after.exercisePlans?.[id])});continue;}
  const old=new Map(recordsFor(before,collection).map(x=>[recordKey(collection,x),x])),now=new Map(recordsFor(after,collection).map(x=>[recordKey(collection,x),x]));
  for(const id of new Set([...old.keys(),...now.keys()]))if(!equal(old.get(id)??null,now.get(id)??null))changes.push({collection,id,before:clone(old.get(id)),after:clone(now.get(id)),beforeIndex:recordsFor(before,collection).findIndex(x=>recordKey(collection,x)===id)});
 }
 const old=accountSettings(before),now=accountSettings(after);if(!equal(old,now))changes.push({collection:'settings',id:'account',before:old,after:now});
 return changes;
}
export function areaFor(change){const r=change.after||change.before;return change.collection==='events'&&r?.type==='休假'?'休假':change.collection==='health'&&r?.kind==='InBody'?'InBody':areas[change.collection]||'帳戶設定';}
export function describe(data,collection,record){
 if(!record)return '';
 if(collection==='places')return [record.name,record.city,record.district].join(' · ');if(collection==='placeVisits')return [data.places?.find(p=>p.id===record.placeId)?.name||'地點',record.date,'造訪'].join(' · ');
 if(collection==='mahjongPlayers')return record.name;if(collection==='mahjongSessions')return record.date;if(collection==='mahjongSettings')return '排行門檻';
 const pet=data.petProfiles?.find(p=>p.id===record.petId)?.name||record.pet||'';const person=data.members?.find(m=>m.userId===record.personUserId)?.name||record.person;
 if(collection==='petProfiles'||collection==='categories')return record.name;if(collection==='recurring')return [record.template?.note||record.template?.title||record.template?.category,'NT$'+Number(record.template?.amount||0).toLocaleString('zh-TW')].join(' · ');
 if(collection==='money'&&record.splits)return (record.note||record.title||'拆分 '+record.splits.length+' 項')+' NT$'+Number(record.amount||0).toLocaleString('zh-TW')+'（拆分 '+record.splits.length+' 項）';
 if(collection==='money')return [record.date,record.title||record.category,'NT$'+Number(record.amount||0).toLocaleString('zh-TW')].filter(Boolean).join(' · ');
 if(collection==='health')return [record.date,person,record.kind==='InBody'?'InBody · '+record.weight+' kg':record.title+' · '+record.minutes+' 分鐘'].filter(Boolean).join(' · ');
 if(collection==='settings')return '共同帳戶餘額與提醒設定';
 if(collection==='petVisits')return [pet,record.date,record.hospital,'NT$'+Number(record.cost||0).toLocaleString('zh-TW')].filter(Boolean).join(' · ');
 return [pet,record.date,record.title||record.drug||record.item||record.name||(collection==='petWeights'?record.weight+' kg':collection==='members'?record.name:'帳戶設定')].filter(Boolean).join(' · ');
}
// 在 mutate 的可重試 callback 中呼叫，與資料一起交給 family_save。
export function appendActivity(data,before,{id,at,userId,action,summary,restoreOf,importing=false,ledgerMigration=false,reimbursementMigration=false,mahjongImport=false}){
 const member=before.members?.find(x=>x.userId===userId)||data.members?.find(x=>x.userId===userId);if(!member)throw Error('找不到操作者成員身分');
 if(reimbursementMigration)return [{id:id+':reimbursement-migration',at,userId,name:member.name,action:'編輯',area:'帳本',collection:'document',recordId:'reimbursement-migration',summary:migrationSummary,before:null,after:{version:1},systemMigration:true,groupId:id,rootId:id+':reimbursement-migration'}];
 let changes=changesBetween(before,data);
 if(ledgerMigration){if(equal(before,data))return [];changes=[{collection:'document',id:'finance-migration',before:snapshot(before),after:snapshot(data)}];}
 if(importing)changes=[{collection:'document',id:'backup',before:snapshot(before),after:snapshot(data)}];
 if(!changes.length)return [];
 const root=changes.find(c=>c.collection==='places'&&!c.after)||changes.find(c=>c.collection==='settlements')||changes.find(c=>c.collection==='petProfiles'&&!c.after)||changes.find(c=>c.collection==='petMedications'&&!c.after)||changes.find(c=>c.collection==='petVisits'&&!c.after)||changes.find(c=>c.collection==='petVisits'&&!c.before)||changes.find(c=>c.collection==='petVisits')||changes.find(c=>c.collection==='members'||c.collection==='settings')||changes[0];
 const rootId=id+':'+root.collection+':'+root.id;
 const unlocked=changes.some(c=>c.collection==='placeVisits'&&c.after)?newlyUnlocked(before,data):[];
 const logs=changes.map(c=>{
  let verb=action||(!c.before?'新增':!c.after?'刪除':c.collection==='petDoses'?'完成':c.collection==='chores'&&!equal(c.before?.history,c.after?.history)?'完成':'編輯');
  if(c.collection==='petDoses'&&!c.before&&!action)verb='完成';
  const entry={id:id+':'+c.collection+':'+c.id,at,userId,name:member.name,action:verb,area:areaFor(c),recordId:c.id,summary:summary||`${verb}${areaFor(c)}：${describe(c.after?data:before,c.collection,c.after||c.before)}`,before:clone(c.before),after:clone(c.after),collection:c.collection,beforeIndex:c.beforeIndex,groupId:id,rootId};
  if(c.collection==='placeVisits'&&unlocked.length)entry.unlockedRegions=unlocked.map(r=>({country:r.country,city:r.city,district:r.district}));
  if(c.collection==='settlements'&&!summary){const s=c.after||c.before,recipient=(c.after?data:before).members?.find(m=>m.userId===s.memberUserId)?.name||'成員';entry.summary=c.after?member.name+' 幫'+recipient+'補款 NT$'+Number(s.amount).toLocaleString('zh-TW')+'（'+s.recordIds.length+' 筆）':'取消補款：'+recipient+' NT$'+Number(s.amount).toLocaleString('zh-TW');}
  if(!summary&&c.collection==='money'&&c.before&&c.after&&(c.before.reimbursement?.status||null)!==(c.after.reimbursement?.status||null)&&![...changes].some(c=>c.collection==='settlements')){const payer=data.members?.find(m=>m.userId===c.after.account)?.name||'成員';entry.summary=payer+'的'+(c.after.note||c.after.title||c.after.category)+'改為'+(c.after.reimbursement?.status==='pending'?'需要補款':'不需補款');}
  if(ledgerMigration){entry.summary='升級記帳分類與帳戶';entry.area='帳本';entry.systemMigration=true;}
  if(importing){entry.summary='匯入備份';entry.area='帳戶設定';entry.action='編輯';}
  if(restoreOf)entry.restores=restoreOf;
  if(entry.id===rootId){if(changes.length>1||(c.collection==='petProfiles'&&!c.after))entry.changes=clone(changes);if(c.collection==='petProfiles'&&!c.after){const bundle={pet:clone(c.before)};for(const other of changes)if(other!==c&&other.before&&!other.after)(bundle[other.collection]??=[]).push(clone(other.before));entry.before=bundle;}}
  return entry;
 });
 logs.sort((a,b)=>Number(a.id===rootId)-Number(b.id===rootId));return mahjongImport?[logs.find(e=>e.id===rootId)]:logs.length>100?logs.filter(e=>e.id===rootId):logs;
}
export function deleteRecord(data,collection,id){
 const record=(data[collection]||[]).find(x=>recordKey(collection,x)===id);if(!record)throw Error('紀錄已被刪除');
 if(collection==='places')data.placeVisits=(data.placeVisits||[]).filter(v=>v.placeId!==id);
 if(collection==='money')assertSettledEdit(record,null);if(collection==='settlements')throw Error('請使用取消補款');
 const relatedVisits=collection==='petProfiles'?(data.petVisits||[]).filter(v=>v.petId===id).map(v=>v.id):collection==='petVisits'?[id]:[];for(const r of data.money||[])if(relatedVisits.includes(r.visitId)||relatedVisits.some(v=>r.id==='pet-visit-'+v))assertSettledEdit(r,null);
 const visits=new Set(),plans=new Set();
 if(collection==='petProfiles'){
  for(const key of ['petWeights','petMedications','petDoses','petVisits','petPreventives','pets'])data[key]=(data[key]||[]).filter(x=>{const related=x.petId===id||(key==='pets'&&!x.petId&&x.pet===record.name);if(related&&key==='petVisits')visits.add(x.id);if(related&&key==='petMedications')plans.add(x.id);return !related;});
 }
 if(collection==='petMedications')plans.add(id);
 if(collection==='petVisits'){visits.add(id);for(const source of data.petVisits)if(source.followUpVisitId===id){source.followUpStatus='pending';delete source.followUpVisitId;}}
 if(plans.size)data.petDoses=(data.petDoses||[]).filter(x=>!plans.has(x.planId));
 if(visits.size)data.money=data.money.filter(x=>!visits.has(x.visitId)&&![...visits].some(v=>x.id==='pet-visit-'+v));
 data[collection]=data[collection].filter(x=>recordKey(collection,x)!==id);
}
export function visibleActivity(entry,userId){
 const hidden=r=>r?.visibility==='private'&&r.ownerId!==userId;
 if(entry.area==='行程'&&(hidden(entry.before)||hidden(entry.after)))return false;
 if(entry.collection==='document'&&[...(entry.before?.events||[]),...(entry.after?.events||[])].some(hidden))return false;
 if(entry.changes?.some(c=>c.collection==='events'&&(hidden(c.before)||hidden(c.after))))return false;
 return true;
}
export function rootEntry(data,id){const entry=data.activity?.find(x=>x.id===id);if(!entry)return null;return data.activity.find(x=>x.id===(entry.rootId||entry.id))||entry;}
export function currentFor(data,change){if(change.collection==='mahjongSettings')return clone(data.mahjong?.settings);if(change.collection==='exercisePlans')return clone(data.exercisePlans?.[change.id]);if(change.collection==='settings')return accountSettings(data);if(change.collection==='document')return snapshot(data);return clone(recordsFor(data,change.collection).find(x=>recordKey(change.collection,x)===change.id));}
export function restoreState(data,entry){return (entry.changes||[{collection:entry.collection,id:entry.recordId,before:entry.before,after:entry.after,beforeIndex:entry.beforeIndex}]).map(c=>currentFor(data,c));}
export function archivedActivity(entry){return entry?.collection==='events'||entry?.changes?.some(c=>c.collection==='events');}
export function restoreActivity(data,id,userId,{confirm=()=>true,ask=true,entries=data.activity||[]}={}){
 const entry=rootEntry({activity:entries},id);if(!entry||!visibleActivity(entry,userId))throw Error('找不到可還原的操作紀錄');
 if(entry.systemMigration)throw Error('資料升級紀錄僅供查看');
 if(archivedActivity(entry))throw Error('舊行程已封存，僅供查看，不支援還原');
 if(!(['settlements','exercisePlans'].includes(entry.collection)&&entry.action==='新增')&&!['刪除','編輯'].includes(entry.action)&&!(entry.action==='完成'&&entry.collection==='chores'))throw Error('此操作不支援還原');
 const changes=entry.changes||[{collection:entry.collection,id:entry.recordId,before:entry.before,after:entry.after,beforeIndex:entry.beforeIndex}],current=changes.map(c=>currentFor(data,c));
 if(changes.every((c,i)=>equal(current[i],c.before)))return false;
 const position=entries.findIndex(x=>x.id===entry.id);const newer=changes.some((c,i)=>!equal(current[i],c.after))||entries.slice(position+1).some(e=>e.groupId!==entry.groupId&&(e.collection==='document'||changes.some(c=>c.collection===e.collection&&c.id===e.recordId||e.changes?.some(other=>other.collection===c.collection&&other.id===c.id))));
 if((ask||newer)&&!confirm((newer?'此紀錄之後已有修改，還原會覆蓋較新的內容。\n':'')+'確定還原「'+entry.summary+'」及其連動紀錄？'))return false;
 const restored=clone(data);
 for(const change of changes){
  if(!Object.hasOwn(areas,change.collection)&&!['settings','document'].includes(change.collection))throw Error('不支援還原這個資料類型');const target=clone(change.before);
  if(change.collection==='settings'){restored.opening=target.opening;restored.threshold=target.threshold;if(Object.hasOwn(target,'preferences'))restored.settings=clone(target.preferences);else if(Object.hasOwn(change.after||{},'preferences'))delete restored.settings;continue;}
  if(change.collection==='document'){const events=clone(restored.events);for(const k of Object.keys(restored))delete restored[k];Object.assign(restored,snapshot(target));restored.events=events;continue;}
  if(change.collection.startsWith('mahjong')){restored.mahjong??={players:[],sessions:[],settings:{minGames:3}};if(change.collection==='mahjongSettings'){restored.mahjong.settings=target||{minGames:3};continue;}const list=change.collection==='mahjongPlayers'?restored.mahjong.players:restored.mahjong.sessions,index=list.findIndex(r=>r.id===change.id);if(target==null){if(index>=0)list.splice(index,1);}else if(index>=0)list[index]=target;else list.push(target);continue;}
  if(change.collection==='exercisePlans'){restored.exercisePlans??={};if(target==null)delete restored.exercisePlans[change.id];else restored.exercisePlans[change.id]=target;continue;}
  const list=restored[change.collection]??=[];const index=list.findIndex(x=>recordKey(change.collection,x)===change.id);
  if(target==null){if(index>=0)list.splice(index,1);}else if(index>=0)list[index]=target;else list.splice(Number.isInteger(change.beforeIndex)?Math.min(change.beforeIndex,list.length):list.length,0,target);
 }
 validatePlaces(restored);assertPlaceMutation(data,restored,userId,{restoring:true});validateMahjong(restored);assertExerciseMutation(data,restored,userId);validateReimbursements(restored);if(changes.some(c=>c.collection==='settlements')&&Math.round(commonBalance(restored)*100)<0)throw Error('還原會造成共同帳戶餘額不足，請先補充收入或取消其他補款');for(const k of Object.keys(data))delete data[k];Object.assign(data,restored);
 return true;
}
export function changedFields(before,after,prefix=''){
 const result=[];for(const key of new Set([...Object.keys(before||{}),...Object.keys(after||{})])){const a=before?.[key]??null,b=after?.[key]??null;if(equal(a,b))continue;const path=prefix?prefix+'.'+key:key;if(a&&b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b))result.push(...changedFields(a,b,path));else result.push({field:path,before:a,after:b});}return result;
}
