# Study Agent

Private AI study coach with authenticated chats, image uploads, and a per-user mastery dashboard.

## Features

- Email/password auth (Supabase Auth)
- User-scoped chats, messages, and concepts (RLS)
- Streaming tutoring replies (Groq)
- Image uploads to Supabase Storage
- Save concept progress to a personal dashboard
- Profile settings, theme toggle, and logout
- Forgot password / reset password flow
- First-time onboarding for new users
- Per-user API rate limits (chat, uploads, concept detection)
- Auto-save study memory when photo uploads succeed

## Setup

### 1. Environment variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
GROQ_API_KEY=your_groq_api_key
```

### 2. Supabase database

In the Supabase SQL editor, run:

1. `supabase/migrations/0001_init.sql`
2. If you already applied an older schema, also run `supabase/migrations/0002_upgrade_existing.sql`
3. `supabase/migrations/0003_user_features.sql` (onboarding + API rate limits)

In Supabase Auth settings:

- Enable Email provider
- Add your site URL (local `http://localhost:3000` and your Vercel URL)
- Add redirect URLs:
  - `https://YOUR_DOMAIN/auth/callback`
  - `https://YOUR_DOMAIN/auth/callback?next=/reset-password`

### 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy on Vercel

1. Import the repo in Vercel
2. Add the same three environment variables
3. Deploy
4. Add the Vercel URL to Supabase Auth redirect allow-list

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```
