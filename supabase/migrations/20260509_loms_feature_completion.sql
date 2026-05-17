-- Run this in Supabase SQL Editor after 20260502_supabase_only_backend.sql.
-- Adds the remaining app-backed tables used by advisory, document, and audit screens.

alter table public.audit_logs
  add column if not exists resource text,
  add column if not exists details text;

create table if not exists public.advisory_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  requested_by text not null,
  department text not null,
  due_date date,
  status text not null default 'Pending'
    check (status in ('Pending', 'In Progress', 'Completed', 'Urgent')),
  assigned_to text,
  priority text not null default 'Medium'
    check (priority in ('Low', 'Medium', 'High', 'Critical')),
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null
    check (type in ('MoU', 'Court Process', 'Legal Opinion', 'Contract', 'Correspondence')),
  case_id uuid references public.cases(id) on delete set null,
  storage_path text,
  mime_type text,
  version text not null default '1.0',
  uploaded_by text not null,
  size text not null default '0 MB',
  status text not null default 'Final'
    check (status in ('Draft', 'Final', 'Archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.documents
  add column if not exists storage_path text,
  add column if not exists mime_type text;

alter table public.advisory_requests enable row level security;
alter table public.documents enable row level security;

drop policy if exists "advisory_select_approved" on public.advisory_requests;
create policy "advisory_select_approved"
on public.advisory_requests
for select
to authenticated
using (public.is_approved());

drop policy if exists "advisory_insert_approved" on public.advisory_requests;
create policy "advisory_insert_approved"
on public.advisory_requests
for insert
to authenticated
with check (public.is_approved() and created_by = auth.uid());

drop policy if exists "advisory_update_admin_or_creator" on public.advisory_requests;
create policy "advisory_update_admin_or_creator"
on public.advisory_requests
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

drop policy if exists "advisory_delete_admins" on public.advisory_requests;
create policy "advisory_delete_admins"
on public.advisory_requests
for delete
to authenticated
using (public.is_approved() and public.current_profile_role() in ('superadmin', 'admin'));

drop policy if exists "documents_select_approved" on public.documents;
create policy "documents_select_approved"
on public.documents
for select
to authenticated
using (public.is_approved());

drop policy if exists "documents_insert_approved" on public.documents;
create policy "documents_insert_approved"
on public.documents
for insert
to authenticated
with check (public.is_approved() and created_by = auth.uid());

drop policy if exists "documents_update_admin_or_creator" on public.documents;
create policy "documents_update_admin_or_creator"
on public.documents
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

drop policy if exists "documents_delete_admins" on public.documents;
create policy "documents_delete_admins"
on public.documents
for delete
to authenticated
using (public.is_approved() and public.current_profile_role() in ('superadmin', 'admin'));

create index if not exists advisory_requests_status_idx on public.advisory_requests(status);
create index if not exists advisory_requests_due_date_idx on public.advisory_requests(due_date);
create index if not exists documents_type_idx on public.documents(type);

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

drop policy if exists "case_documents_select_approved" on storage.objects;
create policy "case_documents_select_approved"
on storage.objects
for select
to authenticated
using (bucket_id = 'case-documents' and public.is_approved());

drop policy if exists "case_documents_insert_approved" on storage.objects;
create policy "case_documents_insert_approved"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'case-documents' and public.is_approved());

drop policy if exists "case_documents_update_approved" on storage.objects;
create policy "case_documents_update_approved"
on storage.objects
for update
to authenticated
using (bucket_id = 'case-documents' and public.is_approved())
with check (bucket_id = 'case-documents' and public.is_approved());

drop policy if exists "case_documents_delete_approved" on storage.objects;
create policy "case_documents_delete_approved"
on storage.objects
for delete
to authenticated
using (bucket_id = 'case-documents' and public.is_approved());

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
for each row
execute function public.handle_new_auth_user();
