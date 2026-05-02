import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function SignUp() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [requestedRole, setRequestedRole] = useState<"staff" | "admin">("staff");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signUp({
        email,
        password,
        fullName,
        role: requestedRole,
      });
      if (error) throw error;

      toast.success("Signup submitted. Your account is awaiting superadmin approval.");
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
            <label className="block text-sm text-muted-foreground">
              Account type
            </label>
            <select
              value={requestedRole}
              onChange={(e) => setRequestedRole(e.target.value as "staff" | "admin")}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="staff">Legal User</option>
              <option value="admin">Admin</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Superadmin must approve the account before login.
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="gold-button px-4 py-2 rounded-lg"
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
