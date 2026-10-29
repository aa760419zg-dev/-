import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeNames,empty} from '../public/model.js';
import {pendingVisits,pendingPreventives,preventiveAlerts} from '../public/pets-model.js';
import {calendarRecords} from '../public/record-calendar.js';
import {appendActivity,snapshot,restoreActivity,deleteRecord,archivedActivity} from '../public/activity.js';
const now='2026-10-29';
test('預防針：逾期保留、較新施打（含同日）取代舊提醒、取消不改原日期',()=>{
 const d=normalizeNames(empty());d.petPreventives=[{id:'a',petId:'p',item:'驅蟲',date:'2026-09-01',next:'2026-10-01'}];assert.equal(preventiveAlerts(d,now).length,1);assert.ok(calendarRecords(d,now).some(r=>r.planned&&r.overdue&&r.date===now));d.petPreventives.push({id:'b',petId:'p',item:'驅蟲',date:'2026-09-01',next:'2026-11-01'});assert.deepEqual(pendingPreventives(d).map(r=>r.id),['b']);d.petPreventives[1].reminderStatus='cancelled';assert.equal(pendingPreventives(d).length,0);assert.equal(d.petPreventives[0].next,'2026-10-01');
});
test('完成回診後結束舊提醒；刪除新就診重新提醒，還原一併恢復完成狀態',()=>{
 const d=normalizeNames(empty());d.members=[{userId:'a',name:'阿嘎',color:'#315c4c'}];d.petVisits=[{id:'v1',petId:'p',date:'2026-10-01',next:'2026-10-28',hospital:'和平醫院',followUpStatus:'completed',followUpVisitId:'v2'},{id:'v2',petId:'p',date:now,next:'2026-11-15',followUpOf:'v1',hospital:'和平醫院'}];assert.deepEqual(pendingVisits(d).map(r=>r.id),['v2']);const before=snapshot(d);deleteRecord(d,'petVisits','v2');(d.activity??=[]).push(...appendActivity(d,before,{id:'del',userId:'a',at:now+'T10:00:00Z'}));assert.deepEqual(pendingVisits(d).map(r=>r.id),['v1']);const log=d.activity.at(-1);assert.equal(log.action,'刪除');restoreActivity(d,log.id,'a',{confirm:()=>true});assert.deepEqual(pendingVisits(d).map(r=>r.id),['v2']);d.petVisits.find(r=>r.id==='v2').followUpStatus='cancelled';assert.equal(pendingVisits(d).length,0);
});
test('封存行程歷史可以查看、禁止還原；備份歷史還原仍保留現有 events',()=>{
 const d=normalizeNames(empty());d.members=[{userId:'a',name:'阿嘎',color:'#315c4c'}];d.events=[{id:'e',date:now,title:'原行程'}];const before=snapshot(d);d.events[0].title='新版';(d.activity??=[]).push(...appendActivity(d,before,{id:'edit',userId:'a',at:now+'T10:00:00Z'}));const entry=d.activity.at(-1);assert.equal(archivedActivity(entry),true);assert.throws(()=>restoreActivity(d,entry.id,'a'),/已封存/);assert.equal(d.events[0].title,'新版');const events=structuredClone(d.events),base=snapshot(d);d.opening=300;(d.activity??=[]).push(...appendActivity(d,base,{id:'import',userId:'a',at:now+'T11:00:00Z',importing:true}));restoreActivity(d,d.activity.at(-1).id,'a',{confirm:()=>true});assert.deepEqual(d.events,events);assert.equal(d.opening,0);
});
