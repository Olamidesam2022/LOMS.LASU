-- Optional test data for verification.
-- Run this in Supabase SQL Editor after creating/approving superadmin@lasu.edu.ng.

with actor as (
  select id from public.profiles
  where email = 'superadmin@lasu.edu.ng'
  limit 1
),
case_insert as (
  insert into public.cases (title, description, created_by)
  select
    'LASU v. Sample Contractor',
    json_build_object(
      'description', 'Seed test case used to verify create, view, edit, delete, dashboard, and calendar flows.',
      'suitNumber', 'LASU-LU-2026-0001',
      'adversaryParty', 'Sample Contractor Ltd',
      'proceduralStage', 'Mention',
      'assignedCounsel', 'Ade Ademide',
      'court', 'High Court of Lagos State',
      'nextHearing', (current_date + interval '2 days')::date
    )::text,
    actor.id
  from actor
  returning id
)
insert into public.audit_logs (action, performed_by, target_id, resource, details)
select 'CREATE', actor.id, case_insert.id, 'Case', 'Seeded test case for LOMS verification'
from actor, case_insert;

insert into public.advisory_requests (
  title, requested_by, department, due_date, status, assigned_to, priority, description, created_by
)
select
  'Review proposed partnership MoU',
  'Vice Chancellor Office',
  'Executive',
  current_date + interval '5 days',
  'Pending',
  'Ade Ademide',
  'High',
  'Seed test advisory request for workflow verification.',
  id
from public.profiles
where email = 'superadmin@lasu.edu.ng'
limit 1;

insert into public.documents (
  name, type, storage_path, mime_type, version, uploaded_by, size, status, created_by
)
select
  'Seed Contract Review Memo',
  'Legal Opinion',
  null,
  'text/plain',
  '1.0',
  full_name,
  '0.12 MB',
  'Final',
  id
from public.profiles
where email = 'superadmin@lasu.edu.ng'
limit 1;
