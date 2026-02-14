-- =============================================================================
-- KinPath: Initial Database Schema
-- =============================================================================

-- Enable required extensions
create extension if not exists "vector";      -- pgvector for AI embeddings

-- =============================================================================
-- USERS
-- =============================================================================

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  onboarding_complete boolean not null default false,
  subscription_tier text not null default 'free' check (subscription_tier in ('free', 'premium', 'family')),
  stripe_customer_id text unique,
  rc_customer_id text unique,
  created_at timestamptz not null default now()
);

-- Auto-create user profile on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- CHILDREN
-- =============================================================================

create table public.children (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  due_date date,         -- for prenatal tracking
  dob date,              -- set once born
  is_born boolean not null default false,
  created_at timestamptz not null default now(),

  constraint child_has_date check (due_date is not null or dob is not null)
);

create index idx_children_user_id on public.children(user_id);

-- =============================================================================
-- USER PREFERENCES
-- =============================================================================

create table public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  birth_preference text check (birth_preference in ('home', 'hospital', 'birth_center', 'undecided')),
  feeding_preference text check (feeding_preference in ('breastfeeding', 'formula', 'combination', 'undecided')),
  vaccine_stance text check (vaccine_stance in ('standard', 'delayed', 'selective', 'hesitant', 'prefer_not_to_say')),
  religion text,
  dietary_preference text check (dietary_preference in ('omnivore', 'vegetarian', 'vegan', 'kosher', 'halal', 'other')),
  parenting_style text check (parenting_style in ('attachment', 'gentle', 'montessori', 'rie', 'no_preference')),
  topics_of_interest text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- =============================================================================
-- TOPICS
-- =============================================================================

create table public.topics (
  id text primary key,  -- e.g., 'nutrition_and_diet'
  label text not null,
  icon text,
  sort_order int not null default 0
);

-- =============================================================================
-- TAGS (lifestyle/belief filters)
-- =============================================================================

create table public.tags (
  id text primary key,  -- e.g., 'faith:christian'
  namespace text not null,  -- e.g., 'faith'
  value text not null,
  label text not null
);

create index idx_tags_namespace on public.tags(namespace);

-- =============================================================================
-- RESOURCES
-- =============================================================================

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text not null,
  body text not null,      -- Markdown content
  resource_type text not null check (resource_type in ('article', 'checklist', 'video', 'guide', 'infographic')),
  source_url text,
  age_start_weeks int not null,  -- -40 (conception) to 260 (age 5)
  age_end_weeks int not null,
  status text not null default 'draft' check (status in ('draft', 'in_review', 'published', 'rejected', 'archived')),
  is_premium boolean not null default false,
  vetted_at timestamptz,
  vetted_by uuid references public.users(id),
  embedding vector(1536),  -- For AI similarity search
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint valid_age_range check (age_end_weeks >= age_start_weeks)
);

create index idx_resources_status on public.resources(status);
create index idx_resources_age on public.resources(age_start_weeks, age_end_weeks);
create index idx_resources_slug on public.resources(slug);
-- Vector similarity index (IVFFlat for moderate-scale datasets)
create index idx_resources_embedding on public.resources
  using ivfflat (embedding vector_cosine_ops) with (lists = 20);

-- =============================================================================
-- RESOURCE <-> TOPIC junction
-- =============================================================================

create table public.resource_topics (
  resource_id uuid not null references public.resources(id) on delete cascade,
  topic_id text not null references public.topics(id) on delete cascade,
  primary key (resource_id, topic_id)
);

-- =============================================================================
-- RESOURCE <-> TAG junction
-- =============================================================================

create table public.resource_tags (
  resource_id uuid not null references public.resources(id) on delete cascade,
  tag_id text not null references public.tags(id) on delete cascade,
  primary key (resource_id, tag_id)
);

-- =============================================================================
-- REVIEWERS
-- =============================================================================

create table public.reviewers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  full_name text not null,
  credentials text not null,  -- e.g., 'MD', 'RN', 'IBCLC'
  specialty text,
  verified boolean not null default false,
  active boolean not null default true
);

-- =============================================================================
-- PROFESSIONAL REVIEWS
-- =============================================================================

create table public.professional_reviews (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  reviewer_id uuid not null references public.reviewers(id),
  status text not null check (status in ('approved', 'rejected', 'needs_revision')),
  review_notes text,
  credentials_verified boolean not null default false,
  reviewed_at timestamptz not null default now()
);

create index idx_reviews_resource on public.professional_reviews(resource_id);

