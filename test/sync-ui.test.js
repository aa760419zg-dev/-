import {createLedgerUI} from '../public/ledger-ui.js';
import {migrateLedger,materializeRecurring} from '../public/ledger-model.js';
import {createMobileUI} from '../public/mobile-ui.js';
import {createActivityStore} from '../public/activity-store.js';
import {activityRPC,remember} from '../test-support/activity.js';
import {createRecordCalendar} from '../public/record-calendar-ui.js';
import {appendActivity,snapshot} from '../public/activity.js';
import {createActivityUI} from '../public/activity-ui.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import * as model from '../public/model.js';
import {createPetManager} from '../public/pet-manager.js';
import {retryMutation} from '../public/mutations.js';
import {createHomeSync} from '../public/realtime.js';
import {ensureMembers,renameMember} from '../public/members.js';
const tick=()=>new Promise(r=>setTimeout(r,20));
test('UI：Broadcast 在編輯時延後，關閉後載入；回前景立即同步；60 秒備援',async()=>{
 const logs=[];
 const dom=new JSDOM(await readFile(new URL('../public/index.html',import.meta.url),'utf8'),{url:'http://localhost/',runScripts:'outside-only'}),w=dom.window;
 try{
 let stored=model.empty(),revision=1,reads=0,listener,visible='visible',intervals=[],sent=[],readGate=null;
 stored.members=[{userId:'a',name:'阿嘎',color:'#315c4c'},{userId:'b',name:'糖糖',color:'#b97878'}];
 Object.defineProperty(w.document,'visibilityState',{get:()=>visible});
 w.setInterval=(fn,delay)=>{intervals.push({fn,delay});return 1;};w.structuredClone=structuredClone;w.confirm=()=>true;w.scrollTo=()=>{};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 w.createRecordCalendar=o=>createRecordCalendar({...o,document:w.document,storage:w.localStorage});w.createMobileUI=o=>createMobileUI({...o,document:w.document});w.createLedgerUI=o=>createLedgerUI({...o,document:w.document});Object.assign(w,model,{migrateLedger,materializeRecurring,createActivityStore,retryMutation,createHomeSync,ensureMembers,renameMember,appendActivity,snapshot});w.createActivityUI=options=>createActivityUI({...options,document:w.document});w.createPetManager=o=>createPetManager({...o,document:w.document});
 const channel={on(type,filter,fn){listener=fn;return this;},subscribe(fn){fn('SUBSCRIBED');},send:async msg=>{sent.push(msg);return 'ok';}};
 w.client={channel:()=>channel,removeChannel(){},auth:{getSession:async()=>({data:{session:{user:{id:'a',email:'a@example.com'}}}}),onAuthStateChange(){}}};
 migrateLedger(stored);w.rpc=async(name,args)=>{if(name.startsWith('family_activity_'))return activityRPC(logs,name,args);if(name==='family_read'){reads++;if(readGate)await readGate;return {id:'home',document:structuredClone(stored),revision,owner:true};}if(name==='family_save'){assert.equal(args.expected_revision,revision);stored=structuredClone(args.new_document);remember(logs,args.new_activity);return ++revision;}};
 w.eval((await readFile(new URL('../public/app.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,''));await tick();await tick();
 const q=s=>w.document.querySelector(s),click=async s=>{q(s).click();await tick();};
 await click('#record-add');await click('[data-record-add="money"]');q('#ledger-note').value='未送出的草稿';const before=reads;
 stored.money.push({id:'remote',date:model.today(),kind:'支出',amount:'10',title:'糖糖新增',category:'其他',source:'共同帳戶'});revision++;
 await listener({payload:{revision}});await tick();assert.equal(reads,before);assert.equal(q('#ledger-note').value,'未送出的草稿');
 await click('.close');assert.ok(reads>before);assert.match(q('#view').textContent,/糖糖新增/);
 let loaded=reads;visible='hidden';revision++;stored.money[0].title='回到前景可看見';await listener({payload:{revision}});assert.equal(reads,loaded);
 visible='visible';w.document.dispatchEvent(new w.Event('visibilitychange'));await tick();assert.ok(reads>loaded);assert.match(q('#view').textContent,/回到前景可看見/);
 assert.deepEqual(intervals.map(i=>i.delay),[60000]);loaded=reads;await intervals[0].fn();await tick();assert.ok(reads>loaded);
 // 寵物視窗也延後載入，關閉才同步。
 w.location.hash='pets';w.dispatchEvent(new w.Event('hashchange'));await tick();await click('[data-pet-action="new-profile"]');loaded=reads;revision++;await listener({payload:{revision}});assert.equal(reads,loaded);await click('.pet-close');assert.ok(reads>loaded);
 w.location.hash='home';w.dispatchEvent(new w.Event('hashchange'));await tick();
 // 更新已開始讀取，但使用者隨後開啟編輯器，結果仍應延後套用。
 let release;readGate=new Promise(resolve=>{release=resolve;});revision++;const inFlight=listener({payload:{revision}});await tick();await click('#record-add');await click('[data-record-add="money"]');q('#ledger-note').value='載入期間的草稿';release();await inFlight;readGate=null;assert.equal(q('#ledger-note').value,'載入期間的草稿');await click('.close');
 await click('#record-add');await click('[data-record-add="money"]');q('[name="amount"]').value='20';q('#ledger-note').value='本機新增';q('#form').dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();assert.deepEqual(JSON.parse(JSON.stringify(sent.at(-1))),{type:'broadcast',event:'revision',payload:{revision}});
 }finally{w.close();}
});
