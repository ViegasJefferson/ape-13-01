begin;

-- =========================================================
-- BUCKET PRIVADO DA GALERIA
-- =========================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'apartment-media',
  'apartment-media',
  false,
  6291456,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id)
do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


-- =========================================================
-- IMAGENS PRÓPRIAS DA GALERIA
-- =========================================================

create table if not exists public.apartment_media (
  id uuid primary key
    default gen_random_uuid(),

  apartment_id uuid not null
    references public.apartments(id)
    on delete cascade,

  section text not null
    check (
      section in (
        'architecture',
        'renovation',
        'inspiration',
        'other'
      )
    ),

  title text
    check (
      title is null
      or char_length(trim(title)) <= 150
    ),

  description text
    check (
      description is null
      or char_length(description) <= 1000
    ),

  room text
    check (
      room is null
      or char_length(trim(room)) <= 100
    ),

  tags text[] not null
    default '{}'::text[],

  reference_date date,

  source_type text,

  source_id uuid,

  bucket_id text not null
    default 'apartment-media',

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

  created_by uuid not null
    references auth.users(id)
    on delete restrict,

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now(),

  unique (
    bucket_id,
    storage_path
  ),

  check (
    coalesce(
      array_length(tags, 1),
      0
    ) <= 20
  )
);


create index if not exists
  apartment_media_apartment_idx
on public.apartment_media (
  apartment_id
);

create index if not exists
  apartment_media_section_idx
on public.apartment_media (
  section
);

create index if not exists
  apartment_media_reference_date_idx
on public.apartment_media (
  reference_date
);

create index if not exists
  apartment_media_source_idx
on public.apartment_media (
  source_type,
  source_id
);


-- =========================================================
-- TRIGGERS
-- =========================================================

drop trigger if exists
  apartment_media_set_updated_at
on public.apartment_media;

create trigger
  apartment_media_set_updated_at
before update
on public.apartment_media
for each row
execute function public.set_updated_at();


drop trigger if exists
  apartment_media_preserve_created_by
on public.apartment_media;

create trigger
  apartment_media_preserve_created_by
before update
on public.apartment_media
for each row
execute function public.preserve_created_by();


-- =========================================================
-- RLS DA TABELA
-- =========================================================

alter table public.apartment_media
  enable row level security;


drop policy if exists
  apartment_media_select
on public.apartment_media;

create policy apartment_media_select
on public.apartment_media
for select
to authenticated
using (
  public.is_apartment_member(
    apartment_id
  )
);


drop policy if exists
  apartment_media_insert
on public.apartment_media;

create policy apartment_media_insert
on public.apartment_media
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
  apartment_media_update
on public.apartment_media;

create policy apartment_media_update
on public.apartment_media
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
  apartment_media_delete
on public.apartment_media;

create policy apartment_media_delete
on public.apartment_media
for delete
to authenticated
using (
  public.can_edit_apartment(
    apartment_id
  )
);


revoke all
on public.apartment_media
from anon;

grant
  select,
  insert,
  update,
  delete
on public.apartment_media
to authenticated;


-- =========================================================
-- STORAGE
--
-- O primeiro diretório continua sendo apartmentId.
-- Reutiliza storage_apartment_id() já criado
-- pela estrutura da galeria da obra.
-- =========================================================

drop policy if exists
  apartment_media_objects_select
on storage.objects;

create policy apartment_media_objects_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'apartment-media'
  and public.is_apartment_member(
    public.storage_apartment_id(name)
  )
);


drop policy if exists
  apartment_media_objects_insert
on storage.objects;

create policy apartment_media_objects_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'apartment-media'
  and public.can_edit_apartment(
    public.storage_apartment_id(name)
  )
);


drop policy if exists
  apartment_media_objects_delete
on storage.objects;

create policy apartment_media_objects_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'apartment-media'
  and public.can_edit_apartment(
    public.storage_apartment_id(name)
  )
);

commit;