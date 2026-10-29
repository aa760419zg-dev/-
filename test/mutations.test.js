import test from 'node:test';
import assert from 'node:assert/strict';
import {retryMutation} from '../public/mutations.js';
import {recordDose,hydratePets} from '../public/pets-model.js';
import {empty} from '../public/model.js';
function setup(document,conflicts=1){let data=structuredClone(document),server=structuredClone(document),home={id:'h',revision:0},revision=0,attempts=0,reads=0;return {getData:()=>data,setData:d=>data=d,getHome:()=>home,loadHome:async()=>{reads++;data=structuredClone(server);home.revision=revision;},save:async()=>{attempts++;if(attempts<=conflicts){server.extra='保留對方更新';revision++;throw Error('資料已更新');}assert.equal(home.revision,revision);server=structuredClone(data);home.revision=++revision;},get server(){return server;},get attempts(){return attempts;},get reads(){return reads;}};}
test('衝突後載入新資料並按 ID 重做同一修改，保留另一人的更新',async()=>{
 const state=setup({chores:[{id:'a',pinned:false}]});const old=state.getData().chores[0];
 await retryMutation({...state,fn:()=>{state.getData().chores.find(x=>x.id==='a').pinned=true;}});
 assert.equal(state.server.chores[0].pinned,true);assert.equal(state.server.extra,'保留對方更新');assert.equal(state.attempts,2);assert.notEqual(state.getData().chores[0],old);
});
test('最多重試三次，耗盡仍載入最新 revision，下一次可以成功',async()=>{
 const state=setup({value:0},4);await assert.rejects(retryMutation({...state,fn:()=>state.getData().value++}),/頻繁更新/);assert.equal(state.attempts,4);assert.equal(state.reads,4);assert.equal(state.getHome().revision,4);
 await retryMutation({...state,fn:()=>state.getData().value++});assert.equal(state.server.value,1);
});
test('非衝突錯誤不重試，回復操作前的文件',async()=>{
 const state=setup({value:0},0);await assert.rejects(retryMutation({...state,save:async()=>{throw Error('network');},fn:()=>state.getData().value++}),/network/);assert.equal(state.getData().value,0);assert.equal(state.reads,0);
});
test('餵藥重試遇到對方完成，停止並顯示實際餵藥者，不再次寫入',async()=>{
 let data=hydratePets(empty()),home={id:'h',revision:0},saved=0;
 data.members=[{userId:'a',name:'阿嘎',color:'#315c4c'},{userId:'b',name:'糖糖',color:'#b97878'}];data.petMedications=[{id:'plan',petId:'pet',start:'2026-10-28',mode:'每天幾次',times:1}];
 const latest=structuredClone(data);recordDose(latest,'plan:2026-10-28:1','2026-10-28',{id:'b',name:'糖糖',at:'2026-10-28T00:00:00Z'});
 await assert.rejects(retryMutation({getData:()=>data,setData:d=>data=d,getHome:()=>home,loadHome:async()=>{data=structuredClone(latest);home.revision=1;},save:async()=>{saved++;throw Error('資料已更新');},fn:()=>recordDose(data,'plan:2026-10-28:1','2026-10-28',{id:'a',name:'阿嘎',at:'2026-10-28T01:00:00Z'})}),/已由 糖糖 標記餵藥/);
 assert.equal(saved,1);assert.equal(data.petDoses.length,1);assert.equal(data.petDoses[0].by,'糖糖');
});
