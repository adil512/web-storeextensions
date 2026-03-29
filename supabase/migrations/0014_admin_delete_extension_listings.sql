-- Allow admins to permanently remove listings (child rows cascade per FKs).
grant delete on table public.extension_listings to authenticated;

drop policy if exists "admins can delete extension listings" on public.extension_listings;

create policy "admins can delete extension listings"
  on public.extension_listings for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  );
