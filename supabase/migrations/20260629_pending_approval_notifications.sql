-- Keep superadmin approval notifications aligned with pending profiles.
-- Also ensure admins can see approved legal user profiles, including legacy
-- rows that still use the old legal_officer role name.

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
    and public.current_profile_role()::text = 'admin'
    and role::text in ('staff', 'legal_officer')
    and status::text = 'approved'
  )
);

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

drop trigger if exists on_profile_created_notify_superadmins on public.profiles;
drop trigger if exists on_profile_pending_notify_superadmins on public.profiles;

create trigger on_profile_pending_notify_superadmins
after insert or update of status on public.profiles
for each row
when (new.status::text = 'pending')
execute function public.notify_superadmins_new_profile();
