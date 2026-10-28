import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createActivityUI} from '../public/activity-ui.js';
import {appendActivity,snapshot} from '../public/activity.js';
import {empty,normalizeNames} from '../public/model.js';
test('刪除復原提示精確維持五秒、後續修改警告、成員與私人紀錄過濾',async()=>{
 const dom=new JSDOM('<main id="view"></main>',{url:'http://localhost/'}),w=dom.window;try{
 let data=normalizeNames(empty()),ui,sequence=0,expiry,delay,confirmations=[];data.members=[{userId:'a',name:'阿嘎',color:'#315c4c'},{userId:'b',name:'糖糖',color:'#b97878'}];data.money=[{id:'m',date:'2026-10-28',title:'買菜',amount:'100'}];
 w.confirm=m=>{confirmations.push(m);return true;};w.setTimeout=(fn,ms)=>{expiry=fn;delay=ms;return 1;};w.clearTimeout=()=>{};
 const render=()=>{w.document.querySelector('#view').innerHTML=ui.page();};
 const mutate=async(fn,options={})=>{const before=snapshot(data);fn();appendActivity(data,before,{...options,id:options.id||String(++sequence),at:new Date().toISOString(),userId:'a'});render();return true;};
 ui=createActivityUI({document:w.document,getData:()=>data,getUserId:()=>'a',mutate,render,toast:()=>{}});render();await ui.remove('money','m');const deleted=data.activity.at(-1);assert.equal(delay,5000);assert.equal(w.document.querySelector('#undo-toast').hidden,false);expiry();assert.equal(w.document.querySelector('#undo-toast').hidden,true);
 // 五秒後仍能從操作紀錄還原，若有人加回相同 ID 的新內容須警告。
 data.money.push({id:'m',date:'2026-10-28',title:'較新的買菜',amount:'300'});await ui.restore(deleted.id);assert.match(confirmations.at(-1),/此紀錄之後已有修改/);assert.equal(data.money.length,1);assert.equal(data.money[0].amount,'100');assert.equal(data.activity.at(-1).action,'還原');
 data.activity.push({id:'private',at:new Date().toISOString(),userId:'b',name:'糖糖',area:'行程',action:'編輯',recordId:'secret',summary:'秘密行程',before:null,after:{visibility:'private',ownerId:'b',title:'秘密'}});render();assert.doesNotMatch(w.document.querySelector('#view').textContent,/秘密行程/);
 ui.clear();assert.equal(w.document.querySelector('#undo-toast').hidden,true);
 }finally{w.close();}
});
