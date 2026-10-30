import test from 'node:test';
import assert from 'node:assert/strict';
import {formatDate,formatDatesInText} from '../public/dates.js';
import {choreIcon,choreIcons,commonChores} from '../public/model.js';
test('日期顯示：今天／昨天／明天、星期、跨年及無效日期相容',()=>{
 assert.equal(formatDate('2026-10-30','2026-10-30'),'今天');assert.equal(formatDate('2026-10-29','2026-10-30'),'昨天');assert.equal(formatDate('2026-10-31','2026-10-30'),'明天');assert.equal(formatDate('2026-10-27','2026-10-30'),'10/27（二）');assert.equal(formatDate('2025-10-27','2026-10-30'),'2025/10/27');assert.equal(formatDate('2025-12-31','2026-01-01'),'昨天');assert.equal(formatDate('2027-01-01','2026-12-31'),'明天');assert.equal(formatDate('2026-02-30','2026-10-30'),'2026-02-30');assert.equal(formatDatesInText('就診：2026-10-27 · 醫院','2026-10-30'),'就診：10/27（二） · 醫院');
});
test('家務圖示依名稱自動選擇、明確選擇優先、未知名稱使用掃把',()=>{
 const names=['淨水器濾心','冷氣濾網','床單更換','澆花','掃地拖地','清貓砂','倒垃圾','洗衣'];assert.deepEqual(names.map(choreIcon),['💧','🌬','🛏','🪴','🧹','🐈','🗑','🧺']);assert.equal(choreIcon('整理抽屜'),'🧹');assert.equal(choreIcon({title:'床單更換',icon:'💧'}),'💧');assert.equal(choreIcons.length,8);assert.deepEqual(commonChores('2026-10-30',['a','b','c','d','e','f']).map(c=>c.icon),['💧','🌬','🛏','🪴','🧹','🐈']);
});
