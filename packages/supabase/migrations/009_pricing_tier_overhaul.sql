-- 1. Expand household_members role CHECK to include 'caregiver'
alter table public.household_members
  drop constraint if exists household_members_role_check;

alter table public.household_members
  add constraint household_members_role_check
  check (role in ('owner', 'partner', 'caregiver'));

-- 2. Add max_members column to households for tier-based member limit enforcement
alter table public.households
  add column if not exists max_members integer not null default 1;

-- 3. Sync existing households with owner's current subscription tier
update public.households h
  set max_members = case
    when u.subscription_tier = 'family' then 5
    when u.subscription_tier = 'premium' then 1
    else 0
  end
  from public.users u
  where h.owner_user_id = u.id;
