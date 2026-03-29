-- =============================================================================
-- Milestone Achievements
-- Records when a child achieves a developmental milestone (e.g. "rolls over").
-- Separate from checklist_items because these are celebratory records, not tasks.
-- =============================================================================

create table public.milestone_achievements (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,

  milestone_id text not null,          -- matches DevelopmentalMilestone.id constant (e.g. "m-6-1")
  achieved_date date not null,         -- when the child achieved it
  notes text,                          -- optional parent note

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(child_id, milestone_id)       -- one achievement per milestone per child
);

create index idx_milestone_achievements_child on public.milestone_achievements(child_id);
create index idx_milestone_achievements_user on public.milestone_achievements(user_id);

-- Auto-update the updated_at timestamp
create or replace function public.update_milestone_achievements_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_milestone_achievements_updated_at
  before update on public.milestone_achievements
  for each row
  execute function public.update_milestone_achievements_timestamp();

-- RLS policies
alter table public.milestone_achievements enable row level security;

create policy "Users can view own milestone achievements"
  on public.milestone_achievements
  for select using (auth.uid() = user_id);

create policy "Users can insert own milestone achievements"
  on public.milestone_achievements
  for insert with check (auth.uid() = user_id);

create policy "Users can update own milestone achievements"
  on public.milestone_achievements
  for update using (auth.uid() = user_id);

create policy "Users can delete own milestone achievements"
  on public.milestone_achievements
  for delete using (auth.uid() = user_id);
