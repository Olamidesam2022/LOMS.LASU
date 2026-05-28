-- Mock data for every existing account.
-- Run in Supabase SQL Editor after the schema/RLS migrations.
-- This script is safe to re-run: it removes only rows tagged with this seed marker.

do $$
begin
  if to_regclass('public.profiles') is null then
    raise exception 'public.profiles does not exist. Run the app migrations first.';
  end if;
end $$;

delete from public.audit_logs
where details like '%[seed:all-accounts-mock-v1]%';

delete from public.advisory_requests
where description like '%[seed:all-accounts-mock-v1]%';

delete from public.documents
where storage_path like 'mock/%'
   or name like 'Mock %';

delete from public.deadlines
where title like 'Mock %';

delete from public.case_notes
where content like '%[seed:all-accounts-mock-v1]%';

delete from public.cases
where description like '%seed:all-accounts-mock-v1%';

with accounts as (
  select
    id,
    email,
    full_name,
    role,
    row_number() over (order by created_at, email) as account_no
  from public.profiles
  where status = 'approved'
),
case_templates as (
  select * from (values
    (1, 'Contract Enforcement Review', 'Mention', 'Active', 'High', 'High Court of Lagos State', 7),
    (2, 'Employment Disciplinary Appeal', 'Trial', 'In Progress', 'Medium', 'National Industrial Court', 14),
    (3, 'Property Documentation Dispute', 'Interlocutory', 'Pending', 'Low', 'Lagos State Magistrate Court', 21)
  ) as t(case_no, title, stage, status, priority, court, days_offset)
),
inserted_cases as (
  insert into public.cases (
    title,
    description,
    created_by,
    creator_email,
    entered_by,
    assigned_to,
    status,
    created_at,
    updated_at
  )
  select
    'Mock ' || a.full_name || ' - ' || ct.title,
    json_build_object(
      'seed', 'seed:all-accounts-mock-v1',
      'description', 'Mock case owned by ' || a.full_name || ' for authorization and UI testing. [seed:all-accounts-mock-v1]',
      'suitNumber', 'LASU-MOCK-' || lpad(a.account_no::text, 3, '0') || '-' || lpad(ct.case_no::text, 2, '0'),
      'adversaryParty', 'Mock Opposing Party ' || a.account_no || '-' || ct.case_no,
      'proceduralStage', ct.stage,
      'assignedCounsel', a.full_name,
      'court', ct.court,
      'nextHearing', (current_date + (ct.days_offset || ' days')::interval)::date,
      'filingDeadline', (current_date + ((ct.days_offset - 2) || ' days')::interval)::date,
      'status', ct.status,
      'priority', ct.priority,
      'enteredBy', a.id,
      'creatorEmail', a.email
    )::text,
    a.id,
    a.email,
    a.id,
    a.id,
    lower(replace(ct.status, ' ', '_')),
    now() - ((a.account_no + ct.case_no) || ' days')::interval,
    now()
  from accounts a
  cross join case_templates ct
  returning id, title, created_by
),
inserted_documents as (
  insert into public.documents (
    name,
    type,
    case_id,
    storage_path,
    mime_type,
    version,
    uploaded_by,
    size,
    status,
    created_by,
    entered_by,
    created_at,
    updated_at
  )
  select
    'Mock ' || split_part(c.title, ' - ', 2) || ' Brief',
    case
      when row_number() over (partition by c.created_by order by c.title) = 1 then 'Court Process'
      when row_number() over (partition by c.created_by order by c.title) = 2 then 'Legal Opinion'
      else 'Correspondence'
    end,
    c.id,
    'mock/' || c.created_by || '/' || c.id || '-brief.txt',
    'text/plain',
    '1.0',
    p.full_name,
    '0.08 MB',
    'Final',
    c.created_by,
    c.created_by,
    now(),
    now()
  from inserted_cases c
  join public.profiles p on p.id = c.created_by
  returning id, created_by, name
),
inserted_notes as (
  insert into public.case_notes (
    case_id,
    content,
    created_by,
    user_id,
    is_private,
    note_type,
    created_at
  )
  select
    c.id,
    'Initial mock progress note for "' || c.title || '". [seed:all-accounts-mock-v1]',
    c.created_by,
    c.created_by,
    false,
    'note',
    now()
  from inserted_cases c
  returning id
),
inserted_deadlines as (
  insert into public.deadlines (
    case_id,
    title,
    due_date,
    status,
    created_by,
    created_at,
    updated_at
  )
  select
    c.id,
    'Mock filing deadline - ' || split_part(c.title, ' - ', 2),
    current_date + ((row_number() over (partition by c.created_by order by c.title) * 5) || ' days')::interval,
    'open',
    c.created_by,
    now(),
    now()
  from inserted_cases c
  returning id
),
inserted_advisory as (
  insert into public.advisory_requests (
    title,
    requested_by,
    department,
    due_date,
    status,
    assigned_to,
    priority,
    description,
    created_by,
    created_at
  )
  select
    'Mock advisory request for ' || a.full_name,
    a.full_name,
    'Legal Unit',
    current_date + ((a.account_no + 4) || ' days')::interval,
    case
      when a.account_no % 4 = 0 then 'Urgent'
      when a.account_no % 3 = 0 then 'In Progress'
      when a.account_no % 2 = 0 then 'Pending'
      else 'Completed'
    end,
    a.full_name,
    case
      when a.account_no % 4 = 0 then 'Critical'
      when a.account_no % 3 = 0 then 'High'
      when a.account_no % 2 = 0 then 'Medium'
      else 'Low'
    end,
    'Mock advisory workflow item owned by ' || a.full_name || '. [seed:all-accounts-mock-v1]',
    a.id,
    now()
  from accounts a
  returning id, title, created_by
)
insert into public.audit_logs (
  action,
  performed_by,
  target_id,
  resource,
  details,
  created_at
)
select
  'CREATE',
  c.created_by,
  c.id,
  'Case',
  'Seeded mock case for account-specific testing. [seed:all-accounts-mock-v1]',
  now()
from inserted_cases c
union all
select
  'CREATE',
  d.created_by,
  d.id,
  'Document',
  'Seeded mock document "' || d.name || '". [seed:all-accounts-mock-v1]',
  now()
from inserted_documents d
union all
select
  'CREATE',
  a.created_by,
  a.id,
  'Advisory',
  'Seeded mock advisory "' || a.title || '". [seed:all-accounts-mock-v1]',
  now()
from inserted_advisory a;
