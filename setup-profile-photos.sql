-- Watch Together — run this once in the Supabase SQL editor.
-- Adds profile photos and lets people change their username.
-- Safe to run more than once.

-- 1. store a photo URL on each profile
alter table public.profiles add column if not exists avatar_url text;

-- 2. a public bucket for display pictures
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- anyone can view a display picture; you may only write your own folder
drop policy if exists "avatar read" on storage.objects;
create policy "avatar read" on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatar write" on storage.objects;
create policy "avatar write" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and public.path_room(name) = auth.uid());

drop policy if exists "avatar update" on storage.objects;
create policy "avatar update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and public.path_room(name) = auth.uid());

drop policy if exists "avatar delete" on storage.objects;
create policy "avatar delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and public.path_room(name) = auth.uid());

-- 3. change username, with the uniqueness check done server side
create or replace function public.set_username(new_name text) returns text
language plpgsql security definer set search_path = public as $fn$
declare n text;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  n := trim(new_name);
  if n !~ '^[A-Za-z0-9_]{3,20}$' then
    raise exception 'invalid username';
  end if;
  if exists (
    select 1 from public.profiles p
    where lower(p.username) = lower(n) and p.id <> auth.uid()
  ) then
    raise exception 'taken';
  end if;
  update public.profiles set username = n where id = auth.uid();
  return n;
end $fn$;
grant execute on function public.set_username(text) to authenticated;

-- 4. hand the photo back everywhere the app shows an avatar
drop function if exists public.my_friends();
create function public.my_friends()
returns table (row_id uuid, friend_id uuid, username text, uid6 text,
               avatar_emoji text, avatar_color text, avatar_url text,
               status text, direction text)
language sql security definer stable set search_path = public as $fn$
  select f.id,
    case when f.requester = auth.uid() then f.addressee else f.requester end,
    p.username, p.uid6, p.avatar_emoji, p.avatar_color, p.avatar_url, f.status,
    case when f.requester = auth.uid() then 'out' else 'in' end
  from public.friendships f
  join public.profiles p
    on p.id = case when f.requester = auth.uid() then f.addressee else f.requester end
  where (f.requester = auth.uid() or f.addressee = auth.uid())
    and f.status <> 'declined'
  order by f.status, p.username;
$fn$;
grant execute on function public.my_friends() to authenticated;

drop function if exists public.search_users(text);
create function public.search_users(q text)
returns table (id uuid, username text, uid6 text,
               avatar_emoji text, avatar_color text, avatar_url text)
language sql security definer stable set search_path = public as $fn$
  select p.id, p.username, p.uid6, p.avatar_emoji, p.avatar_color, p.avatar_url
  from public.profiles p
  where length(trim(q)) >= 2
    and p.id <> auth.uid()
    and (
      lower(p.username) like lower(trim(q)) || '%'
      or p.uid6 = regexp_replace(trim(q), '\D', '', 'g')
      or lower(p.email) = lower(trim(q))
    )
  order by p.username
  limit 20;
$fn$;
grant execute on function public.search_users(text) to authenticated;

drop function if exists public.my_invites();
create function public.my_invites()
returns table (invite_id uuid, room_id uuid, code text, kind text,
               from_id uuid, from_name text, from_emoji text,
               from_color text, from_photo text)
language sql security definer stable set search_path = public as $fn$
  select i.id, i.room_id, r.code, coalesce(i.kind,'watch'),
         i.from_user, p.username, p.avatar_emoji, p.avatar_color, p.avatar_url
  from public.room_invites i
  join public.rooms r on r.id = i.room_id
  join public.profiles p on p.id = i.from_user
  where i.to_user = auth.uid() and i.status = 'pending'
  order by i.created_at desc;
$fn$;
grant execute on function public.my_invites() to authenticated;
