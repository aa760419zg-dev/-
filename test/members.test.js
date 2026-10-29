import test from 'node:test';
import assert from 'node:assert/strict';
import {ensureMembers,renameMember} from '../public/members.js';
import {empty} from '../public/model.js';
test('成員依 userId 遷移，舊名字對應保留，暱稱變更不會丟失紀錄關聯',()=>{
 const d=empty();d.money=[{person:'阿嘎'}];d.health=[{person:'糖糖'}];d.events=[{person:'糖糖',type:'休假',title:'糖糖休假'}];const roster=[{userId:'a',legacyName:'阿嘎'},{userId:'b',legacyName:'糖糖'}];
 ensureMembers(d,roster,'b',false);assert.equal(d.members.find(m=>m.userId==='b').name,'糖糖');assert.equal(d.health[0].personUserId,'b');renameMember(d,'b','小糖','#123456');assert.equal(d.members.find(m=>m.userId==='a').name,'阿嘎');assert.deepEqual(d.events,[{person:'糖糖',type:'休假',title:'糖糖休假'}]);assert.equal(d.health[0].person,'小糖');ensureMembers(d,roster,'b',false);assert.equal(d.members.length,2);assert.equal(d.members[1].name,'小糖');assert.throws(()=>renameMember(d,'b','阿嘎','#123456'),/不同/);
});
