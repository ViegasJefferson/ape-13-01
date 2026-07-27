begin;

create or replace function public.save_construction_update(
  p_apartment_id uuid,
  p_reference_month date,
  p_overall_progress numeric,
  p_status text,
  p_source_name text,
  p_notes text,
  p_stage_progress jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_update_id uuid;

  v_active_stage_count integer;
  v_payload_count integer;
  v_distinct_stage_count integer;
begin
  v_user_id := (select auth.uid());

  if v_user_id is null then
    raise exception 'Usuário não autenticado.'
      using errcode = '42501';
  end if;

  if not public.can_edit_apartment(
    p_apartment_id
  ) then
    raise exception
      'O usuário não possui permissão para editar este apartamento.'
      using errcode = '42501';
  end if;

  if p_reference_month is null
    or extract(day from p_reference_month) <> 1
  then
    raise exception
      'O mês de referência deve utilizar o primeiro dia do mês.';
  end if;

  if p_overall_progress is null
    or p_overall_progress < 0
    or p_overall_progress > 100
  then
    raise exception
      'O progresso geral deve estar entre 0 e 100.';
  end if;

  if p_status not in (
    'not_started',
    'in_progress',
    'paused',
    'completed'
  ) then
    raise exception
      'A situação da obra é inválida.';
  end if;

  if p_stage_progress is null
    or jsonb_typeof(p_stage_progress) <> 'array'
  then
    raise exception
      'Os percentuais das etapas são inválidos.';
  end if;

  select count(*)
  into v_active_stage_count
  from public.construction_stages stages
  where stages.apartment_id = p_apartment_id
    and stages.active = true;

  if v_active_stage_count = 0 then
    raise exception
      'Nenhuma etapa ativa foi encontrada para o apartamento.';
  end if;

  select
    count(*),
    count(distinct payload.stage_id)
  into
    v_payload_count,
    v_distinct_stage_count
  from jsonb_to_recordset(
    p_stage_progress
  ) as payload (
    stage_id uuid,
    progress numeric
  );

  if v_payload_count <> v_active_stage_count
    or v_distinct_stage_count <> v_active_stage_count
  then
    raise exception
      'Informe o percentual de todas as etapas da obra.';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(
      p_stage_progress
    ) as payload (
      stage_id uuid,
      progress numeric
    )
    where payload.progress is null
      or payload.progress < 0
      or payload.progress > 100
  ) then
    raise exception
      'O percentual das etapas deve estar entre 0 e 100.';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(
      p_stage_progress
    ) as payload (
      stage_id uuid,
      progress numeric
    )
    left join public.construction_stages stages
      on stages.id = payload.stage_id
      and stages.apartment_id = p_apartment_id
      and stages.active = true
    where stages.id is null
  ) then
    raise exception
      'Uma ou mais etapas não pertencem ao apartamento.';
  end if;

  insert into public.construction_updates (
    apartment_id,
    reference_month,
    overall_progress,
    status,
    source_name,
    notes,
    created_by
  )
  values (
    p_apartment_id,
    p_reference_month,
    p_overall_progress,
    p_status,
    nullif(trim(p_source_name), ''),
    nullif(trim(p_notes), ''),
    v_user_id
  )
  on conflict (
    apartment_id,
    reference_month
  )
  do update set
    overall_progress =
      excluded.overall_progress,

    status =
      excluded.status,

    source_name =
      excluded.source_name,

    notes =
      excluded.notes

  returning id
  into v_update_id;

  insert into public.construction_stage_progress (
    construction_update_id,
    stage_id,
    progress,
    notes,
    created_by
  )
  select
    v_update_id,
    stages.id,
    payload.progress,
    null,
    v_user_id
  from jsonb_to_recordset(
    p_stage_progress
  ) as payload (
    stage_id uuid,
    progress numeric
  )
  join public.construction_stages stages
    on stages.id = payload.stage_id
    and stages.apartment_id =
      p_apartment_id
    and stages.active = true

  on conflict (
    construction_update_id,
    stage_id
  )
  do update set
    progress = excluded.progress,
    notes = excluded.notes;

  return v_update_id;
end;
$$;

revoke all
on function public.save_construction_update(
  uuid,
  date,
  numeric,
  text,
  text,
  text,
  jsonb
)
from public;

revoke all
on function public.save_construction_update(
  uuid,
  date,
  numeric,
  text,
  text,
  text,
  jsonb
)
from anon;

grant execute
on function public.save_construction_update(
  uuid,
  date,
  numeric,
  text,
  text,
  text,
  jsonb
)
to authenticated;

commit;