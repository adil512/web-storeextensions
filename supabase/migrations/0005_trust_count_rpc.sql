-- Trust score needs total listings per maker; RLS hides other users' pending rows from anon.
create or replace function public.count_listings_by_owner_for_trust(p_owner uuid)
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::int from public.extension_listings where owner_id = p_owner;
$$;

grant execute on function public.count_listings_by_owner_for_trust(uuid) to anon, authenticated;
