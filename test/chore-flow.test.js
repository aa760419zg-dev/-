import {icon,illustration} from '../public/icons.js';
import {completionFeedback} from '../public/feedback.js';
import {createLedgerUI} from '../public/ledger-ui.js';
import {migrateLedger,materializeRecurring} from '../public/ledger-model.js';
import {createMobileUI} from '../public/mobile-ui.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import * as model from '../public/model.js';
import {createActivityStore} from '../public/activity-store.js';
import {createActivityUI} from '../public/activity-ui.js';
import {createRecordCalendar} from '../public/record-calendar-ui.js';
import {createPetManager} from '../public/pet-manager.js';
import {appendActivity,snapshot} from '../public/activity.js';
import {retryMutation} from '../public/mutations.js';
import {createHomeSync} from '../public/realtime.js';
import {ensureMembers,renameMember} from '../public/members.js';
import {activityRPC,remember} from '../test-support/activity.js';
const tick=()=>new Promise(r=>setTimeout(r,20));
test('家務 UI：自動遷移、合併排序、直接完成／復原、歷史完成者、空白初始化與記帳聚焦',async()=>{
 const dom=new JSDOM(await readFile(new URL('../public/index.html',import.meta.url),'utf8'),{url:'http://localhost/#chores',runScripts:'outside-only'}),w=dom.window;
 try{
 let stored=model.normalizeNames(model.empty()),revision=1;const logs=[],confirms=[];stored.members=[{userId:'a',name:'阿嘎',color:'#315c4c'},{userId:'b',name:'糖糖',color:'#b97878'}];stored.chores=[{id:'d',title:'床單更換',date:'2026-01-01',next:'2026-10-01',repeatEvery:14,repeatUnit:'天',history:['2026-01-01']},{id:'w',title:'倒垃圾',date:'',next:'2026-11-02',cadence:'每週',history:[],pinned:true}];
 w.structuredClone=structuredClone;w.confirm=m=>{confirms.push(m);return true;};w.scrollTo=()=>{};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};w.createMobileUI=o=>createMobileUI({...o,document:w.document});w.createLedgerUI=o=>createLedgerUI({...o,document:w.document});Object.assign(w,model,{migrateLedger,materializeRecurring,createActivityStore,appendActivity,snapshot,retryMutation,createHomeSync,ensureMembers,renameMember});w.createActivityUI=o=>createActivityUI({...o,document:w.document});w.createPetManager=o=>createPetManager({...o,document:w.document});w.createRecordCalendar=o=>createRecordCalendar({...o,document:w.document,storage:w.localStorage});w.client={auth:{getSession:async()=>({data:{session:{user:{id:'b'}}}}),onAuthStateChange(){}}};migrateLedger(stored);w.rpc=async(name,args)=>{if(name.startsWith('family_activity_'))return activityRPC(logs,name,args);if(name==='family_read')return {id:'home',revision,document:structuredClone(stored),owner:false};if(name==='family_save'){assert.equal(args.expected_revision,revision);stored=structuredClone(args.new_document);remember(logs,args.new_activity);return ++revision;}};
 Object.assign(w,{icon,illustration,completionFeedback});w.eval((await readFile(new URL('../public/app.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,''));await tick();await tick();const q=s=>w.document.querySelector(s),click=async s=>{assert.ok(q(s),s);q(s).click();await tick();},route=async hash=>{w.location.hash=hash;w.dispatchEvent(new w.Event('hashchange'));await tick();};
 assert.equal(stored.chores[0].scheduleMode,'completion');assert.equal(stored.chores[1].scheduleMode,'fixed');assert.deepEqual(stored.chores[0].history,['2026-01-01']);assert.equal(q('.chore-row strong').textContent,'倒垃圾');assert.equal(q('.help'),null);assert.doesNotMatch(q('#view').textContent,/設定範例/);const before=structuredClone(stored.chores[0]);await click('[data-complete="d"]');assert.equal(confirms.length,0);assert.deepEqual(stored.chores[0].history.at(-1),{date:model.today(),userId:'b',name:'糖糖'});assert.match(q('#view').textContent,/上次由 糖糖 完成/);assert.match(q('#undo-toast').textContent,/完成了・復原/);await click('#undo-toast button');assert.deepEqual(stored.chores[0],before);assert.equal(confirms.length,0);assert.equal(logs.at(-1).action,'還原');
 await route('chores/d');assert.match(q('#view').textContent,/完成紀錄/);assert.match(q('#view').textContent,/未知完成/);await click('[data-edit-chore]');assert.equal(q('[name="scheduleMode"]').value,'從完成日起算');await click('.close');
 stored.chores=[];revision++;await click('#settings');await click('#refresh-cloud');await route('chores');assert.ok(q('#seed-chores'));assert.equal(q('#view').querySelectorAll('.card').length,1);await click('#seed-chores');assert.equal(stored.chores.length,6);assert.ok(stored.chores.every(c=>c.scheduleMode==='completion'));assert.equal(q('#seed-chores'),null);
 await route('money');await click('[data-add="money"]');assert.equal(q('[name="amount"]').readOnly,true);assert.equal(q('[name="amount"]').getAttribute('inputmode'),'none');assert.equal(q('[name="person"]'),null);assert.equal(q('#ledger-keypad').hidden,false);await click('.close');stored.chores[0].next=model.today();revision++;await click('#settings');await click('#refresh-cloud');await route('home');const homeBefore=structuredClone(stored.chores[0]);await click(`[data-complete="${homeBefore.id}"]`);assert.equal(confirms.length,0);assert.equal(stored.chores[0].history.at(-1).name,'糖糖');assert.match(q('.record-list').textContent,/糖糖完成/);await click('#undo-toast button');assert.deepEqual(stored.chores[0],homeBefore);
 }finally{w.close();}
});
