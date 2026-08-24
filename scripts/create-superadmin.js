/*
 Node script to create a superadmin using the SUPABASE_SERVICE_ROLE_KEY.
 Usage:
  SUPABASE_URL=https://<project>.supabase.co SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/create-superadmin.js
*/
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

function loadEnvFile(path) {
  if (!existsSync(path)) return;

  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;

    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;

    const [, name, rawValue] = match;
    if (process.env[name]) continue;

    process.env[name] = rawValue.replace(/^(['"])(.*)\1$/, "$2");
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, key);

async function findUserByEmail(email) {
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const user = data.users.find(
      (candidate) => candidate.email?.toLowerCase() === email.toLowerCase(),
    );
    if (user) return user;

    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function run() {
  const email = process.env.SUPERADMIN_EMAIL || "superadmin@example.com";
  const password = process.env.SUPERADMIN_PASSWORD || "Supersecret123!";
  const fullName = process.env.SUPERADMIN_NAME || "Super Admin";

  try {
    let userId;

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error) {
      const existingUser = await findUserByEmail(email);
      if (!existingUser) {
        console.error("createUser error:", error);
        process.exit(1);
      }

      userId = existingUser.id;
      const { error: updateError } = await admin.auth.admin.updateUserById(
        userId,
        {
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        },
      );
      if (updateError) {
        console.error("updateUser error:", updateError);
        process.exit(1);
      }

      console.log("Updated existing auth user", userId);
    } else {
      userId = data.user.id;
      console.log("Created auth user", userId);
    }

    const { error: pErr } = await admin.from("profiles").upsert({
      id: userId,
      full_name: fullName,
      email,
      role: "superadmin",
      status: "approved",
    });
    if (pErr) {
      console.error("profiles upsert error:", pErr);
      process.exit(1);
    }

    console.log("Superadmin ready:", { userId, email });
  } catch (e) {
    console.error("unexpected", e);
    process.exit(1);
  }
}

run();
