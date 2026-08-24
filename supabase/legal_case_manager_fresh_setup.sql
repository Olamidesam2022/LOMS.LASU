-- Legal Case Manager fresh Supabase setup
-- Paste this into the Supabase SQL Editor for a NEW project.
-- Then create your first auth user and run the superadmin update at the bottom.

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
  department text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'info' check (type in ('urgent', 'info', 'warning')),
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
  creator_email text,
  entered_by uuid references auth.users(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.case_access (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (case_id, user_id)
);

create table if not exists public.case_notes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  content text not null,
  created_by uuid references auth.users(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  is_private boolean not null default false,
  note_type text not null default 'note',
  created_at timestamptz not null default now()
);

create table if not exists public.case_tasks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'completed')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  due_date date,
  assigned_to uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deadlines (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  title text not null default 'Deadline',
  due_date date not null,
  status text not null default 'open',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.advisory_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  requested_by text not null,
  department text not null,
  due_date date,
  status text not null default 'Pending' check (status in ('Pending', 'In Progress', 'Completed', 'Urgent')),
  assigned_to text,
  priority text not null default 'Medium' check (priority in ('Low', 'Medium', 'High', 'Critical')),
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('MoU', 'Court Process', 'Legal Opinion', 'Contract', 'Correspondence')),
  case_id uuid references public.cases(id) on delete set null,
  storage_path text,
  mime_type text,
  version text not null default '1.0',
  uploaded_by text not null,
  size text not null default '0 MB',
  status text not null default 'Final' check (status in ('Draft', 'Final', 'Archived')),
  created_by uuid references auth.users(id) on delete set null,
  entered_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  performed_by uuid references auth.users(id) on delete set null,
  target_id uuid,
  resource text,
  details text,
  created_at timestamptz not null default now()
);

create index if not exists profiles_role_status_idx on public.profiles(role, status);
create index if not exists profiles_status_created_idx on public.profiles(status, created_at desc);
create index if not exists notifications_user_read_idx on public.notifications(user_id, read);
create index if not exists cases_created_by_idx on public.cases(created_by);
create index if not exists cases_entered_by_idx on public.cases(entered_by);
create index if not exists cases_assigned_to_idx on public.cases(assigned_to);
create index if not exists cases_created_at_idx on public.cases(created_at desc);
create index if not exists case_access_case_user_idx on public.case_access(case_id, user_id);
create index if not exists case_notes_case_created_idx on public.case_notes(case_id, created_at desc);
create index if not exists case_tasks_case_status_idx on public.case_tasks(case_id, status);
create index if not exists case_tasks_assigned_to_idx on public.case_tasks(assigned_to);
create index if not exists case_tasks_due_date_idx on public.case_tasks(due_date);
create index if not exists deadlines_case_due_idx on public.deadlines(case_id, due_date);
create index if not exists advisory_requests_status_idx on public.advisory_requests(status);
create index if not exists advisory_requests_due_date_idx on public.advisory_requests(due_date);
create index if not exists documents_case_id_idx on public.documents(case_id);
create index if not exists documents_created_by_idx on public.documents(created_by);
create index if not exists documents_entered_by_idx on public.documents(entered_by);
create index if not exists documents_type_idx on public.documents(type);
create index if not exists audit_logs_target_idx on public.audit_logs(target_id);
create index if not exists audit_logs_performed_by_idx on public.audit_logs(performed_by);

alter table public.profiles enable row level security;
alter table public.notifications enable row level security;
alter table public.cases enable row level security;
alter table public.case_access enable row level security;
alter table public.case_notes enable row level security;
alter table public.case_tasks enable row level security;
alter table public.deadlines enable row level security;
alter table public.advisory_requests enable row level security;
alter table public.documents enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_cases_updated_at on public.cases;
create trigger set_cases_updated_at
before update on public.cases
for each row execute function public.set_updated_at();

drop trigger if exists set_case_tasks_updated_at on public.case_tasks;
create trigger set_case_tasks_updated_at
before update on public.case_tasks
for each row execute function public.set_updated_at();

drop trigger if exists set_deadlines_updated_at on public.deadlines;
create trigger set_deadlines_updated_at
before update on public.deadlines
for each row execute function public.set_updated_at();

drop trigger if exists set_advisory_requests_updated_at on public.advisory_requests;
create trigger set_advisory_requests_updated_at
before update on public.advisory_requests
for each row execute function public.set_updated_at();

