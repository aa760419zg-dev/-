import test from 'node:test';
import assert from 'node:assert/strict';
import {balance,expense,empty,validData} from '../public/model.js';
test('共同帳戶不扣個人付款，補款加入餘額，統計包含兩種支付',()=>{const d=empty();d.opening=10000;d.money=[{kind:'存入',amount:'2000',date:'2026-10-01'},{kind:'支出',source:'共同帳戶',amount:'800',date:'2026-10-02'},{kind:'支出',source:'個人支付',amount:'300',date:'2026-10-03'},{kind:'支出',source:'共同帳戶',amount:'100',date:'2026-09-01'}];assert.equal(balance(d),11100);assert.equal(expense(d,'2026-10'),1100);assert.equal(expense(d,'2026-11'),0);});
test('備份檢查拒絕不相容版本與損壞紀錄',()=>{assert.ok(validData(empty()));assert.ok(!validData({version:2}));const d=empty();d.money=[null];assert.ok(!validData(d));});
