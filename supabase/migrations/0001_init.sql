-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Concepts table: tracks mastery per subject/concept
create table if not exists public.concepts (
  id uuid primary key default uuid_generate_v4(),
  subject text not null,
  concept text not null,
  mastery_score numeric(5,2) not null default 0,
  mastery_level text,
  weak_areas text[] not null default '{}',
  strong_areas text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject, concept)
);

-- Chats table
create table if not exists public.chats (
  id uuid primary key default uuid_generate_v4(),
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Messages table
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  image_url text,
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists concepts_subject_idx on public.concepts(subject);
create index if not exists messages_chat_id_created_at_idx on public.messages(chat_id, created_at desc);

-- Storage bucket for chat image uploads
insert into storage.buckets (id, name, public, avails_to_roles)
values (
  'chat-images',
  'chat-images',
  true,
  '{"authenticated": ["SELECT"],"anonymous": ["SELECT"]}'
)
on conflict (id) do nothing;

-- Optional: allow public read access for objects in the bucket
-- (Supabase storage policies are applied separately in the SQL editor if needed)
