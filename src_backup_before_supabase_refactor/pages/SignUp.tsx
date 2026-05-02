import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function SignUp() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("Legal");
  const [password, setPassword] = useState("");
  const [requestedRole, setRequestedRole] = useState<"admin" | "legal_officer">(
    "legal_officer",
  );
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // Insert pending user record (use returned user id if available)
      const userId = data?.user?.id ?? null;
      const { error: insertError } = await supabase
        .from("pending_users")
        .insert([
          {
            user_id: userId,
            full_name: fullName,
            email,
            requested_role: requestedRole,
          },
        ]);

      if (insertError) {
        console.error(insertError);
        throw insertError;
      }

      toast.success("Signup submitted — awaiting superadmin approval");
      navigate("/login");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Create account
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground">
              Full name
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground">
              Password
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground">Role</label>
            <select
              value={requestedRole}
              onChange={(e) => setRequestedRole(e.target.value as any)}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
            >
              <option value="legal_officer">Staff (legal officer)</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={loading}
              className="gold-button px-4 py-2 rounded-lg"
            >
              Create account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
