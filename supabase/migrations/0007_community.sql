-- Community feed: text + link posts, comments, one post per author per UTC day.

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0 and char_length(body) <= 12000),
  links jsonb not null default '[]'::jsonb,
  comment_count integer not null default 0 check (comment_count >= 0),
  created_at timestamptz not null default now(),
  constraint community_posts_links_is_array check (jsonb_typeof(links) = 'array')
);

create unique index if not exists community_posts_one_per_author_utc_day
  on public.community_posts (author_id, ((created_at at time zone 'utc')::date));

create index if not exists community_posts_created_id_idx
  on public.community_posts (created_at desc, id desc);

create table if not exists public.community_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0 and char_length(body) <= 4000),
  created_at timestamptz not null default now()
);

create index if not exists community_post_comments_post_created_idx
  on public.community_post_comments (post_id, created_at asc);

-- Comment count
create or replace function public.apply_community_comment_count_delta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.community_posts
    set comment_count = comment_count + 1
    where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.community_posts
    set comment_count = greatest(0, comment_count - 1)
    where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists community_post_comments_count_trg on public.community_post_comments;
create trigger community_post_comments_count_trg
after insert or delete on public.community_post_comments
for each row execute procedure public.apply_community_comment_count_delta();

-- Keyset page for infinite scroll (newest first)
create or replace function public.community_posts_page(
  page_limit int,
  p_after_created timestamptz default null,
  p_after_id uuid default null
)
returns table (
  id uuid,
  author_id uuid,
  body text,
  links jsonb,
  comment_count integer,
  created_at timestamptz,
  username text,
  full_name text
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    p.id,
    p.author_id,
    p.body,
    p.links,
    p.comment_count,
    p.created_at,
    pr.username,
    pr.full_name
  from public.community_posts p
  join public.profiles pr on pr.id = p.author_id
  where
    p_after_created is null
    or (p.created_at, p.id) < (p_after_created, p_after_id)
  order by p.created_at desc, p.id desc
  limit least(coalesce(page_limit, 20), 100);
$$;

alter table public.community_posts enable row level security;
alter table public.community_post_comments enable row level security;

create policy "community posts are readable"
  on public.community_posts for select
  using (true);

create policy "signed-in non-banned insert own community post"
  on public.community_posts for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.profiles x
      where x.id = auth.uid() and coalesce(x.is_banned, false) = false
    )
  );

create policy "authors delete own community posts"
  on public.community_posts for delete
  using (auth.uid() = author_id);

create policy "community comments readable"
  on public.community_post_comments for select
  using (exists (select 1 from public.community_posts cp where cp.id = post_id));

create policy "signed-in non-banned insert community comments"
  on public.community_post_comments for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.profiles x
      where x.id = auth.uid() and coalesce(x.is_banned, false) = false
    )
    and exists (select 1 from public.community_posts cp where cp.id = post_id)
  );

create policy "authors delete own community comments"
  on public.community_post_comments for delete
  using (auth.uid() = author_id);

grant select, insert, delete on public.community_posts to anon, authenticated;
grant select, insert, delete on public.community_post_comments to anon, authenticated;
grant execute on function public.community_posts_page(int, timestamptz, uuid) to anon, authenticated;
