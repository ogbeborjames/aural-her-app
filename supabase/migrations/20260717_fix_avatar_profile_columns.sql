-- Ensure the profile table has the avatar columns the app writes to.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS avatar_path text;

-- Keep the existing profile policy intact for authenticated users.
-- The policy already ensures users can only update their own profile row.
