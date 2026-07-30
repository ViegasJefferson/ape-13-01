begin;

-- =========================================================
-- VÍNCULOS DOS DOCUMENTOS
-- =========================================================

alter table public.apartment_documents
add column if not exists expense_id uuid
references public.expenses(id)
on delete set null;

alter table public.apartment_documents
add column if not exists financing_payment_id uuid
references public.financing_payments(id)
on delete set null;

create index if not exists apartment_documents_expense_idx
  on public.apartment_documents(expense_id);

create index if not exists apartment_documents_payment_idx
  on public.apartment_documents(financing_payment_id);

-- Um documento pode ficar sem vínculo,
-- mas não pode apontar simultaneamente
-- para um gasto e uma parcela.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname =
      'apartment_documents_single_link_check'
  ) then
    alter table public.apartment_documents
    add constraint apartment_documents_single_link_check
    check (
      num_nonnulls(
        expense_id,
        financing_payment_id
      ) <= 1
    );
  end if;
end;
$$;

-- =========================================================
-- VALIDA SE O VÍNCULO PERTENCE AO MESMO APARTAMENTO
-- =========================================================

create or replace function
public.validate_apartment_document_link()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_expense_apartment_id uuid;
  v_payment_apartment_id uuid;
begin
  if new.expense_id is not null then
    select expenses.apartment_id
    into v_expense_apartment_id
    from public.expenses expenses
    where expenses.id = new.expense_id;

    if v_expense_apartment_id is null then
      raise exception
        'O gasto vinculado não foi encontrado.';
    end if;

    if v_expense_apartment_id <> new.apartment_id then
      raise exception
        'O gasto não pertence ao mesmo apartamento do documento.';
    end if;
  end if;

  if new.financing_payment_id is not null then
    select contracts.apartment_id
    into v_payment_apartment_id
    from public.financing_payments payments
    join public.financing_contracts contracts
      on contracts.id = payments.contract_id
    where payments.id =
      new.financing_payment_id;

    if v_payment_apartment_id is null then
      raise exception
        'A parcela vinculada não foi encontrada.';
    end if;

    if v_payment_apartment_id <> new.apartment_id then
      raise exception
        'A parcela não pertence ao mesmo apartamento do documento.';
    end if;
  end if;

  return new;
end;
$$;

revoke all
on function public.validate_apartment_document_link()
from public;

drop trigger if exists
  apartment_documents_validate_link
on public.apartment_documents;

create trigger apartment_documents_validate_link
before insert or update of
  apartment_id,
  expense_id,
  financing_payment_id
on public.apartment_documents
for each row
execute function
  public.validate_apartment_document_link();

commit;