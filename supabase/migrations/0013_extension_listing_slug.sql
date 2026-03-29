-- SEO-friendly public URLs: /extensions/{slug} derived from title; duplicates get -2, -3, ...

alter table public.extension_listings
  add column if not exists slug text;

-- Backfill from name (lowercase, non-alphanumeric -> hyphen; empty -> extension; duplicates -> -2, -3, ...)
update public.extension_listings el
set slug = n.final_slug
from (
  select id,
    case
      when rn = 1 then b
      else b || '-' || rn::text
    end as final_slug
  from (
    select id,
      left(
        coalesce(
          nullif(
            trim(both '-' from regexp_replace(lower(trim(coalesce(name, ''))), '[^a-z0-9]+', '-', 'g')),
            ''
          ),
          'extension'
        ),
        96
      ) as b,
      row_number() over (
        partition by left(
          coalesce(
            nullif(
              trim(both '-' from regexp_replace(lower(trim(coalesce(name, ''))), '[^a-z0-9]+', '-', 'g')),
              ''
            ),
            'extension'
          ),
          96
        )
        order by created_at
      ) as rn
    from public.extension_listings
  ) x
) n
where el.id = n.id
  and (el.slug is null or el.slug = '');

alter table public.extension_listings
  alter column slug set not null;

drop index if exists extension_listings_slug_lower_uidx;
create unique index extension_listings_slug_lower_uidx
  on public.extension_listings (lower(slug));

comment on column public.extension_listings.slug is
  'URL segment for public page /extensions/{slug}; lowercase, unique; first duplicate suffix -2, then -3, ...';
