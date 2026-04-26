
-- profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users view own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "Users delete own profile" on public.profiles for delete to authenticated using (auth.uid() = id);

-- trips table
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  destination text not null,
  days int not null,
  budget text not null,
  interests text[] not null default '{}',
  itinerary jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.trips enable row level security;

create policy "Users view own trips" on public.trips for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own trips" on public.trips for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own trips" on public.trips for update to authenticated using (auth.uid() = user_id);
create policy "Users delete own trips" on public.trips for delete to authenticated using (auth.uid() = user_id);

create index trips_user_id_idx on public.trips(user_id, created_at desc);

-- chat_messages
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

create policy "Users view own messages" on public.chat_messages for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own messages" on public.chat_messages for insert to authenticated with check (auth.uid() = user_id);
create policy "Users delete own messages" on public.chat_messages for delete to authenticated using (auth.uid() = user_id);

create index chat_messages_user_id_idx on public.chat_messages(user_id, created_at);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trips_updated_at before update on public.trips
  for each row execute function public.set_updated_at();
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
