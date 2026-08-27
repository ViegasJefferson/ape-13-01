begin;

alter table public.household_items
  add column if not exists additional_product_urls text[]
  not null
  default '{}'::text[];

alter table public.household_items
  drop constraint if exists household_items_additional_product_urls_check;

alter table public.household_items
  add constraint household_items_additional_product_urls_check
  check (
    coalesce(
      array_length(
        additional_product_urls,
        1
      ),
      0
    ) <= 10
  );

commit;