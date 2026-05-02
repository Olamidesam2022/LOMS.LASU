import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "superadmin" | "admin" | "legal_officer" | "pending";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  department: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: AppRole | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      if (!supabase) {
        console.error("Supabase client not initialized");
        return;
      }
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      } else {
        setProfile(profileData);
      }

      // Fetch role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (roleError) {
        console.error("Error fetching role:", roleError);
      } else {
        const r = roleData?.role as AppRole | undefined;
        // treat missing role as pending
        setRole(r ?? "pending");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    if (!supabase) {
      console.error("Supabase client not initialized — skipping auth setup");
      setIsLoading(false);
      return;
    }
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        // Use setTimeout to avoid potential deadlock with Supabase client
        setTimeout(() => {
          fetchUserData(newSession.user.id);
        }, 0);
      } else {
        setProfile(null);
        setRole(null);
      }

      if (event === "SIGNED_OUT") {
        setProfile(null);
        setRole(null);
      }

      setIsLoading(false);
    });

    // THEN check for existing session
    supabase.auth
      .getSession()
      .then(({ data: { session: existingSession } }) => {
        setSession(existingSession);
        setUser(existingSession?.user ?? null);

        if (existingSession?.user) {
          fetchUserData(existingSession.user.id);
        }

        setIsLoading(false);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase)
      return { error: new Error("Supabase client not initialized") };
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { error: new Error(error.message) };

    // After sign-in, check role; if pending, sign out immediately and return error
    try {
      const userId = data?.user?.id;
      if (userId) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();

        const r = roleData?.role || "pending";
        if (r === "pending") {
          // sign out and inform caller
          await supabase.auth.signOut();
          return { error: new Error("Account pending superadmin approval") };
        }
      }
    } catch (e) {
      console.error("Error checking role after sign-in", e);
    }

    return { error: null };
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        isLoading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
