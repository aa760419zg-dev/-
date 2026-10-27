import test from 'node:test';
import assert from 'node:assert/strict';
import {balance,expense,empty,validData,normalizeNames,exerciseSummary,choreStatus,nextChoreDate,choreFrequency} from '../public/model.js';
test('共同帳戶不扣個人付款，補款加入餘額，統計包含兩種支付',()=>{const d=empty();d.opening=10000;d.money=[{kind:'存入',amount:'2000',date:'2026-10-01'},{kind:'支出',source:'共同帳戶',amount:'800',date:'2026-10-02'},{kind:'支出',source:'個人支付',amount:'300',date:'2026-10-03'},{kind:'支出',source:'共同帳戶',amount:'100',date:'2026-09-01'}];assert.equal(balance(d),11100);assert.equal(expense(d,'2026-10'),1100);assert.equal(expense(d,'2026-11'),0);});
test('備份檢查拒絕不相容版本與損壞紀錄',()=>{assert.ok(validData(empty()));assert.ok(!validData({version:2}));const d=empty();d.money=[null];assert.ok(!validData(d));});

test('改名後舊紀錄仍歸入同一人，保留原始備註與自訂行程名稱',()=>{
 const d=empty();d.health=[{person:'先生',kind:'運動'}];d.money=[{person:'太太'}];d.events=[{person:'先生',type:'休假',title:'先生休假',note:'太太提醒'},{person:'太太',title:'和太太散步'}];
 const n=normalizeNames(d);assert.equal(n.health[0].person,'阿嘎');assert.equal(n.money[0].person,'糖糖');assert.equal(n.events[0].title,'阿嘎休假');assert.equal(n.events[0].note,'太太提醒');assert.equal(n.events[1].title,'和太太散步');assert.equal(d.health[0].person,'先生');assert.deepEqual(normalizeNames(n),n);
});

test('運動月統計依成員與月份隔離，同日多筆只算一天且不混加總熱量',()=>{
 const records=[{kind:'運動',person:'阿嘎',date:'2026-10-01',minutes:'20',activeCalories:'100',totalCalories:'150'},{kind:'運動',person:'阿嘎',date:'2026-10-01',minutes:'10',activeCalories:'0'},{kind:'運動',person:'阿嘎',date:'2026-10-03',minutes:'5'},{kind:'運動',person:'糖糖',date:'2026-10-01',minutes:'60',activeCalories:'500'},{kind:'運動',person:'阿嘎',date:'2026-09-30',minutes:'90',activeCalories:'700'},{kind:'InBody',person:'阿嘎',date:'2026-10-02',weight:'70'}];
 const stats=exerciseSummary(records,'阿嘎','2026-10');assert.equal(stats.days,2);assert.equal(stats.sessions,3);assert.equal(stats.minutes,35);assert.equal(stats.activeCalories,100);assert.equal(stats.calorieEntries,2);assert.equal(exerciseSummary(records,'阿嘎','2026-11').sessions,0);
});

test('固定家務：月末與閏年、完成後保留原星期、逾期不逐筆補做',()=>{
 const monthly={cadence:'每月',next:'2026-01-31',anchor:'2026-01-31'};
 assert.equal(nextChoreDate(monthly,'2026-01-31'),'2026-02-28');
 assert.equal(nextChoreDate({...monthly,next:'2026-02-28'},'2026-02-28'),'2026-03-31');
 assert.equal(nextChoreDate({...monthly,next:'2028-01-31'},'2028-01-31'),'2028-02-29');
 const weekly={cadence:'每週',next:'2026-10-05'};
 assert.equal(nextChoreDate(weekly,'2026-10-07'),'2026-10-12');
 assert.equal(nextChoreDate(weekly,'2026-10-27'),'2026-11-02');
 assert.equal(nextChoreDate(weekly,'2026-10-04'),'2026-10-12');
 assert.equal(choreFrequency(weekly),'每週一');
 assert.equal(nextChoreDate({next:'2026-10-01',interval:'7'},'2026-10-08'),'2026-10-15');
 assert.equal(nextChoreDate({cadence:'每日',next:'2026-10-01'},'2026-10-27'),'2026-10-28');
 assert.equal(choreStatus({next:'2026-10-26'},'2026-10-27').group,'overdue');
 assert.equal(choreStatus({next:'2026-10-27'},'2026-10-27').group,'today');
 assert.equal(choreStatus({next:'2026-10-30',remindDays:3},'2026-10-27').group,'soon');
 assert.equal(choreStatus({next:'2026-10-30',remindDays:1},'2026-10-27').group,'later');
});
