-- Public contact form submissions (read by admins in Supabase or future admin UI).

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references public.profiles (id) on delete set null,
  name text not null,
  email text not null,
  subject text not null,
  body text not null,
  constraint contact_messages_name_len check (char_length(trim(name)) >= 1 and char_length(name) <= 200),
  constraint contact_messages_email_len check (char_length(trim(email)) >= 5 and char_length(email) <= 320),
  constraint contact_messages_subject_len check (char_length(trim(subject)) >= 1 and char_length(subject) <= 200),
  constraint contact_messages_body_len check (char_length(trim(body)) >= 10 and char_length(body) <= 10000)
);

create index if not exists contact_messages_created_at_idx on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;

create policy "contact messages insert public"
  on public.contact_messages for insert
  to anon, authenticated
  with check (
    user_id is null
    or user_id = auth.uid()
  );

create policy "admins read contact messages"
  on public.contact_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  );

grant insert on public.contact_messages to anon, authenticated;
grant select on public.contact_messages to authenticated;
