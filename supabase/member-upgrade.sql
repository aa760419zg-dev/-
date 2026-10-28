-- 舊環境升級：保留原資料，首次讀取補齊 members；create/join 原本就會呼叫 family_read。
begin;
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
revoke all on function public.family_read() from public,anon;
grant execute on function public.family_read() to authenticated;
commit;
