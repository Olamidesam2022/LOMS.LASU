export type AppRole = "superadmin" | "admin" | "legal_officer" | "pending";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  department?: string | null;
}
