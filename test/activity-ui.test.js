import {activityRPC} from '../test-support/activity.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createActivityUI} from '../public/activity-ui.js';
import {appendActivity,snapshot} from '../public/activity.js';
import {empty,normalizeNames} from '../public/model.js';
test('刪除復原提示精確維持五秒、後續修改警告、成員與私人紀錄過濾',async()=>{
 const dom=new JSDOM('<main id="view"></main>',{url:'http://localhost/'}),w=dom.window;try{
 let data=normalizeNames(empty()),ui,sequence=0,logs=[],last=[],expiry,delay,confirmations=[];data.members=[{userId:'a',name:'阿嘎',color:'#315c4c'},{userId:'b',name:'糖糖',color:'#b97878'}];data.money=[{id:'m',date:'2026-10-28',title:'買菜',amount:'100'}];
 w.confirm=m=>{confirmations.push(m);return true;};w.setTimeout=(fn,ms)=>{expiry=fn;delay=ms;return 1;};w.clearTimeout=()=>{};
 const render=()=>{w.document.querySelector('#view').innerHTML=ui.page();};
 const mutate=async(fn,options={})=>{await options.prepare?.();const before=snapshot(data);fn();last=appendActivity(data,before,{...options,id:options.id||String(++sequence),at:new Date().toISOString(),userId:'a'});logs.push(...last);ui?.invalidate();render();return true;};
 ui=createActivityUI({document:w.document,getData:()=>data,getUserId:()=>'a',mutate,render,toast:()=>{},activity:{last:()=>last,get:async id=>logs.find(e=>e.id===id),newer:async e=>logs.filter(x=>x.at>=e.at&&x.groupId!==e.groupId),list:async args=>{const rows=activityRPC(logs,'family_activity_list',args);return {entries:rows.map(r=>r.entry),cursor:null,more:false};}}});render();await ui.remove('money','m');const deleted=logs.at(-1);assert.equal(delay,5000);assert.equal(w.document.querySelector('#undo-toast').hidden,false);expiry();assert.equal(w.document.querySelector('#undo-toast').hidden,true);
 // 五秒後仍能從操作紀錄還原，若有人加回相同 ID 的新內容須警告。
 data.money.push({id:'m',date:'2026-10-28',title:'較新的買菜',amount:'300'});await ui.restore(deleted.id);assert.match(confirmations.at(-1),/此紀錄之後已有修改/);assert.equal(data.money.length,1);assert.equal(data.money[0].amount,'100');assert.equal(logs.at(-1).action,'還原');
 logs.push({id:'private',at:new Date().toISOString(),userId:'b',name:'糖糖',area:'行程',action:'編輯',recordId:'secret',summary:'秘密行程',before:null,after:{visibility:'private',ownerId:'b',title:'秘密'}});ui.invalidate();render();await new Promise(r=>setTimeout(r,10));assert.doesNotMatch(w.document.querySelector('#view').textContent,/秘密行程/);
 ui.clear();assert.equal(w.document.querySelector('#undo-toast').hidden,true);
 }finally{w.close();}
});

test('操作紀錄頁用伺服器游標分頁／篩選，還原 get root 並在重試前查詢後續修改',async()=>{
 const dom=new JSDOM('<main id="view"></main>',{url:'http://localhost/#activity'}),w=dom.window;try{
 let ui,data=normalizeNames(empty()),generation=0;data.members=[{userId:'a',name:'阿嘎',color:'#315c4c'}];data.money=[{id:'m',date:'2026-10-28',amount:200}];const logs=Array.from({length:120},(_,i)=>({id:'id-'+String(i).padStart(3,'0'),at:'2026-10-29T10:00:00Z',userId:'a',name:'阿嘎',area:i%2?'家務':'帳本',action:'新增',summary:'紀錄 '+i}));const calls=[],confirmations=[];let newerCalls=0;
 const root={id:'root',rootId:'root',groupId:'original',at:'2026-10-28T10:00:00Z',userId:'a',name:'阿嘎',area:'帳本',action:'編輯',collection:'money',recordId:'m',summary:'修改買菜',before:{id:'m',date:'2026-10-28',amount:100},after:{id:'m',date:'2026-10-28',amount:200}};
 const render=()=>{w.document.querySelector('#view').innerHTML=ui.page();};w.confirm=message=>{confirmations.push(message);return true;};
 const service={list:async args=>{calls.push(args);const rows=activityRPC(logs,'family_activity_list',args);return {entries:rows.map(r=>r.entry),cursor:rows.length?{before_at:rows.at(-1).at,before_id:rows.at(-1).id}:null,more:rows.length===50};},get:async id=>{assert.equal(id,'root');return root;},newer:async()=>{newerCalls++;return [{id:'later',groupId:'other',collection:'money',recordId:'m'}];},last:()=>[]};
 ui=createActivityUI({document:w.document,getData:()=>data,getUserId:()=>'a',render,toast:()=>{},activity:service,mutate:async(fn,options)=>{await options.prepare();const before=structuredClone(data);fn();data=before;await options.prepare();fn();generation++;return true;}});
 render();await new Promise(r=>setTimeout(r,10));assert.equal(w.document.querySelectorAll('.audit-entry').length,50);w.document.querySelector('#audit-more').click();await new Promise(r=>setTimeout(r,10));assert.equal(w.document.querySelectorAll('.audit-entry').length,100);assert.ok(calls[1].before_id);const filter=w.document.querySelector('#audit-area');filter.value='家務';filter.dispatchEvent(new w.Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,10));assert.equal(calls.at(-1).area_filter,'家務');assert.equal(w.document.querySelectorAll('.audit-entry').length,50);
 await ui.restore('root');assert.equal(newerCalls,2);assert.match(confirmations[0],/此紀錄之後已有修改/);assert.equal(data.money[0].amount,100);assert.equal(generation,1);assert.equal(Object.hasOwn(data,'activity'),false);
 }finally{w.close();}
});
