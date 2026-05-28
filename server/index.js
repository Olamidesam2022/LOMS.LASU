import express from "express";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

app.patch("/api/admin/users/:userId", async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: "Supabase admin client is not configured" });
  }

  const { userId } = req.params;
  const updates = req.body || {};

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .maybeSingle();

  if (profileError) {
    return res.status(400).json({ error: profileError.message });
  }

  if (updates.is_active === false || updates.status === "rejected") {
    const { data: openCases, error: casesError } = await supabaseAdmin
      .from("cases")
      .select("id")
      .eq("assigned_to", userId)
      .in("status", ["open", "in_progress", "Active"]);

    if (casesError) {
      return res.status(400).json({ error: casesError.message });
    }

    const caseIds = (openCases || []).map((caseItem) => caseItem.id);

    if (caseIds.length > 0) {
      const { error: updateCasesError } = await supabaseAdmin
        .from("cases")
        .update({ assigned_to: null })
        .in("id", caseIds);

      if (updateCasesError) {
        return res.status(400).json({ error: updateCasesError.message });
      }

      const noteRows = caseIds.map((caseId) => ({
        case_id: caseId,
        content: "Previously assigned officer deactivated. Case awaiting reassignment.",
        is_private: false,
        note_type: "system",
      }));

      const { error: notesError } = await supabaseAdmin
        .from("case_notes")
        .insert(noteRows);

      if (notesError) {
        return res.status(400).json({ error: notesError.message });
      }
    }
  }

  return res.json({ user: profile });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`LOMS admin server listening on port ${port}`);
});
