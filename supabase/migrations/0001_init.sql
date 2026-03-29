create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  website_url text,
  social_links jsonb not null default '{}'::jsonb,
  role text not null default 'user' check (role in ('user', 'admin', 'super_admin')),
  is_banned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.extension_listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text not null,
  category text not null,
  current_users integer not null default 0 check (current_users >= 0),
  uninstalls_last_30_days integer not null default 0 check (uninstalls_last_30_days >= 0),
  users_by_region jsonb not null default '{}'::jsonb,
  languages text[] not null default '{}',
  homepage_url text,
  store_url text,
  logo_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_notes text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists extension_listings_owner_id_idx on public.extension_listings (owner_id);
create index if not exists extension_listings_status_idx on public.extension_listings (status);
create unique index if not exists profiles_username_lower_idx on public.profiles ((lower(username))) where username is not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.extension_listings enable row level security;

create policy "profiles public read by username"
  on public.profiles for select
  using (true);

create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "approved listings are public"
  on public.extension_listings for select
  using (
    status = 'approved'
    or owner_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  );

create policy "users can insert own listing"
  on public.extension_listings for insert
  with check (owner_id = auth.uid());

create policy "users can update own pending listing"
  on public.extension_listings for update
  using (owner_id = auth.uid() and status = 'pending')
  with check (owner_id = auth.uid());

create policy "admins can moderate all listings"
  on public.extension_listings for update
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

create policy "super admins can manage users"
  on public.profiles for update
  using (
    auth.uid() = id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'super_admin'
    )
  )
  with check (
    auth.uid() = id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'super_admin'
    )
  );
