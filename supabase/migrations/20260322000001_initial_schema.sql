-- ─────────────────────────────────────────────────────────────────────────────
-- PhysicAI: Initial schema
--
-- Tables:
--   plans              Recovery plans (guest token or authenticated)
--   check_ins          Daily check-in submissions
--   notification_failures  Email send failures for retry (cron)
--
-- Auth: uses Supabase Auth (magic link). user_id references auth.users.
-- Guest users: identified by token (UUID) only, user_id is NULL.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Plans ───────────────────────────────────────────────────────────────────

create table public.plans (
  id                uuid primary key default gen_random_uuid(),
  token             uuid not null unique default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete set null,

  -- Assessment inputs
  collected_flags   jsonb not null,

  -- Generated recovery plan (null while pending or failed)
  plan_json         jsonb,
  status            text not null default 'pending_review'
                    check (status in ('pending_review', 'approved', 'generation_failed')),

  -- Progress tracking
  current_phase     int not null default 1,
  current_day       int not null default 1,

  -- Notification tracking
  last_reminder_at  timestamptz,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Index for guest token lookup (plan page)
create index plans_token_idx on public.plans (token);

-- Index for notification cron query
create index plans_notification_idx on public.plans (status, last_reminder_at)
  where status = 'approved';

-- ─── Check-ins ────────────────────────────────────────────────────────────────

create table public.check_ins (
  id              uuid primary key default gen_random_uuid(),
  plan_id         uuid not null references public.plans(id) on delete cascade,

  day             int not null,
  pain_score      int not null check (pain_score between 1 and 10),
  swelling        boolean not null,
  weight_bearing  boolean not null,
  outcome         text not null check (outcome in ('advance', 'hold', 'escalate')),

  created_at      timestamptz not null default now(),

  -- One check-in per plan per day (idempotency)
  unique (plan_id, day)
);

create index check_ins_plan_idx on public.check_ins (plan_id, day desc);

-- ─── Notification failures ────────────────────────────────────────────────────

create table public.notification_failures (
  id            uuid primary key default gen_random_uuid(),
  plan_id       uuid not null references public.plans(id) on delete cascade,
  attempted_at  timestamptz not null default now(),
  error         text,
  resolved      boolean not null default false
);

create index notif_failures_unresolved_idx on public.notification_failures (resolved, attempted_at)
  where resolved = false;

-- ─── updated_at trigger ──────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger plans_updated_at
  before update on public.plans
  for each row execute function public.set_updated_at();

-- ─── RLS ──────────────────────────────────────────────────────────────────────

alter table public.plans              enable row level security;
alter table public.check_ins          enable row level security;
alter table public.notification_failures enable row level security;

-- Plans: guest access by token, authenticated access by user_id
create policy "plans_select_by_token" on public.plans
  for select using (
    token = (current_setting('request.jwt.claims', true)::jsonb->>'plan_token')::uuid
    or user_id = auth.uid()
  );

create policy "plans_insert_anon" on public.plans
  for insert with check (true); -- Edge Function inserts on behalf of guest/user

create policy "plans_update_own" on public.plans
  for update using (
    token = (current_setting('request.jwt.claims', true)::jsonb->>'plan_token')::uuid
    or user_id = auth.uid()
  );

-- Check-ins: readable/writable if you own the plan
create policy "check_ins_select" on public.check_ins
  for select using (
    plan_id in (
      select id from public.plans
      where user_id = auth.uid()
         or token = (current_setting('request.jwt.claims', true)::jsonb->>'plan_token')::uuid
    )
  );

create policy "check_ins_insert" on public.check_ins
  for insert with check (
    plan_id in (
      select id from public.plans
      where user_id = auth.uid()
         or token = (current_setting('request.jwt.claims', true)::jsonb->>'plan_token')::uuid
    )
  );

-- Notification failures: internal only (service role), no user access
create policy "notif_failures_no_user_access" on public.notification_failures
  for all using (false);
