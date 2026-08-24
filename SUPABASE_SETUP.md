# Supabase Setup

Use this guide for a fresh Supabase project for Legal Case Manager.

## 1. Create or choose a Supabase project

In the Supabase dashboard, open your project and copy:

- Project URL
- Project API `anon public` key
- Project API `service_role` key, only for server/admin scripts

## 2. Run the fresh SQL setup

Open **Supabase Dashboard > SQL Editor**, paste the full contents of:

`supabase/legal_case_manager_fresh_setup.sql`

Then click **Run**.

This creates the current app schema:

- `profiles`
- `notifications`
- `cases`
- `case_access`
- `case_notes`
- `case_tasks`
- `deadlines`
- `advisory_requests`
- `documents`
- `audit_logs`
- private storage bucket `case-documents`

The older files in `supabase/migrations/` are historical incremental migrations. For a new project, use the consolidated file above.

## 3. Swap the frontend environment variables

Edit `.env.local` in the project root:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

These are read by `src/integrations/supabase/client.ts`.

Restart the dev server after changing `.env.local`.

## 4. Create the first superadmin

Option A: sign up normally in the app, then run this in Supabase SQL Editor:

```sql
update public.profiles
set role = 'superadmin', status = 'approved'
where email = 'your-email@example.com';
```

Option B: use the helper script with your new project keys:

```bash
SUPABASE_URL=https://your-project-ref.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
SUPERADMIN_EMAIL=you@example.com \
SUPERADMIN_PASSWORD="StrongPassword123!" \
SUPERADMIN_NAME="Your Name" \
node scripts/create-superadmin.js
```

Do not commit service-role keys.

## 5. Optional Edge Functions

If you deploy the Supabase functions, set these Supabase function secrets:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CREATE_USER_SECRET`
- `BOOTSTRAP_SECRET`

Deploy only the functions you intend to use.
