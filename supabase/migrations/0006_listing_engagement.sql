-- Upvotes and comments on approved listings; upvote_count denormalized for fast category cards.

alter table public.extension_listings
  add column if not exists upvote_count integer not null default 0 check (upvote_count >= 0);

create table if not exists public.listing_upvotes (
  listing_id uuid not null references public.extension_listings (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (listing_id, user_id)
);

create index if not exists listing_upvotes_listing_id_idx on public.listing_upvotes (listing_id);
create index if not exists listing_upvotes_user_id_idx on public.listing_upvotes (user_id);

create table if not exists public.listing_comments (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.extension_listings (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0 and char_length(body) <= 8000),
  created_at timestamptz not null default now()
);

create index if not exists listing_comments_listing_id_created_idx
  on public.listing_comments (listing_id, created_at desc);

-- Maintain upvote_count (bypasses listing update RLS)
create or replace function public.apply_listing_upvote_delta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.extension_listings
    set upvote_count = upvote_count + 1, updated_at = now()
    where id = new.listing_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.extension_listings
    set upvote_count = greatest(0, upvote_count - 1), updated_at = now()
    where id = old.listing_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists listing_upvotes_delta_trg on public.listing_upvotes;
create trigger listing_upvotes_delta_trg
after insert or delete on public.listing_upvotes
for each row execute procedure public.apply_listing_upvote_delta();

update public.extension_listings el
set upvote_count = coalesce(
  (select count(*)::integer from public.listing_upvotes u where u.listing_id = el.id),
  0
);

alter table public.listing_upvotes enable row level security;
alter table public.listing_comments enable row level security;

create policy "upvotes readable for approved listings"
  on public.listing_upvotes for select
  using (
    exists (
      select 1 from public.extension_listings el
      where el.id = listing_id and el.status = 'approved'
    )
  );

create policy "signed-in non-banned can upvote approved listings"
  on public.listing_upvotes for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and coalesce(p.is_banned, false) = false
    )
    and exists (
      select 1 from public.extension_listings el
      where el.id = listing_id and el.status = 'approved'
    )
  );

create policy "users can remove own upvote"
  on public.listing_upvotes for delete
  using (auth.uid() = user_id);

create policy "comments readable for approved listings"
  on public.listing_comments for select
  using (
    exists (
      select 1 from public.extension_listings el
      where el.id = listing_id and el.status = 'approved'
    )
  );

create policy "signed-in non-banned can comment on approved listings"
  on public.listing_comments for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and coalesce(p.is_banned, false) = false
    )
    and exists (
      select 1 from public.extension_listings el
      where el.id = listing_id and el.status = 'approved'
    )
  );

create policy "users can delete own comments"
  on public.listing_comments for delete
  using (auth.uid() = user_id);

grant select, insert, delete on public.listing_upvotes to anon, authenticated;
grant select, insert, delete on public.listing_comments to anon, authenticated;
