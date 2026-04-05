-- Profiles table for storing user preferences and saved resume
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  resume_text text,
  resume_filename text,
  updated_at timestamp with time zone default now()
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);
