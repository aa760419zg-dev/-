import test from 'node:test';
import assert from 'node:assert/strict';
import {empty,normalizeNames} from '../public/model.js';
import {appendActivity,snapshot,deleteRecord,restoreActivity,visibleActivity,changedFields,pruneActivity,rootEntry} from '../public/activity.js';
import {retryMutation} from '../public/mutations.js';
import {saveVisit} from '../public/pets-model.js';
const context=id=>({id,at:'2026-10-28T10:00:00.000Z',userId:'a'});
function fixture(){const d=normalizeNames(empty());d.members=[{userId:'a',name:'阿嘎',color:'#315c4c'},{userId:'b',name:'糖糖',color:'#b97878'}];d.petProfiles=[{id:'p',name:'小橘',date:'2026-01-01',photo:'home/photo.jpg'},{id:'q',name:'小白',date:'2026-01-01'}];return d;}
function audited(d,fn,id,opts={}){const before=snapshot(d);fn();return appendActivity(d,before,{...context(id),...opts});}
test('新增、編輯、完成、置頂、暱稱與同步帳本紀錄均捕捉完整前後值',()=>{
 const d=fixture();audited(d,()=>d.money.push({id:'m',date:'2026-10-28',title:'買菜',amount:'100'}),'add');assert.equal(d.activity[0].before,null);assert.equal(d.activity[0].after.amount,'100');assert.equal(d.activity[0].name,'阿嘎');
 audited(d,()=>d.money.find(x=>x.id==='m').amount='150','edit');assert.equal(d.activity.at(-1).action,'編輯');assert.equal(d.activity.at(-1).before.amount,'100');
 audited(d,()=>saveVisit(d,{id:'v',petId:'p',date:'2026-10-28',hospital:'和平動物醫院',cost:'1200',syncMoney:true}),'visit');assert.equal(d.activity.filter(x=>x.groupId==='visit').length,2);assert.match(d.activity.find(x=>x.groupId==='visit'&&x.area==='就診').summary,/小橘.*和平.*1,200/);
 audited(d,()=>{d.chores.push({id:'c',date:'',title:'濾心',history:[]});},'chore');audited(d,()=>{const c=d.chores.find(x=>x.id==='c');c.history.push('2026-10-28');c.date='2026-10-28';},'complete');assert.equal(d.activity.at(-1).action,'完成');
 audited(d,()=>d.chores.find(x=>x.id==='c').pinned=true,'pin');assert.equal(d.activity.at(-1).action,'編輯');
});
test('刪除整隻寵物保存所有相關資料與連動支出，全部還原且重複還原不重複加入',()=>{
 const d=fixture();for(const k of ['petWeights','petMedications','petDoses','petVisits','petPreventives','pets'])d[k]=[{id:k,petId:'p',date:'2026-10-28',name:'x'}];d.petVisits[0].photos=['home/receipt.jpg'];d.money=[{id:'linked',visitId:'petVisits',amount:'100'},{id:'other',amount:'50'}];
 const before=snapshot(d);audited(d,()=>deleteRecord(d,'petProfiles','p'),'delete');const root=rootEntry(d,d.activity.at(-1).id);assert.equal(root.area,'寵物資料');assert.equal(root.before.pet.name,'小橘');assert.equal(root.before.petDoses.length,1);assert.equal(root.before.money.length,1);assert.equal(d.petProfiles.length,1);assert.equal(d.money.length,1);
 audited(d,()=>assert.equal(restoreActivity(d,root.id,'a',{confirm:()=>true}),true),'restore',{action:'還原',restoreOf:root.id});for(const k of Object.keys(before))assert.deepEqual(d[k],before[k],k);
 const count=d.activity.length;audited(d,()=>assert.equal(restoreActivity(d,root.id,'a'),false),'again',{action:'還原'});assert.equal(d.activity.length,count);assert.equal(d.petVisits[0].photos[0],'home/receipt.jpg');
});
test('就診及用藥計畫刪除連動還原；不會重複加入同 id',()=>{
 const d=fixture();saveVisit(d,{id:'v',petId:'p',date:'2026-10-28',hospital:'醫院',cost:'100',syncMoney:true,photos:['home/a.jpg']});audited(d,()=>deleteRecord(d,'petVisits','v'),'delete-v');assert.equal(d.money.length,0);restoreActivity(d,d.activity.at(-1).id,'a',{confirm:()=>true});assert.equal(d.money.length,1);assert.equal(d.petVisits.length,1);
 d.petMedications=[{id:'plan',petId:'p',date:'2026-10-28'}];d.petDoses=[{id:'dose',planId:'plan',petId:'p',date:'2026-10-28'}];audited(d,()=>deleteRecord(d,'petMedications','plan'),'delete-plan');assert.equal(d.petDoses.length,0);restoreActivity(d,d.activity.at(-1).id,'a',{confirm:()=>true});assert.equal(d.petDoses.length,1);
});
test('還原較新資料要警告，拒絕時不改資料；私人行程及差異過濾',()=>{
 const d=fixture();d.events=[{id:'e',date:'2026-10-28',title:'舊行程'}];audited(d,()=>d.events.find(x=>x.id==='e').title='新版','edit');const id=d.activity[0].id;d.events[0].title='更新版';let message='';assert.equal(restoreActivity(d,id,'a',{confirm:m=>{message=m;return false;}}),false);assert.match(message,/此紀錄之後已有修改/);assert.equal(d.events[0].title,'更新版');restoreActivity(d,id,'a',{confirm:()=>true});assert.equal(d.events[0].title,'舊行程');
 assert.equal(visibleActivity({area:'行程',before:{visibility:'private',ownerId:'b'}},'a'),false);assert.equal(visibleActivity({area:'行程',after:{visibility:'private',ownerId:'a'}},'a'),true);assert.deepEqual(changedFields({name:'a',note:'same'},{name:'b',note:'same'}),[{field:'name',before:'a',after:'b'}]);
});
test('活動保留同時符合最近十二個月及最多兩千筆，匯入保留原歷史且不遞迴快照',()=>{
 const entries=Array.from({length:2100},(_,i)=>({id:String(i),at:new Date(Date.UTC(2026,9,28,0,0,i)).toISOString()}));entries.unshift({id:'old',at:'2025-10-27T00:00:00Z'});assert.equal(pruneActivity(entries,'2026-10-28T10:00:00Z').length,2000);assert.ok(!pruneActivity(entries,'2026-10-28T10:00:00Z').some(x=>x.id==='old'));
 const d=fixture();audited(d,()=>d.opening=1,'first');const before=snapshot(d);d.opening=200;appendActivity(d,before,{...context('import'),importing:true});assert.equal(d.activity.length,2);assert.equal(d.activity.at(-1).summary,'匯入備份');assert.equal(d.activity.at(-1).before.activity,undefined);assert.equal(d.activity.at(-1).after.activity,undefined);
});
test('資料與操作紀錄在同一份存檔；衝突重試只留一筆，失敗不留下假紀錄',async()=>{
 let d=fixture(),server=structuredClone(d),revision=0,home={id:'h',revision:0},tries=0;d.money=[{id:'m',date:'2026-10-28',amount:'100'}];server=structuredClone(d);const ctx=context('retry');
 await retryMutation({getData:()=>d,setData:v=>d=v,getHome:()=>home,loadHome:async()=>{d=structuredClone(server);home.revision=revision;},fn:()=>{const before=snapshot(d);d.money.find(x=>x.id==='m').amount='200';appendActivity(d,before,ctx);},save:async()=>{tries++;assert.equal(d.activity.length,1);if(tries===1){server.money[0].note='糖糖更新';revision++;throw Error('資料已更新');}server=structuredClone(d);home.revision=++revision;}});
 assert.equal(tries,2);assert.equal(server.activity.length,1);assert.equal(server.money[0].note,'糖糖更新');assert.equal(server.activity[0].before.note,'糖糖更新');
 await assert.rejects(retryMutation({getData:()=>d,setData:v=>d=v,getHome:()=>home,loadHome:async()=>{},fn:()=>audited(d,()=>d.money[0].amount='300','failed'),save:async()=>{throw Error('offline');}}),/offline/);assert.equal(d.activity.length,1);assert.equal(d.money[0].amount,'200');
});

test('無法建立操作紀錄時不允許業務修改存檔',async()=>{
 let d=fixture(),saved=0;await assert.rejects(retryMutation({getData:()=>d,setData:v=>d=v,getHome:()=>({id:'h',revision:0}),loadHome:async()=>{},save:async()=>saved++,fn:()=>{const before=snapshot(d);d.money.push({id:'new',date:'2026-10-28'});appendActivity(d,before,{...context('missing'),userId:'missing'});}}),/操作者/);assert.equal(saved,0);assert.equal(d.money.length,0);assert.equal(d.activity.length,0);
});

test('取消還原或重複還原沒有資料變動時不再存檔，也不增加 revision',async()=>{
 let d=fixture(),saved=0;await retryMutation({getData:()=>d,setData:v=>d=v,getHome:()=>({id:'h',revision:0}),loadHome:async()=>{},save:async()=>saved++,fn:()=>{}});assert.equal(saved,0);
});
