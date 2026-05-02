-- Run this entire file in the Supabase SQL Editor.
-- It is idempotent and can be re-run safely while developing.

create extension if not exists pgcrypto;

do $$
begin
  create type public.app_role as enum ('superadmin', 'admin', 'staff');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.profile_status as enum ('pending', 'approved', 'rejected');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role public.app_role not null default 'staff',
  status public.profile_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'info',
  message text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  performed_by uuid references auth.users(id) on delete set null,
  target_id uuid,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.notifications enable row level security;
alter table public.cases enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.current_profile_role()
returns public.app_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.current_profile_status()
returns public.profile_status
language sql
security definer
set search_path = public
stable
as $$
  select status from public.profiles where id = auth.uid()
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_profile_role() = 'superadmin', false)
$$;

create or replace function public.is_approved()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_profile_status() = 'approved', false)
$$;

drop policy if exists "profiles_select_own_or_superadmin" on public.profiles;
create policy "profiles_select_own_or_superadmin"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_superadmin());

drop policy if exists "profiles_insert_own_pending" on public.profiles;
create policy "profiles_insert_own_pending"
on public.profiles
for insert
to authenticated
with check (
  id = auth.uid()
  and role in ('staff', 'admin')
  and status = 'pending'
);

drop policy if exists "profiles_update_superadmin" on public.profiles;
create policy "profiles_update_superadmin"
on public.profiles
for update
to authenticated
using (public.is_superadmin())
with check (public.is_superadmin());

drop policy if exists "notifications_select_own_or_superadmin" on public.notifications;
create policy "notifications_select_own_or_superadmin"
on public.notifications
for select
to authenticated
using (user_id = auth.uid() or public.is_superadmin());

drop policy if exists "notifications_update_own_read_or_superadmin" on public.notifications;
create policy "notifications_update_own_read_or_superadmin"
on public.notifications
for update
to authenticated
using (user_id = auth.uid() or public.is_superadmin())
with check (user_id = auth.uid() or public.is_superadmin());

drop policy if exists "notifications_insert_superadmin" on public.notifications;
create policy "notifications_insert_superadmin"
on public.notifications
for insert
to authenticated
with check (public.is_superadmin());

drop policy if exists "cases_select_approved" on public.cases;
create policy "cases_select_approved"
on public.cases
for select
to authenticated
using (public.is_approved());

drop policy if exists "cases_insert_approved" on public.cases;
create policy "cases_insert_approved"
on public.cases
for insert
to authenticated
with check (public.is_approved() and created_by = auth.uid());

drop policy if exists "cases_update_admin_or_creator" on public.cases;
create policy "cases_update_admin_or_creator"
on public.cases
for update
to authenticated
using (
  public.is_approved()
  and (created_by = auth.uid() or public.current_profile_role() in ('superadmin', 'admin'))
)
with check (
  public.is_approved()
  and (created_by = auth.uid() or public.current_profile_role() in ('superadmin', 'admin'))
);

drop policy if exists "cases_delete_admins" on public.cases;
create policy "cases_delete_admins"
on public.cases
for delete
to authenticated
using (public.is_approved() and public.current_profile_role() in ('superadmin', 'admin'));

drop policy if exists "audit_logs_select_superadmin" on public.audit_logs;
create policy "audit_logs_select_superadmin"
on public.audit_logs
for select
to authenticated
using (public.is_superadmin());

drop policy if exists "audit_logs_insert_approved" on public.audit_logs;
create policy "audit_logs_insert_approved"
on public.audit_logs
for insert
to authenticated
with check (public.is_approved() and performed_by = auth.uid());

create or replace function public.notify_superadmins_new_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (type, message, user_id)
  select
    'info',
    'New user awaiting approval: ' || new.full_name || ' (' || new.email || ')',
    profiles.id
  from public.profiles
  where role = 'superadmin'
    and status = 'approved';

  return new;
end;
$$;

drop trigger if exists on_profile_created_notify_superadmins on public.profiles;
create trigger on_profile_created_notify_superadmins
after insert on public.profiles
for each row
execute function public.notify_superadmins_new_profile();

create index if not exists profiles_role_status_idx on public.profiles(role, status);
create index if not exists notifications_user_read_idx on public.notifications(user_id, read);
create index if not exists cases_created_by_idx on public.cases(created_by);
create index if not exists audit_logs_performed_by_idx on public.audit_logs(performed_by);

-- After your first signup, run this in Supabase SQL Editor to create the first superadmin:
-- update public.profiles
-- set role = 'superadmin', status = 'approved'
-- where email = 'your-email@example.com';
