-- The person the candidate is preparing to interview with.
-- Profile text is researched once during question generation and reused for scoring.
alter table sessions add column if not exists interviewer_linkedin_url text;
alter table sessions add column if not exists interviewer_name text;
alter table sessions add column if not exists interviewer_profile text;
