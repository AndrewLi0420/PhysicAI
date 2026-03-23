/**
 * approve-plan Edge Function
 *
 * Called via the approve/flag links in PT review emails.
 * Flips plan status to 'approved' (or logs a flag for correction).
 *
 * GET /functions/v1/approve-plan?plan_id=<uuid>&action=approve|flag&sig=<hmac>
 *
 * The sig parameter is an HMAC-SHA256 of `${plan_id}:${action}` using
 * APPROVE_PLAN_SECRET. This prevents anyone with the URL from approving
 * arbitrary plans.
 */

const encoder = new TextEncoder();

async function verifySignature(
  planId: string,
  action: string,
  sig: string,
  secret: string
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const sigBytes = hexToBytes(sig);
  const data = encoder.encode(`${planId}:${action}`);
  return crypto.subtle.verify("HMAC", key, sigBytes, data);
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const planId = url.searchParams.get("plan_id");
  const action = url.searchParams.get("action"); // "approve" | "flag"
  const sig    = url.searchParams.get("sig");

  if (!planId || !action || !sig) {
    return new Response("Missing parameters", { status: 400 });
  }
  if (action !== "approve" && action !== "flag") {
    return new Response("Invalid action", { status: 400 });
  }

  const secret = Deno.env.get("APPROVE_PLAN_SECRET");
  if (!secret) {
    return new Response("Server misconfigured", { status: 500 });
  }

  const valid = await verifySignature(planId, action, sig, secret);
  if (!valid) {
    return new Response("Invalid signature", { status: 403 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (action === "approve") {
    await fetch(`${supabaseUrl}/rest/v1/plans?id=eq.${planId}`, {
      method: "PATCH",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "approved" }),
    });

    return new Response(
      "<html><body style='font-family:sans-serif;padding:40px'><h2>✓ Plan approved</h2><p>The recovery plan has been approved and will be delivered to the athlete.</p></body></html>",
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  }

  // flag: mark as failed so it stays out of athlete's view and founder can fix
  await fetch(`${supabaseUrl}/rest/v1/plans?id=eq.${planId}`, {
    method: "PATCH",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "generation_failed" }),
  });

  return new Response(
    "<html><body style='font-family:sans-serif;padding:40px'><h2>⚠ Plan flagged</h2><p>The plan has been flagged and will not be shown to the athlete. Check the Supabase dashboard to review and correct the decision tree branch.</p></body></html>",
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
});
