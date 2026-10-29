-- 雲端歷史版本 v2：每次家庭資料存檔前，自動保留上一版（不含操作紀錄 activity，避免占用過多空間）。
-- 每個家庭保留最近 200 版。可重複執行，不刪除既有資料。僅供後台救援使用，App 無法直接讀取。
begin;
create table if not exists public.family_document_history (
 id bigint generated always as identity primary key,
 home_id uuid not null references public.family_homes(id) on delete cascade,
 revision integer not null,
 document jsonb not null,
 saved_by uuid,
 saved_at timestamptz not null default now()
);
create index if not exists family_document_history_home_idx on public.family_document_history(home_id, revision desc);
alter table public.family_document_history enable row level security;
revoke all on public.family_document_history from anon, authenticated;

-- 既有的歷史版本也移除 activity，釋放空間。
update public.family_document_history set document = document - 'activity' where document ? 'activity';

create or replace function public.family_keep_history() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if (old.document - 'activity') is distinct from (new.document - 'activity') then
  insert into public.family_document_history(home_id, revision, document, saved_by)
  values(old.id, old.revision, old.document - 'activity', auth.uid());
  delete from public.family_document_history
  where home_id = old.id and id not in (
   select id from public.family_document_history where home_id = old.id order by id desc limit 200
  );
 end if;
 return new;
end $$;
revoke all on function public.family_keep_history() from public, anon, authenticated;

drop trigger if exists family_keep_history on public.family_homes;
create trigger family_keep_history before update on public.family_homes
for each row execute function public.family_keep_history();
commit;
