import test from 'node:test';
import assert from 'node:assert/strict';
import {empty,normalizeNames,nextChoreDate,choreScheduleMode,migrateChores,choreCompletion,completeChore,commonChores} from '../public/model.js';
import {appendActivity,snapshot,restoreActivity} from '../public/activity.js';
import {calendarRecords} from '../public/record-calendar.js';
const member={userId:'b',name:'糖糖',color:'#b97878'};
test('完成日起算：晚做14天、提早做90天、月末與跨年',()=>{
 assert.equal(nextChoreDate({scheduleMode:'completion',repeatEvery:14,repeatUnit:'天',next:'2026-10-01'},'2026-10-20'),'2026-11-03');
 assert.equal(nextChoreDate({scheduleMode:'completion',repeatEvery:90,repeatUnit:'天',next:'2026-12-31'},'2026-10-28'),'2027-01-26');
 assert.equal(nextChoreDate({scheduleMode:'completion',repeatEvery:1,repeatUnit:'個月',next:'2026-12-31'},'2026-01-31'),'2026-02-28');
 assert.equal(nextChoreDate({scheduleMode:'completion',repeatEvery:1,repeatUnit:'個月',next:'2028-02-29'},'2028-02-29'),'2028-03-29');
 assert.equal(nextChoreDate({scheduleMode:'completion',repeatEvery:2,repeatUnit:'週',next:'2026-10-01'},'2026-10-20'),'2026-11-03');
});
test('遷移按週保持固定、其餘完成日起算，保留原排程／歷史與明確設定',()=>{
 const d=normalizeNames(empty());d.chores=[{id:'d',date:'2026-10-01',next:'2026-11-01',cadence:'每日',history:['2026-10-01']},{id:'w',date:'',next:'2026-11-02',repeatUnit:'週',repeatEvery:2},{id:'m',date:'',next:'2026-11-30',cadence:'每月'},{id:'x',date:'',next:'2026-10-30',scheduleMode:'fixed',repeatUnit:'天',repeatEvery:14}];const before=snapshot(d);migrateChores(d);assert.deepEqual(d.chores.map(choreScheduleMode),['completion','fixed','completion','fixed']);assert.deepEqual(d.chores.map(({scheduleMode,...r})=>r),before.chores.map(({scheduleMode,...r})=>r));const current=structuredClone(d);migrateChores(d);assert.deepEqual(d,current);
});
test('完成者使用 members、字串歷史不轉換、月曆摘要與整次復原',()=>{
 const d=normalizeNames(empty());d.members=[member];d.chores=[{id:'c',title:'床單更換',date:'2026-10-01',next:'2026-10-15',scheduleMode:'completion',repeatUnit:'天',repeatEvery:14,history:['2026-10-01']}];const before=snapshot(d);completeChore(d,'c','2026-10-20','b','2026-10-15');assert.equal(d.chores[0].next,'2026-11-03');assert.equal(d.chores[0].history[0],'2026-10-01');assert.deepEqual(d.chores[0].history[1],{date:'2026-10-20',userId:'b',name:'糖糖'});assert.equal(choreCompletion(d,d.chores[0].history[0]).name,'未知');d.members[0].name='小糖';assert.equal(choreCompletion(d,d.chores[0].history[1]).name,'小糖');assert.match(calendarRecords(d,'2026-10-20').find(r=>r.date==='2026-10-20').summary,/床單更換 · 小糖完成/);d.members[0].name='糖糖';const entries=appendActivity(d,before,{id:'complete',at:'2026-10-20T10:00:00Z',userId:'b'});assert.equal(entries[0].action,'完成');restoreActivity(d,entries[0].id,'b',{entries,ask:false});assert.deepEqual(d,before);
});
test('即使完成後日期巧合不變，也不能在衝突重試重複完成同一次',()=>{
 const d=normalizeNames(empty());d.members=[member];d.chores=[{id:'c',date:'',next:'2026-12-31',scheduleMode:'completion',repeatEvery:90,repeatUnit:'天',history:[]}];const expected={next:'2026-12-31',date:'',count:0};completeChore(d,'c','2026-10-02','b',expected);assert.equal(d.chores[0].next,'2026-12-31');assert.throws(()=>completeChore(d,'c','2026-10-02','b',expected),/已更新或完成/);assert.equal(d.chores[0].history.length,1);
});
test('常用家務按指定週期建立，全部從完成日起算且首次尚未完成',()=>{
 const rows=commonChores('2026-10-28',['a','b','c','d','e','f']);assert.deepEqual(rows.map(r=>r.repeatEvery),[90,30,14,3,7,1]);assert.deepEqual(rows.map(r=>r.next),['2027-01-26','2026-11-27','2026-11-11','2026-10-31','2026-11-04','2026-10-29']);assert.ok(rows.every(r=>r.scheduleMode==='completion'&&!r.date&&!r.history.length));
});
