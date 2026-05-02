import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  role: "admin" | "legal_officer" | "superadmin";
  department?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Protection: require the caller to present a function-specific secret
    // Set `CREATE_USER_SECRET` in the function's environment (do NOT commit the secret).
    const authHeader = req.headers.get("authorization") || "";
    const expected = `Bearer ${Deno.env.get("CREATE_USER_SECRET")}`;
    if (!Deno.env.get("CREATE_USER_SECRET") || authHeader !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({
          error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    const admin = createClient(supabaseUrl, supabaseKey);

    const body: CreateUserRequest = await req.json();
    const { email, password, fullName, role, department } = body;

    if (!email || !password || !fullName || !role) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create auth user
    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (createErr || !created) {
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
    }

    const userId = created.user.id;

    // Insert profile
    const { error: profileErr } = await admin.from("profiles").insert({
      user_id: userId,
      full_name: fullName,
      email: email,
      department: department || null,
    });

    if (profileErr) {
      // rollback auth user
      await admin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({
          error: "Failed to create profile",
          debug: profileErr,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Assign role
    const { error: roleErr } = await admin.from("user_roles").insert({
      user_id: userId,
      role: role,
    });

    if (roleErr) {
      await admin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: "Failed to assign role", debug: roleErr }),
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
    console.error("unexpected", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", debug: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
