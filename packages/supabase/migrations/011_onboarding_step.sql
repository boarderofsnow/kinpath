-- =============================================================================
-- 011: Add onboarding_step column for step-based onboarding tracking
-- =============================================================================
-- Replaces the boolean-only onboarding_complete with a step tracker so users
-- can resume mid-flow. The boolean is kept in sync for backward compatibility.

ALTER TABLE public.users
  ADD COLUMN onboarding_step text NOT NULL DEFAULT 'child'
  CHECK (onboarding_step IN ('child', 'preferences', 'paywall', 'partner_invite', 'complete'));

-- Backfill existing users
UPDATE public.users SET onboarding_step = 'complete' WHERE onboarding_complete = true;
UPDATE public.users SET onboarding_step = 'child' WHERE onboarding_complete = false;

-- Update the new-user trigger to explicitly set onboarding_step
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, onboarding_step)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'child'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
