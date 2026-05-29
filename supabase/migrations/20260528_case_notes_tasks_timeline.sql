-- Add case notes, task assignment, and timeline support.
-- Superadmin can see all rows; other approved users see rows attached to cases
-- they created, entered, are assigned to, or were explicitly granted.

alter table public.cases
  add column if not exists entered_by uuid references auth.users(id) on delete set null,
  add column if not exists assigned_to uuid references auth.users(id) on delete set null,
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

create table if not exists public.case_tasks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'open',
  priority text not null default 'normal',
  due_date date,
  assigned_to uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists case_access_case_user_idx on public.case_access(case_id, user_id);
create index if not exists case_notes_case_created_idx on public.case_notes(case_id, created_at desc);
create index if not exists case_tasks_case_status_idx on public.case_tasks(case_id, status);
create index if not exists case_tasks_assigned_to_idx on public.case_tasks(assigned_to);
create index if not exists case_tasks_due_date_idx on public.case_tasks(due_date);

alter table public.case_access enable row level security;
alter table public.case_notes enable row level security;
alter table public.case_tasks enable row level security;

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
        public.is_superadmin()
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

drop policy if exists "case_access_select_self_or_superadmin" on public.case_access;
create policy "case_access_select_self_or_superadmin"
on public.case_access
for select
to authenticated
using (
  public.is_approved()
  and (public.is_superadmin() or user_id = auth.uid())
);

drop policy if exists "case_access_insert_superadmin" on public.case_access;
create policy "case_access_insert_superadmin"
on public.case_access
for insert
to authenticated
with check (public.is_approved() and public.is_superadmin());

drop policy if exists "case_notes_select_accessible_case" on public.case_notes;
create policy "case_notes_select_accessible_case"
on public.case_notes
for select
to authenticated
using (public.is_approved() and public.can_access_case(case_id));

drop policy if exists "case_notes_insert_accessible_case" on public.case_notes;
create policy "case_notes_insert_accessible_case"
on public.case_notes
for insert
to authenticated
with check (
  public.is_approved()
  and public.can_access_case(case_id)
  and coalesce(created_by, auth.uid()) = auth.uid()
);

drop policy if exists "case_notes_update_author_or_superadmin" on public.case_notes;
create policy "case_notes_update_author_or_superadmin"
on public.case_notes
for update
to authenticated
using (
  public.is_approved()
  and (public.is_superadmin() or created_by = auth.uid())
)
with check (
  public.is_approved()
  and public.can_access_case(case_id)
  and (public.is_superadmin() or created_by = auth.uid())
);

drop policy if exists "case_notes_delete_author_or_superadmin" on public.case_notes;
create policy "case_notes_delete_author_or_superadmin"
on public.case_notes
for delete
to authenticated
using (
  public.is_approved()
  and (public.is_superadmin() or created_by = auth.uid())
);

drop policy if exists "case_tasks_select_accessible_case" on public.case_tasks;
create policy "case_tasks_select_accessible_case"
on public.case_tasks
for select
to authenticated
using (public.is_approved() and public.can_access_case(case_id));

drop policy if exists "case_tasks_insert_accessible_case" on public.case_tasks;
create policy "case_tasks_insert_accessible_case"
on public.case_tasks
for insert
to authenticated
with check (
  public.is_approved()
  and public.can_access_case(case_id)
  and coalesce(created_by, auth.uid()) = auth.uid()
);

drop policy if exists "case_tasks_update_assignee_creator_or_superadmin" on public.case_tasks;
create policy "case_tasks_update_assignee_creator_or_superadmin"
on public.case_tasks
for update
to authenticated
using (
  public.is_approved()
  and (
    public.is_superadmin()
    or created_by = auth.uid()
    or assigned_to = auth.uid()
  )
)
with check (
  public.is_approved()
  and public.can_access_case(case_id)
  and (
    public.is_superadmin()
    or created_by = auth.uid()
    or assigned_to = auth.uid()
  )
);

drop policy if exists "case_tasks_delete_creator_or_superadmin" on public.case_tasks;
create policy "case_tasks_delete_creator_or_superadmin"
on public.case_tasks
for delete
to authenticated
using (
  public.is_approved()
  and (public.is_superadmin() or created_by = auth.uid())
);
