import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Shield, UserPlus } from "lucide-react";

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
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,hsl(224_46%_13%),hsl(213_33%_20%)_45%,hsl(45_93%_58%_/_0.22))] p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-accent shadow-gold">
            <Shield className="h-8 w-8 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Request Access</h1>
          <p className="mt-1 text-sm text-white/70">Create your LASU Legal CMS account</p>
        </div>

      <div className="rounded-lg border border-white/15 bg-card p-6 shadow-2xl">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-foreground">
          <UserPlus className="h-5 w-5 text-accent-foreground" />
          Account details
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">
              Full name
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="search-input"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              className="search-input"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">
              Password
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              className="search-input"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">
              Account type
            </label>
            <select
              value={requestedRole}
              onChange={(e) => setRequestedRole(e.target.value as "staff" | "admin")}
              required
              className="search-input"
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
            className="gold-button flex w-full items-center justify-center rounded-lg px-4 py-2.5"
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>
      </div>
      <p className="mt-4 text-center text-xs text-white/60">
        Your account remains pending until a superadmin approves it.
      </p>
      </div>
    </div>
  );
}
