import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import * as model from '../public/model.js';
import {createMobileUI} from '../public/mobile-ui.js';
import {createActivityStore} from '../public/activity-store.js';
import {createActivityUI} from '../public/activity-ui.js';
import {createRecordCalendar} from '../public/record-calendar-ui.js';
import {createPetManager} from '../public/pet-manager.js';
import {appendActivity,snapshot} from '../public/activity.js';
import {retryMutation} from '../public/mutations.js';
import {createHomeSync} from '../public/realtime.js';
import {ensureMembers,renameMember} from '../public/members.js';
import {activityRPC} from '../test-support/activity.js';
const tick=()=>new Promise(r=>setTimeout(r,20));
async function fixture(){const dom=new JSDOM(await readFile(new URL('../public/index.html',import.meta.url),'utf8'),{url:'http://localhost/#home',runScripts:'outside-only'}),w=dom.window;Object.defineProperty(w,'innerWidth',{value:375,writable:true});let reads=0,revision=1,listener,gate=null;const stored=model.normalizeNames(model.empty());stored.members=[{userId:'a',name:'阿嘎',color:'#315c4c'},{userId:'b',name:'糖糖',color:'#b97878'}];stored.petProfiles=[{id:'p',name:'小橘',date:'2026-01-01'}];
 w.structuredClone=structuredClone;w.scrollTo=()=>{};w.confirm=()=>true;w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};Object.assign(w,model,{createActivityStore,appendActivity,snapshot,retryMutation,createHomeSync,ensureMembers,renameMember});w.createMobileUI=o=>createMobileUI({...o,document:w.document});w.createActivityUI=o=>createActivityUI({...o,document:w.document});w.createRecordCalendar=o=>createRecordCalendar({...o,document:w.document,storage:w.localStorage});w.createPetManager=o=>createPetManager({...o,document:w.document});w.client={auth:{getSession:async()=>({data:{session:{user:{id:'a'}}}}),onAuthStateChange(){}},channel:()=>({on(t,f,fn){listener=fn;return this;},subscribe(fn){fn('SUBSCRIBED');},send:async()=> 'ok'}),removeChannel(){}};w.rpc=async(name,args)=>{if(name.startsWith('family_activity_'))return activityRPC([],name,args);if(name==='family_read'){reads++;if(gate)await gate;return{id:'h',revision,document:structuredClone(stored),owner:true};}throw Error('本測試不應寫入資料');};w.eval((await readFile(new URL('../public/app.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,''));await tick();await tick();const q=s=>w.document.querySelector(s),click=async s=>{assert.ok(q(s),s);q(s).click();await tick();},route=async hash=>{w.location.hash=hash;w.dispatchEvent(new w.Event('hashchange'));await tick();};return{dom,w,stored,q,click,route,reads:()=>reads,notify:async()=>{revision++;await listener({payload:{revision}});await tick();},gate:value=>gate=value};}

test('375px 手機：五格導覽、更多面板、各頁浮動新增與所選日期、設定才有登出',async()=>{
 const f=await fixture();const{dom,w,q,click,route}=f;try{
 assert.equal(q('#mobile-nav').children.length,5);assert.deepEqual([...q('#mobile-nav').children].map(e=>e.textContent.trim()),['⌂首頁','▤帳本','🐾寵物','🧹家務','⋯更多']);assert.match(q('#mobile-topbar h1').textContent,/月/);assert.equal(q('.local-notice #logout'),null);assert.equal(q('.local-notice .member-badge'),null);
 const date=model.today().slice(0,7)+'-15';await click(`[data-record-date="${date}"]`);await click('#mobile-add');await click('[data-mobile-kind="money"]');assert.equal(q('[name="date"]').value,date);await click('.close');await click('#mobile-add');await click('[data-mobile-kind="health"]');assert.equal(q('[name="date"]').value,date);assert.equal(q('[name="kind"]').value,'運動');await click('.close');await click('#mobile-add');await click('[data-mobile-kind="pets"]');await click('[data-pet-action="choose-pet"]');await click('[data-pet-action="choose-type"][data-pet-id="weight"]');assert.equal(q('#pet-form [name="date"]').value,date);await click('.pet-close');
 await route('money');assert.equal(q('input[type="month"]'),null);const initial=q('.page-month-picker h2').textContent;await click('[data-page-month="money"][data-step="-1"]');assert.notEqual(q('.page-month-picker h2').textContent,initial);await click('#mobile-add');assert.match(q('#modal-title').textContent,/收支/);await click('.close');
 await route('pets');await click('#mobile-add');assert.ok(q('#pet-form [name="species"]'));await click('.pet-close');for(const [tab,field]of [['weight','weight'],['visit','hospital'],['preventive','item'],['medication','drug']]){await route('pets/p/'+tab);await click('#mobile-add');assert.ok(q(`#pet-form [name="${field}"]`),tab);await click('.pet-close');}await route('pets/p/diet');await click('#mobile-add');assert.match(q('#modal-title').textContent,/毛孩/);await click('.close');
 await route('chores');await click('#mobile-add');assert.ok(q('[name="scheduleMode"]'));await click('.close');await route('health');await click('#mobile-add');assert.equal(q('[name="kind"]').value,'運動');await click('.close');await click('#mobile-more');assert.equal(q('#more-sheet').open,true);assert.equal(q('#more-sheet a[href="#health"]').textContent.trim(),'♡ 運動健康');await click('[data-mobile-settings]');assert.equal(q('#more-sheet').open,false);assert.ok(q('#modal #logout'));assert.match(q('.settings-member').textContent,/阿嘎/);await click('.close');await route('activity');assert.equal(q('#mobile-add').hidden,true);
 }finally{dom.window.close();}
});

test('首頁搜尋／任何輸入框有焦點時 Broadcast 不重繪，失焦才載入；載入途中取得焦點也延後',async()=>{
 const f=await fixture();const{dom,w,q,click}=f;try{
 await click('#record-search');let input=q('#record-query');input.focus();input.value='未完成的搜尋';const before=f.reads();await f.notify();assert.equal(f.reads(),before);assert.equal(q('#record-query'),input);assert.equal(input.value,'未完成的搜尋');assert.equal(q('#mobile-topbar .sync-dot').classList.contains('synced'),false);input.blur();await tick();await tick();assert.ok(f.reads()>before);assert.equal(q('#mobile-topbar .sync-dot').classList.contains('synced'),true);
 input=q('#record-query');let release;f.gate(new Promise(r=>release=r));const loading=f.notify();await tick();input.focus();input.value='載入中的草稿';release();await loading;f.gate(null);assert.equal(q('#record-query'),input);assert.equal(input.value,'載入中的草稿');input.blur();await tick();await tick();assert.notEqual(q('#record-query'),input);
 // Also covers inputs outside dialogs, not only the home search box.
 const extra=w.document.createElement('textarea');w.document.body.append(extra);extra.focus();const reads=f.reads();await f.notify();assert.equal(f.reads(),reads);extra.blur();await tick();await tick();assert.ok(f.reads()>reads);
 }finally{dom.window.close();}
});

test('手機表單可點背景或下滑關閉，375px 日曆與底部安全區樣式約束',async()=>{
 const f=await fixture();const{dom,w,q,click,route}=f;try{
 await route('money');await click('#mobile-add');q('#modal').dispatchEvent(new w.MouseEvent('click',{bubbles:true,clientX:999,clientY:999}));await tick();assert.equal(q('#modal').open,false);await click('#mobile-add');const start=new w.Event('touchstart',{bubbles:true});Object.defineProperty(start,'touches',{value:[{clientX:100,clientY:100}]});q('#modal .dialog-head').dispatchEvent(start);const end=new w.Event('touchend',{bubbles:true});Object.defineProperty(end,'changedTouches',{value:[{clientX:105,clientY:200}]});q('#modal .dialog-head').dispatchEvent(end);assert.equal(q('#modal').open,false);
 const css=await readFile(new URL('../public/style.css',import.meta.url),'utf8');assert.match(css,/@media\(max-width:759px\)/);assert.match(css,/#mobile-nav\{[^}]*padding-bottom:env\(safe-area-inset-bottom\)/);assert.match(css,/#mobile-nav a,#mobile-nav button\{[^}]*min-height:60px[^}]*font-size:11px/);assert.match(css,/\.record-day\{min-height:52px/);
 }finally{dom.window.close();}
});