-- =============================================================================
-- EDITORIAL PINS
-- =============================================================================

create table public.editorial_pins (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  position int not null default 0,
  age_week_target int,
  pinned_at timestamptz not null default now(),
  expires_at timestamptz
);

-- =============================================================================
-- RESOURCE REVIEW SCHEDULE
-- =============================================================================

create table public.resource_review_schedule (
  resource_id uuid primary key references public.resources(id) on delete cascade,
  review_interval_days int not null default 365,
  last_reviewed_at timestamptz,
  next_review_due timestamptz,
  flagged boolean not null default false
);

-- =============================================================================
-- AI CONVERSATIONS
-- =============================================================================

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  child_id uuid references public.children(id) on delete set null,
  messages jsonb not null default '[]',
  cited_resource_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_ai_conversations_user on public.ai_conversations(user_id);
create index idx_ai_conversations_created on public.ai_conversations(created_at);

-- =============================================================================
-- BOOKMARKS
-- =============================================================================

create table public.bookmarks (
  user_id uuid not null references public.users(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, resource_id)
);

-- =============================================================================
-- AUDIT LOGS
-- =============================================================================

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  change_delta jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_actor on public.audit_logs(actor_id);
create index idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.children enable row level security;
alter table public.user_preferences enable row level security;
alter table public.resources enable row level security;
alter table public.resource_topics enable row level security;
alter table public.resource_tags enable row level security;
alter table public.reviewers enable row level security;
alter table public.professional_reviews enable row level security;
alter table public.editorial_pins enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.bookmarks enable row level security;
alter table public.audit_logs enable row level security;
alter table public.topics enable row level security;
alter table public.tags enable row level security;

-- Users: read own profile, update own profile
create policy "Users can read own profile"
  on public.users for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.users for update using (auth.uid() = id);

-- Children: full CRUD on own children
create policy "Users can manage own children"
  on public.children for all using (auth.uid() = user_id);

-- Preferences: full CRUD on own preferences
create policy "Users can manage own preferences"
  on public.user_preferences for all using (auth.uid() = user_id);

-- Resources: anyone can read published resources (vetted or unvetted); admins manage all
create policy "Anyone can read published resources"
  on public.resources for select using (status = 'published');

-- Resource topics/tags: readable by all (follow resource visibility)
create policy "Anyone can read resource topics"
  on public.resource_topics for select using (true);
create policy "Anyone can read resource tags"
  on public.resource_tags for select using (true);

-- Topics & tags: readable by all
create policy "Anyone can read topics"
  on public.topics for select using (true);
create policy "Anyone can read tags"
  on public.tags for select using (true);

-- Reviewers: visible to authenticated users
create policy "Authenticated users can view reviewers"
  on public.reviewers for select using (auth.uid() is not null);

-- Reviews: visible to authenticated users
create policy "Authenticated users can view reviews"
  on public.professional_reviews for select using (auth.uid() is not null);

-- Editorial pins: readable by all
create policy "Anyone can read editorial pins"
  on public.editorial_pins for select using (true);

-- AI conversations: users can manage own conversations
create policy "Users can manage own AI conversations"
  on public.ai_conversations for all using (auth.uid() = user_id);

-- Bookmarks: users can manage own bookmarks
create policy "Users can manage own bookmarks"
  on public.bookmarks for all using (auth.uid() = user_id);

-- Audit logs: only service role can insert/read (no user-facing RLS policy)
-- Admin access is via service role key, which bypasses RLS

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to get age-appropriate resources for a child
create or replace function public.get_resources_for_age(
  p_age_weeks int,
  p_status text default 'published'
)
returns setof public.resources as $$
begin
  return query
    select *
    from public.resources
    where status = p_status
      and age_start_weeks <= p_age_weeks
      and age_end_weeks >= p_age_weeks
    order by created_at desc;
end;
$$ language plpgsql security definer;

-- Function for vector similarity search (for AI RAG)
create or replace function public.match_resources(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 5
)
returns table (
  id uuid,
  title text,
  summary text,
  body text,
  similarity float
) as $$
begin
  return query
    select
      r.id,
      r.title,
      r.summary,
      r.body,
      1 - (r.embedding <=> query_embedding) as similarity
    from public.resources r
    where r.status = 'published'
      and r.embedding is not null
      and 1 - (r.embedding <=> query_embedding) > match_threshold
    order by r.embedding <=> query_embedding
    limit match_count;
end;
$$ language plpgsql security definer;
