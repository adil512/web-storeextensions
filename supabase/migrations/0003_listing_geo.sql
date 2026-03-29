-- Approximate submitter location from hosting / CDN headers (filled by app on insert).
alter table public.extension_listings
  add column if not exists listing_country text,
  add column if not exists listing_region text,
  add column if not exists listing_city text;

comment on column public.extension_listings.listing_country is 'ISO country code or name from edge headers when listing was submitted';
comment on column public.extension_listings.listing_region is 'Region/state from edge headers when available';
comment on column public.extension_listings.listing_city is 'City from edge headers when available';
