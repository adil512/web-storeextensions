-- Blog posts (super_admin CRUD; public reads published only)

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  excerpt text,
  body text not null default '',
  meta_title text,
  meta_description text,
  canonical_url text,
  cover_image_url text,
  published boolean not null default false,
  author_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_posts_slug_format_chk check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create unique index if not exists blog_posts_slug_uidx on public.blog_posts (lower(slug));
create index if not exists blog_posts_published_created_idx on public.blog_posts (published, created_at desc);

create or replace function public.blog_posts_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists blog_posts_updated_at on public.blog_posts;
create trigger blog_posts_updated_at
  before update on public.blog_posts
  for each row execute procedure public.blog_posts_set_updated_at();

alter table public.blog_posts enable row level security;

create policy "blog_posts_select_public_or_super"
  on public.blog_posts for select
  using (
    published = true
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'super_admin'
    )
  );

create policy "blog_posts_insert_super_admin"
  on public.blog_posts for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'super_admin'
    )
  );

create policy "blog_posts_update_super_admin"
  on public.blog_posts for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'super_admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'super_admin'
    )
  );

create policy "blog_posts_delete_super_admin"
  on public.blog_posts for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'super_admin'
    )
  );

grant select on public.blog_posts to anon, authenticated;
grant insert, update, delete on public.blog_posts to authenticated;

comment on table public.blog_posts is 'Marketing/editorial posts; only super_admin may write.';

-- Seed posts (published)
insert into public.blog_posts (slug, title, excerpt, body, meta_title, meta_description, canonical_url, published)
values
(
  'welcome-extension-listings-directory',
  'Welcome to the Web Store Extensions directory',
  'A moderated home for browser extensions—why it matters and how to get listed.',
  $md$
# A directory built for trust

**Web Store Extensions** exists so builders can reach users without fighting algorithmic noise alone. Every submission is reviewed before it goes live.

## What makes this different

- **Moderation** — We check listings for clarity and policy alignment.
- **Categories** — Browse by real use cases, not just store charts.
- **Maker profiles** — Tie your work to a public profile users can follow.

## Next steps for developers

1. [Create an account](/auth) and complete your profile.
2. [Submit your extension](/submit) with accurate store links and descriptions.
3. Share your public listing once approved.

Questions? [Contact us](/contact)—we read every message.
$md$,
  'Web Store Extensions directory — moderated browser extension marketplace',
  'Learn why Web Store Extensions moderates submissions, how categories work, and how to submit your Chrome, Firefox, or Edge extension.',
  null,
  true
),
(
  'chrome-web-store-listing-tips',
  'Chrome Web Store listing tips that actually convert',
  'Practical copy, screenshots, and permission hygiene before you ship.',
  $md$
# Make your store page work harder

Your **Chrome Web Store** listing is a landing page. Treat it like one.

## Copy that converts

- Lead with the **outcome** ("Save 20 minutes a day") not the mechanism ("Uses the Storage API").
- Keep the short description scannable—no keyword stuffing.
- Mirror the **first-run experience** in screenshot order.

## Screenshots

- Show the **happy path** in frame one.
- Use real UI, not marketing mockups that reviewers flag.
- Add captions in-image sparingly for clarity.

## Permissions

- Drop anything you do not need.
- In the privacy section, match what your code *actually* does.

Explore our [extension tools](/extension-tools) for checklists and helpers.
$md$,
  'Chrome Web Store listing tips | Web Store Extensions',
  'Improve your Chrome Web Store listing with clearer copy, better screenshots, and tighter permissions—before review.',
  null,
  true
),
(
  'manifest-v3-migration-checklist',
  'Manifest V3 migration checklist for extension teams',
  'Background workers, networking, and review pitfalls—condensed.',
  $md$
# Shipping MV3 without surprises

Migrating from **Manifest V2** is more than a JSON change—it is an architecture shift.

## Service worker realities

- No persistent background page; plan for **event-driven** wakeups.
- Move long tasks to **offscreen** or chunk work across alarms where allowed.

## Networking

- Prefer **declarativeNetRequest** when you can express rules statically.
- Document why you need **host permissions**—reviewers will ask.

## Testing

- Test installs from a **clean profile** with your production bundle.
- Verify OAuth and identity flows under the new lifecycle.

Use our [MV2 to MV3 converter](/extension-tools/mv2-to-mv3-converter) as a starting point only—always validate against current Google docs.
$md$,
  'Manifest V3 migration checklist | Web Store Extensions',
  'A practical MV3 migration checklist: service workers, declarativeNetRequest, host permissions, and review-ready testing.',
  null,
  true
),
(
  'grow-extension-without-ads',
  'Growing your extension without a massive ads budget',
  'Distribution ideas that compound: communities, directories, and product stories.',
  $md$
# Organic growth is still possible

Paid ads are not the only path to **active users**.

## Where to show up

- **Niche communities** (Reddit, Discord, forums) with a help-first tone.
- **Directories** like Web Store Extensions for evergreen discovery.
- **Maker content**—short posts that teach something your extension solves.

## Measure what matters

- Track **store listing → install** if the store provides funnels.
- Watch **uninstall timing** to spot onboarding gaps.

## Tell a story

People remember narratives. Lead with the user's day, not your stack.

[Submit your extension](/submit) when you are ready to add another discovery channel.
$md$,
  'Grow your browser extension organically | Web Store Extensions',
  'Distribution tactics for extension makers: communities, directories, storytelling, and metrics that matter.',
  null,
  true
);
