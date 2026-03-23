import Anthropic from "npm:@anthropic-ai/sdk";

const VALID_EXERCISE_IDS = [
  // ankle_sprain
  "ankle-elevation-ice", "ankle-compression-rest",
  "ankle-alphabet", "ankle-calf-raise",
  "ankle-single-leg-balance", "ankle-hop-landing", "ankle-lateral-hop",
  // knee_sprain
  "knee-quad-set", "knee-patellar-mobilization",
  "knee-straight-leg-raise", "knee-terminal-extension",
  "knee-mini-squat", "knee-step-up", "knee-wall-sit",
  // hamstring_strain
  "hamstring-prone-ice", "hamstring-pain-free-stretch",
  "hamstring-prone-curl", "hamstring-bridge",
  "hamstring-nordic-eccentric", "hamstring-single-leg-rdl",
  // groin_strain
  "groin-adductor-isometric-squeeze", "groin-hip-flexor-stretch",
  "groin-side-lying-adduction", "groin-standing-adduction-band",
  "groin-lateral-lunge", "groin-copenhagen-plank",
  // shoulder_sprain
  "shoulder-pendulum", "shoulder-scapular-squeeze",
  "shoulder-external-rotation-band", "shoulder-side-lying-er",
  "shoulder-overhead-press", "shoulder-wall-push-up",
  // lower_back_strain
  "back-knee-to-chest", "back-cat-cow",
  "back-bird-dog", "back-glute-bridge",
  "back-dead-bug", "back-side-plank",
  // shin_splints
  "shin-rest-activity-mod", "shin-tibialis-anterior-stretch",
  "shin-calf-raise", "shin-toe-tap",
  "shin-run-walk-progression", "shin-single-leg-calf-raise",
  // wrist_sprain
  "wrist-buddy-rest", "wrist-ice-elevation",
  "wrist-flexion-extension", "wrist-radial-ulnar-deviation",
  "wrist-grip-strengthening", "wrist-forearm-pronation-supination",
  // finger_sprain
  "finger-buddy-taping", "finger-gentle-extension-stretch",
  "finger-tendon-glides", "finger-place-and-hold",
  "finger-pinch-grip", "finger-sport-grip-progression",
];

const GENERATE_PLAN_TOOL: Anthropic.Tool = {
  name: "generate_recovery_plan",
  description: "Generate a structured sports injury recovery plan",
  input_schema: {
    type: "object",
    properties: {
      injury_type:    { type: "string" },
      injury_subtype: { type: "string" },
      severity: { type: "string", enum: ["Grade I", "Grade II", "Grade III"] },
      timeline_days: {
        type: "array", items: { type: "number" }, minItems: 2, maxItems: 2,
      },
      phases: {
        type: "array",
        items: {
          type: "object",
          properties: {
            label:       { type: "string" },
            name:        { type: "string" },
            description: { type: "string" },
          },
          required: ["label", "name", "description"],
        },
      },
      todays_exercises: {
        type: "array",
        items: {
          type: "object",
          properties: {
            exercise_id:  { type: "string", enum: VALID_EXERCISE_IDS },
            sets:         { type: ["number", "null"] },
            reps:         { type: ["number", "null"] },
            duration_sec: { type: ["number", "null"] },
          },
          required: ["exercise_id"],
        },
      },
      red_flags: { type: "array", items: { type: "string" } },
      seek_care:  { type: "boolean" },
    },
    required: [
      "injury_type", "injury_subtype", "severity", "timeline_days",
      "phases", "todays_exercises", "red_flags", "seek_care",
    ],
  },
};

// ─── CORS ─────────────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let body: {
    collected_flags: Record<string, unknown>;
    token: string;          // client-generated UUID
    user_id?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { collected_flags, token, user_id } = body;
  if (!collected_flags || !token) {
    return new Response("Missing collected_flags or token", { status: 400 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")!;

  // ── 1. Create the plan row (service role bypasses RLS) ────────────────────

  const insertRes = await fetch(`${supabaseUrl}/rest/v1/plans`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      token,
      user_id: user_id ?? null,
      collected_flags,
      status: "pending_review",
    }),
  });

  if (!insertRes.ok) {
    const err = await insertRes.text();
    console.error("Plan insert failed:", err);
    return new Response(JSON.stringify({ error: "Failed to create plan" }), {
      status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  const [plan] = await insertRes.json();
  const planId: string = plan.id;

  // ── 2. Call Claude with 25s timeout ───────────────────────────────────────

  const anthropic = new Anthropic({ apiKey: anthropicKey });
  let planInput: Record<string, unknown> | null = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    const response = await anthropic.messages.create(
      {
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        tools: [GENERATE_PLAN_TOOL],
        tool_choice: { type: "any" },
        messages: [{ role: "user", content: buildPrompt(collected_flags) }],
      },
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    const toolUse = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );
    if (!toolUse) throw new Error("Claude did not call the tool");
    planInput = toolUse.input as Record<string, unknown>;

  } catch (err) {
    await patchPlan(planId, { status: "generation_failed" }, supabaseUrl, serviceKey);
    console.error("Claude call failed:", err);
    return new Response(
      JSON.stringify({ error: "Plan generation failed", token, retry: true }),
      { status: 503, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  }

  // ── 3. Validate exercise IDs ───────────────────────────────────────────────

  const exercises = (planInput.todays_exercises as Array<{ exercise_id: string }>) ?? [];
  const invalidIds = exercises.map((e) => e.exercise_id).filter((id) => !VALID_EXERCISE_IDS.includes(id));

  if (invalidIds.length > 0) {
    await patchPlan(planId, { status: "generation_failed" }, supabaseUrl, serviceKey);
    console.error("Invalid exercise IDs:", invalidIds);
    return new Response(
      JSON.stringify({ error: "Invalid exercise IDs", invalid: invalidIds }),
      { status: 422, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  }

  // ── 4. Determine status (pending_review for first 10, then approved) ───────

  const countRes = await fetch(
    `${supabaseUrl}/rest/v1/plans?status=eq.approved&select=id`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Prefer: "count=exact",
        "Content-Range": "0-0/*",
      },
    }
  );
  const countHeader = countRes.headers.get("Content-Range") ?? "0-0/0";
  const approvedCount = parseInt(countHeader.split("/")[1] ?? "0", 10);
  const status = approvedCount < 10 ? "pending_review" : "approved";

  // ── 5. Save plan JSON ──────────────────────────────────────────────────────

  await patchPlan(planId, { plan_json: planInput, status }, supabaseUrl, serviceKey);

  return new Response(
    JSON.stringify({
      token,
      plan_id: planId,
      status,
      plan: status === "approved" ? planInput : null,
    }),
    { status: 200, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
  );
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPrompt(flags: Record<string, unknown>): string {
  return `You are a sports physical therapist. Generate a recovery plan for an athlete based on their injury assessment.

Assessment results:
${JSON.stringify(flags, null, 2)}

Use the generate_recovery_plan tool to return a structured plan. Select exercise_ids ONLY from the provided enum — do not invent exercise IDs. Include 2-4 exercises for today appropriate to Phase 1 (pain control). Write phase descriptions in plain, encouraging language for a college or high school athlete.

Always include relevant red flag criteria the athlete should watch for.`;
}

async function patchPlan(
  planId: string,
  patch: Record<string, unknown>,
  supabaseUrl: string,
  serviceKey: string
): Promise<void> {
  await fetch(`${supabaseUrl}/rest/v1/plans?id=eq.${planId}`, {
    method: "PATCH",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(patch),
  });
}
