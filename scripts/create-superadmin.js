/*
 Node script to create a superadmin using the SUPABASE_SERVICE_ROLE_KEY.
 Usage:
  SUPABASE_URL=https://<project>.supabase.co SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/create-superadmin.js
*/
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, key);

async function run() {
  const email = process.env.SUPERADMIN_EMAIL || "superadmin@example.com";
  const password = process.env.SUPERADMIN_PASSWORD || "Supersecret123!";
  const fullName = process.env.SUPERADMIN_NAME || "Super Admin";

  try {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) {
      console.error("createUser error:", error);
      process.exit(1);
    }
    const userId = data.user.id;
    console.log("Created auth user", userId);

    const { error: pErr } = await admin
      .from("profiles")
      .insert({ user_id: userId, full_name: fullName, email });
    if (pErr) {
      console.error("profiles insert error:", pErr);
      await admin.auth.admin.deleteUser(userId);
      process.exit(1);
    }

    const { error: rErr } = await admin
      .from("user_roles")
      .insert({ user_id: userId, role: "superadmin" });
    if (rErr) {
      console.error("user_roles insert error:", rErr);
      await admin.auth.admin.deleteUser(userId);
      process.exit(1);
    }

    console.log("Superadmin created:", { userId, email });
  } catch (e) {
    console.error("unexpected", e);
    process.exit(1);
  }
}

run();
