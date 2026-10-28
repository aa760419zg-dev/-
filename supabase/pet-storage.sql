-- 寵物照片使用私人儲存空間。僅家庭成員可存取，路徑以家庭 ID 開頭。
begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('family-pet-photos','family-pet-photos',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false, file_size_limit=5242880, allowed_mime_types=array['image/jpeg','image/png','image/webp'];
create or replace function public.family_photo_access(folder text)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.family_members m where m.user_id=auth.uid() and m.home_id::text=folder);
$$;
revoke all on function public.family_photo_access(text) from public,anon;
grant execute on function public.family_photo_access(text) to authenticated;
drop policy if exists family_pet_photo_read on storage.objects;
create policy family_pet_photo_read on storage.objects for select to authenticated
using(bucket_id='family-pet-photos' and public.family_photo_access((storage.foldername(name))[1]));
drop policy if exists family_pet_photo_insert on storage.objects;
create policy family_pet_photo_insert on storage.objects for insert to authenticated
with check(bucket_id='family-pet-photos' and public.family_photo_access((storage.foldername(name))[1]));
drop policy if exists family_pet_photo_delete on storage.objects;
create policy family_pet_photo_delete on storage.objects for delete to authenticated
using(bucket_id='family-pet-photos' and public.family_photo_access((storage.foldername(name))[1]));
commit;
