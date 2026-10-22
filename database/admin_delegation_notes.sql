-- Mega Admin-controlled delegation. Deployed to Supabase 2026-10-22.
-- See database/admin_tools.sql for other RPCs.
create table if not exists public.admin_baselines(user_id uuid primary key references auth.users(id) on delete cascade,created_at timestamptz not null default now(),granted_by uuid not null references auth.users(id),original_role text not null default 'player',original_powers jsonb not null default '{}'::jsonb);
alter table public.admin_baselines enable row level security;
revoke all on public.admin_baselines from anon,authenticated;
-- The owner_set_admin RPC is installed in Supabase with a server-side owner check,
-- immutable owner protection, allowlisted powers, baseline restoration and audit log.
-- Export its deployed definition with pg_get_functiondef for migrations.