drop trigger if exists set_documents_updated_at on public.documents;
create trigger set_documents_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

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
      and public.is_approved()
      and (
        public.current_profile_role() in ('superadmin', 'admin')
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

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email, 'New User'),
    case
      when new.raw_user_meta_data->>'requested_role' = 'admin'
        then 'admin'::public.app_role
      else 'staff'::public.app_role
    end,
    'pending'::public.profile_status
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.notify_superadmins_new_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  notification_message text;
begin
  if new.status::text <> 'pending' then
    return new;
  end if;

  notification_message :=
    'New user awaiting approval: '
    || coalesce(nullif(new.full_name, ''), new.email, 'New user')
    || ' ('
    || new.email
    || ')';

  insert into public.notifications (type, message, user_id)
  select
    'info',
    notification_message,
    superadmin_profiles.id
  from public.profiles superadmin_profiles
  where superadmin_profiles.role = 'superadmin'
    and superadmin_profiles.status = 'approved'
    and superadmin_profiles.id <> new.id
    and not exists (
      select 1
      from public.notifications existing_notifications
      where existing_notifications.user_id = superadmin_profiles.id
        and existing_notifications.read = false
        and existing_notifications.message ilike '%' || new.email || '%'
        and existing_notifications.message ilike '%awaiting approval%'
    );

  return new;
end;
$$;

drop trigger if exists on_profile_pending_notify_superadmins on public.profiles;
create trigger on_profile_pending_notify_superadmins
after insert or update of status on public.profiles
for each row
when (new.status::text = 'pending')
execute function public.notify_superadmins_new_profile();

create or replace function public.enforce_case_staff_update_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_profile_role() not in ('superadmin', 'admin') then
    if new.created_by is distinct from old.created_by
      or new.entered_by is distinct from old.entered_by
      or new.assigned_to is distinct from old.assigned_to
      or new.creator_email is distinct from old.creator_email then
      raise exception 'Legal users cannot change case ownership or assignment.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_case_staff_update_scope on public.cases;
create trigger enforce_case_staff_update_scope
before update on public.cases
for each row execute function public.enforce_case_staff_update_scope();

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

  delete from public.profiles where id = target_user_id;

  begin
    delete from auth.users where id = target_user_id;
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

drop policy if exists profiles_select_own_superadmin_or_admin_staff on public.profiles;
create policy profiles_select_own_superadmin_or_admin_staff
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_superadmin()
  or (
    public.is_approved()
    and public.current_profile_role() = 'admin'
    and role = 'staff'
    and status = 'approved'
  )
);

drop policy if exists profiles_insert_own_pending on public.profiles;
create policy profiles_insert_own_pending
on public.profiles
for insert
to authenticated
with check (
  id = auth.uid()
  and role in ('staff', 'admin')
  and status = 'pending'
);

drop policy if exists profiles_update_superadmin on public.profiles;
create policy profiles_update_superadmin
on public.profiles
for update
to authenticated
using (public.is_superadmin())
with check (public.is_superadmin());

drop policy if exists notifications_select_own_or_superadmin on public.notifications;
create policy notifications_select_own_or_superadmin
on public.notifications
for select
to authenticated
using (user_id = auth.uid() or public.is_superadmin());

drop policy if exists notifications_update_own_or_superadmin on public.notifications;
create policy notifications_update_own_or_superadmin
on public.notifications
for update
to authenticated
using (user_id = auth.uid() or public.is_superadmin())
with check (user_id = auth.uid() or public.is_superadmin());

drop policy if exists notifications_insert_superadmin on public.notifications;
create policy notifications_insert_superadmin
on public.notifications
for insert
to authenticated
with check (public.is_superadmin());

drop policy if exists cases_select_manager_or_assigned on public.cases;
create policy cases_select_manager_or_assigned
on public.cases
for select
to authenticated
using (public.can_access_case(id));

drop policy if exists cases_insert_manager on public.cases;
create policy cases_insert_manager
on public.cases
for insert
to authenticated
with check (
  public.is_approved()
  and public.current_profile_role() in ('superadmin', 'admin')
  and created_by = auth.uid()
  and coalesce(entered_by, auth.uid()) = auth.uid()
);

drop policy if exists cases_update_manager_or_assigned on public.cases;
create policy cases_update_manager_or_assigned
on public.cases
for update
to authenticated
using (public.can_access_case(id))
with check (public.can_access_case(id));

drop policy if exists cases_delete_superadmin on public.cases;
create policy cases_delete_superadmin
on public.cases
for delete
to authenticated
using (public.is_approved() and public.is_superadmin());

drop policy if exists case_access_select_self_or_managers on public.case_access;
create policy case_access_select_self_or_managers
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

