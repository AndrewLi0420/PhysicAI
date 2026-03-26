/**
 * notify-checkin Edge Function
 *
 * Called by the hourly pg_cron job. Receives a list of plan_ids that need
 * a check-in reminder email. Sends via Resend, logs failures for retry.
 */

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response("Unauthorized", { status: 401 });

  let body: { plan_ids: string[] | null };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const planIds: string[] = body.plan_ids ?? [];
  if (planIds.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendKey = Deno.env.get("RESEND_API_KEY")!;
  const appUrl = Deno.env.get("APP_URL") ?? "https://physicai.app";

  const results = await Promise.allSettled(
    planIds.map((planId) => sendReminder(planId, { supabaseUrl, serviceKey, resendKey, appUrl }))
  );

  // Log failures for retry
  const failures = results
    .map((r, i) => ({ planId: planIds[i], result: r }))
    .filter((x) => x.result.status === "rejected");

  if (failures.length > 0) {
    await logFailures(failures, { supabaseUrl, serviceKey });
  }

  // Retry previously-failed reminders from last hour
  await retryFailures({ supabaseUrl, serviceKey, resendKey, appUrl });

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return new Response(
    JSON.stringify({ sent, failed: failures.length }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

// ─── Send one reminder ────────────────────────────────────────────────────────

async function sendReminder(
  planId: string,
  ctx: { supabaseUrl: string; serviceKey: string; resendKey: string; appUrl: string }
) {
  // Fetch plan + user email
  const planRes = await fetch(
    `${ctx.supabaseUrl}/rest/v1/plans?id=eq.${planId}&select=id,token,current_day,user_id,plan_json`,
    {
      headers: {
        apikey: ctx.serviceKey,
        Authorization: `Bearer ${ctx.serviceKey}`,
      },
    }
  );
  const [plan] = await planRes.json();
  if (!plan) throw new Error(`Plan ${planId} not found`);

  // Get email — from auth.users if authenticated, skip if guest with no email
  let email: string | null = null;
  if (plan.user_id) {
    const userRes = await fetch(
      `${ctx.supabaseUrl}/auth/v1/admin/users/${plan.user_id}`,
      {
        headers: {
          apikey: ctx.serviceKey,
          Authorization: `Bearer ${ctx.serviceKey}`,
        },
      }
    );
    const user = await userRes.json();
    email = user?.email ?? null;
  }

  if (!email) return; // guest with no email — skip silently

  const injuryName = (plan.plan_json?.injury_subtype ?? "injury").replace(/ - Grade.*$/, "");
  const planUrl = `${ctx.appUrl}/plan/${plan.token}`;
  const day = plan.current_day;

  // Send via Resend
  const emailRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ctx.resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "PhysicAI <onboarding@resend.dev>",
      to: email,
      subject: `Day ${day} check-in — how's your ${injuryName}?`,
      html: buildEmailHtml({ injuryName, day, planUrl }),
    }),
  });

  if (!emailRes.ok) {
    const err = await emailRes.text();
    throw new Error(`Resend error for plan ${planId}: ${err}`);
  }

  // Update last_reminder_at
  await fetch(
    `${ctx.supabaseUrl}/rest/v1/plans?id=eq.${planId}`,
    {
      method: "PATCH",
      headers: {
        apikey: ctx.serviceKey,
        Authorization: `Bearer ${ctx.serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ last_reminder_at: new Date().toISOString() }),
    }
  );
}

// ─── Log failures ─────────────────────────────────────────────────────────────

async function logFailures(
  failures: Array<{ planId: string; result: PromiseRejectedResult }>,
  ctx: { supabaseUrl: string; serviceKey: string }
) {
  const rows = failures.map((f) => ({
    plan_id: f.planId,
    error: f.result.reason?.message ?? String(f.result.reason),
  }));

  await fetch(`${ctx.supabaseUrl}/rest/v1/notification_failures`, {
    method: "POST",
    headers: {
      apikey: ctx.serviceKey,
      Authorization: `Bearer ${ctx.serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(rows),
  });
}

// ─── Retry failures from last hour ───────────────────────────────────────────

async function retryFailures(ctx: {
  supabaseUrl: string;
  serviceKey: string;
  resendKey: string;
  appUrl: string;
}) {
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const res = await fetch(
    `${ctx.supabaseUrl}/rest/v1/notification_failures?resolved=eq.false&attempted_at=gt.${cutoff}&select=id,plan_id`,
    {
      headers: {
        apikey: ctx.serviceKey,
        Authorization: `Bearer ${ctx.serviceKey}`,
      },
    }
  );
  const failures = await res.json();
  if (!failures?.length) return;

  for (const failure of failures) {
    try {
      await sendReminder(failure.plan_id, ctx);
      // Mark resolved
      await fetch(
        `${ctx.supabaseUrl}/rest/v1/notification_failures?id=eq.${failure.id}`,
        {
          method: "PATCH",
          headers: {
            apikey: ctx.serviceKey,
            Authorization: `Bearer ${ctx.serviceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ resolved: true }),
        }
      );
    } catch {
      // Leave unresolved — will retry next hour
    }
  }
}

// ─── Email template ───────────────────────────────────────────────────────────

function buildEmailHtml(params: {
  injuryName: string;
  day: number;
  planUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; padding: 24px; margin: 0;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
    <p style="font-size: 11px; font-weight: 600; letter-spacing: 0.08em; color: #3B82F6; text-transform: uppercase; margin: 0 0 16px;">PhysicAI</p>
    <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 8px;">Day ${params.day} — time to check in</h1>
    <p style="font-size: 15px; color: #6B7280; margin: 0 0 24px; line-height: 1.6;">How's your <strong>${params.injuryName}</strong> feeling today? Log your check-in to unlock today's exercises and track your recovery.</p>
    <a href="${params.planUrl}" style="display: block; background: #3B82F6; color: white; text-align: center; text-decoration: none; font-weight: 600; font-size: 15px; padding: 14px 24px; border-radius: 12px;">Log today's check-in →</a>
    <p style="font-size: 12px; color: #9CA3AF; margin: 24px 0 0; line-height: 1.5;">Recovery guidance only — not a substitute for medical advice. <a href="${params.planUrl}/unsubscribe" style="color: #9CA3AF;">Unsubscribe</a></p>
  </div>
</body>
</html>
  `.trim();
}
