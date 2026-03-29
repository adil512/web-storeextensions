-- Extension store ID (Chrome item id, etc.), analytics, reports, edit history
-- Run after 0003_listing_geo.sql

alter table public.extension_listings
  add column if not exists extension_id text,
  add column if not exists view_count integer not null default 0 check (view_count >= 0),
  add column if not exists store_click_count integer not null default 0 check (store_click_count >= 0);

update public.extension_listings
set extension_id = 'legacy-' || replace(id::text, '-', '')
where extension_id is null or trim(extension_id) = '';

alter table public.extension_listings alter column extension_id set not null;

drop index if exists extension_listings_extension_id_active_uidx;
create unique index extension_listings_extension_id_active_uidx
  on public.extension_listings (lower(trim(extension_id)))
  where status in ('pending', 'approved');

create index if not exists extension_listings_view_count_idx
  on public.extension_listings (view_count desc)
  where status = 'approved';

-- Safe public increments (no broad update RLS)
create or replace function public.increment_listing_view(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.extension_listings
  set view_count = view_count + 1, updated_at = now()
  where id = p_id and status = 'approved';
end;
$$;

create or replace function public.increment_listing_store_click(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.extension_listings
  set store_click_count = store_click_count + 1, updated_at = now()
  where id = p_id and status = 'approved';
end;
$$;

grant execute on function public.increment_listing_view(uuid) to anon, authenticated;
grant execute on function public.increment_listing_store_click(uuid) to anon, authenticated;

create table if not exists public.listing_versions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.extension_listings (id) on delete cascade,
  editor_id uuid not null references public.profiles (id) on delete cascade,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists listing_versions_listing_id_idx on public.listing_versions (listing_id, created_at desc);

alter table public.listing_versions enable row level security;

create policy "listing_versions_select_owner_or_admin"
  on public.listing_versions for select
  using (
    exists (
      select 1 from public.extension_listings el
      where el.id = listing_versions.listing_id
      and (
        el.owner_id = auth.uid()
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role in ('admin', 'super_admin')
        )
      )
    )
  );

create policy "listing_versions_insert_owner_or_admin"
  on public.listing_versions for insert
  with check (
    editor_id = auth.uid()
    and (
      exists (
        select 1 from public.extension_listings el
        where el.id = listing_id
        and el.owner_id = auth.uid()
        and el.status = 'pending'
      )
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role in ('admin', 'super_admin')
      )
    )
  );

create table if not exists public.listing_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.extension_listings (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists listing_reports_listing_id_idx on public.listing_reports (listing_id);
create index if not exists listing_reports_status_idx on public.listing_reports (status);

alter table public.listing_reports enable row level security;

create policy "listing_reports_insert_authenticated"
  on public.listing_reports for insert
  with check (
    reporter_id = auth.uid()
    and exists (
      select 1 from public.extension_listings el
      where el.id = listing_id
      and el.status = 'approved'
      and (el.owner_id is null or el.owner_id is distinct from auth.uid())
    )
  );

create policy "listing_reports_select_admin"
  on public.listing_reports for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  );

create policy "listing_reports_update_admin"
  on public.listing_reports for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  );
