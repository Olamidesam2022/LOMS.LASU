-- Initial Supabase schema for app roles, profiles, and user_roles
-- Run with `supabase db push` or paste into Supabase SQL editor.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('superadmin', 'admin', 'legal_officer');
  END IF;
END$$;

-- profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT,
  avatar_url TEXT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- pending_users table for signup approvals
CREATE TABLE IF NOT EXISTS public.pending_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  requested_role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Basic index to speed lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_pending_users_status ON public.pending_users (status);
