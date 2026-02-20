-- Junction table for checklist items <-> children (multi-child tagging)
create table public.checklist_item_children (
  checklist_item_id uuid not null references public.checklist_items(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  primary key (checklist_item_id, child_id)
);

create index idx_checklist_item_children_child on public.checklist_item_children(child_id);

alter table public.checklist_item_children enable row level security;

create policy "Users can manage checklist item children"
  on public.checklist_item_children for all
  using (
    exists (
      select 1 from public.checklist_items ci
      where ci.id = checklist_item_id and ci.user_id = auth.uid()
    )
  );

-- Migrate existing data: populate junction table from existing child_id
insert into public.checklist_item_children (checklist_item_id, child_id)
select id, child_id from public.checklist_items where child_id is not null;

-- Make child_id nullable (items can now span multiple children)
alter table public.checklist_items alter column child_id drop not null;
