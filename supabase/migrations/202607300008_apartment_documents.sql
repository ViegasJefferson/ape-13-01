begin;

-- =========================================================
-- DOCUMENTOS DO APARTAMENTO
-- =========================================================

create table if not exists public.apartment_documents (
  id uuid primary key default gen_random_uuid(),

  apartment_id uuid not null
    references public.apartments(id)
    on delete cascade,

  document_type text not null
    check (
      document_type in (
        'purchase_contract',
        'financing',
        'construction',
        'expense',
        'receipt',
        'property',
        'tax',
        'insurance',
        'renovation',
        'other'
      )
    ),

  title text not null
    check (
      char_length(trim(title)) between 1 and 150
    ),

  description text
    check (
      description is null
      or char_length(description) <= 1000
    ),

  issuer_name text
    check (
      issuer_name is null
      or char_length(issuer_name) <= 150
    ),

  reference_date date,

  is_important boolean not null default false,

  bucket_id text not null
    default 'apartment-documents',

  storage_path text not null,

  original_file_name text not null,

  mime_type text not null
    check (
      mime_type in (
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
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

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (
    bucket_id,
    storage_path
  )
);

create index if not exists apartment_documents_apartment_idx
  on public.apartment_documents(apartment_id);

create index if not exists apartment_documents_type_idx
  on public.apartment_documents(document_type);

create index if not exists apartment_documents_reference_date_idx
  on public.apartment_documents(reference_date);

create index if not exists apartment_documents_important_idx
  on public.apartment_documents(is_important);

-- =========================================================
-- TRIGGERS
-- =========================================================

drop trigger if exists apartment_documents_set_updated_at
  on public.apartment_documents;

create trigger apartment_documents_set_updated_at
before update on public.apartment_documents
for each row
execute function public.set_updated_at();

drop trigger if exists apartment_documents_preserve_created_by
  on public.apartment_documents;

create trigger apartment_documents_preserve_created_by
before update on public.apartment_documents
for each row
execute function public.preserve_created_by();

-- =========================================================
-- FUNÇÃO PARA IDENTIFICAR O APARTAMENTO PELO CAMINHO
--
-- Caminho:
-- apartmentId/tipo/ano/mes/arquivo.ext
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
-- RLS DOS METADADOS
-- =========================================================

alter table public.apartment_documents
  enable row level security;

drop policy if exists apartment_documents_select
  on public.apartment_documents;

create policy apartment_documents_select
on public.apartment_documents
for select
to authenticated
using (
  public.is_apartment_member(apartment_id)
);

drop policy if exists apartment_documents_insert
  on public.apartment_documents;

create policy apartment_documents_insert
on public.apartment_documents
for insert
to authenticated
with check (
  public.can_edit_apartment(apartment_id)
  and created_by = (select auth.uid())
  and bucket_id = 'apartment-documents'
);

drop policy if exists apartment_documents_update
  on public.apartment_documents;

create policy apartment_documents_update
on public.apartment_documents
for update
to authenticated
using (
  public.can_edit_apartment(apartment_id)
)
with check (
  public.can_edit_apartment(apartment_id)
  and bucket_id = 'apartment-documents'
);

drop policy if exists apartment_documents_delete
  on public.apartment_documents;

create policy apartment_documents_delete
on public.apartment_documents
for delete
to authenticated
using (
  public.can_edit_apartment(apartment_id)
);

revoke all
on public.apartment_documents
from anon;

grant select, insert, update, delete
on public.apartment_documents
to authenticated;

-- =========================================================
-- RLS DOS ARQUIVOS NO STORAGE
-- =========================================================

drop policy if exists apartment_documents_objects_select
  on storage.objects;

create policy apartment_documents_objects_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'apartment-documents'
  and public.is_apartment_member(
    public.storage_apartment_id(name)
  )
);

drop policy if exists apartment_documents_objects_insert
  on storage.objects;

create policy apartment_documents_objects_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'apartment-documents'
  and public.can_edit_apartment(
    public.storage_apartment_id(name)
  )
);

drop policy if exists apartment_documents_objects_delete
  on storage.objects;

create policy apartment_documents_objects_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'apartment-documents'
  and public.can_edit_apartment(
    public.storage_apartment_id(name)
  )
);

commit;