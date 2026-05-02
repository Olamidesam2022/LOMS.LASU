import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// This endpoint creates a single superadmin user. Protect it (e.g. remove after use).
serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const secret = Deno.env.get("BOOTSTRAP_SECRET");
    const authHeader = req.headers.get("authorization") || "";
    if (!secret || authHeader !== `Bearer ${secret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { email, password, fullName } = body || {};
    if (!email || !password || !fullName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY",
    )!;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing SUPABASE env vars" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // create auth user
    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
    if (createErr || !created)
      return new Response(
        JSON.stringify({
          error: "Failed to create auth user",
          debug: createErr,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );

    const userId = created.user.id;

    // Insert profile
    const { error: profileErr } = await admin
      .from("profiles")
      .insert({ user_id: userId, full_name: fullName, email });
    if (profileErr) {
      await admin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({
          error: "Failed to insert profile",
          debug: profileErr,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Insert role
    const { error: roleErr } = await admin
      .from("user_roles")
      .insert({ user_id: userId, role: "superadmin" });
    if (roleErr) {
      await admin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: "Failed to insert role", debug: roleErr }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ success: true, id: userId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("bootstrap unexpected", err);
    return new Response(
      JSON.stringify({ error: "Internal error", debug: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
