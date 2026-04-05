-- Schema
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  resume_text text,
  resume_filename text,
  updated_at timestamp with time zone default now()
);

create table sessions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  user_id uuid references auth.users(id),
  company_name text,
  role_title text,
  interview_stage text,
  seniority_level text,
  resume_text text,
  job_description_text text,
  company_research text,
  overall_score integer,
  summary text,
  status text default 'in_progress'
);

create table questions (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references sessions(id),
  question_order integer,
  question_text text,
  question_category text,
  rubric jsonb
);

create table responses (
  id uuid default gen_random_uuid() primary key,
  question_id uuid references questions(id),
  session_id uuid references sessions(id),
  transcript text,
  score integer,
  feedback text,
  model_answer text,
  audio_url text
);

-- RLS
alter table sessions enable row level security;
alter table questions enable row level security;
alter table responses enable row level security;

create policy "Users can view own sessions"
  on sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on sessions for update
  using (auth.uid() = user_id);

create policy "Users can view own questions"
  on questions for select
  using (
    session_id in (
      select id from sessions where user_id = auth.uid()
    )
  );

create policy "Users can insert own questions"
  on questions for insert
  with check (
    session_id in (
      select id from sessions where user_id = auth.uid()
    )
  );

create policy "Users can view own responses"
  on responses for select
  using (
    session_id in (
      select id from sessions where user_id = auth.uid()
    )
  );

create policy "Users can insert own responses"
  on responses for insert
  with check (
    session_id in (
      select id from sessions where user_id = auth.uid()
    )
  );

create policy "Users can update own responses"
  on responses for update
  using (
    session_id in (
      select id from sessions where user_id = auth.uid()
    )
  );
