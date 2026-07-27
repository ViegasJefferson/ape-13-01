begin;

-- =========================================================
-- CATEGORIAS DE GASTOS
-- =========================================================

create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),

  apartment_id uuid not null
    references public.apartments(id)
    on delete cascade,

  name text not null,
  slug text not null,

  financial_group text not null
    check (
      financial_group in (
        'acquisition',
        'construction',
        'financing',
        'documentation',
        'renovation',
        'furnishing',
        'housing',
        'moving',
        'other'
      )
    ),

  cost_nature text not null default 'additional_cost'
    check (
      cost_nature in (
        'purchase_principal',
        'additional_cost',
        'post_delivery_cost'
      )
    ),

  active boolean not null default true,
  sort_order integer not null default 0,

  created_by uuid not null
    references auth.users(id)
    on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (apartment_id, slug)
);

create index if not exists expense_categories_apartment_id_idx
  on public.expense_categories(apartment_id);

-- =========================================================
-- SÉRIES DE GASTOS RECORRENTES
-- =========================================================

create table if not exists public.expense_series (
  id uuid primary key default gen_random_uuid(),

  apartment_id uuid not null
    references public.apartments(id)
    on delete cascade,

  category_id uuid not null
    references public.expense_categories(id)
    on delete restrict,

  title text not null,

  frequency text not null default 'monthly'
    check (
      frequency in (
        'one_time',
        'monthly',
        'annual'
      )
    ),

  variable_amount boolean not null default false,

  expected_amount numeric(14, 2)
    check (
      expected_amount is null
      or expected_amount >= 0
    ),

  start_date date not null,
  end_date date,

  default_due_day integer
    check (
      default_due_day is null
      or default_due_day between 1 and 31
    ),

  active boolean not null default true,
  notes text,

  created_by uuid not null
    references auth.users(id)
    on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (apartment_id, title),

  check (
    end_date is null
    or end_date >= start_date
  )
);

create index if not exists expense_series_apartment_id_idx
  on public.expense_series(apartment_id);

create index if not exists expense_series_category_id_idx
  on public.expense_series(category_id);

-- =========================================================
-- LANÇAMENTOS DE GASTOS
-- =========================================================

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),

  apartment_id uuid not null
    references public.apartments(id)
    on delete cascade,

  category_id uuid not null
    references public.expense_categories(id)
    on delete restrict,

  series_id uuid
    references public.expense_series(id)
    on delete set null,

  title text not null,

  reference_month date not null,

  due_date date not null,

  planned_amount numeric(14, 2)
    check (
      planned_amount is null
      or planned_amount >= 0
    ),

  paid_amount numeric(14, 2) not null default 0
    check (paid_amount >= 0),

  paid_at date,

  status text not null default 'planned'
    check (
      status in (
        'planned',
        'partial',
        'paid',
        'overdue',
        'cancelled'
      )
    ),

  vendor_name text,
  payment_method text,
  notes text,

  created_by uuid not null
    references auth.users(id)
    on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (
    extract(day from reference_month) = 1
  ),

  unique (series_id, due_date)
);

create index if not exists expenses_apartment_id_idx
  on public.expenses(apartment_id);

create index if not exists expenses_category_id_idx
  on public.expenses(category_id);

create index if not exists expenses_due_date_idx
  on public.expenses(due_date);

create index if not exists expenses_status_idx
  on public.expenses(status);

-- =========================================================
-- TRIGGERS
-- =========================================================

drop trigger if exists expense_categories_set_updated_at
  on public.expense_categories;

create trigger expense_categories_set_updated_at
before update on public.expense_categories
for each row
execute function public.set_updated_at();

drop trigger if exists expense_categories_preserve_created_by
  on public.expense_categories;

create trigger expense_categories_preserve_created_by
before update on public.expense_categories
for each row
execute function public.preserve_created_by();

drop trigger if exists expense_series_set_updated_at
  on public.expense_series;

