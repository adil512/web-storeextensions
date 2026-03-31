-- Marketplace (/sell): opt-in flag + owner-only RPCs for approved listings (RLS-safe)

alter table public.extension_listings
  add column if not exists listed_for_sale boolean not null default false;

comment on column public.extension_listings.listed_for_sale is
  'When true and status is approved, listing appears on /sell in addition to the main directory.';

create index if not exists extension_listings_listed_for_sale_idx
  on public.extension_listings (listed_for_sale)
  where status = 'approved' and listed_for_sale = true;

-- Owner can toggle marketplace visibility on their own approved listing (single column only via UPDATE in function).
create or replace function public.set_extension_listed_for_sale(p_listing_id uuid, p_listed boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not exists (
    select 1 from public.extension_listings el
    where el.id = p_listing_id
      and el.owner_id = auth.uid()
      and el.status = 'approved'
  ) then
    raise exception 'not allowed';
  end if;
  update public.extension_listings
  set listed_for_sale = coalesce(p_listed, false),
      updated_at = now()
  where id = p_listing_id;
end;
$$;

revoke all on function public.set_extension_listed_for_sale(uuid, boolean) from public;
grant execute on function public.set_extension_listed_for_sale(uuid, boolean) to authenticated;

-- Owner can refresh reported install count + primary geography on approved listings (marketplace stats).
create or replace function public.update_extension_marketplace_metrics(
  p_listing_id uuid,
  p_current_users integer,
  p_primary_country text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  c int;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  c := coalesce(p_current_users, 0);
  if c < 0 then
    raise exception 'invalid user count';
  end if;
  if not exists (
    select 1 from public.extension_listings el
    where el.id = p_listing_id
      and el.owner_id = auth.uid()
      and el.status = 'approved'
  ) then
    raise exception 'not allowed';
  end if;
  update public.extension_listings
  set current_users = c,
      listing_country = nullif(trim(p_primary_country), ''),
      updated_at = now()
  where id = p_listing_id;
end;
$$;

revoke all on function public.update_extension_marketplace_metrics(uuid, integer, text) from public;
grant execute on function public.update_extension_marketplace_metrics(uuid, integer, text) to authenticated;
