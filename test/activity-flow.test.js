import {createNavigationGuard} from '../public/navigation.js';
import {icon,illustration} from '../public/icons.js';
import {completionFeedback} from '../public/feedback.js';
import {createLedgerUI} from '../public/ledger-ui.js';
import {migrateLedger,materializeRecurring} from '../public/ledger-model.js';
import {createMobileUI} from '../public/mobile-ui.js';
import {createActivityStore} from '../public/activity-store.js';
import {activityRPC,remember} from '../test-support/activity.js';
import {createRecordCalendar} from '../public/record-calendar-ui.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import * as model from '../public/model.js';
import {createPetManager} from '../public/pet-manager.js';
import {createActivityUI} from '../public/activity-ui.js';
import {appendActivity,snapshot} from '../public/activity.js';
import {retryMutation} from '../public/mutations.js';
import {createHomeSync} from '../public/realtime.js';
import {ensureMembers,renameMember} from '../public/members.js';
const tick=()=>new Promise(r=>setTimeout(r,20));
test('全站 UI：帳本／行程／飲食編輯刪除、5 秒復原、就診連動、寵物完整還原與操作紀錄',async()=>{
 const logs=[];
 const dom=new JSDOM(await readFile(new URL('../public/index.html',import.meta.url),'utf8'),{url:'http://localhost/',runScripts:'outside-only'}),w=dom.window;
 try{
 let stored=model.normalizeNames(model.empty()),revision=1,confirmations=[];
 const archived=[{id:'archived',date:'2026-10-01',person:'先生',type:'休假',title:'先生休假',note:'保留原樣'}];stored.events=structuredClone(archived);stored.members=[{userId:'a',name:'阿嘎',color:'#315c4c'},{userId:'b',name:'糖糖',color:'#b97878'}];stored.petProfiles=[{id:'p',name:'小橘',species:'貓',date:model.today()}];
 w.structuredClone=structuredClone;w.confirm=message=>{confirmations.push(message);return true;};w.scrollTo=()=>{};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 w.createRecordCalendar=o=>createRecordCalendar({...o,document:w.document,storage:w.localStorage});w.createMobileUI=o=>createMobileUI({...o,document:w.document});w.createLedgerUI=o=>createLedgerUI({...o,document:w.document});Object.assign(w,model,{migrateLedger,materializeRecurring,createActivityStore,retryMutation,createHomeSync,ensureMembers,renameMember,appendActivity,snapshot});w.createPetManager=o=>createPetManager({...o,document:w.document});w.createActivityUI=o=>createActivityUI({...o,document:w.document});
 w.client={auth:{getSession:async()=>({data:{session:{user:{id:'a'}}}}),onAuthStateChange(){}}};
 migrateLedger(stored);w.rpc=async(name,args)=>{if(name.startsWith('family_activity_'))return activityRPC(logs,name,args);if(name==='family_read')return {id:'home',owner:true,revision,document:structuredClone(stored)};if(name==='family_save'){assert.equal(args.expected_revision,revision);stored=structuredClone(args.new_document);remember(logs,args.new_activity);return ++revision;}};
 Object.assign(w,{icon,illustration,completionFeedback,createNavigationGuard:o=>createNavigationGuard({...o,document:w.document})});w.eval((await readFile(new URL('../public/app.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,''));await tick();
 const q=s=>w.document.querySelector(s),click=async s=>{assert.ok(q(s),s);q(s).click();await tick();},route=async hash=>{w.location.hash=hash;w.dispatchEvent(new w.Event('hashchange'));await tick();},fill=(n,v)=>{(q(`[name="${n}"]`)||(n==='title'?q('#ledger-note'):null)).value=v;},submit=async(selector='#form')=>{q(selector).dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();};
 await route('money');await click('[data-add="money"]');fill('amount','100');fill('title','買菜');await submit();const moneyId=stored.money[0].id;assert.equal(logs.length,1);
 await click('[data-edit-record="money"]');fill('amount','200');await submit();assert.equal(stored.money[0].id,moneyId);const editLog=logs.find(e=>e.recordId===moneyId&&e.action==='編輯');assert.equal(editLog.before.amount,100);assert.equal(editLog.after.amount,200);
 await click('[data-delete="money"]');assert.equal(stored.money.length,0);assert.match(confirmations.at(-1),/買菜.*200/);assert.equal(q('#undo-toast').hidden,false);await click('#undo-toast button');assert.equal(stored.money.length,1);assert.equal(logs.at(-1).action,'還原');
 await route('calendar');assert.equal(w.location.hash,'#home');assert.equal(q('[data-add="events"]'),null);
 await route('pets/p/diet');await click('[data-pet-action="add-diet"]');fill('title','雞肉罐頭');await submit();await click('[data-pet-action="edit-diet"]');fill('note','食慾正常');await submit();assert.equal(stored.pets[0].note,'食慾正常');await click('[data-pet-action="delete-diet"]');assert.equal(stored.pets.length,0);await click('#undo-toast button');assert.equal(stored.pets.length,1);
 await route('pets/p/visit');await click('[data-pet-action="new-visit"]');fill('hospital','和平動物醫院');fill('cost','1200');q('[name="syncMoney"]').checked=true;await submit('#pet-form');const visit=stored.petVisits[0],linked=stored.money.find(m=>m.visitId===visit.id);assert.ok(linked);assert.equal(logs.filter(e=>e.groupId===logs.at(-1).groupId).length,2);
 await route('money');await click(`[data-edit-record="money"][data-id="${linked.id}"]`);assert.equal(q('#modal').open,false);assert.match(q('#toast').textContent,/就診紀錄修改/);
 await route('pets/p/visit');await click('[data-pet-action="delete-visit"]');assert.equal(stored.petVisits.length,0);assert.ok(!stored.money.some(m=>m.visitId===visit.id));await click('#undo-toast button');assert.equal(stored.petVisits.length,1);assert.equal(stored.money.filter(m=>m.visitId===visit.id).length,1);
 await route('pets/p/summary');await click('[data-pet-action="profile-menu"]');await click('[data-pet-action="delete-profile"]');assert.match(confirmations.at(-1),/一併刪除 2 筆/);assert.equal(stored.petProfiles.length,0);assert.equal(stored.pets.length,0);assert.equal(stored.petVisits.length,0);await click('#undo-toast button');assert.equal(stored.petProfiles.length,1);assert.equal(stored.pets.length,1);assert.equal(stored.petVisits.length,1);assert.equal(stored.money.length,2);
 await click('#settings');await click('#open-activity');assert.match(q('h1').textContent,/操作紀錄/);await click(`[data-audit-detail="${editLog.id}"]`);assert.match(q('#view').textContent,/修改前/);assert.equal(q('.audit-diff strong').textContent,'金額');
 await click('[data-audit-member="b"]');assert.equal(q('.audit-entry'),null);
 // 匯入只替換業務資料，現有 activity 保留，不採用備份內的歷史。
 const priorIds=logs.map(e=>e.id),incoming=model.empty();incoming.activity=[{id:'foreign-history',at:new Date().toISOString()}];
 await click('#settings');const originalCreate=w.document.createElement.bind(w.document);w.document.createElement=(tag,...args)=>{const element=originalCreate(tag,...args);if(tag==='input')element.click=()=>{Object.defineProperty(element,'files',{value:[{size:100,text:async()=>JSON.stringify(incoming)}]});void element.onchange();};return element;};await click('#import');await tick();w.document.createElement=originalCreate;
 assert.ok(priorIds.every(id=>logs.some(e=>e.id===id)));assert.ok(!logs.some(e=>e.id==='foreign-history'));assert.equal(logs.at(-1).summary,'匯入備份');assert.equal(logs.at(-1).before.activity,undefined);assert.deepEqual(stored.events,archived);

 }finally{w.close();}
});
