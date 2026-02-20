-- =============================================================================
-- Checklist Items
-- Per-child interactive checklist for milestones and custom planning tasks.
-- =============================================================================

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,

  -- Item content
  title text not null,
  description text,
  item_type text not null default 'custom' check (item_type in ('milestone', 'custom')),
  milestone_key text,            -- references constant key for system milestones

  -- Dates
  suggested_date date,           -- auto-calculated from milestone offset
  due_date date,                 -- parent-editable target date
  is_completed boolean not null default false,
  completed_at timestamptz,      -- set when checked off

  -- Ordering
  sort_order int not null default 0,

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_checklist_items_child on public.checklist_items(child_id, is_completed);
create index idx_checklist_items_user on public.checklist_items(user_id);

-- Auto-update the updated_at timestamp
create or replace function public.update_checklist_items_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_checklist_items_updated_at
  before update on public.checklist_items
  for each row
  execute function public.update_checklist_items_timestamp();

-- RLS policies
alter table public.checklist_items enable row level security;

create policy "Users can view own checklist items"
  on public.checklist_items
  for select using (auth.uid() = user_id);

create policy "Users can insert own checklist items"
  on public.checklist_items
  for insert with check (auth.uid() = user_id);

create policy "Users can update own checklist items"
  on public.checklist_items
  for update using (auth.uid() = user_id);

create policy "Users can delete own checklist items"
  on public.checklist_items
  for delete using (auth.uid() = user_id);
