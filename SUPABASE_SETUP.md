# Supabase Setup

## 1. Run SQL in Supabase

Open your Supabase project, go to **SQL Editor**, paste the full contents of:

`supabase/migrations/20260502_supabase_only_backend.sql`

Then click **Run**.

## 2. Add Vite environment variables

Create `.env.local` in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Create the first superadmin

Start the app, sign up normally, then go back to Supabase **SQL Editor** and run:

```sql
update public.profiles
set role = 'superadmin', status = 'approved'
where email = 'your-email@example.com';
```

Replace `your-email@example.com` with the email you used to sign up.

## Example Supabase Queries

Signup is handled in `src/context/AuthContext.tsx`:

```ts
await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
await supabase.from("profiles").upsert({
  id: user.id,
  email,
  full_name: fullName,
  role: "staff", // or "admin" when selected during signup
  status: "pending",
});
```

Approve user:

```ts
await supabase.from("profiles").update({ status: "approved" }).eq("id", userId);
```

Promote admin:

```ts
await supabase.from("profiles").update({ role: "admin" }).eq("id", userId);
```

Fetch notifications:

```ts
const { data } = await supabase
  .from("notifications")
  .select("*")
  .order("created_at", { ascending: false });
```

Mark notification as read:

```ts
await supabase.from("notifications").update({ read: true }).eq("id", notificationId);
```

Create case:

```ts
await supabase.from("cases").insert({
  title,
  description,
  created_by: user.id,
});
```

## Files Changed

Created:

- `src/context/AuthContext.tsx`
- `src/hooks/useCases.ts`
- `src/hooks/useNotifications.ts`
- `src/hooks/useProfiles.ts`
- `supabase/migrations/20260502_supabase_only_backend.sql`
- `SUPABASE_SETUP.md`

Replaced:

- `src/integrations/supabase/client.ts`
- `src/contexts/AuthContext.tsx`
- `src/pages/SignUp.tsx`
- `src/components/layout/Header.tsx`

Updated:

- `src/pages/Index.tsx`
- `src/components/dialogs/AddCaseDialog.tsx`
- `src/components/dialogs/AddUserDialog.tsx`
- `src/components/dashboard/Dashboard.tsx`
- `src/components/users/UserManagement.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/types/legal.ts`

Delete after confirming:

- `supabase/functions/`
- `scripts/create-superadmin.js`
- `src/data/mockData.ts`
