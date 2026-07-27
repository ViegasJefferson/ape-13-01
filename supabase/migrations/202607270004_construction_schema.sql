begin;

-- =========================================================
-- ETAPAS DA OBRA
-- =========================================================

create table if not exists public.construction_stages (
  id uuid primary key default gen_random_uuid(),

  apartment_id uuid not null
    references public.apartments(id)
    on delete cascade,

  name text not null,
  slug text not null,
  description text,

  sort_order integer not null default 0,
  active boolean not null default true,

  created_by uuid not null
    references auth.users(id)
    on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (apartment_id, slug)
);

create index if not exists construction_stages_apartment_id_idx
  on public.construction_stages(apartment_id);

-- =========================================================
-- ATUALIZAÇÕES MENSAIS DA OBRA
-- =========================================================

create table if not exists public.construction_updates (
  id uuid primary key default gen_random_uuid(),

  apartment_id uuid not null
    references public.apartments(id)
    on delete cascade,

  reference_month date not null,

  overall_progress numeric(5, 2) not null
    check (
      overall_progress >= 0
      and overall_progress <= 100
    ),

  status text not null default 'in_progress'
    check (
      status in (
        'not_started',
        'in_progress',
        'paused',
        'completed'
      )
    ),

  source_name text,
  notes text,

  created_by uuid not null
    references auth.users(id)
    on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (
    extract(day from reference_month) = 1
  ),

  unique (apartment_id, reference_month)
);

create index if not exists construction_updates_apartment_id_idx
  on public.construction_updates(apartment_id);

create index if not exists construction_updates_reference_month_idx
  on public.construction_updates(reference_month);

-- =========================================================
-- PROGRESSO DAS ETAPAS
-- =========================================================

create table if not exists public.construction_stage_progress (
  id uuid primary key default gen_random_uuid(),

  construction_update_id uuid not null
    references public.construction_updates(id)
    on delete cascade,

  stage_id uuid not null
    references public.construction_stages(id)
    on delete restrict,

  progress numeric(5, 2) not null
    check (
      progress >= 0
      and progress <= 100
    ),

  notes text,

  created_by uuid not null
    references auth.users(id)
    on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (
    construction_update_id,
    stage_id
  )
);

create index if not exists construction_stage_progress_update_idx
  on public.construction_stage_progress(
    construction_update_id
  );

create index if not exists construction_stage_progress_stage_idx
  on public.construction_stage_progress(stage_id);

-- =========================================================
-- TRIGGERS
-- =========================================================

drop trigger if exists construction_stages_set_updated_at
  on public.construction_stages;

create trigger construction_stages_set_updated_at
before update on public.construction_stages
for each row
execute function public.set_updated_at();

drop trigger if exists construction_stages_preserve_created_by
  on public.construction_stages;

create trigger construction_stages_preserve_created_by
before update on public.construction_stages
for each row
execute function public.preserve_created_by();

drop trigger if exists construction_updates_set_updated_at
  on public.construction_updates;

create trigger construction_updates_set_updated_at
before update on public.construction_updates
for each row
execute function public.set_updated_at();

drop trigger if exists construction_updates_preserve_created_by
  on public.construction_updates;

create trigger construction_updates_preserve_created_by
before update on public.construction_updates
for each row
execute function public.preserve_created_by();

drop trigger if exists construction_stage_progress_set_updated_at
  on public.construction_stage_progress;

create trigger construction_stage_progress_set_updated_at
before update on public.construction_stage_progress
for each row
execute function public.set_updated_at();

drop trigger if exists construction_stage_progress_preserve_created_by
  on public.construction_stage_progress;

create trigger construction_stage_progress_preserve_created_by
before update on public.construction_stage_progress
for each row
execute function public.preserve_created_by();

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table public.construction_stages
  enable row level security;

alter table public.construction_updates
  enable row level security;

alter table public.construction_stage_progress
  enable row level security;

-- ETAPAS

drop policy if exists construction_stages_select
  on public.construction_stages;

create policy construction_stages_select
on public.construction_stages
for select
to authenticated
using (
  public.is_apartment_member(apartment_id)
);

