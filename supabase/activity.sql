-- 操作紀錄獨立儲存。先部署相容的新前端，再在 Supabase SQL Editor 執行本檔。
begin;
create table if not exists public.family_activity (
 id text primary key,
 home_id uuid not null references public.family_homes(id) on delete cascade,
 at timestamptz not null,
 user_id uuid,
 area text,
 action text,
 entry jsonb not null,
 created_at timestamptz default now()
);
create index if not exists family_activity_home_at_idx on public.family_activity(home_id, at desc);
alter table public.family_activity enable row level security;
revoke all on public.family_activity from public, anon, authenticated;

-- 共用驗證與寫入；僅由下方 security definer 函式及後台遷移使用。
create or replace function public.family_activity_insert(target_home uuid, entries jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare item jsonb; item_at timestamptz;
begin
 if jsonb_typeof(entries) is distinct from 'array' then raise exception '操作紀錄必須是陣列'; end if;
 for item in select value from jsonb_array_elements(entries) loop
  if jsonb_typeof(item) is distinct from 'object' or jsonb_typeof(item->'id') is distinct from 'string'
     or length(item->>'id')=0 or jsonb_typeof(item->'at') is distinct from 'string' then
   raise exception '操作紀錄須有字串 id 與有效 at';
  end if;
  begin
   item_at=(item->>'at')::timestamptz;
   if not isfinite(item_at) then raise exception 'invalid timestamp'; end if;
  exception when others then raise exception '操作紀錄 at 日期無效'; end;
  if exists(select 1 from public.family_activity where id=item->>'id' and home_id<>target_home) then
   raise exception '操作紀錄 ID 已被使用，請重新操作';
  end if;
  insert into public.family_activity(id,home_id,at,user_id,area,action,entry)
  values(item->>'id',target_home,item_at,
   case when item->>'userId' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then (item->>'userId')::uuid else null end,
   item->>'area',item->>'action',item)
  on conflict(id) do nothing;
 end loop;
 delete from public.family_activity where home_id=target_home and at<now()-interval '24 months';
end $$;
revoke all on function public.family_activity_insert(uuid,jsonb) from public,anon,authenticated;

drop function if exists public.family_save(integer,jsonb);
create or replace function public.family_save(expected_revision integer, new_document jsonb, new_activity jsonb default '[]'::jsonb)
returns integer language plpgsql security definer set search_path = '' as $$
declare target_home uuid; result integer; clean_document jsonb; legacy jsonb;
begin
 if auth.uid() is null then raise exception '請先登入'; end if;
 if jsonb_typeof(new_activity) is distinct from 'array' then raise exception '操作紀錄必須是陣列'; end if;
 if jsonb_array_length(new_activity)>100 then raise exception '一次最多 100 筆操作紀錄'; end if;
 clean_document=new_document-'activity';
 if clean_document->>'version' is distinct from '1' or jsonb_typeof(clean_document->'opening') is distinct from 'number' or jsonb_typeof(clean_document->'threshold') is distinct from 'number'
 or jsonb_typeof(clean_document->'money') is distinct from 'array' or jsonb_typeof(clean_document->'events') is distinct from 'array'
 or jsonb_typeof(clean_document->'pets') is distinct from 'array' or jsonb_typeof(clean_document->'chores') is distinct from 'array' or jsonb_typeof(clean_document->'health') is distinct from 'array'
 or octet_length(clean_document::text)>5000000 then raise exception '資料格式不正確或超過 5 MB'; end if;
 select m.home_id into target_home from public.family_members m where m.user_id=auth.uid();
 update public.family_homes h set document=clean_document,revision=h.revision+1
 where h.id=target_home and h.revision=expected_revision returning h.revision into result;
 if result is null then raise exception '資料已更新，請重新整理後再試；本次變更未儲存'; end if;
 -- 若紀錄驗證失敗，整個函式交易回滾，文件與 revision 也不會更新。
 perform public.family_activity_insert(target_home,new_activity);
 if new_document ? 'activity' then
  legacy=new_document->'activity';
  perform public.family_activity_insert(target_home,legacy);
 end if;
 return result;
end $$;
revoke all on function public.family_save(integer,jsonb,jsonb) from public,anon;
grant execute on function public.family_save(integer,jsonb,jsonb) to authenticated;

-- before_id 是同一時間戳記的分頁游標，避免同一批操作跨頁時漏掉紀錄。
create or replace function public.family_activity_list(before_at timestamptz default null, max_rows integer default 50, area_filter text default null, member_filter uuid default null, before_id text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
 if auth.uid() is null then raise exception '請先登入'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'at',r.at,'entry',r.entry) order by r.at desc,r.id desc),'[]'::jsonb) into result
 from (
  select a.id,a.at,a.entry from public.family_activity a
  join public.family_members m on m.home_id=a.home_id and m.user_id=auth.uid()
  where (before_at is null or a.at<before_at or (before_id is not null and a.at=before_at and a.id<before_id))
   and (area_filter is null or a.area=area_filter) and (member_filter is null or a.user_id=member_filter)
   and a.at>=now()-interval '24 months'
  order by a.at desc,a.id desc limit greatest(1,least(coalesce(max_rows,50),100))
 ) r;
 return result;
end $$;
revoke all on function public.family_activity_list(timestamptz,integer,text,uuid,text) from public,anon;
grant execute on function public.family_activity_list(timestamptz,integer,text,uuid,text) to authenticated;

create or replace function public.family_activity_get(activity_id text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is null then raise exception '請先登入'; end if;
 return (select a.entry from public.family_activity a join public.family_members m on m.home_id=a.home_id and m.user_id=auth.uid()
  where a.id=activity_id and a.at>=now()-interval '24 months');
end $$;
revoke all on function public.family_activity_get(text) from public,anon;
grant execute on function public.family_activity_get(text) to authenticated;

-- 每戶鎖定與存檔相同的資料列。遷移與 revision 更新同一次交易完成；可安全重跑。
do $$
declare home record;
begin
 for home in select id,document from public.family_homes where document ? 'activity' for update loop
  perform public.family_activity_insert(home.id,home.document->'activity');
  update public.family_homes set document=document-'activity',revision=revision+1 where id=home.id;
 end loop;
end $$;
notify pgrst, 'reload schema';
commit;
