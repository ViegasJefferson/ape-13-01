begin;

create table if not exists public.architecture_items (
  id uuid primary key
    default gen_random_uuid(),

  apartment_id uuid not null
    references public.apartments(id)
    on delete cascade,

  title text not null
    check (
      char_length(trim(title))
      between 1 and 150
    ),

  room text
    check (
      room is null
      or char_length(trim(room)) <= 100
    ),

  item_type text not null
    default 'deliverable'
    check (
      item_type in (
        'deliverable',
        'version',
        'decision',
        'meeting',
        'task'
      )
    ),

  status text not null
    default 'planned'
    check (
      status in (
        'planned',
        'in_progress',
        'review',
        'approved',
        'completed',
        'cancelled'
      )
    ),

  priority text not null
    default 'medium'
    check (
      priority in (
        'low',
        'medium',
        'high'
      )
    ),

  version_label text
    check (
      version_label is null
      or char_length(trim(version_label)) <= 50
    ),

  professional_name text
    check (
      professional_name is null
      or char_length(trim(professional_name)) <= 150
    ),

  target_date date,

  completed_at timestamptz,

  description text
    check (
      description is null
      or char_length(description) <= 2000
    ),

  notes text
    check (
      notes is null
      or char_length(notes) <= 3000
    ),

  created_by uuid not null
    references auth.users(id)
    on delete restrict,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now()
);

create index if not exists
  architecture_items_apartment_idx
on public.architecture_items (
  apartment_id
);

create index if not exists
  architecture_items_room_idx
on public.architecture_items (
  room
);

create index if not exists
  architecture_items_status_idx
on public.architecture_items (
  status
);

create index if not exists
  architecture_items_target_date_idx
on public.architecture_items (
  target_date
);


drop trigger if exists
  architecture_items_set_updated_at
on public.architecture_items;

create trigger
  architecture_items_set_updated_at
before update
on public.architecture_items
for each row
execute function public.set_updated_at();


drop trigger if exists
  architecture_items_preserve_created_by
on public.architecture_items;

create trigger
  architecture_items_preserve_created_by
before update
on public.architecture_items
for each row
execute function public.preserve_created_by();


alter table public.architecture_items
  enable row level security;


drop policy if exists
  architecture_items_select
on public.architecture_items;

create policy architecture_items_select
on public.architecture_items
for select
to authenticated
using (
  public.is_apartment_member(
    apartment_id
  )
);


drop policy if exists
  architecture_items_insert
on public.architecture_items;

create policy architecture_items_insert
on public.architecture_items
for insert
to authenticated
with check (
  public.can_edit_apartment(
    apartment_id
  )
  and created_by =
    (select auth.uid())
);


drop policy if exists
  architecture_items_update
on public.architecture_items;

create policy architecture_items_update
on public.architecture_items
for update
to authenticated
using (
  public.can_edit_apartment(
    apartment_id
  )
)
with check (
  public.can_edit_apartment(
    apartment_id
  )
);


drop policy if exists
  architecture_items_delete
on public.architecture_items;

create policy architecture_items_delete
on public.architecture_items
for delete
to authenticated
using (
  public.can_edit_apartment(
    apartment_id
  )
);

revoke all
on public.architecture_items
from anon;

grant
  select,
  insert,
  update,
  delete
on public.architecture_items
to authenticated;

commit;