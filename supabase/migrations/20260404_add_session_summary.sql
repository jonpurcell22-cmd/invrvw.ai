-- Add summary column for session-level trend analysis
alter table sessions add column if not exists summary text;
