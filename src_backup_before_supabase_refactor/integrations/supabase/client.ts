import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Client for browser usage (Vite uses import.meta.env)
const importEnv =
  typeof window !== "undefined" && (import.meta as any)?.env
    ? (import.meta as any).env
    : undefined;
const nodeEnv =
  typeof process !== "undefined" ? (process.env as any) : undefined;

const url = importEnv?.VITE_SUPABASE_URL || nodeEnv?.SUPABASE_URL || "";
const anonKey =
  importEnv?.VITE_SUPABASE_ANON_KEY || nodeEnv?.SUPABASE_ANON_KEY || "";

if (!url || !anonKey) {
  // It's okay for local dev if env vars are not set — importing code should handle missing keys at runtime.
  // Avoid throwing at import time to keep dev UX simple.
}

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url as string, anonKey as string) : null;

// Server/admin client factory that requires SUPABASE_SERVICE_ROLE_KEY
export function createAdminClient(): SupabaseClient {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey)
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
  if (!url) throw new Error("Missing SUPABASE_URL environment variable");
  return createClient(url as string, serviceKey);
}
