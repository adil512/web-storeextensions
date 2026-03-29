-- Blog post comments (public submit pending; admins approve/reject)

create table if not exists public.blog_post_comments (
  id uuid primary key default gen_random_uuid(),
  blog_post_id uuid not null references public.blog_posts (id) on delete cascade,
  author_name text not null,
  author_email text not null,
  body text not null,
  website_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null,
  constraint blog_post_comments_name_len check (char_length(trim(author_name)) >= 1 and char_length(author_name) <= 200),
  constraint blog_post_comments_email_len check (char_length(trim(author_email)) >= 3 and char_length(author_email) <= 320),
  constraint blog_post_comments_body_len check (char_length(trim(body)) >= 2 and char_length(body) <= 8000),
  constraint blog_post_comments_website_len check (website_url is null or char_length(website_url) <= 500)
);

create index if not exists blog_post_comments_post_status_created_idx
  on public.blog_post_comments (blog_post_id, status, created_at desc);

alter table public.blog_post_comments enable row level security;

create policy "blog_post_comments_select_approved"
  on public.blog_post_comments for select
  to anon, authenticated
  using (
    status = 'approved'
    and exists (
      select 1 from public.blog_posts bp
      where bp.id = blog_post_id and bp.published = true
    )
  );

create policy "blog_post_comments_select_admins"
  on public.blog_post_comments for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  );

create policy "blog_post_comments_insert_public"
  on public.blog_post_comments for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and exists (
      select 1 from public.blog_posts bp
      where bp.id = blog_post_id and bp.published = true
    )
  );

create policy "blog_post_comments_update_admins"
  on public.blog_post_comments for update
  to authenticated
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

grant select, insert on public.blog_post_comments to anon, authenticated;
grant update on public.blog_post_comments to authenticated;

comment on table public.blog_post_comments is 'Reader comments on blog posts; moderated by admins.';

-- Rebrand seed copy for existing databases (slug URLs unchanged)
update public.blog_posts set
  title = replace(title, 'Extension Listings', 'Web Store Extensions'),
  excerpt = replace(coalesce(excerpt, ''), 'Extension Listings', 'Web Store Extensions'),
  body = replace(body, 'Extension Listings', 'Web Store Extensions'),
  meta_title = replace(coalesce(meta_title, ''), 'Extension Listings', 'Web Store Extensions'),
  meta_description = replace(coalesce(meta_description, ''), 'Extension Listings', 'Web Store Extensions')
where title ilike '%Extension Listings%'
   or coalesce(excerpt, '') ilike '%Extension Listings%'
   or body ilike '%Extension Listings%'
   or coalesce(meta_title, '') ilike '%Extension Listings%'
   or coalesce(meta_description, '') ilike '%Extension Listings%';
