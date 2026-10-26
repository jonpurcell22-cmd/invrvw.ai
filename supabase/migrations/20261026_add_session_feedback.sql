-- One feedback note per completed practice session.
create table if not exists session_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  session_id uuid not null references sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  stuck text,
  useful text,
  change text,
  unique (session_id)
);

alter table session_feedback enable row level security;

create policy "Users can view own feedback"
  on session_feedback for select
  using (auth.uid() = user_id);

create policy "Users can insert own feedback"
  on session_feedback for insert
  with check (
    auth.uid() = user_id
    and session_id in (select id from sessions where user_id = auth.uid())
  );

create policy "Users can update own feedback"
  on session_feedback for update
  using (auth.uid() = user_id);
