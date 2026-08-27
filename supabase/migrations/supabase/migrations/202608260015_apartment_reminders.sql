begin;

-- =========================================================
-- AGENDA E LEMBRETES
-- =========================================================

create table if not exists public.apartment_reminders (
  id uuid primary key default gen_random_uuid(),

  apartment_id uuid not null
    references public.apartments(id)
    on delete cascade,

  title text not null
    check (
      char_length(trim(title))
      between 1 and 150
    ),

  description text
    check (
      description is null
      or char_length(description) <= 2000
    ),

  event_type text not null default 'reminder'
    check (
      event_type in (
        'reminder',
        'payment',
        'financing',
        'construction',
        'renovation',
        'document',
        'appointment',
        'other'
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

  event_date date not null,

  event_time time,

  is_completed boolean
    not null
    default false,

  completed_at timestamptz,

  source_type text,

  source_id uuid,

  created_by uuid not null
    references auth.users(id)
    on delete restrict,

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now()
);

create index if not exists
  apartment_reminders_apartment_idx
on public.apartment_reminders(
  apartment_id
);

create index if not exists
  apartment_reminders_date_idx
on public.apartment_reminders(
  event_date
);

create index if not exists
  apartment_reminders_completed_idx
on public.apartment_reminders(
  is_completed
);

create index if not exists
  apartment_reminders_source_idx
on public.apartment_reminders(
  source_type,
  source_id
);

-- =========================================================
-- EVITA LEMBRETE AUTOMÁTICO DUPLICADO
-- =========================================================

create unique index if not exists
  apartment_reminders_source_uidx
on public.apartment_reminders(
  apartment_id,
  source_type,
  source_id
)
where
  source_type is not null
  and source_id is not null;

-- =========================================================
-- TRIGGERS
-- =========================================================

drop trigger if exists
  apartment_reminders_set_updated_at
on public.apartment_reminders;

create trigger
  apartment_reminders_set_updated_at
before update
on public.apartment_reminders
for each row
execute function public.set_updated_at();


drop trigger if exists
  apartment_reminders_preserve_created_by
on public.apartment_reminders;

create trigger
  apartment_reminders_preserve_created_by
before update
on public.apartment_reminders
for each row
execute function public.preserve_created_by();

-- =========================================================
-- RLS
-- =========================================================

alter table public.apartment_reminders
  enable row level security;


drop policy if exists
  apartment_reminders_select
on public.apartment_reminders;

create policy apartment_reminders_select
on public.apartment_reminders
for select
to authenticated
using (
  public.is_apartment_member(
    apartment_id
  )
);


drop policy if exists
  apartment_reminders_insert
on public.apartment_reminders;

create policy apartment_reminders_insert
on public.apartment_reminders
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
  apartment_reminders_update
on public.apartment_reminders;

create policy apartment_reminders_update
on public.apartment_reminders
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
  apartment_reminders_delete
on public.apartment_reminders;

create policy apartment_reminders_delete
on public.apartment_reminders
for delete
to authenticated
using (
  public.can_edit_apartment(
    apartment_id
  )
);


revoke all
on public.apartment_reminders
from anon;

grant
  select,
  insert,
  update,
  delete
on public.apartment_reminders
to authenticated;

commit;