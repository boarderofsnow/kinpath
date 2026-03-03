-- Add category column to checklist_items
-- Distinguishes general checklist items from items to discuss with a medical provider.
alter table public.checklist_items
  add column category text not null default 'general'
  check (category in ('general', 'provider'));

create index idx_checklist_items_category on public.checklist_items(category);
