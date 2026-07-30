begin;

-- =========================================================
-- METADADOS DAS IMAGENS DA OBRA
-- =========================================================

create table if not exists public.construction_media (
  id uuid primary key default gen_random_uuid(),

  apartment_id uuid not null
    references public.apartments(id)
    on delete cascade,

  stage_id uuid
    references public.construction_stages(id)
    on delete set null,

  reference_month date not null,

  media_type text not null default 'image'
    check (
      media_type in ('image', 'video')
    ),

  bucket_id text not null default 'construction-media',

  storage_path text not null,

  original_file_name text not null,

  mime_type text not null
    check (
      mime_type in (
        'image/jpeg',
        'image/png',
        'image/webp'
      )
    ),

  size_bytes bigint not null
    check (
      size_bytes > 0
      and size_bytes <= 6291456
    ),

  title text
    check (
      title is null
      or char_length(title) <= 150
    ),

  description text
    check (
      description is null
      or char_length(description) <= 1000
    ),

  source_name text
    check (
      source_name is null
      or char_length(source_name) <= 150
    ),

  captured_at date,

  created_by uuid not null
    references auth.users(id)
    on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (
    extract(day from reference_month) = 1
  ),

  unique (
    bucket_id,
    storage_path
  )
);

create index if not exists construction_media_apartment_idx
  on public.construction_media(apartment_id);

create index if not exists construction_media_reference_month_idx
  on public.construction_media(reference_month);

create index if not exists construction_media_stage_idx
  on public.construction_media(stage_id);

-- =========================================================
-- TRIGGERS
-- =========================================================

drop trigger if exists construction_media_set_updated_at
  on public.construction_media;

create trigger construction_media_set_updated_at
before update on public.construction_media
for each row
execute function public.set_updated_at();

drop trigger if exists construction_media_preserve_created_by
  on public.construction_media;

create trigger construction_media_preserve_created_by
before update on public.construction_media
for each row
execute function public.preserve_created_by();

-- =========================================================
-- FUNÇÃO AUXILIAR PARA IDENTIFICAR O APARTAMENTO
-- PELO PRIMEIRO DIRETÓRIO DO ARQUIVO
-- =========================================================

create or replace function public.storage_apartment_id(
  object_name text
)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
declare
  folder_name text;
begin
  folder_name :=
    (storage.foldername(object_name))[1];

  if folder_name is null then
    return null;
  end if;

  return folder_name::uuid;

exception
  when invalid_text_representation then
    return null;
end;
$$;

revoke all
on function public.storage_apartment_id(text)
from public;

grant execute
on function public.storage_apartment_id(text)
to authenticated;

-- =========================================================
-- RLS DA TABELA DE METADADOS
-- =========================================================

alter table public.construction_media
  enable row level security;

drop policy if exists construction_media_select
  on public.construction_media;

create policy construction_media_select
on public.construction_media
for select
to authenticated
using (
  public.is_apartment_member(apartment_id)
);

drop policy if exists construction_media_insert
  on public.construction_media;

create policy construction_media_insert
on public.construction_media
for insert
to authenticated
with check (
  public.can_edit_apartment(apartment_id)

  and created_by = (select auth.uid())

  and (
    stage_id is null
    or exists (
      select 1
      from public.construction_stages stages
      where stages.id =
        construction_media.stage_id
        and stages.apartment_id =
          construction_media.apartment_id
        and stages.active = true
    )
  )
);

drop policy if exists construction_media_update
  on public.construction_media;

create policy construction_media_update
on public.construction_media
for update
to authenticated
using (
  public.can_edit_apartment(apartment_id)
)
with check (
  public.can_edit_apartment(apartment_id)

  and (
    stage_id is null
    or exists (
      select 1
      from public.construction_stages stages
      where stages.id =
        construction_media.stage_id
        and stages.apartment_id =
          construction_media.apartment_id
        and stages.active = true
    )
  )
);

drop policy if exists construction_media_delete
  on public.construction_media;

create policy construction_media_delete
on public.construction_media
for delete
to authenticated
using (
  public.can_edit_apartment(apartment_id)
);

revoke all
on public.construction_media
from anon;

grant select, insert, update, delete
on public.construction_media
to authenticated;

-- =========================================================
-- RLS DOS ARQUIVOS NO STORAGE
--
-- Caminho utilizado:
-- apartmentId/AAAA-MM/arquivo.ext
-- =========================================================

drop policy if exists construction_media_objects_select
  on storage.objects;

create policy construction_media_objects_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'construction-media'

  and public.is_apartment_member(
    public.storage_apartment_id(name)
  )
);

drop policy if exists construction_media_objects_insert
  on storage.objects;

create policy construction_media_objects_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'construction-media'

  and public.can_edit_apartment(
    public.storage_apartment_id(name)
  )
);

drop policy if exists construction_media_objects_delete
  on storage.objects;

create policy construction_media_objects_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'construction-media'

  and public.can_edit_apartment(
    public.storage_apartment_id(name)
  )
);

commit;