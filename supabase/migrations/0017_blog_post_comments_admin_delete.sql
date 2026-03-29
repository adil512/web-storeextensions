-- Allow admins to delete blog post comments

create policy "blog_post_comments_delete_admins"
  on public.blog_post_comments for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  );

grant delete on public.blog_post_comments to authenticated;
