import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import * as model from '../public/model.js';
import {createPetManager} from '../public/pet-manager.js';
const tick=()=>new Promise(r=>setTimeout(r,10));
test('登入介面、雲端儲存失敗回復、登出清除資料畫面',async()=>{
 const dom=new JSDOM(await readFile(new URL('../public/index.html',import.meta.url),'utf8'),{url:'http://localhost/',runScripts:'outside-only'}),w=dom.window;
 try{
 let stored=model.empty(),rev=0,fail=false,signedOut;
 w.structuredClone=structuredClone;w.confirm=()=>true;w.scrollTo=()=>{};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 Object.assign(w,model);w.createPetManager=options=>createPetManager({...options,document:w.document});
 w.client={auth:{getSession:async()=>({data:{session:null}}),signInWithPassword:async()=>({data:{session:{user:{email:'one@example.com'}}}}),signOut:async()=>{signedOut?.('SIGNED_OUT',null);return{};},onAuthStateChange:fn=>{signedOut=fn;}}};
 w.rpc=async(name,args)=>{if(name==='family_read')return{id:'a',revision:rev,document:structuredClone(stored),owner:true};if(name==='family_save'){if(fail)throw Error('資料已更新');stored=structuredClone(args.new_document);return ++rev;}};
 const code=(await readFile(new URL('../public/app.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'');w.eval(code);await tick();
 const q=s=>w.document.querySelector(s), click=async s=>{q(s).click();await tick();};
 assert.ok(q('#auth-form'));q('[name="email"]').value='one@example.com';q('[name="password"]').value='12345678';q('#auth-form').dispatchEvent(new w.SubmitEvent('submit',{bubbles:true,cancelable:true,submitter:q('[value="login"]')}));await tick();assert.ok(q('[data-add="money"]'));
 await click('[data-add="money"]');q('[name="amount"]').value='200';q('[name="title"]').value='買菜';q('[name="category"]').value='  生鮮蔬果  ';q('#form').dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();assert.equal(stored.money.length,1);assert.equal(stored.money[0].category,'生鮮蔬果');assert.match(q('#view').textContent,/買菜/);await click('[data-add="money"]');assert.ok(q('[data-category="生鮮蔬果"]'));await click('[data-category="生鮮蔬果"]');assert.equal(q('[name="category"]').value,'生鮮蔬果');await click('.close');

 // 首頁運動入口只開啟表單，不自動寫入固定分鐘數。
 await click('[data-exercise="阿嘎"]');assert.equal(stored.health.length,0);
 q('[name="title"]').value='戶外健走';q('[name="minutes"]').value='25';q('[name="date"]').value='2026-10-05';
 q('[name="activeCalories"]').value='120';q('[name="totalCalories"]').value='100';
 q('#form').dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();assert.equal(stored.health.length,0);assert.match(q('#form-error').textContent,/總熱量/);
 q('[name="totalCalories"]').value='150';q('[name="avgHeartRate"]').value='110';q('[name="distance"]').value='2';
 q('#form').dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();assert.equal(stored.health.length,1);const id=stored.health[0].id;
 w.location.hash='health';w.dispatchEvent(new w.Event('hashchange'));await tick();
 q('#health-month').value='2026-10';q('#health-month').dispatchEvent(new w.Event('change',{bubbles:true}));
 assert.match(q('#view').textContent,/戶外健走/);assert.match(q('#view').textContent,/平均心率 110/);
 await click('[data-edit-health]');assert.equal(q('[name="title"]').value,'戶外健走');assert.equal(q('[name="activeCalories"]').value,'120');
 q('[name="title"]').value='戶外健走與伸展';q('[name="minutes"]').value='30';q('#form').dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();
 assert.equal(stored.health.length,1);assert.equal(stored.health[0].id,id);assert.equal(stored.health[0].minutes,'30');assert.equal(stored.health[0].totalCalories,'150');
 await click('#refresh-cloud');assert.match(q('#view').textContent,/戶外健走與伸展/);
 q('#health-month').value='2026-09';q('#health-month').dispatchEvent(new w.Event('change',{bubbles:true}));assert.doesNotMatch(q('#view').textContent,/戶外健走與伸展/);
 q('#health-month').value='2026-10';q('#health-month').dispatchEvent(new w.Event('change',{bubbles:true}));
 q('#health-person').value='糖糖';q('#health-person').dispatchEvent(new w.Event('change',{bubbles:true}));assert.doesNotMatch(q('#view').textContent,/戶外健走與伸展/);
 w.location.hash='home';w.dispatchEvent(new w.Event('hashchange'));await tick();

 w.location.hash='chores';w.dispatchEvent(new w.Event('hashchange'));await tick();
 await click('[data-add="chores"]');q('[name="title"]').value='更換濾心';q('[name="repeatUnit"]').value='個月';q('[name="repeatEvery"]').value='3';q('[name="remindDays"]').value='5';q('[name="next"]').value=model.today();q('[name="pinned"]').checked=true;
 q('#form').dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();assert.equal(stored.chores.length,1);assert.equal(stored.chores[0].date,'');assert.equal(stored.chores[0].pinned,true);assert.equal(stored.chores[0].repeatEvery,'3');assert.equal(stored.chores[0].remindDays,5);const choreId=stored.chores[0].id;
 assert.match(q('#view').textContent,/今天處理/);assert.match(q('#view').textContent,/置頂 · 常看家務/);
 await click('[data-edit-chore]');q('[name="title"]').value='廚房濾心';q('#form').dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();assert.equal(stored.chores.length,1);assert.equal(stored.chores[0].id,choreId);assert.equal(stored.chores[0].title,'廚房濾心');
 const expectedNext=model.nextChoreDate(stored.chores[0]);await click('[data-complete]');assert.equal(stored.chores[0].next,expectedNext);assert.equal(stored.chores[0].date,model.today());assert.equal(stored.chores[0].history.length,1);
 await click('[data-pin-chore]');assert.equal(stored.chores[0].pinned,false);await click('#refresh-cloud');assert.match(q('#view').textContent,/廚房濾心/);
 w.location.hash='home';w.dispatchEvent(new w.Event('hashchange'));await tick();

 // 計算機單獨算帳不寫入紀錄，結果只在確認後帶入表單。
 w.location.hash='money';w.dispatchEvent(new w.Event('hashchange'));await tick();
 await click('#open-calculator');assert.equal(q('#form .submit').hidden,true);q('#calc-expression').value='600÷3';await click('[data-calc-key="="]');assert.equal(q('#calc-output').textContent,'200');assert.equal(stored.money.length,1);
 await click('#calc-apply');assert.equal(q('[name="amount"]').value,'200');assert.equal(q('#form .submit').hidden,false);
 q('[name="title"]').value='保留用途';q('#calc-details').open=true;q('#calc-expression').value='10÷0';await click('#calc-apply');assert.match(q('#calc-error').textContent,/不能除以 0/);assert.equal(q('[name="amount"]').value,'200');
 q('#calc-expression').value='-10';await click('#calc-apply');assert.match(q('#calc-error').textContent,/大於 0/);assert.equal(q('[name="amount"]').value,'200');
 q('#calc-expression').value='120+85×2';await click('#calc-apply');assert.equal(q('[name="amount"]').value,'290');assert.equal(q('[name="title"]').value,'保留用途');assert.equal(stored.money.length,1);
 q('#calc-details').open=true;await click('[data-calc-key="AC"]');for(const key of ['0','.','1','+','0','.','2'])await click(`[data-calc-key="${key}"]`);await click('[data-calc-key="="]');assert.equal(q('#calc-output').textContent,'0.3');await click('#calc-apply');assert.equal(q('[name="amount"]').value,'0.3');await click('.close');
 w.location.hash='home';w.dispatchEvent(new w.Event('hashchange'));await tick();
 fail=true;await click('[data-add="money"]');q('[name="amount"]').value='100';q('[name="title"]').value='不應儲存';q('#form').dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();assert.equal(stored.money.length,1);assert.equal(q('#modal').open,true);
 await click('.close');await click('#logout');assert.ok(q('#auth-form'));assert.doesNotMatch(q('#view').textContent,/買菜/);
 }finally{w.close();}
});
