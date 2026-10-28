import test from 'node:test';
import assert from 'node:assert/strict';
import {createHomeSync} from '../public/realtime.js';
const tick=()=>new Promise(r=>setImmediate(r));
test('Realtime 僅廣播 revision，較新通知立即載入，編輯期間合併延後更新',async()=>{
 let home={id:'family',revision:1},blocked=false,reads=0,renders=0,listener,channelName,removed=0,sent=[];
 const channel={on(type,filter,fn){listener=fn;return this;},subscribe(fn){fn('SUBSCRIBED');},send:async message=>sent.push(message)};
 const sync=createHomeSync({client:{channel:(name)=>{channelName=name;return channel;},removeChannel:()=>removed++},getHome:()=>home,isBlocked:()=>blocked,load:async()=>{reads++;home.revision=10;},render:()=>renders++});
 sync.connect();await tick();assert.equal(channelName,'home:family');assert.equal(reads,1);
 await sync.notify(10);assert.deepEqual(sent[0],{type:'broadcast',event:'revision',payload:{revision:10}});
 await listener({payload:{revision:9}});await listener({payload:{}});assert.equal(reads,1);
 blocked=true;await listener({payload:{revision:11}});await listener({payload:{revision:12}});assert.equal(reads,1);
 blocked=false;await sync.flush();assert.equal(reads,2);assert.equal(renders,2);
 // visibility / 備援輪詢使用無 revision 的 request，強制同步一次。
 await sync.request();assert.equal(reads,3);sync.disconnect();assert.equal(removed,1);
});
test('通知發送失敗不讓已儲存的操作失敗',async()=>{
 let home={id:'h',revision:1};const channel={on(){return this;},subscribe(fn){fn('SUBSCRIBED');},send:async()=>{throw Error('offline');}};
 const sync=createHomeSync({client:{channel:()=>channel,removeChannel(){}},getHome:()=>home,isBlocked:()=>false,load:async()=>{},render:()=>{}});sync.connect();await assert.doesNotReject(sync.notify(2));sync.disconnect();
});
