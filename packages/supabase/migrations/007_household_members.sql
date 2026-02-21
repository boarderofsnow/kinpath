-- Household: one per family subscription
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users(id) on delete cascade,
  name text,
  created_at timestamptz not null default now()
);

-- Members (owner + invited partners)
create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  invited_email text not null,
  display_name text,
  role text not null default 'partner' check (role in ('owner', 'partner')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz
);

-- Checklist item assignee (optional)
alter table public.checklist_items add column if not exists assignee_member_id uuid references public.household_members(id) on delete set null;

-- RLS
alter table public.households enable row level security;
alter table public.household_members enable row level security;

-- Households: owner can manage their own household
create policy "Household owner can manage household"
  on public.households for all
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

-- Members: can see households they belong to
create policy "Members can view their household"
  on public.household_members for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.households h
      where h.id = household_id and h.owner_user_id = auth.uid()
    )
  );

-- Owner can insert/update/delete members
create policy "Owner can manage members"
  on public.household_members for insert
  with check (
    exists (
      select 1 from public.households h
      where h.id = household_id and h.owner_user_id = auth.uid()
    )
  );

create policy "Owner can update members"
  on public.household_members for update
  using (
    exists (
      select 1 from public.households h
      where h.id = household_id and h.owner_user_id = auth.uid()
    )
  );

create policy "Owner can delete members"
  on public.household_members for delete
  using (
    exists (
      select 1 from public.households h
      where h.id = household_id and h.owner_user_id = auth.uid()
    )
  );
