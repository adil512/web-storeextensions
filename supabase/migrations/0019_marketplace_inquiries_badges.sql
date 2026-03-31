-- Marketplace inquiries (buyers), deal thread messages, manual verification badges (admin)

-- ---------------------------------------------------------------------------
-- Listing inquiries + deal room messages
-- ---------------------------------------------------------------------------
create table if not exists public.listing_inquiries (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.extension_listings (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  message text not null,
  offer_hint text,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listing_inquiries_message_len check (
    char_length(trim(message)) >= 10 and char_length(message) <= 8000
  ),
  constraint listing_inquiries_offer_hint_len check (
    offer_hint is null or char_length(offer_hint) <= 500
  )
);

create unique index if not exists listing_inquiries_one_open_per_buyer_listing
  on public.listing_inquiries (listing_id, buyer_id)
  where status = 'open';

create index if not exists listing_inquiries_listing_id_idx
  on public.listing_inquiries (listing_id, created_at desc);

create index if not exists listing_inquiries_buyer_id_idx
  on public.listing_inquiries (buyer_id, created_at desc);

create table if not exists public.deal_messages (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.listing_inquiries (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint deal_messages_body_len check (
    char_length(trim(body)) >= 1 and char_length(body) <= 8000
  )
);

create index if not exists deal_messages_inquiry_id_idx
  on public.deal_messages (inquiry_id, created_at asc);

create or replace function public.touch_listing_inquiry_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.listing_inquiries
  set updated_at = now()
  where id = new.inquiry_id;
  return new;
end;
$$;

drop trigger if exists deal_messages_touch_inquiry on public.deal_messages;
create trigger deal_messages_touch_inquiry
  after insert on public.deal_messages
  for each row execute procedure public.touch_listing_inquiry_updated_at();

alter table public.listing_inquiries enable row level security;
alter table public.deal_messages enable row level security;

-- Inquiries: buyer, listing owner, admin
create policy "listing_inquiries_select_participants"
  on public.listing_inquiries for select
  using (
    buyer_id = auth.uid()
    or exists (
      select 1 from public.extension_listings el
      where el.id = listing_id and el.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  );

create policy "listing_inquiries_insert_buyer"
  on public.listing_inquiries for insert
  with check (
    buyer_id = auth.uid()
    and exists (
      select 1 from public.extension_listings el
      where el.id = listing_id
        and el.status = 'approved'
        and coalesce(el.listed_for_sale, false) = true
        and el.owner_id is not null
        and el.owner_id <> auth.uid()
    )
  );

create policy "listing_inquiries_update_participants"
  on public.listing_inquiries for update
  using (
    buyer_id = auth.uid()
    or exists (
      select 1 from public.extension_listings el
      where el.id = listing_id and el.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  )
  with check (
    buyer_id = auth.uid()
    or exists (
      select 1 from public.extension_listings el
      where el.id = listing_id and el.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  );

-- Messages: buyer + seller on that inquiry; admin read all via inquiry select
create policy "deal_messages_select_participants"
  on public.deal_messages for select
  using (
    exists (
      select 1 from public.listing_inquiries iq
      where iq.id = inquiry_id
        and (
          iq.buyer_id = auth.uid()
          or exists (
            select 1 from public.extension_listings el
            where el.id = iq.listing_id and el.owner_id = auth.uid()
          )
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role in ('admin', 'super_admin')
          )
        )
    )
  );

create policy "deal_messages_insert_participants"
  on public.deal_messages for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.listing_inquiries iq
      join public.extension_listings el on el.id = iq.listing_id
      where iq.id = inquiry_id
        and iq.status = 'open'
        and (
          iq.buyer_id = auth.uid()
          or el.owner_id = auth.uid()
        )
    )
  );

-- ---------------------------------------------------------------------------
-- Manual verification badges (admin grants; public read on approved listings)
-- ---------------------------------------------------------------------------
create table if not exists public.listing_verification_badges (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.extension_listings (id) on delete cascade,
  badge_key text not null check (badge_key in (
    'traffic_verified',
    'revenue_documented',
    'ownership_verified',
    'seller_identity_verified'
  )),
  notes text,
  granted_by uuid not null references public.profiles (id) on delete restrict,
  granted_at timestamptz not null default now(),
  unique (listing_id, badge_key)
);

create index if not exists listing_verification_badges_listing_id_idx
  on public.listing_verification_badges (listing_id);

alter table public.listing_verification_badges enable row level security;

create policy "listing_verification_badges_select_public_approved"
  on public.listing_verification_badges for select
  using (
    exists (
      select 1 from public.extension_listings el
      where el.id = listing_id and el.status = 'approved'
    )
  );

create policy "listing_verification_badges_admin_write"
  on public.listing_verification_badges for all
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
    and granted_by = auth.uid()
  );
