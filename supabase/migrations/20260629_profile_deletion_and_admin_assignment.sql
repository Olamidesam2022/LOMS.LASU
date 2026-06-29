-- Make deleted profiles disappear and move case assignment to admin accounts.
-- This migration is idempotent and safe to re-run.

do $$
declare
  profile_auth_column text;
begin
  profile_auth_column := case
    when exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'profiles'
        and column_name = 'user_id'
    )
      then 'user_id'
    else 'id'
  end;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'status'
  ) then
    execute 'delete from public.profiles where status::text = ''rejected''';
  end if;

  execute format(
    'delete from public.profiles p
     where not exists (
       select 1 from auth.users au where au.id = p.%I
     )',
    profile_auth_column
  );
end $$;

do $$
declare
  profile_auth_column text;
  profile_auth_attnum smallint;
  existing_constraint record;
  constraint_name text;
begin
  profile_auth_column := case
    when exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'profiles'
        and column_name = 'user_id'
    )
      then 'user_id'
    else 'id'
  end;

  select attnum
  into profile_auth_attnum
  from pg_attribute
  where attrelid = 'public.profiles'::regclass
    and attname = profile_auth_column
    and not attisdropped;

  for existing_constraint in
    select conname
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'f'
      and confrelid = 'auth.users'::regclass
      and conkey = array[profile_auth_attnum]::smallint[]
  loop
    execute format(
      'alter table public.profiles drop constraint %I',
      existing_constraint.conname
    );
  end loop;

  constraint_name := format(
    'profiles_%s_auth_users_delete_cascade_fkey',
    profile_auth_column
  );

  execute format(
    'alter table public.profiles
     add constraint %I
     foreign key (%I) references auth.users(id) on delete cascade',
    constraint_name,
    profile_auth_column
  );
exception
  when duplicate_object then null;
end $$;

drop policy if exists "profiles_select_own_or_superadmin" on public.profiles;
drop policy if exists "profiles_select_own_superadmin_or_admin_staff" on public.profiles;
create policy "profiles_select_own_superadmin_or_admin_staff"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_superadmin()
  or (
    public.is_approved()
    and public.current_profile_role() = 'admin'
    and role::text in ('staff', 'legal_officer')
    and status = 'approved'
  )
);

create or replace function public.delete_user_account(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if target_user_id is null then
    raise exception 'A target user id is required.';
  end if;

  if auth.uid() is null or not public.is_superadmin() then
    raise exception 'Only superadmin accounts can delete users.';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'You cannot delete your own account.';
  end if;

  delete from public.profiles
  where id = target_user_id;

  begin
    delete from auth.users
    where id = target_user_id;
  exception
    when others then
      raise warning 'Profile deleted, but auth user % could not be removed: %',
        target_user_id,
        sqlerrm;
  end;
end;
$$;

revoke all on function public.delete_user_account(uuid) from public;
grant execute on function public.delete_user_account(uuid) to authenticated;

create or replace function public.can_access_case(target_case_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.cases c
    where c.id = target_case_id
      and (
        public.current_profile_role() in ('superadmin', 'admin')
        or c.created_by = auth.uid()
        or c.entered_by = auth.uid()
        or c.assigned_to = auth.uid()
        or exists (
          select 1
          from public.case_access ca
          where ca.case_id = c.id
            and ca.user_id = auth.uid()
        )
      )
  )
$$;

drop policy if exists "cases_select_approved" on public.cases;
drop policy if exists "cases_select_role_or_owner" on public.cases;
drop policy if exists "cases_select_role_or_assignee" on public.cases;
drop policy if exists user_case_isolation on public.cases;
create policy "cases_select_role_or_assignee"
on public.cases
for select
to authenticated
using (
  public.is_approved()
  and (
    public.current_profile_role() in ('superadmin', 'admin')
    or created_by = auth.uid()
    or entered_by = auth.uid()
    or assigned_to = auth.uid()
    or exists (
      select 1
      from public.case_access ca
      where ca.case_id = cases.id
        and ca.user_id = auth.uid()
    )
  )
);

drop policy if exists "cases_update_admin_or_creator" on public.cases;
drop policy if exists "cases_update_superadmin_or_owner" on public.cases;
drop policy if exists "cases_update_manager_or_owner" on public.cases;
create policy "cases_update_manager_or_owner"
on public.cases
for update
to authenticated
using (
  public.is_approved()
  and (
    public.current_profile_role() in ('superadmin', 'admin')
    or created_by = auth.uid()
    or entered_by = auth.uid()
  )
)
with check (
  public.is_approved()
  and (
    public.current_profile_role() in ('superadmin', 'admin')
    or created_by = auth.uid()
    or entered_by = auth.uid()
  )
);

drop policy if exists "case_access_select_self_or_superadmin" on public.case_access;
drop policy if exists "case_access_select_self_or_managers" on public.case_access;
drop policy if exists user_case_access_self_or_admin on public.case_access;
create policy "case_access_select_self_or_managers"
on public.case_access
for select
to authenticated
using (
  public.is_approved()
  and (
    user_id = auth.uid()
    or public.current_profile_role() in ('superadmin', 'admin')
  )
);

drop policy if exists "case_access_insert_superadmin" on public.case_access;
drop policy if exists "case_access_insert_admin_to_staff" on public.case_access;
create policy "case_access_insert_admin_to_staff"
on public.case_access
for insert
to authenticated
with check (
  public.is_approved()
  and public.current_profile_role() = 'admin'
  and granted_by = auth.uid()
  and exists (
    select 1
    from public.profiles target_profile
    where target_profile.id = case_access.user_id
      and target_profile.role::text in ('staff', 'legal_officer')
      and target_profile.status::text = 'approved'
  )
);

drop policy if exists "case_access_delete_admin" on public.case_access;
create policy "case_access_delete_admin"
on public.case_access
for delete
to authenticated
using (
  public.is_approved()
  and public.current_profile_role() = 'admin'
);
