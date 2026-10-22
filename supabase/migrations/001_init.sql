-- Bright Future Classes demo — initial schema
create extension if not exists "pgcrypto";

-- 1. sessions ---------------------------------------------------------------
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  ip_hash text,
  user_agent text,
  source text not null check (source in ('landing_bubble','demo_page','scripted_A','scripted_B','scripted_C','seed')),
  language_detected text,
  mode text not null default 'live' check (mode in ('live','scripted')),
  started_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_sessions_visitor on sessions (visitor_id);

-- 2. messages ---------------------------------------------------------------
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  raw_json jsonb,
  tokens_in int not null default 0,
  tokens_out int not null default 0,
  latency_ms int,
  model text,
  created_at timestamptz not null default now()
);
create index if not exists idx_messages_session_created on messages (session_id, created_at);

-- 3. leads ------------------------------------------------------------------
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references sessions(id) on delete cascade,
  student_name text,
  parent_name text,
  parent_phone text,
  phone_valid boolean not null default false,
  class_or_exam text,
  board text,
  preferred_branch text,
  preferred_batch text,
  budget_comfort text,
  interest_summary text,
  score int not null default 0 check (score between 0 and 100),
  badge text not null default 'COLD' check (badge in ('HOT','WARM','COLD')),
  score_reasons text[] not null default '{}',
  next_action text,
  needs_human boolean not null default false,
  handover_reason text,
  demo_slot_requested timestamptz,
  status text not null default 'new' check (status in ('new','contacted','demo_booked','enrolled','lost')),
  is_seed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_leads_badge on leads (badge);
create index if not exists idx_leads_score on leads (score desc);
create index if not exists idx_leads_created on leads (created_at desc);

-- 4. lead_events ------------------------------------------------------------
create table if not exists lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  event_type text not null check (event_type in ('field_extracted','score_changed','badge_changed','handover','alert_fired','status_changed')),
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_lead_events_lead on lead_events (lead_id, created_at);

-- 5. alerts -----------------------------------------------------------------
create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  channel text not null default 'whatsapp_mock' check (channel in ('whatsapp_mock')),
  title text not null,
  body text not null,
  shown boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_alerts_created on alerts (created_at desc);

-- 6. usage_logs -------------------------------------------------------------
create table if not exists usage_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  provider text not null,
  model text not null,
  tokens_in int not null default 0,
  tokens_out int not null default 0,
  cost_inr numeric(10,4) not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_usage_created on usage_logs (created_at);

-- 7. rate_limits ------------------------------------------------------------
create table if not exists rate_limits (
  ip_hash text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (ip_hash, window_start)
);

-- 8. guardrail_events -------------------------------------------------------
create table if not exists guardrail_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  type text not null check (type in ('prompt_injection','out_of_scope','abuse','result_guarantee','medical_legal_financial','invented_fact')),
  user_text text,
  created_at timestamptz not null default now()
);

-- View: daily stats ---------------------------------------------------------
create or replace view v_daily_stats as
select
  d.day::date as date,
  coalesce(l.leads, 0) as leads,
  coalesce(l.hot, 0) as hot,
  coalesce(l.warm, 0) as warm,
  coalesce(l.cold, 0) as cold,
  coalesce(l.avg_score, 0) as avg_score,
  coalesce(u.total_cost_inr, 0) as total_cost_inr
from (select generate_series(current_date - 29, current_date, interval '1 day') as day) d
left join (
  select created_at::date as day,
         count(*) as leads,
         count(*) filter (where badge = 'HOT') as hot,
         count(*) filter (where badge = 'WARM') as warm,
         count(*) filter (where badge = 'COLD') as cold,
         round(avg(score)::numeric, 1) as avg_score
  from leads group by 1
) l on l.day = d.day::date
left join (
  select created_at::date as day, sum(cost_inr) as total_cost_inr
  from usage_logs group by 1
) u on u.day = d.day::date
order by d.day;

-- Realtime ------------------------------------------------------------------
alter publication supabase_realtime add table leads;
alter publication supabase_realtime add table lead_events;
alter publication supabase_realtime add table alerts;

-- RLS: anon can only read seed data or its own visitor's rows. All writes use the service role.
alter table sessions enable row level security;
alter table messages enable row level security;
alter table leads enable row level security;
alter table lead_events enable row level security;
alter table alerts enable row level security;
alter table usage_logs enable row level security;
alter table rate_limits enable row level security;
alter table guardrail_events enable row level security;

-- The visitor id travels in a request header (x-visitor-id) that PostgREST exposes via request.headers.
create or replace function current_visitor() returns text language sql stable as $$
  select coalesce(current_setting('request.headers', true)::json ->> 'x-visitor-id', '')
$$;

create policy leads_read on leads for select to anon using (
  is_seed
  or exists (select 1 from sessions s where s.id = leads.session_id and s.visitor_id = current_visitor())
);
create policy events_read on lead_events for select to anon using (
  exists (select 1 from leads l where l.id = lead_events.lead_id and (
    l.is_seed or exists (select 1 from sessions s where s.id = l.session_id and s.visitor_id = current_visitor())
  ))
);
create policy alerts_read on alerts for select to anon using (
  exists (select 1 from leads l where l.id = alerts.lead_id and (
    l.is_seed or exists (select 1 from sessions s where s.id = l.session_id and s.visitor_id = current_visitor())
  ))
);
create policy sessions_read on sessions for select to anon using (visitor_id = current_visitor());
create policy messages_read on messages for select to anon using (
  exists (select 1 from sessions s where s.id = messages.session_id and s.visitor_id = current_visitor())
);
