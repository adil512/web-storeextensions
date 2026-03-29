-- Target store / browser platform for each listing (submit + public page).

alter table public.extension_listings
  add column if not exists store_platform text not null default 'other';

update public.extension_listings
set store_platform = 'other'
where store_platform is null or trim(store_platform) = '';

alter table public.extension_listings
  drop constraint if exists extension_listings_store_platform_chk;

alter table public.extension_listings
  add constraint extension_listings_store_platform_chk
  check (store_platform in ('google', 'mozilla', 'edge', 'other'));
