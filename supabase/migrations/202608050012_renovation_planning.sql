begin;

-- =========================================================
-- PLANEJAMENTO DA REFORMA
-- =========================================================

create table if not exists public.renovation_items (
  id uuid primary key default gen_random_uuid(),

  apartment_id uuid not null
    references public.apartments(id)
    on delete cascade,

  title text not null
    check (
      char_length(trim(title)) between 1 and 150
    ),

  area text
    check (
      area is null
      or char_length(trim(area)) <= 100
    ),

  status text not null default 'planned'
    check (
      status in (
        'planned',
        'quoting',
        'approved',
        'in_progress',
        'completed',
        'cancelled'
      )
    ),

  priority text not null default 'medium'
    check (
      priority in (
        'low',
        'medium',
        'high'
      )
    ),

  planned_amount numeric(14, 2) not null default 0
    check (planned_amount >= 0),

  actual_amount numeric(14, 2) not null default 0
    check (actual_amount >= 0),

  vendor_name text
    check (
      vendor_name is null
      or char_length(trim(vendor_name)) <= 150
    ),

  target_date date,
  completed_at date,

  notes text
    check (
      notes is null
      or char_length(notes) <= 2000
    ),

  created_by uuid not null
    references auth.users(id)
    on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists renovation_items_apartment_idx
  on public.renovation_items(apartment_id);

create index if not exists renovation_items_status_idx
  on public.renovation_items(status);

create index if not exists renovation_items_priority_idx
  on public.renovation_items(priority);

create index if not exists renovation_items_target_date_idx
  on public.renovation_items(target_date);

-- =========================================================
-- TRIGGERS
-- =========================================================

drop trigger if exists renovation_items_set_updated_at
  on public.renovation_items;

create trigger renovation_items_set_updated_at
before update on public.renovation_items
for each row
execute function public.set_updated_at();

drop trigger if exists renovation_items_preserve_created_by
  on public.renovation_items;

create trigger renovation_items_preserve_created_by
before update on public.renovation_items
for each row
execute function public.preserve_created_by();

-- =========================================================
-- RLS
-- =========================================================

alter table public.renovation_items
  enable row level security;

drop policy if exists renovation_items_select
  on public.renovation_items;

create policy renovation_items_select
on public.renovation_items
for select
to authenticated
using (
  public.is_apartment_member(apartment_id)
);

drop policy if exists renovation_items_insert
  on public.renovation_items;

create policy renovation_items_insert
on public.renovation_items
for insert
to authenticated
with check (
  public.can_edit_apartment(apartment_id)
  and created_by = (select auth.uid())
);

drop policy if exists renovation_items_update
  on public.renovation_items;

create policy renovation_items_update
on public.renovation_items
for update
to authenticated
using (
  public.can_edit_apartment(apartment_id)
)
with check (
  public.can_edit_apartment(apartment_id)
);

drop policy if exists renovation_items_delete
  on public.renovation_items;

create policy renovation_items_delete
on public.renovation_items
for delete
to authenticated
using (
  public.can_edit_apartment(apartment_id)
);

revoke all
on public.renovation_items
from anon;

grant select, insert, update, delete
on public.renovation_items
to authenticated;

commit;