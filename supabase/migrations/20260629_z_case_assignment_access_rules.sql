-- Enforce case assignment rules for legal users.
-- Legal/staff users can view and edit only cases assigned to them.
-- Admin and superadmin can create cases; admin and superadmin can assign cases.
-- Superadmin keeps full data access without a shared-password backdoor.

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
    and status::text = 'approved'
  )
);

drop policy if exists "profiles_update_superadmin" on public.profiles;
create policy "profiles_update_superadmin"
on public.profiles
for update
to authenticated
using (public.is_superadmin())
with check (public.is_superadmin());

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

create or replace function public.enforce_case_staff_update_scope()
returns trigger
language plpgsql
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

  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists enforce_case_staff_update_scope on public.cases;
create trigger enforce_case_staff_update_scope
before update on public.cases
for each row
execute function public.enforce_case_staff_update_scope();

drop policy if exists "cases_select_approved" on public.cases;
drop policy if exists "cases_select_role_or_owner" on public.cases;
drop policy if exists "cases_select_role_or_assignee" on public.cases;
drop policy if exists "cases_select_manager_or_assigned" on public.cases;
drop policy if exists user_case_isolation on public.cases;
create policy "cases_select_manager_or_assigned"
on public.cases
for select
to authenticated
using (public.can_access_case(id));

drop policy if exists "cases_insert_approved" on public.cases;
drop policy if exists "cases_insert_manager" on public.cases;
create policy "cases_insert_manager"
on public.cases
for insert
to authenticated
with check (
  public.is_approved()
  and public.current_profile_role() in ('superadmin', 'admin')
  and created_by = auth.uid()
  and coalesce(entered_by, auth.uid()) = auth.uid()
);

drop policy if exists "cases_update_admin_or_creator" on public.cases;
drop policy if exists "cases_update_superadmin_or_owner" on public.cases;
drop policy if exists "cases_update_manager_or_owner" on public.cases;
drop policy if exists "cases_update_manager_or_assigned" on public.cases;
create policy "cases_update_manager_or_assigned"
on public.cases
for update
to authenticated
using (public.can_access_case(id))
with check (public.can_access_case(id));

drop policy if exists "cases_delete_admins" on public.cases;
drop policy if exists "cases_delete_superadmin_or_owner" on public.cases;
drop policy if exists "cases_delete_superadmin" on public.cases;
create policy "cases_delete_superadmin"
on public.cases
for delete
to authenticated
using (public.is_approved() and public.is_superadmin());

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
drop policy if exists "case_access_insert_manager_to_staff" on public.case_access;
create policy "case_access_insert_manager_to_staff"
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
      and target_profile.role::text in ('staff', 'legal_officer')
      and target_profile.status::text = 'approved'
  )
);

drop policy if exists "case_access_delete_admin" on public.case_access;
drop policy if exists "case_access_delete_manager" on public.case_access;
create policy "case_access_delete_manager"
on public.case_access
for delete
to authenticated
using (
  public.is_approved()
  and public.current_profile_role() in ('superadmin', 'admin')
);

drop policy if exists "documents_select_approved" on public.documents;
drop policy if exists "documents_select_role_or_owner" on public.documents;
drop policy if exists "documents_select_accessible_case" on public.documents;
drop policy if exists user_document_case_isolation on public.documents;
create policy "documents_select_accessible_case"
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

drop policy if exists "documents_insert_approved" on public.documents;
drop policy if exists "documents_insert_owner" on public.documents;
drop policy if exists "documents_insert_accessible_case" on public.documents;
create policy "documents_insert_accessible_case"
on public.documents
for insert
to authenticated
with check (
  public.is_approved()
  and created_by = auth.uid()
  and coalesce(entered_by, auth.uid()) = auth.uid()
  and (case_id is null or public.can_access_case(case_id))
);

drop policy if exists "documents_update_admin_or_creator" on public.documents;

drop policy if exists "documents_delete_admins" on public.documents;
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

drop policy if exists "audit_logs_select_superadmin" on public.audit_logs;
drop policy if exists "audit_logs_select_superadmin_or_accessible_case" on public.audit_logs;
create policy "audit_logs_select_superadmin_or_accessible_case"
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

drop policy if exists "case_documents_select_approved" on storage.objects;
drop policy if exists "case_documents_select_accessible_case" on storage.objects;
create policy "case_documents_select_accessible_case"
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

drop policy if exists "case_documents_insert_approved" on storage.objects;
drop policy if exists "case_documents_insert_owner" on storage.objects;
create policy "case_documents_insert_owner"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'case-documents'
  and public.is_approved()
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "case_documents_update_approved" on storage.objects;
drop policy if exists "case_documents_update_owner" on storage.objects;
create policy "case_documents_update_owner"
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

drop policy if exists "case_documents_delete_approved" on storage.objects;
drop policy if exists "case_documents_delete_owner_or_superadmin" on storage.objects;
create policy "case_documents_delete_owner_or_superadmin"
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

do $$
begin
  if to_regclass('public.deadlines') is not null then
    drop policy if exists user_deadline_case_isolation on public.deadlines;
    drop policy if exists "deadlines_select_accessible_case" on public.deadlines;
    create policy "deadlines_select_accessible_case"
    on public.deadlines
    for select
    to authenticated
    using (public.is_approved() and public.can_access_case(case_id));

    drop policy if exists "deadlines_insert_accessible_case" on public.deadlines;
    create policy "deadlines_insert_accessible_case"
    on public.deadlines
    for insert
    to authenticated
    with check (
      public.is_approved()
      and public.can_access_case(case_id)
      and coalesce(created_by, auth.uid()) = auth.uid()
    );

    drop policy if exists "deadlines_update_accessible_case" on public.deadlines;
    create policy "deadlines_update_accessible_case"
    on public.deadlines
    for update
    to authenticated
    using (public.is_approved() and public.can_access_case(case_id))
    with check (public.is_approved() and public.can_access_case(case_id));

    drop policy if exists "deadlines_delete_creator_or_superadmin" on public.deadlines;
    create policy "deadlines_delete_creator_or_superadmin"
    on public.deadlines
    for delete
    to authenticated
    using (
      public.is_approved()
      and (
        public.is_superadmin()
        or created_by = auth.uid()
      )
    );
  end if;
end $$;
