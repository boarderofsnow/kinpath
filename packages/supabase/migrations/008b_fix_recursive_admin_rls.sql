-- Drop the recursive policy that self-references the users table,
-- causing infinite recursion and making ALL users table reads fail.
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;

-- Security-definer function to check is_admin without triggering RLS
-- (SECURITY DEFINER runs as the function owner, bypassing row-level security)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND is_admin = true
  );
$$;

-- Recreate the policy using the function — no recursion
CREATE POLICY "Admins can read all users"
  ON public.users FOR SELECT
  USING (auth.uid() = id OR public.is_admin());
