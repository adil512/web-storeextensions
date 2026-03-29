-- Maker leaderboard: approved listings per profile, ranked by total upvotes then listing count.

create or replace function public.leaderboard_makers(p_limit int default 100)
returns table (
  profile_id uuid,
  username text,
  full_name text,
  listing_count bigint,
  total_upvotes bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    p.id as profile_id,
    p.username,
    p.full_name,
    count(el.id)::bigint as listing_count,
    coalesce(sum(el.upvote_count), 0)::bigint as total_upvotes
  from public.profiles p
  inner join public.extension_listings el
    on el.owner_id = p.id and el.status = 'approved'
  group by p.id, p.username, p.full_name
  order by coalesce(sum(el.upvote_count), 0) desc, count(el.id) desc, p.username nulls last
  limit least(coalesce(p_limit, 100), 500);
$$;

grant execute on function public.leaderboard_makers(int) to anon, authenticated;
