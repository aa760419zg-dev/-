-- 在 Supabase SQL Editor 執行整份腳本。不刪除既有資料。
begin;
create table if not exists public.family_homes (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id),
 invite_email text,
 document jsonb not null default '{"version":1,"opening":0,"threshold":3000,"money":[],"events":[],"pets":[],"chores":[],"health":[]}',
 revision integer not null default 0
);
create table if not exists public.family_members (
 user_id uuid primary key references auth.users(id),
 home_id uuid not null references public.family_homes(id) on delete cascade
);
alter table public.family_homes enable row level security;
alter table public.family_members enable row level security;
revoke all on public.family_homes, public.family_members from anon, authenticated;

create or replace function public.family_read() returns jsonb language plpgsql security definer set search_path = '' as $$
declare home public.family_homes%rowtype; person record; members jsonb; roster jsonb;
begin
 select h.* into home from public.family_homes h join public.family_members m on m.home_id=h.id where m.user_id=auth.uid() for update of h;
 if home.id is null then return null; end if;
 members=case when jsonb_typeof(home.document->'members')='array' then home.document->'members' else '[]'::jsonb end;
 for person in select m.user_id,case when m.user_id=home.owner_id then '阿嘎' else '糖糖' end as legacy_name from public.family_members m where m.home_id=home.id order by m.user_id loop
  if not exists(select 1 from jsonb_array_elements(members) x where x->>'userId'=person.user_id::text) then
   members=members||jsonb_build_array(jsonb_build_object('userId',person.user_id,'name',person.legacy_name,'color',case when person.user_id=home.owner_id then '#315c4c' else '#b97878' end));
  end if;
 end loop;
 if home.document->'members' is distinct from members then
  update public.family_homes h set document=jsonb_set(h.document,'{members}',members),revision=h.revision+1 where h.id=home.id returning h.* into home;
 end if;
 select jsonb_agg(jsonb_build_object('userId',m.user_id,'legacyName',case when m.user_id=home.owner_id then '阿嘎' else '糖糖' end)) into roster from public.family_members m where m.home_id=home.id;
 return jsonb_build_object('id',home.id,'document',home.document,'revision',home.revision,'owner',home.owner_id=auth.uid(),'memberRoster',roster);
end $$;
create or replace function public.family_create() returns jsonb language plpgsql security definer set search_path = '' as $$
declare home uuid;
begin
 if auth.uid() is null then raise exception '請先登入'; end if;
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
 if exists(select 1 from public.family_members where user_id=auth.uid()) then raise exception '你已加入家庭'; end if;
 insert into public.family_homes(owner_id) values(auth.uid()) returning id into home;
 insert into public.family_members(user_id,home_id) values(auth.uid(),home);
 return public.family_read();
end $$;
create or replace function public.family_invite(email text) returns void language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is null then raise exception '請先登入'; end if;
 if email is null or length(email)>254 or position('@' in email)<2 then raise exception '請輸入有效 Email'; end if;
 update public.family_homes set invite_email=lower(trim(email)) where owner_id=auth.uid();
 if not found then raise exception '只有建立家庭的人可以邀請'; end if;
end $$;
create or replace function public.family_join() returns jsonb language plpgsql security definer set search_path = '' as $$
declare home uuid;
begin
 if auth.uid() is null then raise exception '請先登入'; end if;
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
 if exists(select 1 from public.family_members where user_id=auth.uid()) then raise exception '你已加入家庭'; end if;
 select h.id into home from public.family_homes h where h.invite_email=lower(auth.jwt()->>'email') order by h.id limit 1 for update;
 if home is null then raise exception '尚未找到寄給此 Email 的邀請，請先由另一半邀請'; end if;
 if (select count(*) from public.family_members where home_id=home)>=2 then raise exception '家庭目前限兩位成員'; end if;
 insert into public.family_members(user_id,home_id) values(auth.uid(),home);
 update public.family_homes set invite_email=null where id=home;
 return public.family_read();
end $$;
create or replace function public.family_save(expected_revision integer, new_document jsonb) returns integer language plpgsql security definer set search_path = '' as $$
declare result integer;
begin
 if auth.uid() is null then raise exception '請先登入'; end if;
 if new_document->>'version' is distinct from '1' or jsonb_typeof(new_document->'opening') is distinct from 'number' or jsonb_typeof(new_document->'threshold') is distinct from 'number'
 or jsonb_typeof(new_document->'money') is distinct from 'array' or jsonb_typeof(new_document->'events') is distinct from 'array'
 or jsonb_typeof(new_document->'pets') is distinct from 'array' or jsonb_typeof(new_document->'chores') is distinct from 'array' or jsonb_typeof(new_document->'health') is distinct from 'array'
 or octet_length(new_document::text)>5000000 then raise exception '資料格式不正確或超過 5 MB'; end if;
 update public.family_homes h set document=new_document, revision=h.revision+1
 where h.revision=expected_revision and exists(select 1 from public.family_members m where m.home_id=h.id and m.user_id=auth.uid()) returning h.revision into result;
 if result is null then raise exception '資料已更新，請重新整理後再試；本次變更未儲存'; end if;
 return result;
end $$;
revoke all on function public.family_read(), public.family_create(), public.family_invite(text), public.family_join(), public.family_save(integer,jsonb) from public, anon;
grant execute on function public.family_read(), public.family_create(), public.family_invite(text), public.family_join(), public.family_save(integer,jsonb) to authenticated;
commit;
