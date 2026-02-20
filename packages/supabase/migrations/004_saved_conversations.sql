-- Saved/bookmarked chat conversations
create table public.saved_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  title text,
  notes text,
  created_at timestamptz not null default now(),
  unique(user_id, conversation_id)
);

create index idx_saved_conversations_user on public.saved_conversations(user_id);

alter table public.saved_conversations enable row level security;

create policy "Users can manage own saved conversations"
  on public.saved_conversations for all using (auth.uid() = user_id);
