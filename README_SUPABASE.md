Quick Supabase scaffold notes

1. Install Supabase CLI

```bash
npm install -g supabase
```

2. Initialize locally (recommended to run in your working copy):

```bash
supabase init
```

3. Link to your project (get project ref from dashboard):

```bash
supabase link --project-ref <your-project-ref>
```

4. Deploy functions and migrations when ready:

```bash
supabase db push              # apply migrations
supabase functions deploy <name>   # deploy functions
```

5. Environment variables used by this repo

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` — client-side
- `SUPABASE_SERVICE_ROLE_KEY` — server/admin usage (do not commit)
- `CREATE_USER_SECRET` — secret used by the `create-user` function (do not commit)
- `BOOTSTRAP_SECRET` — secret used by the `bootstrap-admin` function (temporary, do not commit)

Example `create-user` function notes

- The example function expects the service role key to be presented in the `Authorization` header exactly as:

```
Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
```

- To deploy the example function:

```bash
supabase functions deploy create-user --project-ref <your-project-ref>
```

- To apply the migration:

```bash
supabase db push --project-ref <your-project-ref>
```

- Example curl call to create a user (replace placeholders):

```bash
curl -X POST "https://<your-project>.functions.supabase.co/create-user" \
	-H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
	-H "Content-Type: application/json" \
	-d '{"email":"new@example.com","password":"password123","fullName":"New User","role":"admin"}'
```

Updated usage (recommended):

1. Deploy the `create-user` function and set an environment secret `CREATE_USER_SECRET` on the function (do NOT use the service role key directly as the public bearer token).

2. Call the function with the function secret in the Authorization header:

```bash
curl -X POST "https://<your-project>.functions.supabase.co/create-user" \
	-H "Authorization: Bearer $CREATE_USER_SECRET" \
	-H "Content-Type: application/json" \
	-d '{"email":"new@example.com","password":"password123","fullName":"New User","role":"admin"}'
```

Bootstrap superadmin locally (quick):

```bash
# install deps if needed
npm install @supabase/supabase-js

SUPABASE_URL=https://<project>.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
SUPERADMIN_EMAIL=me@example.com \
SUPERADMIN_PASSWORD="Supersecret123!" \
node scripts/create-superadmin.js
```

Or deploy the `bootstrap-admin` function and call it once with `BOOTSTRAP_SECRET` to create the initial `superadmin`.

Security note: Using the service role key as the direct auth for the function is simple for demos. For production, use a separate function-specific secret or verify the caller identity via a short-lived admin token and additional checks.
If you want, I can add a basic example migration and a sample `create-user` function next.
