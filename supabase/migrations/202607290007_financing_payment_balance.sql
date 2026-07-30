begin;

alter table public.financing_payments
add column if not exists remaining_balance numeric(14, 2)
check (
  remaining_balance is null
  or remaining_balance >= 0
);

create index if not exists financing_payments_paid_at_idx
  on public.financing_payments(paid_at);

commit;