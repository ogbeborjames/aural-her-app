-- Add avatar_path to profiles for robust storage deletion
-- Run this migration in Supabase or via your migration tooling.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_path text;
