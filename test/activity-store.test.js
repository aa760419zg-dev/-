import test from 'node:test';
import assert from 'node:assert/strict';
import {createActivityStore} from '../public/activity-store.js';
import {activityRPC,remember} from '../test-support/activity.js';
test('新前端先部署：舊資料庫相容保存；升級後改傳 new_activity 且文件不含歷史',async()=>{
 let upgraded=false,document={version:1,activity:[{id:'old',at:'2026-10-01T00:00:00Z'}]},logs=[],revision=1;const calls=[];
 const store=createActivityStore({getHome:()=>({id:'h'}),rpc:async(name,args)=>{calls.push({name,args:structuredClone(args)});if((name.startsWith('family_activity_')||Object.hasOwn(args,'new_activity'))&&!upgraded)throw Object.assign(Error('schema cache'),{code:'PGRST202'});if(name==='family_save'){assert.equal(args.expected_revision,revision);document=structuredClone(args.new_document);remember(logs,args.new_activity);return ++revision;}return activityRPC(logs,name,args);}});
 store.ingest(document);const clean={version:1,opening:1},entry={id:'new',at:'2026-10-02T00:00:00Z'};await store.save(clean,[entry],revision);assert.deepEqual(document.activity.map(e=>e.id),['old','new']);assert.ok(!Object.hasOwn(clean,'activity'));assert.equal((await store.list()).entries.length,2);
 upgraded=true;remember(logs,document.activity);delete document.activity;store.ingest(document);await store.save(clean,[{id:'third',at:'2026-10-03T00:00:00Z'}],revision);assert.equal(Object.hasOwn(document,'activity'),false);assert.deepEqual(calls.filter(c=>c.name==='family_save').at(-1).args.new_activity.map(e=>e.id),['third']);assert.equal((await store.list()).entries.length,3);assert.equal((await store.get('old')).id,'old');
});
test('讀取錯誤不誤判舊版降級；查詢後續修改走分頁且忽略同一組操作',async()=>{
 const entries=Array.from({length:140},(_,i)=>({id:'id-'+String(i).padStart(3,'0'),at:'2026-10-02T00:00:00Z',groupId:'group-'+i}));const calls=[];const store=createActivityStore({getHome:()=>({id:'h'}),rpc:async(name,args)=>{calls.push({name,args});return activityRPC(entries,name,args);}});store.ingest({});const result=await store.newer({id:'target',at:'2026-10-01T00:00:00Z',groupId:'group-139'});assert.equal(result.length,139);assert.ok(calls.length>=2);
 const broken=createActivityStore({getHome:()=>({id:'h'}),rpc:async()=>{throw Object.assign(Error('offline'),{code:'NETWORK'});}});await assert.rejects(broken.save({},[],1),/offline/);await assert.rejects(broken.list(),/offline/);
});
