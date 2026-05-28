-- Tighten case/document ownership and superadmin visibility.
-- Apply with Supabase migrations or paste into SQL editor.

alter table public.cases
  add column if not exists creator_email text,
  add column if not exists entered_by uuid references auth.users(id) on delete set null,
  add column if not exists assigned_to uuid references auth.users(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

alter table public.documents
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists entered_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists cases_entered_by_idx on public.cases(entered_by);
create index if not exists cases_assigned_to_idx on public.cases(assigned_to);
create index if not exists documents_created_by_idx on public.documents(created_by);
create index if not exists documents_entered_by_idx on public.documents(entered_by);

drop policy if exists "cases_select_approved" on public.cases;
drop policy if exists "cases_select_role_or_owner" on public.cases;
create policy "cases_select_role_or_owner"
on public.cases
for select
to authenticated
using (
  public.is_approved()
  and (
    public.is_superadmin()
    or created_by = auth.uid()
    or entered_by = auth.uid()
    or assigned_to = auth.uid()
  )
);

drop policy if exists "cases_update_admin_or_creator" on public.cases;
drop policy if exists "cases_update_superadmin_or_owner" on public.cases;
create policy "cases_update_superadmin_or_owner"
on public.cases
for update
to authenticated
using (
  public.is_approved()
  and (
    public.is_superadmin()
    or created_by = auth.uid()
    or entered_by = auth.uid()
  )
)
with check (
  public.is_approved()
  and (
    public.is_superadmin()
    or created_by = auth.uid()
    or entered_by = auth.uid()
  )
);

drop policy if exists "cases_delete_admins" on public.cases;
drop policy if exists "cases_delete_superadmin_or_owner" on public.cases;
create policy "cases_delete_superadmin_or_owner"
on public.cases
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

drop policy if exists "documents_select_role_or_owner" on public.documents;
create policy "documents_select_role_or_owner"
on public.documents
for select
to authenticated
using (
  public.is_approved()
  and (
    public.is_superadmin()
    or created_by = auth.uid()
    or entered_by = auth.uid()
    or exists (
      select 1
      from public.cases
      where cases.id = documents.case_id
        and (
          cases.created_by = auth.uid()
          or cases.entered_by = auth.uid()
          or cases.assigned_to = auth.uid()
        )
    )
  )
);

drop policy if exists "documents_insert_owner" on public.documents;
create policy "documents_insert_owner"
on public.documents
for insert
to authenticated
with check (
  public.is_approved()
  and created_by = auth.uid()
  and coalesce(entered_by, auth.uid()) = auth.uid()
);

drop policy if exists "documents_delete_superadmin_or_owner" on public.documents;
create policy "documents_delete_superadmin_or_owner"
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
