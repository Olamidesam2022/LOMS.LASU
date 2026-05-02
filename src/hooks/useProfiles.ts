import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types/legal";
import { AppRole, ProfileStatus, useAuth } from "@/context/AuthContext";

interface ProfileRow {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
  status: ProfileStatus;
  created_at: string;
}

const toUser = (profile: ProfileRow): User => ({
  id: profile.id,
  name: profile.full_name || profile.email,
  email: profile.email,
  role: profile.role,
  status: profile.status,
  department: "Legal",
});

export function useProfiles() {
  const { role } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (role !== "superadmin") {
      setUsers([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,full_name,role,status,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      throw error;
    }

    setUsers(((data || []) as ProfileRow[]).map(toUser));
    setIsLoading(false);
  }, [role]);

  const updateUser = useCallback(
    async (id: string, values: Partial<Pick<ProfileRow, "role" | "status">>) => {
      const { error } = await supabase.from("profiles").update(values).eq("id", id);
      if (error) throw error;
      await fetchUsers();
    },
    [fetchUsers],
  );

  useEffect(() => {
    fetchUsers().catch(console.error);
  }, [fetchUsers]);

  useEffect(() => {
    if (role !== "superadmin") return;

    const refreshOnFocus = () => {
      fetchUsers().catch(console.error);
    };

    const refreshOnVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshOnFocus();
      }
    };

    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnVisibility);

    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnVisibility);
    };
  }, [fetchUsers, role]);

  return { users, fetchUsers, updateUser, isLoading, error };
}
