begin;

create extension if not exists pgcrypto;

-- =========================================================
-- FUNÇÕES AUXILIARES
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.preserve_created_by()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.created_by = old.created_by;
  return new;
end;
$$;

-- =========================================================
-- APARTAMENTOS
-- =========================================================

create table if not exists public.apartments (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  project_name text,
  developer_name text,
  block text,
  unit text,

  purchase_price numeric(14, 2)
    check (purchase_price is null or purchase_price >= 0),

  delivery_date date,

  created_by uuid not null
    references auth.users(id)
    on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- MORADORES E USUÁRIOS
-- =========================================================

create table if not exists public.apartment_members (
  apartment_id uuid not null
    references public.apartments(id)
    on delete cascade,

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  role text not null default 'viewer'
    check (role in ('owner', 'editor', 'viewer')),

  created_at timestamptz not null default now(),

  primary key (apartment_id, user_id)
);

create index if not exists apartment_members_user_id_idx
  on public.apartment_members(user_id);

-- =========================================================
-- CONTRATOS DE FINANCIAMENTO
-- =========================================================

create table if not exists public.financing_contracts (
  id uuid primary key default gen_random_uuid(),

  apartment_id uuid not null
    references public.apartments(id)
    on delete cascade,

  bank_name text not null,

  amortization_system text not null default 'PRICE'
    check (
      amortization_system in ('PRICE', 'SAC', 'OUTRO')
    ),

  financed_amount numeric(14, 2) not null
    check (financed_amount > 0),

  contractual_term_months integer not null
    check (contractual_term_months > 0),

  base_payment numeric(14, 2) not null
    check (base_payment > 0),

  initial_monthly_charge numeric(14, 2)
    check (
      initial_monthly_charge is null
      or initial_monthly_charge >= 0
    ),

  nominal_annual_rate numeric(8, 4)
    check (
      nominal_annual_rate is null
      or nominal_annual_rate >= 0
    ),

  effective_annual_rate numeric(8, 4)
    check (
      effective_annual_rate is null
      or effective_annual_rate >= 0
    ),

  monthly_tr_rate numeric(8, 4) not null default 0
    check (monthly_tr_rate >= 0),

  start_date date,
  active boolean not null default true,
  notes text,

  created_by uuid not null
    references auth.users(id)
    on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists financing_contracts_apartment_id_idx
  on public.financing_contracts(apartment_id);

-- =========================================================
-- PAGAMENTOS MENSAIS
-- =========================================================

create table if not exists public.financing_payments (
  id uuid primary key default gen_random_uuid(),

  contract_id uuid not null
    references public.financing_contracts(id)
    on delete cascade,

  installment_number integer not null
    check (installment_number > 0),

  due_date date not null,
  paid_at date,

  regular_payment numeric(14, 2) not null default 0
    check (regular_payment >= 0),

  interest_amount numeric(14, 2) not null default 0
    check (interest_amount >= 0),

  principal_amount numeric(14, 2) not null default 0
    check (principal_amount >= 0),

  tr_adjustment numeric(14, 2) not null default 0
    check (tr_adjustment >= 0),

  mio_amount numeric(14, 2) not null default 0
    check (mio_amount >= 0),

  dfi_amount numeric(14, 2) not null default 0
    check (dfi_amount >= 0),

  administrative_fee numeric(14, 2) not null default 0
    check (administrative_fee >= 0),

  other_fees numeric(14, 2) not null default 0
    check (other_fees >= 0),

  total_paid numeric(14, 2) not null default 0
    check (total_paid >= 0),

  payment_status text not null default 'planned'
    check (
      payment_status in (
        'planned',
        'paid',
        'overdue',
        'cancelled'
      )
    ),

  notes text,

  created_by uuid not null
    references auth.users(id)
    on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (contract_id, installment_number)
);

create index if not exists financing_payments_contract_id_idx
  on public.financing_payments(contract_id);

create index if not exists financing_payments_due_date_idx
  on public.financing_payments(due_date);

-- =========================================================
-- AMORTIZAÇÕES EXTRAORDINÁRIAS
-- =========================================================

create table if not exists public.extra_amortizations (
  id uuid primary key default gen_random_uuid(),

  contract_id uuid not null
    references public.financing_contracts(id)
    on delete cascade,

  amortization_date date not null,

  amount numeric(14, 2) not null
    check (amount > 0),

  reduction_type text not null default 'term'
    check (
      reduction_type in ('term', 'payment')
    ),

  notes text,

  created_by uuid not null
    references auth.users(id)
    on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists extra_amortizations_contract_id_idx
  on public.extra_amortizations(contract_id);

create index if not exists extra_amortizations_date_idx
  on public.extra_amortizations(amortization_date);

-- =========================================================
-- TRIGGERS
-- =========================================================

drop trigger if exists apartments_set_updated_at
  on public.apartments;

create trigger apartments_set_updated_at
before update on public.apartments
for each row
execute function public.set_updated_at();

drop trigger if exists apartments_preserve_created_by
  on public.apartments;

create trigger apartments_preserve_created_by
before update on public.apartments
for each row
execute function public.preserve_created_by();

drop trigger if exists financing_contracts_set_updated_at
  on public.financing_contracts;

create trigger financing_contracts_set_updated_at
before update on public.financing_contracts
for each row
execute function public.set_updated_at();

drop trigger if exists financing_contracts_preserve_created_by
  on public.financing_contracts;

create trigger financing_contracts_preserve_created_by
before update on public.financing_contracts
for each row
execute function public.preserve_created_by();

drop trigger if exists financing_payments_set_updated_at
  on public.financing_payments;

create trigger financing_payments_set_updated_at
before update on public.financing_payments
for each row
execute function public.set_updated_at();

drop trigger if exists financing_payments_preserve_created_by
  on public.financing_payments;

create trigger financing_payments_preserve_created_by
before update on public.financing_payments
for each row
execute function public.preserve_created_by();

drop trigger if exists extra_amortizations_set_updated_at
  on public.extra_amortizations;

create trigger extra_amortizations_set_updated_at
before update on public.extra_amortizations
for each row
execute function public.set_updated_at();

drop trigger if exists extra_amortizations_preserve_created_by
  on public.extra_amortizations;

create trigger extra_amortizations_preserve_created_by
before update on public.extra_amortizations
for each row
execute function public.preserve_created_by();

-- =========================================================
-- FUNÇÕES DE AUTORIZAÇÃO
-- =========================================================

create or replace function public.is_apartment_member(
  target_apartment_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.apartment_members members
    where members.apartment_id = target_apartment_id
      and members.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_apartment_owner(
  target_apartment_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.apartment_members members
    where members.apartment_id = target_apartment_id
      and members.user_id = (select auth.uid())
      and members.role = 'owner'
  );
$$;

create or replace function public.can_edit_apartment(
  target_apartment_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.apartment_members members
    where members.apartment_id = target_apartment_id
      and members.user_id = (select auth.uid())
      and members.role in ('owner', 'editor')
  );
$$;

create or replace function public.is_apartment_creator(
  target_apartment_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.apartments apartments
    where apartments.id = target_apartment_id
      and apartments.created_by = (select auth.uid())
  );
$$;

create or replace function public.can_access_financing_contract(
  target_contract_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.financing_contracts contracts
    join public.apartment_members members
      on members.apartment_id = contracts.apartment_id
    where contracts.id = target_contract_id
      and members.user_id = (select auth.uid())
  );
$$;

create or replace function public.can_edit_financing_contract(
  target_contract_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.financing_contracts contracts
    join public.apartment_members members
      on members.apartment_id = contracts.apartment_id
    where contracts.id = target_contract_id
      and members.user_id = (select auth.uid())
      and members.role in ('owner', 'editor')
  );
$$;

revoke all on function public.is_apartment_member(uuid)
  from public;

revoke all on function public.is_apartment_owner(uuid)
  from public;

revoke all on function public.can_edit_apartment(uuid)
  from public;

revoke all on function public.is_apartment_creator(uuid)
  from public;

revoke all on function public.can_access_financing_contract(uuid)
  from public;

revoke all on function public.can_edit_financing_contract(uuid)
  from public;

grant execute on function public.is_apartment_member(uuid)
  to authenticated;

grant execute on function public.is_apartment_owner(uuid)
  to authenticated;

grant execute on function public.can_edit_apartment(uuid)
  to authenticated;

grant execute on function public.is_apartment_creator(uuid)
  to authenticated;

grant execute on function public.can_access_financing_contract(uuid)
  to authenticated;

grant execute on function public.can_edit_financing_contract(uuid)
  to authenticated;

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table public.apartments
  enable row level security;

alter table public.apartment_members
  enable row level security;

alter table public.financing_contracts
  enable row level security;

alter table public.financing_payments
  enable row level security;

alter table public.extra_amortizations
  enable row level security;

-- APARTMENTS

drop policy if exists apartments_select
  on public.apartments;

create policy apartments_select
on public.apartments
for select
to authenticated
using (
  public.is_apartment_member(id)
);

drop policy if exists apartments_insert
  on public.apartments;

create policy apartments_insert
on public.apartments
for insert
to authenticated
with check (
  created_by = (select auth.uid())
);

drop policy if exists apartments_update
  on public.apartments;

create policy apartments_update
on public.apartments
for update
to authenticated
using (
  public.can_edit_apartment(id)
)
with check (
  public.can_edit_apartment(id)
);

drop policy if exists apartments_delete
  on public.apartments;

create policy apartments_delete
on public.apartments
for delete
to authenticated
using (
  public.is_apartment_owner(id)
);

-- APARTMENT MEMBERS

drop policy if exists apartment_members_select
  on public.apartment_members;

create policy apartment_members_select
on public.apartment_members
for select
to authenticated
using (
  public.is_apartment_member(apartment_id)
);

drop policy if exists apartment_members_insert
  on public.apartment_members;

create policy apartment_members_insert
on public.apartment_members
for insert
to authenticated
with check (
  public.is_apartment_owner(apartment_id)
  or (
    user_id = (select auth.uid())
    and role = 'owner'
    and public.is_apartment_creator(apartment_id)
  )
);

drop policy if exists apartment_members_update
  on public.apartment_members;

create policy apartment_members_update
on public.apartment_members
for update
to authenticated
using (
  public.is_apartment_owner(apartment_id)
)
with check (
  public.is_apartment_owner(apartment_id)
);

drop policy if exists apartment_members_delete
  on public.apartment_members;

create policy apartment_members_delete
on public.apartment_members
for delete
to authenticated
using (
  public.is_apartment_owner(apartment_id)
);

-- FINANCING CONTRACTS

drop policy if exists financing_contracts_select
  on public.financing_contracts;

create policy financing_contracts_select
on public.financing_contracts
for select
to authenticated
using (
  public.is_apartment_member(apartment_id)
);

drop policy if exists financing_contracts_insert
  on public.financing_contracts;

create policy financing_contracts_insert
on public.financing_contracts
for insert
to authenticated
with check (
  public.can_edit_apartment(apartment_id)
  and created_by = (select auth.uid())
);

drop policy if exists financing_contracts_update
  on public.financing_contracts;

create policy financing_contracts_update
on public.financing_contracts
for update
to authenticated
using (
  public.can_edit_apartment(apartment_id)
)
with check (
  public.can_edit_apartment(apartment_id)
);

drop policy if exists financing_contracts_delete
  on public.financing_contracts;

create policy financing_contracts_delete
on public.financing_contracts
for delete
to authenticated
using (
  public.is_apartment_owner(apartment_id)
);

-- FINANCING PAYMENTS

drop policy if exists financing_payments_select
  on public.financing_payments;

create policy financing_payments_select
on public.financing_payments
for select
to authenticated
using (
  public.can_access_financing_contract(contract_id)
);

drop policy if exists financing_payments_insert
  on public.financing_payments;

create policy financing_payments_insert
on public.financing_payments
for insert
to authenticated
with check (
  public.can_edit_financing_contract(contract_id)
  and created_by = (select auth.uid())
);

drop policy if exists financing_payments_update
  on public.financing_payments;

create policy financing_payments_update
on public.financing_payments
for update
to authenticated
using (
  public.can_edit_financing_contract(contract_id)
)
with check (
  public.can_edit_financing_contract(contract_id)
);

drop policy if exists financing_payments_delete
  on public.financing_payments;

create policy financing_payments_delete
on public.financing_payments
for delete
to authenticated
using (
  public.can_edit_financing_contract(contract_id)
);

-- EXTRA AMORTIZATIONS

drop policy if exists extra_amortizations_select
  on public.extra_amortizations;

create policy extra_amortizations_select
on public.extra_amortizations
for select
to authenticated
using (
  public.can_access_financing_contract(contract_id)
);

drop policy if exists extra_amortizations_insert
  on public.extra_amortizations;

create policy extra_amortizations_insert
on public.extra_amortizations
for insert
to authenticated
with check (
  public.can_edit_financing_contract(contract_id)
  and created_by = (select auth.uid())
);

drop policy if exists extra_amortizations_update
  on public.extra_amortizations;

create policy extra_amortizations_update
on public.extra_amortizations
for update
to authenticated
using (
  public.can_edit_financing_contract(contract_id)
)
with check (
  public.can_edit_financing_contract(contract_id)
);

drop policy if exists extra_amortizations_delete
  on public.extra_amortizations;

create policy extra_amortizations_delete
on public.extra_amortizations
for delete
to authenticated
using (
  public.can_edit_financing_contract(contract_id)
);

-- =========================================================
-- PERMISSÕES
-- =========================================================

revoke all on public.apartments from anon;
revoke all on public.apartment_members from anon;
revoke all on public.financing_contracts from anon;
revoke all on public.financing_payments from anon;
revoke all on public.extra_amortizations from anon;

grant select, insert, update, delete
  on public.apartments
  to authenticated;

grant select, insert, update, delete
  on public.apartment_members
  to authenticated;

grant select, insert, update, delete
  on public.financing_contracts
  to authenticated;

grant select, insert, update, delete
  on public.financing_payments
  to authenticated;

grant select, insert, update, delete
  on public.extra_amortizations
  to authenticated;

commit;