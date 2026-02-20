-- Doctor discussion items: topics to bring up at appointments
create table public.doctor_discussion_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  notes text,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  is_discussed boolean not null default false,
  discussed_at timestamptz,
  doctor_response text,
  conversation_id uuid references public.ai_conversations(id) on delete set null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_doctor_items_user on public.doctor_discussion_items(user_id);

-- Junction table for doctor items <-> children (multi-child tagging)
create table public.doctor_item_children (
  doctor_item_id uuid not null references public.doctor_discussion_items(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  primary key (doctor_item_id, child_id)
);

create index idx_doctor_item_children_child on public.doctor_item_children(child_id);

-- RLS
alter table public.doctor_discussion_items enable row level security;
alter table public.doctor_item_children enable row level security;

create policy "Users can manage own doctor items"
  on public.doctor_discussion_items for all
  using (auth.uid() = user_id);

create policy "Users can manage doctor item children"
  on public.doctor_item_children for all
  using (
    exists (
      select 1 from public.doctor_discussion_items di
      where di.id = doctor_item_id and di.user_id = auth.uid()
    )
  );
