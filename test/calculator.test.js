import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateAmount} from '../public/model.js';
test('記帳計算機：四則、括號、負數、精確小數與四捨五入',()=>{
 for(const [expression,result] of [['120+85×2',290],['(120+85)×2',410],['600÷3',200],['0.1+0.2',0.3],['1.005',1.01],['-1.005',-1.01],['10-25',-15],['10/-2',-5],['.5+2.5',3],['1/3+1/3+1/3',1],['12.50 + 7.25',19.75]])assert.equal(calculateAmount(expression),result,expression);
});
test('記帳計算機：拒絕零除、不完整、非算式與過大結果',()=>{
 for(const expression of ['','1/0','1+','(1+2','1..2','2(3)','NaN','Infinity','1;alert(1)','1'.repeat(121),'99999999999999999999'])assert.throws(()=>calculateAmount(expression),undefined,expression);
});
