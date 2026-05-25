create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key,
  email text not null,
  name text,
  created_at timestamptz not null default now()
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists team_members (
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

create table if not exists waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'invited', 'converted')),
  created_at timestamptz not null default now()
);

create table if not exists probes (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  created_by uuid not null references users(id) on delete cascade,
  url text not null,
  probe_type text not null check (probe_type in ('hls', 'dash', 'mp4', 'upload')),
  region text not null,
  status text not null default 'queued' check (status in ('queued', 'running', 'pass', 'warn', 'fail', 'error')),
  summary text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists probe_events (
  id uuid primary key default gen_random_uuid(),
  probe_id uuid not null references probes(id) on delete cascade,
  level text not null check (level in ('system', 'pass', 'warn', 'fail', 'error')),
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists probe_metrics (
  id uuid primary key default gen_random_uuid(),
  probe_id uuid not null references probes(id) on delete cascade unique,
  startup_delay_ms integer,
  manifest_fetch_ms integer,
  first_segment_fetch_ms integer,
  cdn_response_ms integer,
  live_latency_ms integer,
  rebuffer_count integer,
  bitrate_variant_count integer,
  segment_count_sampled integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  probe_id uuid not null references probes(id) on delete cascade unique,
  status text not null,
  title text not null,
  checks jsonb not null,
  recommended_actions jsonb not null,
  report_text text not null,
  created_at timestamptz not null default now()
);

create index if not exists probes_team_created_at_idx on probes(team_id, created_at desc);
create index if not exists probe_events_probe_created_at_idx on probe_events(probe_id, created_at asc);
create index if not exists team_members_user_id_idx on team_members(user_id);
