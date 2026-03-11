-- Fix: Replace the recursive "Admins can read all users" RLS policy.
--
-- A later migration re-introduced the inline EXISTS subquery that causes
-- "infinite recursion detected in policy for relation users" errors.
-- The public.is_admin() SECURITY DEFINER function (created in 008b)
-- already exists and safely bypasses RLS for the admin check.

DROP POLICY IF EXISTS "Admins can read all users" ON public.users;

CREATE POLICY "Admins can read all users"
  ON public.users FOR SELECT
  USING (auth.uid() = id OR public.is_admin());
