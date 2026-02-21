-- Add is_admin flag to users
alter table public.users add column if not exists is_admin boolean not null default false;

-- Add assigned_reviewer_id to resources
alter table public.resources add column if not exists assigned_reviewer_id uuid references public.reviewers(id) on delete set null;

-- Admins can read all resources (any status)
create policy "Admins can read all resources"
  on public.resources for select
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)
  );

-- Admins can update resources
create policy "Admins can update resources"
  on public.resources for update
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)
  );

-- Admins can insert resources
create policy "Admins can insert resources"
  on public.resources for insert
  with check (
    exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)
  );

-- Reviewers can view resources assigned to them
create policy "Reviewers can view assigned resources"
  on public.resources for select
  using (
    exists (
      select 1 from public.reviewers r
      where r.user_id = auth.uid()
        and r.active = true
        and resources.assigned_reviewer_id = r.id
    )
  );

-- Reviewers can insert their own reviews
create policy "Reviewers can insert own reviews"
  on public.professional_reviews for insert
  with check (
    exists (select 1 from public.reviewers r where r.user_id = auth.uid() and r.id = reviewer_id)
  );

-- Reviewers can update their own reviews
create policy "Reviewers can update own reviews"
  on public.professional_reviews for update
  using (
    exists (select 1 from public.reviewers r where r.user_id = auth.uid() and r.id = reviewer_id)
  );

-- Admins can read all users (needed so the is_admin check works in policy evaluation)
create policy "Admins can read all users"
  on public.users for select
  using (
    auth.uid() = id
    or exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)
  );
