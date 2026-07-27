begin;

-- =========================================================
-- GERAÇÃO DE LANÇAMENTOS MENSAIS
-- =========================================================

create or replace function public.generate_monthly_expenses(
  target_reference_month date
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_reference_month date;
  inserted_rows integer := 0;
begin
  if target_reference_month is null then
    raise exception 'O mês de referência não pode ser nulo.';
  end if;

  normalized_reference_month :=
    date_trunc(
      'month',
      target_reference_month
    )::date;

  insert into public.expenses (
    apartment_id,
    category_id,
    series_id,
    title,
    reference_month,
    due_date,
    planned_amount,
    paid_amount,
    paid_at,
    status,
    vendor_name,
    payment_method,
    notes,
    created_by
  )
  select
    series.apartment_id,
    series.category_id,
    series.id,

    series.title
      || ' — '
      || to_char(
        normalized_reference_month,
        'MM/YYYY'
      ),

    normalized_reference_month,

    make_date(
      extract(
        year
        from normalized_reference_month
      )::integer,

      extract(
        month
        from normalized_reference_month
      )::integer,

      least(
        coalesce(
          series.default_due_day,
          extract(
            day
            from series.start_date
          )::integer
        ),

        extract(
          day
          from (
            normalized_reference_month
            + interval '1 month'
            - interval '1 day'
          )
        )::integer
      )
    ),

    case
      when series.variable_amount
        then null
      else series.expected_amount
    end,

    0,
    null,
    'planned',
    null,
    null,

    case
      when series.variable_amount
        then 'Valor da cobrança ainda não informado.'
      else 'Lançamento gerado automaticamente.'
    end,

    series.created_by

  from public.expense_series series

  where series.active = true

    and series.frequency = 'monthly'

    and date_trunc(
      'month',
      series.start_date
    )::date <= normalized_reference_month

    and (
      series.end_date is null

      or date_trunc(
        'month',
        series.end_date
      )::date >= normalized_reference_month
    )

  on conflict (
    series_id,
    due_date
  )
  do nothing;

  get diagnostics inserted_rows = row_count;

  return inserted_rows;
end;
$$;

-- A função será executada pelo próprio banco.
-- Usuários comuns não poderão chamá-la diretamente.

revoke all
on function public.generate_monthly_expenses(date)
from public;

revoke all
on function public.generate_monthly_expenses(date)
from anon;

revoke all
on function public.generate_monthly_expenses(date)
from authenticated;

-- =========================================================
-- AGENDAMENTO
-- Dia 25 de cada mês, às 12:00 UTC.
-- Equivale a aproximadamente 09:00 em Brasília.
-- =========================================================

select cron.schedule(
  'generate-next-month-expenses',
  '0 12 25 * *',
  $job$
    select public.generate_monthly_expenses(
      (
        date_trunc(
          'month',
          now() at time zone 'America/Sao_Paulo'
        )
        + interval '1 month'
      )::date
    );
  $job$
);

commit;