drop policy if exists case_access_insert_manager_to_staff on public.case_access;
create policy case_access_insert_manager_to_staff
on public.case_access
for insert
to authenticated
with check (
  public.is_approved()
  and public.current_profile_role() in ('superadmin', 'admin')
  and granted_by = auth.uid()
  and exists (
    select 1
    from public.profiles target_profile
    where target_profile.id = case_access.user_id
      and target_profile.role = 'staff'
      and target_profile.status = 'approved'
  )
);

drop policy if exists case_access_delete_manager on public.case_access;
create policy case_access_delete_manager
on public.case_access
for delete
to authenticated
using (
  public.is_approved()
  and public.current_profile_role() in ('superadmin', 'admin')
);

drop policy if exists case_notes_select_accessible_case on public.case_notes;
create policy case_notes_select_accessible_case
on public.case_notes
for select
to authenticated
using (public.can_access_case(case_id));

drop policy if exists case_notes_insert_accessible_case on public.case_notes;
create policy case_notes_insert_accessible_case
on public.case_notes
for insert
to authenticated
with check (
  public.can_access_case(case_id)
  and coalesce(created_by, auth.uid()) = auth.uid()
);

drop policy if exists case_notes_update_author_or_superadmin on public.case_notes;
create policy case_notes_update_author_or_superadmin
on public.case_notes
for update
to authenticated
using (
  public.can_access_case(case_id)
  and (public.is_superadmin() or created_by = auth.uid())
)
with check (
  public.can_access_case(case_id)
  and (public.is_superadmin() or created_by = auth.uid())
);

drop policy if exists case_notes_delete_author_or_superadmin on public.case_notes;
create policy case_notes_delete_author_or_superadmin
on public.case_notes
for delete
to authenticated
using (
  public.can_access_case(case_id)
  and (public.is_superadmin() or created_by = auth.uid())
);

drop policy if exists case_tasks_select_accessible_case on public.case_tasks;
create policy case_tasks_select_accessible_case
on public.case_tasks
for select
to authenticated
using (public.can_access_case(case_id));

drop policy if exists case_tasks_insert_accessible_case on public.case_tasks;
create policy case_tasks_insert_accessible_case
on public.case_tasks
for insert
to authenticated
with check (
  public.can_access_case(case_id)
  and coalesce(created_by, auth.uid()) = auth.uid()
);

drop policy if exists case_tasks_update_assignee_creator_or_manager on public.case_tasks;
create policy case_tasks_update_assignee_creator_or_manager
on public.case_tasks
for update
to authenticated
using (
  public.can_access_case(case_id)
  and (
    public.current_profile_role() in ('superadmin', 'admin')
    or created_by = auth.uid()
    or assigned_to = auth.uid()
  )
)
with check (
  public.can_access_case(case_id)
  and (
    public.current_profile_role() in ('superadmin', 'admin')
    or created_by = auth.uid()
    or assigned_to = auth.uid()
  )
);

drop policy if exists case_tasks_delete_creator_or_manager on public.case_tasks;
create policy case_tasks_delete_creator_or_manager
on public.case_tasks
for delete
to authenticated
using (
  public.can_access_case(case_id)
  and (
    public.current_profile_role() in ('superadmin', 'admin')
    or created_by = auth.uid()
  )
);

drop policy if exists deadlines_select_accessible_case on public.deadlines;
create policy deadlines_select_accessible_case
on public.deadlines
for select
to authenticated
using (public.can_access_case(case_id));

drop policy if exists deadlines_insert_accessible_case on public.deadlines;
create policy deadlines_insert_accessible_case
on public.deadlines
for insert
to authenticated
with check (
  public.can_access_case(case_id)
  and coalesce(created_by, auth.uid()) = auth.uid()
);

drop policy if exists deadlines_update_accessible_case on public.deadlines;
create policy deadlines_update_accessible_case
on public.deadlines
for update
to authenticated
using (public.can_access_case(case_id))
with check (public.can_access_case(case_id));

drop policy if exists deadlines_delete_creator_or_superadmin on public.deadlines;
create policy deadlines_delete_creator_or_superadmin
on public.deadlines
for delete
to authenticated
using (
  public.can_access_case(case_id)
  and (public.is_superadmin() or created_by = auth.uid())
);

drop policy if exists advisory_select_approved on public.advisory_requests;
create policy advisory_select_approved
on public.advisory_requests
for select
to authenticated
using (public.is_approved());

drop policy if exists advisory_insert_approved on public.advisory_requests;
create policy advisory_insert_approved
on public.advisory_requests
for insert
to authenticated
with check (public.is_approved() and created_by = auth.uid());

