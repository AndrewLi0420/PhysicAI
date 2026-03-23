-- ─────────────────────────────────────────────────────────────────────────────
-- Notification cron job (pg_cron + pg_net)
--
-- Runs hourly. Finds approved plans that:
--   1. Have not had a check-in today
--   2. Have not been reminded in the last 20 hours
--
-- Calls the notify-checkin Edge Function which fires Resend emails.
--
-- Requires pg_cron and pg_net extensions (enable in Supabase dashboard:
--   Database → Extensions → pg_cron + pg_net)
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable required extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ─── Helper: plans needing a reminder right now ───────────────────────────────

create or replace function public.plans_needing_reminder()
returns table (plan_id uuid)
language sql
stable
as $$
  select p.id
  from public.plans p
  where p.status = 'approved'
    and p.plan_json is not null
    -- No check-in today
    and not exists (
      select 1 from public.check_ins c
      where c.plan_id = p.id
        and c.created_at::date = current_date
    )
    -- Not reminded in the last 20 hours
    and (
      p.last_reminder_at is null
      or p.last_reminder_at < now() - interval '20 hours'
    );
$$;

-- ─── Cron: run hourly ─────────────────────────────────────────────────────────

select cron.schedule(
  'physicai-checkin-reminders',
  '0 * * * *',  -- every hour on the hour
  $$
    select
      net.http_post(
        url     := current_setting('app.supabase_url') || '/functions/v1/notify-checkin',
        headers := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer ' || current_setting('app.service_role_key')
        ),
        body    := jsonb_build_object(
          'plan_ids', (select jsonb_agg(plan_id) from public.plans_needing_reminder())
        )
      )
  $$
);
