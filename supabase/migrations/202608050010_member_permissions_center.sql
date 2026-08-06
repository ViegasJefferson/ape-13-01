begin;

-- =========================================================
-- GARANTE UM ÚNICO VÍNCULO POR USUÁRIO E APARTAMENTO
-- =========================================================

create unique index if not exists
  apartment_members_apartment_user_uidx
on public.apartment_members (
  apartment_id,
  user_id
);

-- =========================================================
-- LISTA OS MEMBROS DO APARTAMENTO
-- =========================================================

create or replace function
public.get_apartment_member_directory(
  p_apartment_id uuid
)
returns table (
  member_id uuid,
  user_id uuid,
  email text,
  display_name text,
  member_role text,
  is_current_user boolean
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_apartment_member(
    p_apartment_id
  ) then
    raise exception using
      errcode = '42501',
      message =
        'Você não possui acesso a este apartamento.';
  end if;

  return query
  select
    members.id as member_id,
    members.user_id,
    coalesce(
      users.email,
      'E-mail não informado'
    )::text as email,

    coalesce(
      nullif(
        trim(
          users.raw_user_meta_data
            ->> 'full_name'
        ),
        ''
      ),
      nullif(
        trim(
          users.raw_user_meta_data
            ->> 'name'
        ),
        ''
      ),
      split_part(
        coalesce(users.email, 'Usuário'),
        '@',
        1
      )
    )::text as display_name,

    members.role::text as member_role,

    (
      members.user_id =
      (select auth.uid())
    ) as is_current_user

  from public.apartment_members members

  join auth.users users
    on users.id = members.user_id

  where
    members.apartment_id =
      p_apartment_id

  order by
    case members.role
      when 'owner' then 1
      when 'editor' then 2
      when 'viewer' then 3
      else 4
    end,
    lower(
      coalesce(users.email, '')
    );
end;
$$;

-- =========================================================
-- ADICIONA MEMBRO PELO E-MAIL
-- O USUÁRIO PRECISA JÁ TER CONTA
-- =========================================================

create or replace function
public.add_apartment_member_by_email(
  p_apartment_id uuid,
  p_email text,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  if not public.is_apartment_owner(
    p_apartment_id
  ) then
    raise exception using
      errcode = '42501',
      message =
        'Somente o proprietário pode adicionar membros.';
  end if;

  if p_role not in (
    'owner',
    'editor',
    'viewer'
  ) then
    raise exception
      'A permissão informada é inválida.';
  end if;

  if nullif(trim(p_email), '') is null then
    raise exception
      'Informe o e-mail do usuário.';
  end if;

  select users.id
  into v_user_id
  from auth.users users
  where
    lower(users.email) =
      lower(trim(p_email))
  limit 1;

  if v_user_id is null then
    raise exception
      'Nenhum usuário cadastrado foi encontrado com esse e-mail.';
  end if;

  if exists (
    select 1
    from public.apartment_members members
    where
      members.apartment_id =
        p_apartment_id
      and members.user_id =
        v_user_id
  ) then
    raise exception
      'Este usuário já faz parte do apartamento.';
  end if;

  insert into public.apartment_members (
    apartment_id,
    user_id,
    role
  )
  values (
    p_apartment_id,
    v_user_id,
    p_role
  );
end;
$$;

-- =========================================================
-- ALTERA A FUNÇÃO DO MEMBRO
-- =========================================================

create or replace function
public.update_apartment_member_role(
  p_member_id uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_apartment_id uuid;
  v_current_role text;
  v_owner_count integer;
begin
  if p_role not in (
    'owner',
    'editor',
    'viewer'
  ) then
    raise exception
      'A permissão informada é inválida.';
  end if;

  select
    members.apartment_id,
    members.role::text
  into
    v_apartment_id,
    v_current_role
  from public.apartment_members members
  where members.id = p_member_id;

  if v_apartment_id is null then
    raise exception
      'O membro informado não foi encontrado.';
  end if;

  if not public.is_apartment_owner(
    v_apartment_id
  ) then
    raise exception using
      errcode = '42501',
      message =
        'Somente o proprietário pode alterar permissões.';
  end if;

  if
    v_current_role = 'owner'
    and p_role <> 'owner'
  then
    select count(*)
    into v_owner_count
    from public.apartment_members members
    where
      members.apartment_id =
        v_apartment_id
      and members.role = 'owner';

    if v_owner_count <= 1 then
      raise exception
        'O apartamento precisa ter pelo menos um proprietário.';
    end if;
  end if;

  update public.apartment_members
  set role = p_role
  where id = p_member_id;
end;
$$;

-- =========================================================
-- REMOVE MEMBRO
-- =========================================================

create or replace function
public.remove_apartment_member(
  p_member_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_apartment_id uuid;
  v_current_role text;
  v_owner_count integer;
begin
  select
    members.apartment_id,
    members.role::text
  into
    v_apartment_id,
    v_current_role
  from public.apartment_members members
  where members.id = p_member_id;

  if v_apartment_id is null then
    raise exception
      'O membro informado não foi encontrado.';
  end if;

  if not public.is_apartment_owner(
    v_apartment_id
  ) then
    raise exception using
      errcode = '42501',
      message =
        'Somente o proprietário pode remover membros.';
  end if;

  if v_current_role = 'owner' then
    select count(*)
    into v_owner_count
    from public.apartment_members members
    where
      members.apartment_id =
        v_apartment_id
      and members.role = 'owner';

    if v_owner_count <= 1 then
      raise exception
        'O único proprietário não pode ser removido.';
    end if;
  end if;

  delete from public.apartment_members
  where id = p_member_id;
end;
$$;

-- =========================================================
-- PERMISSÕES DAS FUNÇÕES
-- =========================================================

revoke all
on function
  public.get_apartment_member_directory(uuid)
from public;

revoke all
on function
  public.add_apartment_member_by_email(
    uuid,
    text,
    text
  )
from public;

revoke all
on function
  public.update_apartment_member_role(
    uuid,
    text
  )
from public;

revoke all
on function
  public.remove_apartment_member(uuid)
from public;

grant execute
on function
  public.get_apartment_member_directory(uuid)
to authenticated;

grant execute
on function
  public.add_apartment_member_by_email(
    uuid,
    text,
    text
  )
to authenticated;

grant execute
on function
  public.update_apartment_member_role(
    uuid,
    text
  )
to authenticated;

grant execute
on function
  public.remove_apartment_member(uuid)
to authenticated;

commit;