-- ─────────────────────────────────────────────────────────────────────────────
-- Guest → Account migration (atomic transaction)
--
-- Called when a guest user signs up and we want to attach their existing plan
-- to their new authenticated user_id.
--
-- Steps (atomic):
--   1. Verify token belongs to a guest plan (user_id IS NULL)
--   2. Set user_id on the plan row
--   3. Invalidate the standalone token (set to new UUID so old links 404)
--      NOTE: we keep the token valid by default so the URL still works.
--            Pass invalidate_token=true to rotate it.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.migrate_guest_plan(
  p_token           uuid,
  p_user_id         uuid,
  invalidate_token  boolean default false
)
returns jsonb
language plpgsql
security definer  -- runs as postgres, bypasses RLS for the migration
as $$
declare
  v_plan_id  uuid;
  v_new_token uuid;
begin
  -- Find the guest plan
  select id into v_plan_id
  from public.plans
  where token = p_token
    and user_id is null
  for update; -- lock the row

  if v_plan_id is null then
    return jsonb_build_object('ok', false, 'error', 'plan_not_found_or_already_owned');
  end if;

  v_new_token := case when invalidate_token then gen_random_uuid() else p_token end;

  -- Migrate atomically
  update public.plans
  set
    user_id = p_user_id,
    token   = v_new_token,
    updated_at = now()
  where id = v_plan_id;

  return jsonb_build_object('ok', true, 'plan_id', v_plan_id, 'token', v_new_token);
end;
$$;

-- Only callable by service role (Edge Functions), not by browser clients
revoke execute on function public.migrate_guest_plan(uuid, uuid, boolean) from anon, authenticated;
