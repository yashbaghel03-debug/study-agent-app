-- Safe upgrade for databases created from an earlier schema draft.
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS patterns.

alter table public.concepts add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.concepts add column if not exists overview_gist text;
alter table public.concepts add column if not exists deep_dive_gist text[] not null default '{}';
alter table public.concepts add column if not exists next_steps text[] not null default '{}';
alter table public.concepts add column if not exists notes text;

alter table public.chats add column if not exists user_id uuid references auth.users(id) on delete cascade;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  theme text not null default 'dark' check (theme in ('dark', 'light')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Drop old unique constraint if it exists without user_id
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'concepts_subject_concept_key'
  ) then
    alter table public.concepts drop constraint concepts_subject_concept_key;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'concepts_user_id_subject_concept_key'
  ) then
    alter table public.concepts
      add constraint concepts_user_id_subject_concept_key unique (user_id, subject, concept);
  end if;
end $$;
