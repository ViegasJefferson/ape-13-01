begin;

-- =========================================================
-- CHÁ DE PANELA E ENXOVAL
-- =========================================================

create table if not exists public.household_items (
  id uuid primary key default gen_random_uuid(),

  apartment_id uuid not null
    references public.apartments(id)
    on delete cascade,

  list_type text not null default 'trousseau'
    check (
      list_type in (
        'trousseau',
        'housewarming'
      )
    ),

  title text not null
    check (
      char_length(trim(title)) between 1 and 150
    ),

  category text not null
    check (
      char_length(trim(category)) between 1 and 100
    ),

  room text
    check (
      room is null
      or char_length(trim(room)) <= 100
    ),

  priority text not null default 'medium'
    check (
      priority in (
        'low',
        'medium',
        'high'
      )
    ),

  desired_quantity integer not null default 1
    check (
      desired_quantity > 0
      and desired_quantity <= 999
    ),

  purchased_quantity integer not null default 0
    check (
      purchased_quantity >= 0
      and purchased_quantity <= 999
    ),

  received_quantity integer not null default 0
    check (
      received_quantity >= 0
      and received_quantity <= 999
    ),

  estimated_unit_amount numeric(14, 2) not null default 0
    check (
      estimated_unit_amount >= 0
    ),

  actual_total_amount numeric(14, 2) not null default 0
    check (
      actual_total_amount >= 0
    ),

  store_name text
    check (
      store_name is null
      or char_length(trim(store_name)) <= 150
    ),

  product_url text
    check (
      product_url is null
      or char_length(trim(product_url)) <= 1000
    ),

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

create index if not exists household_items_apartment_idx
  on public.household_items(apartment_id);

create index if not exists household_items_list_type_idx
  on public.household_items(list_type);

create index if not exists household_items_category_idx
  on public.household_items(category);

create index if not exists household_items_priority_idx
  on public.household_items(priority);

-- =========================================================
-- TRIGGERS
-- =========================================================

drop trigger if exists household_items_set_updated_at
  on public.household_items;

create trigger household_items_set_updated_at
before update on public.household_items
for each row
execute function public.set_updated_at();

drop trigger if exists household_items_preserve_created_by
  on public.household_items;

create trigger household_items_preserve_created_by
before update on public.household_items
for each row
execute function public.preserve_created_by();

-- =========================================================
-- RLS
-- =========================================================

alter table public.household_items
  enable row level security;

drop policy if exists household_items_select
  on public.household_items;

create policy household_items_select
on public.household_items
for select
to authenticated
using (
  public.is_apartment_member(apartment_id)
);

drop policy if exists household_items_insert
  on public.household_items;

create policy household_items_insert
on public.household_items
for insert
to authenticated
with check (
  public.can_edit_apartment(apartment_id)
  and created_by = (select auth.uid())
);

drop policy if exists household_items_update
  on public.household_items;

create policy household_items_update
on public.household_items
for update
to authenticated
using (
  public.can_edit_apartment(apartment_id)
)
with check (
  public.can_edit_apartment(apartment_id)
);

drop policy if exists household_items_delete
  on public.household_items;

create policy household_items_delete
on public.household_items
for delete
to authenticated
using (
  public.can_edit_apartment(apartment_id)
);

revoke all
on public.household_items
from anon;

grant select, insert, update, delete
on public.household_items
to authenticated;

commit;