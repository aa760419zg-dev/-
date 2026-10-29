import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

const userId='00000000-0000-4000-8000-000000000001';
async function database(){
 const db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select '${userId}'::uuid$$;create function auth.jwt() returns jsonb language sql stable as $$select '{"email":"a@example.com"}'::jsonb$$;grant usage on schema auth to authenticated;insert into auth.users values('${userId}');`);
 await db.exec(await readFile(new URL('../supabase/setup.sql',import.meta.url),'utf8'));
 return db;
}
const historySQL=()=>readFile(new URL('../supabase/history.sql',import.meta.url),'utf8');
async function save(db,revision,document){
 await db.exec('set role authenticated');
 try{return (await db.query('select public.family_save($1,$2) as revision',[revision,document])).rows[0].revision;}
 finally{await db.exec('reset role');}
}

test('歷史 v2：存上一版但排除 activity、只改操作紀錄不備份、每戶僅留 200 版、一般角色不可讀',async()=>{
 const db=await database();try{
 const sql=await historySQL();await db.exec(sql);await db.exec(sql);
 await db.exec('set role authenticated');const home=(await db.query('select public.family_create() as home')).rows[0].home;await db.exec('reset role');
 let document=home.document,revision=home.revision;
 const count=async()=>Number((await db.query('select count(*) as n from public.family_document_history where home_id=$1',[home.id])).rows[0].n);
 const initial=await count();
 document={...document,activity:[{id:'audit',at:'2026-10-29T00:00:00Z'}]};
 revision=await save(db,revision,document);assert.equal(await count(),initial);
 revision=await save(db,revision,document);assert.equal(await count(),initial);
 for(let i=1;i<=205;i++){
  const previous=revision;document={...document,opening:i,activity:[...document.activity,{id:'audit-'+i}]};revision=await save(db,revision,document);
  const rows=(await db.query('select revision,document,saved_by from public.family_document_history where home_id=$1 order by id desc',[home.id])).rows;
  assert.equal(rows.length,Math.min(200,initial+i));assert.equal(rows[0].revision,previous);assert.equal(rows[0].document.opening,i-1);assert.equal(rows[0].saved_by,userId);assert.ok(!Object.hasOwn(rows[0].document,'activity'));
 }
 const live=(await db.query('select document from public.family_homes where id=$1',[home.id])).rows[0].document;
 assert.deepEqual(live.activity,document.activity);
 for(const role of ['authenticated','anon']){
  await db.exec('set role '+role);await assert.rejects(db.query('select document from public.family_document_history'),/permission denied/);await db.exec('reset role');
 }
 }finally{await db.close();}
});

test('歷史 v2 升級清除舊歷史 activity、可重跑且不改目前文件；README 救援保留目前操作紀錄',async()=>{
 const db=await database();try{
 const sql=await historySQL();await db.exec(sql);
 const home=(await db.query('select public.family_create() as home')).rows[0].home;
 const current={...home.document,opening:500,activity:[{id:'keep-current',at:'2026-10-29T10:00:00Z'}]};
 let revision=await save(db,home.revision,current);
 // Simulate historical rows created by v1, which included a full activity snapshot.
 await db.query("update public.family_document_history set document=document || jsonb_build_object('activity',$1::jsonb)",[[{id:'old-history'}]]);
 const before=(await db.query('select * from public.family_document_history order by id')).rows;assert.ok(before.length>0);
 await db.exec(sql);await db.exec(sql);
 const after=(await db.query('select * from public.family_document_history order by id')).rows;
 assert.deepEqual(after,before.map(row=>{const {activity,...document}=row.document;return {...row,document};}));
 assert.deepEqual((await db.query('select document from public.family_homes where id=$1',[home.id])).rows[0].document,current);
 // Run the actual documented recovery statement, replacing only example IDs.
 const readme=await readFile(new URL('../README.md',import.meta.url),'utf8');
 const example=readme.match(/begin;\nselect id from public\.family_homes[\s\S]*?commit;/)?.[0];assert.ok(example);
 const target=after.find(r=>r.home_id===home.id&&r.document.opening===0);assert.ok(target);
 await db.exec(example.replaceAll('00000000-0000-0000-0000-000000000000',home.id).replace('history.id = 12345','history.id = '+target.id));
 const recovered=(await db.query('select document,revision from public.family_homes where id=$1',[home.id])).rows[0];
 assert.deepEqual(recovered.document,{...target.document,activity:current.activity});assert.equal(recovered.revision,revision+1);
 const latest=(await db.query('select document from public.family_document_history where home_id=$1 order by id desc limit 1',[home.id])).rows[0].document;
 const {activity,...business}=current;assert.deepEqual(latest,business);
 // Recovery also works for an older live document that has no activity property.
 const withoutActivity={...recovered.document,opening:700};delete withoutActivity.activity;
 revision=await save(db,recovered.revision,withoutActivity);
 await db.exec(example.replaceAll('00000000-0000-0000-0000-000000000000',home.id).replace('history.id = 12345','history.id = '+target.id));
 assert.equal(Object.hasOwn((await db.query('select document from public.family_homes where id=$1',[home.id])).rows[0].document,'activity'),false);
 }finally{await db.close();}
});
