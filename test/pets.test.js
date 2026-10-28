import test from 'node:test';
import assert from 'node:assert/strict';
import {empty,normalizeNames} from '../public/model.js';
import {hydratePets,medicationSlots,preventiveAlerts,recordDose,saveVisit} from '../public/pets-model.js';

test('舊飲食紀錄可建立穩定的多寵物對應，重複載入不新增寵物',()=>{
 const data=empty();data.pets=[{id:'1',date:'2026-10-28',pet:'小橘',kind:'飲食'},{id:'2',date:'2026-10-28',pet:'小白',kind:'飲食'}];const a=normalizeNames(data),b=normalizeNames(data);assert.equal(a.petProfiles.length,2);assert.equal(a.pets[0].petId,b.pets[0].petId);assert.equal(hydratePets(a).petProfiles.length,2);
});
test('用藥開始結束日、間隔日、每日多次與重複餵藥標記',()=>{
 const d=hydratePets(empty());d.petMedications=[{id:'a',petId:'p',drug:'藥 A',dose:'1 顆',start:'2026-10-28',end:'2026-10-30',mode:'每天幾次',times:'2'},{id:'b',petId:'q',drug:'藥 B',start:'2026-10-28',mode:'每幾天一次',everyDays:'3'}];
 assert.equal(medicationSlots(d,'2026-10-27').length,0);assert.equal(medicationSlots(d,'2026-10-28','p').length,2);assert.equal(medicationSlots(d,'2026-10-29','q').length,0);assert.equal(medicationSlots(d,'2026-10-31','q').length,1);assert.equal(medicationSlots(d,'2026-10-31','p').length,0);
 const slot=medicationSlots(d,'2026-10-28','p')[0];recordDose(d,slot.id,'2026-10-28',{id:'user1',name:'阿嘎',at:'2026-10-28T01:00:00Z'});assert.equal(medicationSlots(d,'2026-10-28','p')[0].done.by,'阿嘎');assert.equal(d.petDoses[0].drug,'藥 A');assert.throws(()=>recordDose(d,slot.id,'2026-10-28',{id:'user2',name:'糖糖'}),/已由 阿嘎 標記餵藥/);assert.equal(d.petDoses.length,1);assert.throws(()=>recordDose(d,'unknown','2026-10-28',{}),/不在今日/);
 d.petMedications[0].stopped=true;assert.equal(medicationSlots(d,'2026-10-28','p').length,0);assert.equal(d.petDoses.length,1);
});
test('預防保健七天提醒、逾期與同項目的後續紀錄',()=>{
 const d=hydratePets(empty());d.petPreventives=[{id:'a',petId:'p',item:'預防針',date:'2026-01-01',next:'2026-11-04'},{id:'b',petId:'q',item:'驅蟲',date:'2026-09-01',next:'2026-10-01'},{id:'c',petId:'q',item:'驅蟲',date:'2026-10-02',next:'2026-12-01'},{id:'d',petId:'p',item:'驅蟲',date:'2026-10-01',next:'2026-11-05'}];assert.deepEqual(preventiveAlerts(d,'2026-10-28').map(x=>x.id),['a']);
});
test('就診同步帳本：原子新增、重存更新不重複、取消同步移除連結支出',()=>{
 const d=hydratePets(empty());d.opening=1000;d.petProfiles=[{id:'p',name:'小橘'}];const v={id:'visit1',petId:'p',date:'2026-10-28',hospital:'動物醫院',cost:'300',syncMoney:true,person:'阿嘎',source:'共同帳戶'};saveVisit(d,v);saveVisit(d,{...v,cost:'350'});assert.equal(d.money.length,1);assert.equal(d.petVisits.length,1);assert.equal(d.money[0].amount,'350');saveVisit(d,{...v,syncMoney:false});assert.equal(d.money.length,0);assert.equal(d.petVisits.length,1);
});

test('舊體重正確匯入一次，刪除匯入的體重後不會再次出現',()=>{
 const d=empty();d.pets=[{id:'old',date:'2026-10-28',pet:'小橘',kind:'體重',amount:'4.25 kg'}];hydratePets(d);assert.equal(d.petWeights.length,1);assert.equal(d.petWeights[0].weight,'4.25');assert.equal(d.petWeights[0].petId,d.petProfiles[0].id);d.petWeights=[];hydratePets(d);assert.equal(d.petWeights.length,0);
});