drop policy if exists advisory_update_manager_or_creator on public.advisory_requests;
create policy advisory_update_manager_or_creator
on public.advisory_requests
for update
to authenticated
using (
  public.is_approved()
  and (
    created_by = auth.uid()
    or public.current_profile_role() in ('superadmin', 'admin')
  )
)
with check (
  public.is_approved()
  and (
    created_by = auth.uid()
    or public.current_profile_role() in ('superadmin', 'admin')
  )
);

drop policy if exists advisory_delete_managers on public.advisory_requests;
create policy advisory_delete_managers
on public.advisory_requests
for delete
to authenticated
using (
  public.is_approved()
  and public.current_profile_role() in ('superadmin', 'admin')
);

drop policy if exists documents_select_accessible_case on public.documents;
create policy documents_select_accessible_case
on public.documents
for select
to authenticated
using (
  public.is_approved()
  and (
    public.current_profile_role() in ('superadmin', 'admin')
    or (case_id is not null and public.can_access_case(case_id))
    or (
      case_id is null
      and (
        created_by = auth.uid()
        or entered_by = auth.uid()
      )
    )
  )
);

drop policy if exists documents_insert_accessible_case on public.documents;
create policy documents_insert_accessible_case
on public.documents
for insert
to authenticated
with check (
  public.is_approved()
  and created_by = auth.uid()
  and coalesce(entered_by, auth.uid()) = auth.uid()
  and (case_id is null or public.can_access_case(case_id))
);

drop policy if exists documents_delete_superadmin_or_owner on public.documents;
create policy documents_delete_superadmin_or_owner
on public.documents
for delete
to authenticated
using (
  public.is_approved()
  and (
    public.is_superadmin()
    or created_by = auth.uid()
    or entered_by = auth.uid()
  )
);

drop policy if exists audit_logs_select_superadmin_or_accessible_case on public.audit_logs;
create policy audit_logs_select_superadmin_or_accessible_case
on public.audit_logs
for select
to authenticated
using (
  public.is_approved()
  and (
    public.is_superadmin()
    or (
      target_id is not null
      and public.can_access_case(target_id)
    )
  )
);

drop policy if exists audit_logs_insert_approved on public.audit_logs;
create policy audit_logs_insert_approved
on public.audit_logs
for insert
to authenticated
with check (public.is_approved() and performed_by = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'case-documents',
  'case-documents',
  false,
  52428800,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'image/png',
    'image/jpeg'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists case_documents_select_accessible_case on storage.objects;
create policy case_documents_select_accessible_case
on storage.objects
for select
to authenticated
using (
  bucket_id = 'case-documents'
  and public.is_approved()
  and (
    public.current_profile_role() in ('superadmin', 'admin')
    or exists (
      select 1
      from public.documents d
      where d.storage_path = storage.objects.name
        and (
          (d.case_id is not null and public.can_access_case(d.case_id))
          or (
            d.case_id is null
            and (
              d.created_by = auth.uid()
              or d.entered_by = auth.uid()
            )
          )
        )
    )
    or (
      split_part(name, '/', 1) = auth.uid()::text
      and not exists (
        select 1
        from public.documents d
        where d.storage_path = storage.objects.name
      )
    )
  )
);

drop policy if exists case_documents_insert_owner on storage.objects;
create policy case_documents_insert_owner
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'case-documents'
  and public.is_approved()
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists case_documents_update_owner on storage.objects;
create policy case_documents_update_owner
on storage.objects
for update
to authenticated
using (
  bucket_id = 'case-documents'
  and public.is_approved()
  and (
    public.is_superadmin()
    or split_part(name, '/', 1) = auth.uid()::text
  )
)
with check (
  bucket_id = 'case-documents'
  and public.is_approved()
  and (
    public.is_superadmin()
    or split_part(name, '/', 1) = auth.uid()::text
  )
);

drop policy if exists case_documents_delete_owner_or_superadmin on storage.objects;
create policy case_documents_delete_owner_or_superadmin
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'case-documents'
  and public.is_approved()
  and (
    public.is_superadmin()
    or split_part(name, '/', 1) = auth.uid()::text
  )
);

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

do $$
declare
  table_name text;
  table_names text[] := array[
    'profiles',
    'notifications',
    'cases',
    'case_access',
    'case_notes',
    'case_tasks',
    'deadlines',
    'documents',
    'audit_logs'
  ];
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach table_name in array table_names loop
      if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = table_name
      ) then
        execute format('alter publication supabase_realtime add table public.%I', table_name);
      end if;
    end loop;
  end if;
end $$;

-- Bootstrap your first superadmin after creating/signing up the first user:
-- update public.profiles
-- set role = 'superadmin', status = 'approved'
-- where email = 'your-email@example.com';
