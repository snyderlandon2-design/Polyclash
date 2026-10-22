-- Poly-Clash owner recovery: deployed to Supabase on 2026-10-22.
-- This is an implementation record; apply to a staging project before using as a migration.
create table if not exists public.profile_snapshots (
 id bigint generated always as identity primary key,
 user_id uuid not null,
 captured_at timestamptz not null default now(),
 snapshot jsonb not null
);
create index if not exists profile_snapshots_user_time_idx on public.profile_snapshots(user_id,captured_at desc);
alter table public.profile_snapshots enable row level security;
revoke all on public.profile_snapshots from anon, authenticated;

create or replace function private.capture_player_snapshot()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 if tg_op='UPDATE' and row(old.coins,old.wins,old.kills,old.xp,old.data)
   is not distinct from row(new.coins,new.wins,new.kills,new.xp,new.data) then return new; end if;
 insert into public.profile_snapshots(user_id,snapshot) values(old.id,to_jsonb(old));
 if tg_op='DELETE' then return old; end if;
 return new;
end $$;
drop trigger if exists snapshot_profile_before_change on public.profiles;
create trigger snapshot_profile_before_change before update or delete on public.profiles
for each row execute function private.capture_player_snapshot();

create table if not exists public.admin_emergency (
 singleton boolean primary key default true check(singleton),
 locked boolean not null default false
);
insert into public.admin_emergency(singleton,locked) values(true,false)
on conflict(singleton) do nothing;
alter table public.admin_emergency enable row level security;
revoke all on public.admin_emergency from anon,authenticated;

create or replace function public.is_staff(p text)
returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.admin_roles r where r.user_id=auth.uid()
 and (r.role='owner' or ((select not locked from public.admin_emergency where singleton=true)
 and (p is null or coalesce((r.powers->>p)::boolean,false)))))
$$;

create or replace function public.owner_snapshots(target uuid)
returns table(snapshot_id bigint,saved_at timestamptz,coins int,xp int,wins int,kills int)
language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from public.admin_roles where user_id=auth.uid() and role='owner')
 then raise exception 'Owner only'; end if;
 return query select s.id,s.captured_at,(s.snapshot->>'coins')::int,
 (s.snapshot->>'xp')::int,(s.snapshot->>'wins')::int,(s.snapshot->>'kills')::int
 from public.profile_snapshots s where s.user_id=target order by s.captured_at desc limit 100;
end $$;

create or replace function public.owner_restore_snapshot(sid bigint)
returns void language plpgsql security definer set search_path=public as $$
declare snap record; nm text;
begin
 if not exists(select 1 from public.admin_roles where user_id=auth.uid() and role='owner')
 then raise exception 'Owner only'; end if;
 select user_id,snapshot into snap from public.profile_snapshots where id=sid;
 if not found then raise exception 'Snapshot missing'; end if;
 if snap.user_id=auth.uid() then raise exception 'Owner profile protected'; end if;
 select username into nm from public.profiles where id=snap.user_id for update;
 if nm is null then raise exception 'Deleted account requires separate account recovery'; end if;
 update public.profiles set coins=(snap.snapshot->>'coins')::int,
 xp=(snap.snapshot->>'xp')::int,wins=(snap.snapshot->>'wins')::int,
 kills=(snap.snapshot->>'kills')::int,data=snap.snapshot->'data'
 where id=snap.user_id;
 insert into public.admin_log(admin_name,target_name,action,detail)
 values((select username from public.profiles where id=auth.uid()),nm,
 'restored profile snapshot',jsonb_build_object('snapshot',sid));
end $$;

create or replace function public.owner_create_restore_point(target uuid)
returns bigint language plpgsql security definer set search_path=public as $$
declare snap_id bigint;
begin
 if not exists(select 1 from public.admin_roles where user_id=auth.uid() and role='owner')
 then raise exception 'Owner only'; end if;
 insert into public.profile_snapshots(user_id,snapshot)
 select p.id,to_jsonb(p) from public.profiles p where p.id=target returning id into snap_id;
 if snap_id is null then raise exception 'Player not found'; end if;
 return snap_id;
end $$;

create or replace function public.owner_emergency_switch(desired boolean)
returns boolean language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from public.admin_roles where user_id=auth.uid() and role='owner')
 then raise exception 'Owner only'; end if;
 update public.admin_emergency set locked=desired where singleton=true;
 insert into public.admin_log(admin_name,target_name,action,detail)
 values((select username from public.profiles where id=auth.uid()),'ALL ADMINS',
 case when desired then 'EMERGENCY ADMIN LOCK' else 'EMERGENCY ADMIN UNLOCK' end,
 jsonb_build_object('locked',desired));
 return desired;
end $$;

create or replace function public.owner_recovery_status()
returns table(locked boolean,snapshot_count bigint)
language plpgsql stable security definer set search_path=public as $$
begin
 if not exists(select 1 from public.admin_roles where user_id=auth.uid() and role='owner')
 then raise exception 'Owner only'; end if;
 return query select e.locked,(select count(*) from public.profile_snapshots)
 from public.admin_emergency e where e.singleton=true;
end $$;

revoke all on function public.owner_snapshots(uuid),
 public.owner_restore_snapshot(bigint),public.owner_create_restore_point(uuid),
 public.owner_emergency_switch(boolean),public.owner_recovery_status()
 from public,anon;
grant execute on function public.owner_snapshots(uuid),
 public.owner_restore_snapshot(bigint),public.owner_create_restore_point(uuid),
 public.owner_emergency_switch(boolean),public.owner_recovery_status()
 to authenticated;
notify pgrst,'reload schema';
