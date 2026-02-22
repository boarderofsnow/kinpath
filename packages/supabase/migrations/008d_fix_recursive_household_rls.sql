-- Fix infinite recursion between household_members and households RLS policies.
--
-- The household_members SELECT policy queried households inline, and the
-- households "Partners can read their household" SELECT policy queried
-- household_members inline — creating a two-way cycle detected by Postgres as
-- "infinite recursion detected in policy for relation".
--
-- Solution: introduce SECURITY DEFINER helper functions that bypass RLS when
-- performing the cross-table ownership/membership checks, breaking the cycle.

-- ── Helper functions ──────────────────────────────────────────────────────────

-- Returns true if auth.uid() owns the given household.
-- SECURITY DEFINER bypasses households RLS so this can be called safely from
-- within a household_members RLS policy without recursing into households.
CREATE OR REPLACE FUNCTION public.is_household_owner(p_household_id uuid)
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.households
    WHERE id = p_household_id AND owner_user_id = auth.uid()
  );
$$;

-- Returns true if auth.uid() is an accepted member of the given household.
-- SECURITY DEFINER bypasses household_members RLS so this can be called safely
-- from within a households RLS policy without recursing into household_members.
CREATE OR REPLACE FUNCTION public.is_accepted_member_of(p_household_id uuid)
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = p_household_id
      AND user_id = auth.uid()
      AND status = 'accepted'
  );
$$;

-- ── household_members policies ────────────────────────────────────────────────

DROP POLICY IF EXISTS "Members can view their household" ON public.household_members;
CREATE POLICY "Members can view their household"
  ON public.household_members FOR SELECT
  USING (auth.uid() = user_id OR public.is_household_owner(household_id));

DROP POLICY IF EXISTS "Owner can update members" ON public.household_members;
CREATE POLICY "Owner can update members"
  ON public.household_members FOR UPDATE
  USING (public.is_household_owner(household_id));

DROP POLICY IF EXISTS "Owner can delete members" ON public.household_members;
CREATE POLICY "Owner can delete members"
  ON public.household_members FOR DELETE
  USING (public.is_household_owner(household_id));

-- ── households policies ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Partners can read their household" ON public.households;
CREATE POLICY "Partners can read their household"
  ON public.households FOR SELECT
  USING (auth.uid() = owner_user_id OR public.is_accepted_member_of(id));
