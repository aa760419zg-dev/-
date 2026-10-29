import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002';
const at=new Date().toISOString();
const entry=(id,userId=a,extra={})=>({id,at,userId,name:userId===a?'阿嘎':'糖糖',area:'帳本',action:'新增',recordId:id,before:null,after:{id,date:at.slice(0,10)},...extra});
async function auth(db,user){await db.exec('reset role');await db.query("select set_config('test.user',$1,false)",[user]);await db.exec('set role authenticated');}
async function admin(db){await db.exec('reset role');}
async function setup(){const db=new PGlite();await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);insert into auth.users values('${a}'),('${b}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.user',true),'')::uuid$$;create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('email',auth.uid()::text||'@example.com')$$;grant usage on schema auth to authenticated;`);await db.exec(await readFile(new URL('../supabase/setup.sql',import.meta.url),'utf8'));await db.exec(await readFile(new URL('../supabase/history.sql',import.meta.url),'utf8'));return db;}
const sql=()=>readFile(new URL('../supabase/activity.sql',import.meta.url),'utf8');
const read=async db=>(await db.query('select public.family_read() as home')).rows[0].home;
const save=async(db,home,document,entries)=>(await db.query('select public.family_save($1,$2,$3) as revision',[home.revision,document,entries])).rows[0].revision;
const list=async(db,args={})=>(await db.query('select public.family_activity_list($1,$2,$3,$4,$5) as entries',[args.before_at||null,args.max_rows??50,args.area_filter||null,args.member_filter||null,args.before_id||null])).rows[0].entries;

test('操作紀錄資料表：一次性遷移、重跑、原子衝突／驗證回滾、去重、家庭隔離及舊版相容',async()=>{
 const db=await setup();try{
 const homes=[];
 for(const [user,ids]of [[a,['a1','a2']],[b,['b1']]]){await auth(db,user);const home=(await db.query('select public.family_create() as home')).rows[0].home;home.revision=(await db.query('select public.family_save($1,$2) as revision',[home.revision,{...home.document,activity:ids.map(id=>entry(id,user))}])).rows[0].revision;homes.push(home);}
 await admin(db);await db.exec(await sql());await db.exec(await sql());
 const migrated=(await db.query('select id,revision,document from public.family_homes order by id')).rows;for(const old of homes){const row=migrated.find(r=>r.id===old.id);assert.equal(row.revision,old.revision+1);assert.equal(Object.hasOwn(row.document,'activity'),false);}assert.equal((await db.query('select count(*)::int as n from public.family_activity')).rows[0].n,3);
 await auth(db,a);let home=await read(db);assert.deepEqual((await list(db)).map(r=>r.id).sort(),['a1','a2']);assert.equal((await db.query('select public.family_activity_get($1) as entry',['b1'])).rows[0].entry,null);
 const fresh={...home.document,opening:100};await assert.rejects(save(db,{...home,revision:home.revision-1},fresh,[entry('conflict')]),/資料已更新/);assert.deepEqual((await read(db)).document,home.document);assert.ok(!(await list(db)).some(r=>r.id==='conflict'));
 home.revision=await save(db,home,fresh,[entry('stable')]);home.document=fresh;home.revision=await save(db,home,fresh,[entry('stable')]);assert.equal((await list(db)).filter(r=>r.id==='stable').length,1);
 for(const payload of [{},Array.from({length:101},(_,i)=>entry('too-many-'+i)),[entry('invalid-at',a,{at:'not-a-date'})],[entry('infinity',a,{at:'infinity'})],[entry('invalid-id',a,{id:123})]]){
  await assert.rejects(save(db,home,{...fresh,opening:999},payload),/操作紀錄|100/);const current=await read(db);assert.equal(current.revision,home.revision);assert.deepEqual(current.document,fresh);
 }
 // Two-argument old clients continue working through the new defaulted signature.
 home.revision=(await db.query('select public.family_save($1,$2) as revision',[home.revision,{...fresh,activity:[entry('legacy-new'),entry('a1')]}])).rows[0].revision;
 assert.ok(!(await read(db)).document.activity);assert.equal((await list(db)).filter(r=>r.id==='a1').length,1);assert.ok((await list(db)).some(r=>r.id==='legacy-new'));
 await auth(db,b);const bHome=await read(db);await assert.rejects(save(db,bHome,{...bHome.document,opening:666},[entry('a1',b)]),/ID 已被使用/);assert.deepEqual((await read(db)).document,bHome.document);assert.deepEqual((await list(db)).map(r=>r.id),['b1']);assert.equal((await db.query('select public.family_activity_get($1) as entry',['a1'])).rows[0].entry,null);
 await assert.rejects(db.query('select * from public.family_activity'),/permission denied/);await assert.rejects(db.query("select public.family_activity_insert($1,'[]'::jsonb)",[homes[0].id]),/permission denied/);
 await admin(db);await db.exec('set role anon');await assert.rejects(db.query('select * from public.family_activity'),/permission denied/);await assert.rejects(db.query('select public.family_activity_list()'),/permission denied/);
 }finally{await db.close();}
});

test('分頁同時間戳不漏紀錄、伺服器篩選／100筆上限、24月清理、操作紀錄不產生歷史',async()=>{
 const db=await setup();try{
 await auth(db,a);let home=(await db.query('select public.family_create() as home')).rows[0].home;await admin(db);await db.exec(await sql());await auth(db,a);home=await read(db);
 const all=Array.from({length:120},(_,i)=>entry('same-time-'+String(i).padStart(3,'0'),a,{area:i%2?'家務':'帳本'}));
 for(const batch of [all.slice(0,60),all.slice(60)])home.revision=await save(db,home,home.document,batch);
 const seen=[];let cursor={};for(;;){const rows=await list(db,{...cursor,max_rows:17});seen.push(...rows.map(r=>r.id));if(!rows.length)break;cursor={before_at:rows.at(-1).at,before_id:rows.at(-1).id};}assert.equal(seen.length,120);assert.equal(new Set(seen).size,120);
 assert.equal((await list(db,{max_rows:999})).length,100);assert.equal((await list(db,{area_filter:'家務',max_rows:100})).length,60);assert.equal((await list(db,{member_filter:b})).length,0);
 await admin(db);const before=(await db.query('select count(*)::int as n from public.family_document_history where home_id=$1',[home.id])).rows[0].n;
 await auth(db,a);home.revision=await save(db,home,home.document,[entry('activity-only')]);await admin(db);assert.equal((await db.query('select count(*)::int as n from public.family_document_history where home_id=$1',[home.id])).rows[0].n,before);
 await auth(db,a);const oldDate=new Date();oldDate.setUTCMonth(oldDate.getUTCMonth()-25);home.revision=await save(db,home,{...home.document,opening:100},[entry('expired',a,{at:oldDate.toISOString()})]);await admin(db);
 assert.equal((await db.query("select count(*)::int as n from public.family_activity where id='expired'")).rows[0].n,0);assert.equal((await db.query("select count(*)::int as n from public.family_document_history where document ? 'activity'")).rows[0].n,0);
 }finally{await db.close();}
});

test('一年用量：每天三筆收支、六項每日到期家務，document 小於 500 KB',async t=>{
 const {appendActivity,snapshot}=await import('../public/activity.js');
 const {normalizeNames,nextChoreDate}=await import('../public/model.js');
 const db=await setup();try{
 await auth(db,a);let home=(await db.query('select public.family_create() as home')).rows[0].home;await admin(db);await db.exec(await sql());await auth(db,a);home=await read(db);
 let document=normalizeNames(home.document);const start=new Date();start.setUTCDate(start.getUTCDate()-364);const startDate=start.toISOString().slice(0,10);
 document.chores=['澆花','清理貓砂','廚房擦拭','清掃地板','洗碗','整理桌面'].map((title,i)=>({id:'chore-'+i,date:'',title,next:startDate,anchor:startDate,repeatEvery:1,repeatUnit:'天',cadence:'每日',history:[],note:'每日固定處理'}));
 let total=0;
 for(let day=0;day<365;day++){
  const time=new Date(start);time.setUTCDate(start.getUTCDate()+day);const date=time.toISOString().slice(0,10),logs=[];
  const operation=(id,fn)=>{const before=snapshot(document);fn();logs.push(...appendActivity(document,before,{id,at:date+'T12:00:00Z',userId:a}));};
  for(let i=0;i<3;i++)operation('money-'+day+'-'+i,()=>document.money.push({id:'money-'+day+'-'+i,date,kind:'支出',amount:100+i,title:['早餐','午餐','晚餐'][i],category:'伙食',source:'共同帳戶',personUserId:a,person:'阿嘎',note:'家庭日常支出'}));
  for(let i=0;i<6;i++)operation('complete-'+day+'-'+i,()=>{const chore=document.chores.find(x=>x.id==='chore-'+i);assert.equal(chore.next,date);chore.date=date;chore.history.push(date);chore.next=nextChoreDate(chore,date);});
  assert.equal(Object.hasOwn(document,'activity'),false);assert.equal(logs.length,9);total+=logs.length;home.revision=await save(db,home,document,logs);
 }
 const live=(await read(db)).document;const bytes=Buffer.byteLength(JSON.stringify(live));assert.ok(bytes<500000,'document bytes='+bytes);assert.equal(live.money.length,1095);assert.ok(live.chores.every(c=>c.history.length===365));assert.ok(!Object.hasOwn(live,'activity'));
 await admin(db);assert.equal((await db.query('select count(*)::int as n from public.family_activity where home_id=$1',[home.id])).rows[0].n,total);t.diagnostic(`一年 document ${bytes} bytes；${total} 筆 activity 在獨立表。`);
 }finally{await db.close();}
});
