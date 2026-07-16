-- Onboarding + API rate limiting for production features

alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false;

alter table public.profiles
  add column if not exists preferred_subject text;

create table if not exists public.api_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  route text not null,
  hour_window timestamptz not null,
  request_count integer not null default 0,
  primary key (user_id, route, hour_window)
);

create index if not exists api_usage_user_route_idx on public.api_usage(user_id, route);

alter table public.api_usage enable row level security;

drop policy if exists "Users can manage own api usage" on public.api_usage;
create policy "Users can manage own api usage"
  on public.api_usage for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
