import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('家庭 SQL：驗證成員隔離、邀請、容量、版本衝突及匿名拒絕',async()=>{
 const db=new PGlite();
 try{
 await db.exec(`create role anon; create role authenticated; create schema auth;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
 create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('email',current_setting('test.email',true))$$;
 grant usage on schema auth to authenticated, anon; grant execute on function auth.uid(),auth.jwt() to authenticated,anon;
 insert into auth.users values ('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002'),('00000000-0000-4000-8000-000000000003');`);
 const sql=await readFile(new URL('../supabase/setup.sql',import.meta.url),'utf8');await db.exec(sql);await db.exec(sql);
 async function as(n,email){await db.exec(`reset role; select set_config('test.uid','00000000-0000-4000-8000-00000000000${n}',false);select set_config('test.email','${email}',false);set role authenticated;`);}
 async function read(){return (await db.query('select public.family_read() as home')).rows[0].home;}
 await as(1,'one@example.com');assert.equal(await read(),null);
 const first=(await db.query('select public.family_create() as home')).rows[0].home;assert.equal(first.owner,true);
 await assert.rejects(db.query('select * from public.family_homes'),/permission denied/);
 await assert.rejects(db.query('select public.family_create()'),/已加入/);
 await db.query('select public.family_invite($1)',['two@example.com']);
 await as(3,'stranger@example.com');assert.equal(await read(),null);await assert.rejects(db.query('select public.family_join()'),/尚未找到/);
 await assert.rejects(db.query('select public.family_save($1,$2)',[0,first.document]),/資料已更新/);
 await as(2,'two@example.com');await db.query('select public.family_join()');assert.equal((await read()).id,first.id);
 await assert.rejects(db.query('select public.family_invite($1)',['stranger@example.com']),/只有建立/);
 const changed={...first.document,opening:5000};assert.equal((await db.query('select public.family_save($1,$2) as revision',[0,changed])).rows[0].revision,1);
 await as(1,'one@example.com');assert.equal((await read()).document.opening,5000);
 await assert.rejects(db.query('select public.family_save($1,$2)',[0,first.document]),/資料已更新/);
 await db.query('select public.family_invite($1)',['stranger@example.com']);await as(3,'stranger@example.com');await assert.rejects(db.query('select public.family_join()'),/限兩位/);
 await db.exec('reset role;set role anon;');await assert.rejects(db.query('select public.family_read()'),/permission denied/);
 }finally{await db.close();}
});
