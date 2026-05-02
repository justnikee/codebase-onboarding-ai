-- ============================================================
-- DevBoard  –  Supabase SQL Schema
-- Run this in your Supabase project's SQL Editor:
--   Dashboard → SQL Editor → New query → Paste & Run
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Users ────────────────────────────────────────────────────
create table if not exists users (
  id              uuid primary key default uuid_generate_v4(),
  github_id       text unique not null,
  email           text,
  name            text,
  avatar_url      text,
  created_at      timestamptz not null default now(),
  last_login_at   timestamptz
);

-- ── Analyses ─────────────────────────────────────────────────
create table if not exists analyses (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references users(id) on delete cascade,
  repo_url         text not null,
  repo_full_name   text,
  context_id       text unique not null,
  status           text not null default 'pending',  -- pending | completed | failed
  summary_snapshot text,
  readiness_score  integer,                           -- 0-100
  created_at       timestamptz not null default now(),
  completed_at     timestamptz
);

create index if not exists analyses_user_id_idx   on analyses(user_id);
create index if not exists analyses_context_id_idx on analyses(context_id);

-- ── Chat messages ─────────────────────────────────────────────
create table if not exists chat_messages (
  id              uuid primary key default uuid_generate_v4(),
  analysis_id     uuid references analyses(id) on delete cascade,
  user_id         uuid references users(id) on delete cascade,
  role            text not null check (role in ('user', 'assistant')),
  content         text not null,
  relevant_files  text[] default '{}',
  confidence      text check (confidence in ('high', 'medium', 'low')),
  created_at      timestamptz not null default now()
);

create index if not exists chat_messages_analysis_idx on chat_messages(analysis_id);

-- ── Feedback ──────────────────────────────────────────────────
create table if not exists feedback (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references users(id) on delete cascade,
  analysis_id  uuid references analyses(id) on delete set null,
  message_id   uuid references chat_messages(id) on delete set null,
  rating       integer check (rating between 1 and 5),
  helpful      boolean,
  comment      text,
  created_at   timestamptz not null default now()
);

-- ── Row-Level Security (RLS) ──────────────────────────────────
-- The backend uses the service-role key (bypasses RLS).
-- Enable RLS on all tables so direct client access is safe.

alter table users        enable row level security;
alter table analyses     enable row level security;
alter table chat_messages enable row level security;
alter table feedback     enable row level security;

-- Allow the service role to do everything (already true, just explicit):
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'service_role_all_users' and tablename = 'users') then
    create policy "service_role_all_users" on users for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'service_role_all_analyses' and tablename = 'analyses') then
    create policy "service_role_all_analyses" on analyses for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'service_role_all_chat_messages' and tablename = 'chat_messages') then
    create policy "service_role_all_chat_messages" on chat_messages for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'service_role_all_feedback' and tablename = 'feedback') then
    create policy "service_role_all_feedback" on feedback for all using (true) with check (true);
  end if;
end $$;
