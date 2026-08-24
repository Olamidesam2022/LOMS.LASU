# Legal Case Manager Supabase Notes

For a fresh Supabase project, run:

`supabase/legal_case_manager_fresh_setup.sql`

Paste it into **Supabase Dashboard > SQL Editor** and run it once. It is the consolidated schema for the current app.

## Values to swap when changing Supabase projects

Frontend `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Server/admin scripts or functions:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The frontend client is in `src/integrations/supabase/client.ts`; it already reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, so normally you do not edit code to change Supabase projects.

## First superadmin

After the first user signs up, approve and promote that profile:

```sql
update public.profiles
set role = 'superadmin', status = 'approved'
where email = 'your-email@example.com';
```

Or use:

```bash
SUPABASE_URL=https://your-project-ref.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
SUPERADMIN_EMAIL=you@example.com \
SUPERADMIN_PASSWORD="StrongPassword123!" \
SUPERADMIN_NAME="Your Name" \
node scripts/create-superadmin.js
```

## Important

The current app uses `profiles.role` with:

- `superadmin`
- `admin`
- `staff`

It does not use a separate role table.
