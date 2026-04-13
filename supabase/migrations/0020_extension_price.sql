alter table public.extension_listings
  add column if not exists price_usd numeric(10,2);

alter table public.extension_listings
  drop constraint if exists extension_listings_price_usd_nonnegative_chk;

alter table public.extension_listings
  add constraint extension_listings_price_usd_nonnegative_chk
  check (price_usd is null or price_usd >= 0);

comment on column public.extension_listings.price_usd is
  'Optional USD price supplied by the listing owner. Null means not provided.';
