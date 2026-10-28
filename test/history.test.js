import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
test('family_save 雲端歷史保存上一版、每戶僅留 200 版、authenticated 不可讀取',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select '00000000-0000-4000-8000-000000000001'::uuid$$;create function auth.jwt() returns jsonb language sql stable as $$select '{"email":"a@example.com"}'::jsonb$$;grant usage on schema auth to authenticated;insert into auth.users values('00000000-0000-4000-8000-000000000001');`);
 await db.exec(await readFile(new URL('../supabase/setup.sql',import.meta.url),'utf8'));const sql=await readFile(new URL('../supabase/history.sql',import.meta.url),'utf8');await db.exec(sql);await db.exec(sql);
 await db.exec('set role authenticated;');const home=(await db.query('select public.family_create() as home')).rows[0].home;let document=home.document,revision=home.revision;
 await assert.rejects(db.query('select * from public.family_document_history'),/permission denied/);await db.exec('reset role;');const initial=Number((await db.query('select count(*) as n from public.family_document_history')).rows[0].n);
 for(let i=1;i<=205;i++){await db.exec('set role authenticated;');document={...document,opening:i};const previous=revision;revision=(await db.query('select public.family_save($1,$2) as revision',[revision,document])).rows[0].revision;await db.exec('reset role;');const rows=(await db.query('select revision,document,saved_by from public.family_document_history where home_id=$1 order by id desc',[home.id])).rows;assert.equal(rows.length,Math.min(200,initial+i));assert.equal(rows[0].revision,previous);assert.equal(rows[0].document.opening,i-1);assert.equal(rows[0].saved_by,'00000000-0000-4000-8000-000000000001');}
 await db.exec('set role authenticated;');await assert.rejects(db.query('select document from public.family_document_history'),/permission denied/);
 }finally{await db.close();}
});
