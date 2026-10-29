import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createPetManager} from '../public/pet-manager.js';
import {normalizeNames,empty} from '../public/model.js';
import {appendActivity,snapshot} from '../public/activity.js';
import {pendingVisits} from '../public/pets-model.js';
const tick=()=>new Promise(r=>setTimeout(r,10));
test('寵物月曆流程：選寵物／專用表單、日期帶入、時段防重複、固定待辦、回診原子完成取消及定位',async()=>{
 const dom=new JSDOM('<main id="view"></main>',{url:'http://localhost/#home'}),w=dom.window,doc=w.document;
 try{
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};w.confirm=()=>true;
 const d=normalizeNames(empty());d.members=[{userId:'a',name:'阿嘎',color:'#315c4c'}];d.petProfiles=[{id:'p',name:'小橘',date:'2026-01-01'}];d.petVisits=[{id:'v',petId:'p',date:'2026-10-01',hospital:'和平醫院',next:'2026-10-28'}];d.petPreventives=[{id:'vax',petId:'p',date:'2026-09-01',item:'驅蟲',next:'2026-10-15'}];d.chores=[{id:'c',date:'',title:'濾心',next:'2026-10-29'}];d.petMedications=[{id:'plan',petId:'p',date:'2026-10-01',start:'2026-10-01',mode:'每天幾次',times:1,drug:'藥 A',dose:'1 顆'}];
 let manager,seq=0,legacy;const render=()=>doc.querySelector('#view').innerHTML=w.location.hash.startsWith('#pets')?manager.page():manager.todos([]);
 manager=createPetManager({document:doc,getData:()=>d,getHome:()=>({id:'home'}),getSession:()=>({user:{id:'a'}}),today:()=>'2026-10-29',render,refresh:async()=>{},toast:()=>{},client:{},openLegacy:(...args)=>{legacy=args;},mutate:async fn=>{const before=snapshot(d);fn();appendActivity(d,before,{id:'op'+(++seq),at:'2026-10-29T10:00:00Z',userId:'a'});render();return true;}});render();
 const q=s=>doc.querySelector(s),click=async s=>{assert.ok(q(s),s);q(s).click();await tick();},fill=(n,v)=>q(`[name="${n}"]`).value=v,submit=async()=>{q('#pet-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();};
 // Empty filters still show important tasks, including overdue vaccination/follow-up.
 assert.match(q('#view').textContent,/驅蟲.*已逾期/);assert.match(q('#view').textContent,/濾心/);assert.match(q('#view').textContent,/回診/);
 manager.beginAdd('2026-10-20');await click('[data-pet-action="choose-pet"]');await click('[data-pet-action="choose-type"][data-pet-id="weight"]');assert.equal(q('[name="date"]').value,'2026-10-20');fill('weight','4.25');await submit();assert.equal(d.petWeights[0].petId,'p');assert.ok(d.activity.some(e=>e.area==='體重'));
 manager.beginAdd('2026-10-21');await click('[data-pet-action="choose-pet"]');await click('[data-pet-action="choose-type"][data-pet-id="diet"]');assert.equal(legacy[1].petId,'p');assert.equal(legacy[1].date,'2026-10-21');
 manager.beginAdd('2026-10-20');await click('[data-pet-action="choose-pet"]');await click('[data-pet-action="choose-type"][data-pet-id="dose"]');await click('#pet-modal [data-pet-action="dose"]');assert.equal(d.petDoses.length,1);assert.equal(d.petDoses[0].date,'2026-10-20');assert.match(q('#pet-modal').textContent,/已餵藥/);assert.equal(q('#pet-modal [data-pet-action="dose"]'),null);await click('.pet-close');
 await click('[data-pet-action="complete-followup"]');fill('cost','500');q('[name="syncMoney"]').checked=true;fill('next','2026-11-05');await submit();const follow=d.petVisits.find(r=>r.followUpOf==='v');assert.ok(follow);assert.equal(d.petVisits.find(r=>r.id==='v').followUpStatus,'completed');assert.ok(d.money.some(r=>r.visitId===follow.id));const group=d.activity.filter(e=>e.groupId===d.activity.at(-1).groupId);assert.ok(group.some(e=>e.recordId==='v'&&e.action==='編輯'));assert.ok(group.some(e=>e.recordId===follow.id&&e.action==='新增'));assert.ok(group.some(e=>e.area==='帳本'));assert.ok(!pendingVisits(d).some(r=>r.id==='v'));
 manager.navigate('petVisits',follow.id);assert.ok(q('.record-highlight'));assert.match(q('.record-highlight').textContent,/和平醫院/);await click(`[data-pet-action="cancel-followup"][data-pet-id="${follow.id}"]`);assert.equal(pendingVisits(d).length,0);assert.ok(d.activity.some(e=>e.after?.followUpStatus==='cancelled'));
 manager.beginAdd('2026-10-29');await click('[data-pet-action="choose-pet"]');await click('[data-pet-action="choose-type"][data-pet-id="preventive"]');fill('item','驅蟲');fill('next','2026-11-29');await submit();assert.doesNotMatch(manager.todos(),/驅蟲.*已逾期/);
 }finally{w.close();}
});
