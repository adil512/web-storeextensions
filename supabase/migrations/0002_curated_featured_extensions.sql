-- Curated Chrome Web Store extensions (no user owner). Run after 0001_init.sql.

alter table public.extension_listings alter column owner_id drop not null;

alter table public.extension_listings
  add column if not exists is_platform_curated boolean not null default false;

alter table public.extension_listings
  add column if not exists featured_order integer null;

alter table public.extension_listings
  drop constraint if exists extension_listings_owner_curated_chk;

alter table public.extension_listings
  add constraint extension_listings_owner_curated_chk
  check (
    (owner_id is not null and is_platform_curated = false)
    or (owner_id is null and is_platform_curated = true)
  );

create index if not exists extension_listings_featured_order_idx
  on public.extension_listings (featured_order)
  where featured_order is not null;

insert into public.extension_listings (
  id,
  owner_id,
  name,
  description,
  category,
  current_users,
  uninstalls_last_30_days,
  users_by_region,
  languages,
  store_url,
  status,
  is_platform_curated,
  featured_order,
  reviewed_at
) values
  (
    'a1000001-0000-4000-8000-000000000001'::uuid,
    null,
    'Stylish Font Generator',
    'Turn plain text into aesthetic Unicode fonts for posts, bios, and messages—right where you type.',
    'Design',
    142000,
    420,
    '{}'::jsonb,
    array['English']::text[],
    'https://chromewebstore.google.com/detail/stylish-font-generator/mnmepcbbpffecnobhhkgcgimnfkaphdf',
    'approved',
    true,
    1,
    now()
  ),
  (
    'a1000001-0000-4000-8000-000000000002'::uuid,
    null,
    'Block Yourself from Analytics',
    'Exclude your own visits from analytics and heatmaps so data reflects real customers, not you.',
    'Security & Privacy',
    98000,
    310,
    '{}'::jsonb,
    array['English']::text[],
    'https://chromewebstore.google.com/detail/block-yourself-from-analy/bkigppeclejiapcgmhaejolnkfkjefgm',
    'approved',
    true,
    2,
    now()
  ),
  (
    'a1000001-0000-4000-8000-000000000003'::uuid,
    null,
    'Face Shape Detector',
    'Discover your face shape with simple, on-page guidance—useful for styling and personal care picks.',
    'Other',
    76000,
    280,
    '{}'::jsonb,
    array['English']::text[],
    'https://chromewebstore.google.com/detail/face-shape-detector/gbkldkcifhiookkgmjfjnhafpedahkgc',
    'approved',
    true,
    3,
    now()
  ),
  (
    'a1000001-0000-4000-8000-000000000004'::uuid,
    null,
    'Custom Cursor for Chrome',
    'Swap the default cursor for themes, packs, and custom images to personalize every site you visit.',
    'Design',
    210000,
    890,
    '{}'::jsonb,
    array['English']::text[],
    'https://chromewebstore.google.com/detail/custom-cursor-for-chrome/kkhdfhenbdlgndmpkkimklpmgiihjmfb',
    'approved',
    true,
    4,
    now()
  ),
  (
    'a1000001-0000-4000-8000-000000000005'::uuid,
    null,
    'Save Image As PNG',
    'Convert and save images as PNG in one click—handy for designers, shoppers, and researchers.',
    'Productivity',
    54000,
    150,
    '{}'::jsonb,
    array['English']::text[],
    'https://chromewebstore.google.com/detail/save-image-as-png/lnchllndlgeaepadiidnmhnemlkffjpo',
    'approved',
    true,
    5,
    now()
  ),
  (
    'a1000001-0000-4000-8000-000000000006'::uuid,
    null,
    'Website SEO Checker',
    'Get quick on-page SEO signals while you browse—titles, meta, headings, and more at a glance.',
    'Marketing',
    88000,
    260,
    '{}'::jsonb,
    array['English']::text[],
    'https://chromewebstore.google.com/detail/website-seo-checker/jfhjbellbcogljkhajiaacciibfmhfgb',
    'approved',
    true,
    6,
    now()
  ),
  (
    'a1000001-0000-4000-8000-000000000007'::uuid,
    null,
    'View CSS',
    'Inspect computed CSS for any element with a clean, focused panel built for developers.',
    'Developer Tools',
    112000,
    190,
    '{}'::jsonb,
    array['English']::text[],
    'https://chromewebstore.google.com/detail/view-css/onlmbgemedcfbohodjgdgbbhkcbdjikf',
    'approved',
    true,
    7,
    now()
  ),
  (
    'a1000001-0000-4000-8000-000000000008'::uuid,
    null,
    'Country Code',
    'Dialing and country code lookups without tab switching—ideal for travel, support, and sales teams.',
    'Productivity',
    41000,
    95,
    '{}'::jsonb,
    array['English']::text[],
    'https://chromewebstore.google.com/detail/country-code/bkhendidheflelgpogcfneoaahamajal',
    'approved',
    true,
    8,
    now()
  )
on conflict (id) do nothing;
