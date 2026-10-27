import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import * as model from '../public/model.js';
const tick=()=>new Promise(r=>setTimeout(r,10));
test('登入介面、雲端儲存失敗回復、登出清除資料畫面',async()=>{
 const dom=new JSDOM(await readFile(new URL('../public/index.html',import.meta.url),'utf8'),{url:'http://localhost/',runScripts:'outside-only'}),w=dom.window;
 try{
 let stored=model.empty(),rev=0,fail=false,signedOut;
 w.structuredClone=structuredClone;w.confirm=()=>true;w.scrollTo=()=>{};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 Object.assign(w,model);
 w.client={auth:{getSession:async()=>({data:{session:null}}),signInWithPassword:async()=>({data:{session:{user:{email:'one@example.com'}}}}),signOut:async()=>{signedOut?.('SIGNED_OUT',null);return{};},onAuthStateChange:fn=>{signedOut=fn;}}};
 w.rpc=async(name,args)=>{if(name==='family_read')return{id:'a',revision:rev,document:structuredClone(stored),owner:true};if(name==='family_save'){if(fail)throw Error('資料已更新');stored=structuredClone(args.new_document);return ++rev;}};
 const code=(await readFile(new URL('../public/app.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'');w.eval(code);await tick();
 const q=s=>w.document.querySelector(s), click=async s=>{q(s).click();await tick();};
 assert.ok(q('#auth-form'));q('[name="email"]').value='one@example.com';q('[name="password"]').value='12345678';q('#auth-form').dispatchEvent(new w.SubmitEvent('submit',{bubbles:true,cancelable:true,submitter:q('[value="login"]')}));await tick();assert.ok(q('[data-add="money"]'));
 await click('[data-add="money"]');q('[name="amount"]').value='200';q('[name="title"]').value='買菜';q('#form').dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();assert.equal(stored.money.length,1);assert.match(q('#view').textContent,/買菜/);

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
 fail=true;await click('[data-add="money"]');q('[name="amount"]').value='100';q('[name="title"]').value='不應儲存';q('#form').dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();assert.equal(stored.money.length,1);assert.equal(q('#modal').open,true);
 await click('.close');await click('#logout');assert.ok(q('#auth-form'));assert.doesNotMatch(q('#view').textContent,/買菜/);
 }finally{w.close();}
});