drop policy if exists construction_stages_insert
  on public.construction_stages;

create policy construction_stages_insert
on public.construction_stages
for insert
to authenticated
with check (
  public.can_edit_apartment(apartment_id)
  and created_by = (select auth.uid())
);

drop policy if exists construction_stages_update
  on public.construction_stages;

create policy construction_stages_update
on public.construction_stages
for update
to authenticated
using (
  public.can_edit_apartment(apartment_id)
)
with check (
  public.can_edit_apartment(apartment_id)
);

drop policy if exists construction_stages_delete
  on public.construction_stages;

create policy construction_stages_delete
on public.construction_stages
for delete
to authenticated
using (
  public.can_edit_apartment(apartment_id)
);

-- ATUALIZAÇÕES

drop policy if exists construction_updates_select
  on public.construction_updates;

create policy construction_updates_select
on public.construction_updates
for select
to authenticated
using (
  public.is_apartment_member(apartment_id)
);

drop policy if exists construction_updates_insert
  on public.construction_updates;

create policy construction_updates_insert
on public.construction_updates
for insert
to authenticated
with check (
  public.can_edit_apartment(apartment_id)
  and created_by = (select auth.uid())
);

drop policy if exists construction_updates_update
  on public.construction_updates;

create policy construction_updates_update
on public.construction_updates
for update
to authenticated
using (
  public.can_edit_apartment(apartment_id)
)
with check (
  public.can_edit_apartment(apartment_id)
);

drop policy if exists construction_updates_delete
  on public.construction_updates;

create policy construction_updates_delete
on public.construction_updates
for delete
to authenticated
using (
  public.can_edit_apartment(apartment_id)
);

-- PROGRESSO DAS ETAPAS

drop policy if exists construction_stage_progress_select
  on public.construction_stage_progress;

create policy construction_stage_progress_select
on public.construction_stage_progress
for select
to authenticated
using (
  exists (
    select 1
    from public.construction_updates updates
    where updates.id =
      construction_stage_progress.construction_update_id
      and public.is_apartment_member(
        updates.apartment_id
      )
  )
);

drop policy if exists construction_stage_progress_insert
  on public.construction_stage_progress;

create policy construction_stage_progress_insert
on public.construction_stage_progress
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1
    from public.construction_updates updates
    join public.construction_stages stages
      on stages.id =
        construction_stage_progress.stage_id
      and stages.apartment_id =
        updates.apartment_id
    where updates.id =
      construction_stage_progress.construction_update_id
      and public.can_edit_apartment(
        updates.apartment_id
      )
  )
);

drop policy if exists construction_stage_progress_update
  on public.construction_stage_progress;

create policy construction_stage_progress_update
on public.construction_stage_progress
for update
to authenticated
using (
  exists (
    select 1
    from public.construction_updates updates
    where updates.id =
      construction_stage_progress.construction_update_id
      and public.can_edit_apartment(
        updates.apartment_id
      )
  )
)
with check (
  exists (
    select 1
    from public.construction_updates updates
    join public.construction_stages stages
      on stages.id =
        construction_stage_progress.stage_id
      and stages.apartment_id =
        updates.apartment_id
    where updates.id =
      construction_stage_progress.construction_update_id
      and public.can_edit_apartment(
        updates.apartment_id
      )
  )
);

drop policy if exists construction_stage_progress_delete
  on public.construction_stage_progress;

create policy construction_stage_progress_delete
on public.construction_stage_progress
for delete
to authenticated
using (
  exists (
    select 1
    from public.construction_updates updates
    where updates.id =
      construction_stage_progress.construction_update_id
      and public.can_edit_apartment(
        updates.apartment_id
      )
  )
);

-- =========================================================
-- PERMISSÕES
-- =========================================================

revoke all on public.construction_stages from anon;
revoke all on public.construction_updates from anon;
revoke all on public.construction_stage_progress from anon;

grant select, insert, update, delete
  on public.construction_stages
  to authenticated;

grant select, insert, update, delete
  on public.construction_updates
  to authenticated;

grant select, insert, update, delete
  on public.construction_stage_progress
  to authenticated;

commit;