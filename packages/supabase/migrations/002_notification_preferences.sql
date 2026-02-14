-- =============================================================================
-- Notification Preferences
-- Stores per-user email/push notification settings and schedule.
-- =============================================================================

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references public.users(id) on delete cascade,

  -- Master toggle
  email_enabled boolean not null default true,

  -- Content types the user wants to receive
  pregnancy_updates boolean not null default true,   -- weekly pregnancy progress emails
  new_resources     boolean not null default true,   -- new resources added to their feed
  planning_reminders boolean not null default true,  -- upcoming planning tips / milestones
  product_updates   boolean not null default false,  -- KinPath feature announcements

  -- Delivery schedule
  email_frequency text not null default 'weekly'
    check (email_frequency in ('daily', 'weekly', 'monthly', 'off')),
  preferred_day smallint not null default 1          -- 0=Sun, 1=Mon, …, 6=Sat
    check (preferred_day between 0 and 6),
  preferred_hour smallint not null default 8         -- 0-23 in user's local concept (UTC for now)
    check (preferred_hour between 0 and 23),

  -- Tracking
  last_email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-update the updated_at timestamp
create or replace function public.update_notification_preferences_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_notification_preferences_updated_at
  before update on public.notification_preferences
  for each row
  execute function public.update_notification_preferences_timestamp();

-- RLS policies
alter table public.notification_preferences enable row level security;

create policy "Users can view own notification preferences"
  on public.notification_preferences
  for select using (auth.uid() = user_id);

create policy "Users can insert own notification preferences"
  on public.notification_preferences
  for insert with check (auth.uid() = user_id);

create policy "Users can update own notification preferences"
  on public.notification_preferences
  for update using (auth.uid() = user_id);

-- Service role can query all (for cron email dispatch)
create policy "Service role can view all notification preferences"
  on public.notification_preferences
  for select using (auth.role() = 'service_role');
