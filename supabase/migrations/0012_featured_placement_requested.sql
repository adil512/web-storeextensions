-- Submitter indicates they want paid featured placement; admins verify payment and set featured_order.

alter table public.extension_listings
  add column if not exists featured_placement_requested boolean not null default false;

comment on column public.extension_listings.featured_placement_requested is
  'True when submitter opted in to featured placement; admin verifies payment and sets featured_order.';
