import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {empty,normalizeNames} from '../public/model.js';
import {medicationSlotNames,medicationSlots,recordDose,doseSlotName} from '../public/pets-model.js';
import {createPetManager} from '../public/pet-manager.js';
import {appendActivity,snapshot} from '../public/activity.js';
const tick=()=>new Promise(r=>setTimeout(r,15));
test('用藥時段預設1／2／3／4次、自訂名稱、舊計畫不改資料',()=>{
 assert.deepEqual(medicationSlotNames({times:1}),['早上']);assert.deepEqual(medicationSlotNames({times:2}),['早上','晚上']);assert.deepEqual(medicationSlotNames({times:3}),['早上','中午','晚上']);assert.deepEqual(medicationSlotNames({times:4}),['第 1 次','第 2 次','第 3 次','第 4 次']);assert.deepEqual(medicationSlotNames({times:2,slotNames:['早餐後','睡前']}),['早餐後','睡前']);const d=normalizeNames(empty());d.petMedications=[{id:'p',start:'2026-10-01',mode:'每天幾次',times:2}];const before=structuredClone(d);assert.deepEqual(medicationSlots(d,'2026-10-28').map(s=>s.name),['早上','晚上']);assert.deepEqual(d,before);
});
test('餵藥 ID 不變、既有紀錄仍防重複、名稱快照不因計畫改名改變',()=>{
 const d=normalizeNames(empty());d.members=[{userId:'a',name:'阿嘎',color:'#315c4c'}];d.petMedications=[{id:'plan',start:'2026-10-01',mode:'每天幾次',times:2,slotNames:['早餐後','睡前']}];recordDose(d,'plan:2026-10-28:1','2026-10-28',{id:'a',name:'阿嘎',at:'2026-10-28T01:00:00Z'});assert.equal(d.petDoses[0].slotName,'早餐後');d.petMedications[0].slotNames[0]='起床後';assert.equal(doseSlotName(d,d.petDoses[0]),'早餐後');d.members[0].name='新稱呼';assert.throws(()=>recordDose(d,'plan:2026-10-28:1','2026-10-28',{id:'a'}),/已由 新稱呼/);assert.equal(d.petDoses.length,1);const legacy={id:'plan:2026-10-28:2',planId:'plan',index:2,date:'2026-10-28'};d.petDoses.push(legacy);assert.equal(doseSlotName(d,legacy),'睡前');assert.ok(medicationSlots(d,'2026-10-28')[1].done);
});
test('用藥表單可命名、次數變動更新預設、待辦及歷史顯示時段且操作有紀錄',async()=>{
 const dom=new JSDOM('<main id="view"></main>',{url:'http://localhost/#pets/p/medication'}),w=dom.window,doc=w.document;try{
 const d=normalizeNames(empty());d.members=[{userId:'a',name:'阿嘎',color:'#315c4c'}];d.petProfiles=[{id:'p',name:'小橘',date:'2026-01-01'}];d.petMedications=[{id:'plan',petId:'p',date:'2026-10-01',start:'2026-10-01',mode:'每天幾次',times:2,drug:'抗生素',dose:'1 顆'}];let manager,sequence=0;const logs=[],render=()=>doc.querySelector('#view').innerHTML=manager.page();w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};manager=createPetManager({document:doc,getData:()=>d,getHome:()=>({id:'h'}),getSession:()=>({user:{id:'a'}}),today:()=>'2026-10-28',render,refresh:async()=>{},toast:()=>{},client:{},openLegacy(){},mutate:async fn=>{const before=snapshot(d);fn();logs.push(...appendActivity(d,before,{id:'op-'+(++sequence),at:'2026-10-28T01:00:00Z',userId:'a'}));render();return true;}});render();const q=s=>doc.querySelector(s),click=async s=>{q(s).click();await tick();};
 assert.match(q('#view').textContent,/小橘 · 抗生素 · 早上/);assert.match(manager.todos(),/抗生素 · 晚上/);await click('[data-pet-action="edit-medication"]');assert.equal(q('[name="slotName_2"]').value,'晚上');q('[name="slotName_1"]').value='早餐後';q('[name="times"]').value='3';q('[name="times"]').dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(q('[name="slotName_1"]').value,'早餐後');assert.equal(q('[name="slotName_2"]').value,'中午');assert.equal(q('[name="slotName_3"]').value,'晚上');q('#pet-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();assert.deepEqual(d.petMedications[0].slotNames,['早餐後','中午','晚上']);assert.ok(logs.some(e=>e.area==='用藥計畫'&&e.action==='編輯'));await click('[data-pet-action="dose"]');assert.equal(d.petDoses[0].slotName,'早餐後');assert.match(q('#view').textContent,/抗生素 · 1 顆 · 早餐後/);assert.ok(logs.some(e=>e.area==='餵藥'));
 }finally{w.close();}
});
