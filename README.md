## Web Store Extensions

A SaaS-style browser extension directory built with Next.js and Supabase.

### Features

- Email/password and Google authentication
- User profile management with public profile pages at `/u/:username`
- Extension submission flow with admin moderation (`pending`, `approved`, `rejected`)
- Public homepage showing approved listings and categories
- Super admin dashboard for listing review and user banning
- Supabase SQL migration with RLS policies

### Tech Stack

- Next.js (App Router, TypeScript, Tailwind CSS)
- Supabase Auth + Postgres
- Vercel-ready deployment

## Local Setup

1) Install dependencies:

```bash
npm install
```

2) Create env file:

```bash
cp .env.example .env.local
```

Fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

3) In Supabase SQL editor, run (in order):

- `supabase/migrations/0001_init.sql`
- `supabase/migrations/0002_curated_featured_extensions.sql` (adds curated Chrome Web Store featured listings and `featured_order`)

If tables still don't appear, make sure you are in the correct Supabase project and rerun the SQL. Then verify:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('profiles', 'extension_listings');
```

4) Create storage bucket:

- Bucket name: `avatars`
- Public bucket: `true`

5) Run development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Password reset (Supabase)

The app sends reset links to `/auth/update-password`. In the Supabase dashboard:

1. Go to **Authentication** → **URL Configuration**.
2. Under **Redirect URLs**, add both:
   - `http://localhost:3000/auth/update-password` (or your dev port, e.g. `http://localhost:3001/auth/update-password`)
   - `https://YOUR_PRODUCTION_DOMAIN/auth/update-password`
3. **Site URL** should match your primary app URL (e.g. `http://localhost:3000` for local dev).

Users flow: **Log in** page → **Forgot password?** → enter email → **Send reset link** → open email → set a new password on `/auth/update-password`.

Ensure **Authentication** → **Providers** → **Email** is enabled. For production, configure **SMTP** (or use Supabase’s default mail) so reset emails are delivered.

## Admin Roles

To make a user super admin, update their profile row in Supabase:

```sql
update public.profiles
set role = 'super_admin'
where email = 'you@example.com';
```

## Deploy to Vercel via GitHub

1) Push this project to GitHub
2) Import repo in Vercel
3) Add same env vars in Vercel project settings
4) Deploy
