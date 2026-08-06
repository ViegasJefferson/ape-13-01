begin;

alter table public.household_items
  add column if not exists product_image_url text;

alter table public.household_items
  drop constraint if exists household_items_product_image_url_check;

alter table public.household_items
  add constraint household_items_product_image_url_check
  check (
    product_image_url is null
    or char_length(trim(product_image_url)) <= 2000
  );

commit;