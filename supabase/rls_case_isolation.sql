-- LOMS per-user account isolation verification/update script.
-- Run in the Supabase SQL editor with an owner/admin connection.

-- Your current project migrations predate some LOMS tables used by the
-- isolation/progress features, so this section adds missing support objects
-- idempotently. Existing tables/columns are left untouched.
alter table public.cases
  add column if not exists assigned_to uuid references auth.users(id) on delete set null,
  add column if not exists status text not null default 'open',
  add column if not exists updated_at timestamptz not null default now();

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

create index if not exists cases_assigned_to_idx on public.cases(assigned_to);
create index if not exists cases_updated_at_idx on public.cases(updated_at);
create index if not exists case_access_case_user_idx on public.case_access(case_id, user_id);
create index if not exists case_notes_case_id_idx on public.case_notes(case_id);
create index if not exists deadlines_case_due_idx on public.deadlines(case_id, due_date);

alter table public.cases enable row level security;
alter table public.documents enable row level security;
alter table public.case_notes enable row level security;
alter table public.deadlines enable row level security;
alter table public.case_access enable row level security;

alter table public.cases force row level security;
alter table public.documents force row level security;
alter table public.case_notes force row level security;
alter table public.deadlines force row level security;
alter table public.case_access force row level security;

drop policy if exists user_case_isolation on public.cases;
create policy user_case_isolation on public.cases
for select
to authenticated
using (
  public.current_profile_role() in ('superadmin', 'admin')
  or assigned_to = auth.uid()
  or created_by = auth.uid()
  or exists (
    select 1 from public.case_access
    where case_access.case_id = cases.id
      and case_access.user_id = auth.uid()
  )
);

drop policy if exists user_document_case_isolation on public.documents;
create policy user_document_case_isolation on public.documents
for select
to authenticated
using (
  exists (
    select 1 from public.cases
    where cases.id = documents.case_id
      and (
        public.current_profile_role() in ('superadmin', 'admin')
        or cases.assigned_to = auth.uid()
        or cases.created_by = auth.uid()
        or exists (
          select 1 from public.case_access
          where case_access.case_id = cases.id
            and case_access.user_id = auth.uid()
        )
      )
  )
);

drop policy if exists user_case_note_isolation on public.case_notes;
create policy user_case_note_isolation on public.case_notes
for select
to authenticated
using (
  exists (
    select 1 from public.cases
    where cases.id = case_notes.case_id
      and (
        public.current_profile_role() in ('superadmin', 'admin')
        or cases.assigned_to = auth.uid()
        or cases.created_by = auth.uid()
        or exists (
          select 1 from public.case_access
          where case_access.case_id = cases.id
            and case_access.user_id = auth.uid()
        )
      )
  )
);

drop policy if exists user_case_note_insert_for_accessible_case on public.case_notes;
create policy user_case_note_insert_for_accessible_case on public.case_notes
for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.cases
    where cases.id = case_notes.case_id
      and (
        public.current_profile_role() in ('superadmin', 'admin')
        or cases.assigned_to = auth.uid()
        or cases.created_by = auth.uid()
        or exists (
          select 1 from public.case_access
          where case_access.case_id = cases.id
            and case_access.user_id = auth.uid()
        )
      )
  )
);

drop policy if exists user_deadline_case_isolation on public.deadlines;
create policy user_deadline_case_isolation on public.deadlines
for select
to authenticated
using (
  exists (
    select 1 from public.cases
    where cases.id = deadlines.case_id
      and (
        public.current_profile_role() in ('superadmin', 'admin')
        or cases.assigned_to = auth.uid()
        or cases.created_by = auth.uid()
        or exists (
          select 1 from public.case_access
          where case_access.case_id = cases.id
            and case_access.user_id = auth.uid()
        )
      )
  )
);

drop policy if exists user_case_access_self_or_admin on public.case_access;
create policy user_case_access_self_or_admin on public.case_access
for select
to authenticated
using (
  user_id = auth.uid()
  or public.current_profile_role() in ('superadmin', 'admin')
);