create trigger expense_series_set_updated_at
before update on public.expense_series
for each row
execute function public.set_updated_at();

drop trigger if exists expense_series_preserve_created_by
  on public.expense_series;

create trigger expense_series_preserve_created_by
before update on public.expense_series
for each row
execute function public.preserve_created_by();

drop trigger if exists expenses_set_updated_at
  on public.expenses;

create trigger expenses_set_updated_at
before update on public.expenses
for each row
execute function public.set_updated_at();

drop trigger if exists expenses_preserve_created_by
  on public.expenses;

create trigger expenses_preserve_created_by
before update on public.expenses
for each row
execute function public.preserve_created_by();

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table public.expense_categories
  enable row level security;

alter table public.expense_series
  enable row level security;

alter table public.expenses
  enable row level security;

-- CATEGORIAS

drop policy if exists expense_categories_select
  on public.expense_categories;

create policy expense_categories_select
on public.expense_categories
for select
to authenticated
using (
  public.is_apartment_member(apartment_id)
);

drop policy if exists expense_categories_insert
  on public.expense_categories;

create policy expense_categories_insert
on public.expense_categories
for insert
to authenticated
with check (
  public.can_edit_apartment(apartment_id)
  and created_by = (select auth.uid())
);

drop policy if exists expense_categories_update
  on public.expense_categories;

create policy expense_categories_update
on public.expense_categories
for update
to authenticated
using (
  public.can_edit_apartment(apartment_id)
)
with check (
  public.can_edit_apartment(apartment_id)
);

drop policy if exists expense_categories_delete
  on public.expense_categories;

create policy expense_categories_delete
on public.expense_categories
for delete
to authenticated
using (
  public.is_apartment_owner(apartment_id)
);

-- SÉRIES

drop policy if exists expense_series_select
  on public.expense_series;

create policy expense_series_select
on public.expense_series
for select
to authenticated
using (
  public.is_apartment_member(apartment_id)
);

drop policy if exists expense_series_insert
  on public.expense_series;

create policy expense_series_insert
on public.expense_series
for insert
to authenticated
with check (
  public.can_edit_apartment(apartment_id)
  and created_by = (select auth.uid())
);

drop policy if exists expense_series_update
  on public.expense_series;

create policy expense_series_update
on public.expense_series
for update
to authenticated
using (
  public.can_edit_apartment(apartment_id)
)
with check (
  public.can_edit_apartment(apartment_id)
);

drop policy if exists expense_series_delete
  on public.expense_series;

create policy expense_series_delete
on public.expense_series
for delete
to authenticated
using (
  public.can_edit_apartment(apartment_id)
);

-- DESPESAS

drop policy if exists expenses_select
  on public.expenses;

create policy expenses_select
on public.expenses
for select
to authenticated
using (
  public.is_apartment_member(apartment_id)
);

drop policy if exists expenses_insert
  on public.expenses;

create policy expenses_insert
on public.expenses
for insert
to authenticated
with check (
  public.can_edit_apartment(apartment_id)
  and created_by = (select auth.uid())
);

drop policy if exists expenses_update
  on public.expenses;

create policy expenses_update
on public.expenses
for update
to authenticated
using (
  public.can_edit_apartment(apartment_id)
)
with check (
  public.can_edit_apartment(apartment_id)
);

drop policy if exists expenses_delete
  on public.expenses;

create policy expenses_delete
on public.expenses
for delete
to authenticated
using (
  public.can_edit_apartment(apartment_id)
);

-- =========================================================
-- PERMISSÕES
-- =========================================================

revoke all on public.expense_categories from anon;
revoke all on public.expense_series from anon;
revoke all on public.expenses from anon;

grant select, insert, update, delete
  on public.expense_categories
  to authenticated;

grant select, insert, update, delete
  on public.expense_series
  to authenticated;

grant select, insert, update, delete
  on public.expenses
  to authenticated;

commit;