/**
 * Edge Function: notification-dispatcher
 *
 * Routes notification requests to the appropriate channel provider.
 *
 * PHASE 1 STATUS: ALL PROVIDERS ARE STUBBED.
 * Every dispatch request results in a notification_logs entry with
 * status = 'skipped'. No external API calls are made.
 *
 * TODO Phase 2: Replace stub blocks with real provider integrations:
 *   - SMS:       MSG91 (https://msg91.com/api)
 *   - WhatsApp:  Twilio (https://www.twilio.com/en-us/whatsapp)
 *   - Email:     Resend (https://resend.com/docs)
 *   - Push:      Firebase Admin SDK (FCM v1)
 *
 * Method:   POST
 * Auth:     Supabase JWT in Authorization header (any authenticated user).
 *           Returns 401 if no/invalid JWT.
 *
 * Request body (JSON):
 *   {
 *     complaint_id?:  string          (UUID, optional)
 *     channel:        string          ('sms' | 'whatsapp' | 'email' | 'push')
 *     recipient:      string          (phone number or email address)
 *     template_key:   string          (e.g. 'complaint_created', 'complaint_closed')
 *     template_vars?: Record<string, string>  (key-value pairs for template interpolation)
 *   }
 *
 * Response 200 — Phase 1 stub:
 *   {
 *     dispatched: false,
 *     skipped:    true,
 *     reason:     "Phase 1 stub — provider not integrated",
 *     log_id:     string   (UUID of the notification_logs row)
 *   }
 *
 * Response 400 — missing/invalid fields:
 *   { error: "BAD_REQUEST", message: "..." }
 *
 * Response 401 — missing / invalid JWT:
 *   { error: "UNAUTHORIZED", message: "..." }
 *
 * Response 500 — internal error:
 *   { error: "INTERNAL_ERROR", message: "..." }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Types ─────────────────────────────────────────────────────────────────────

type NotificationChannel = "sms" | "whatsapp" | "email" | "push";

interface DispatchRequest {
  complaint_id?: string;
  channel: NotificationChannel;
  recipient: string;
  template_key: string;
  template_vars?: Record<string, string>;
}

// ── Template resolution ───────────────────────────────────────────────────────

/**
 * Resolves a template by key, interpolating template_vars.
 * In Phase 2 this would look up templates from system_settings or a CMS.
 */
function resolveTemplate(
  templateKey: string,
  vars: Record<string, string> = {},
): string {
  const templates: Record<string, string> = {
    complaint_created:
      "Dear {{consumer_name}}, your complaint {{complaint_number}} has been registered. Reference: {{complaint_number}}. SUNR Circle",
    complaint_assigned:
      "Dear {{consumer_name}}, your complaint {{complaint_number}} has been assigned to our field team. We will attend soon. SUNR Circle",
    complaint_in_progress:
      "Dear {{consumer_name}}, our team is working on complaint {{complaint_number}}. Expected resolution within {{eta_hours}} hours. SUNR Circle",
    complaint_closed:
      "Dear {{consumer_name}}, your complaint {{complaint_number}} has been resolved. Attend remarks: {{attend_remarks}}. SUNR Circle",
    complaint_rejected:
      "Dear {{consumer_name}}, your complaint {{complaint_number}} could not be processed. Reason: {{reason}}. Contact {{support_phone}}. SUNR Circle",
    default:
      "SUNR Circle: Update regarding complaint {{complaint_number}}.",
  };

  const template = templates[templateKey] ?? templates["default"];

  return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => vars[key] ?? `{{${key}}}`);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const VALID_CHANNELS: NotificationChannel[] = ["sms", "whatsapp", "email", "push"];

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "METHOD_NOT_ALLOWED", message: "POST required." }, 405);
  }

  // ── 1. Validate JWT ───────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return jsonResponse(
      { error: "UNAUTHORIZED", message: "Missing or malformed Authorization header." },
      401,
    );
  }

  const callerToken = authHeader.replace("Bearer ", "");

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
    return jsonResponse({ error: "INTERNAL_ERROR", message: "Server configuration error." }, 500);
  }

  // Verify calling user's JWT
  const userClient = createClient(supabaseUrl, callerToken, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return jsonResponse(
      { error: "UNAUTHORIZED", message: "Invalid or expired JWT." },
      401,
    );
  }

  // ── 2. Parse and validate request body ───────────────────────────────────
  let body: DispatchRequest;
  try {
    body = await req.json() as DispatchRequest;
  } catch {
    return jsonResponse(
      { error: "BAD_REQUEST", message: "Request body must be valid JSON." },
      400,
    );
  }

  const { complaint_id, channel, recipient, template_key, template_vars } = body;

  if (!channel || !VALID_CHANNELS.includes(channel)) {
    return jsonResponse(
      {
        error: "BAD_REQUEST",
        message: `channel must be one of: ${VALID_CHANNELS.join(", ")}.`,
      },
      400,
    );
  }

  if (!recipient || typeof recipient !== "string" || !recipient.trim()) {
    return jsonResponse(
      { error: "BAD_REQUEST", message: "recipient is required." },
      400,
    );
  }

  if (!template_key || typeof template_key !== "string" || !template_key.trim()) {
    return jsonResponse(
      { error: "BAD_REQUEST", message: "template_key is required." },
      400,
    );
  }

  // ── 3. Resolve message body from template ─────────────────────────────────
  const messageBody = resolveTemplate(template_key, template_vars ?? {});

  // ── 4. PHASE 1 STUB — skip all provider calls ────────────────────────────
  //
  // TODO Phase 2 — SMS via MSG91:
  //   const msg91ApiKey = Deno.env.get("MSG91_API_KEY");
  //   const msg91SenderId = Deno.env.get("MSG91_SENDER_ID");
  //   const response = await fetch("https://api.msg91.com/api/v2/sendsms", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json", "authkey": msg91ApiKey },
  //     body: JSON.stringify({ sender: msg91SenderId, route: "4", country: "91",
  //       sms: [{ message: messageBody, to: [recipient] }] }),
  //   });
  //
  // TODO Phase 2 — WhatsApp via Twilio:
  //   const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  //   const twilioAuthToken  = Deno.env.get("TWILIO_AUTH_TOKEN");
  //   const twilioWhatsApp   = Deno.env.get("TWILIO_WHATSAPP_NUMBER");
  //   const response = await fetch(
  //     `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
  //     { method: "POST", headers: { Authorization: "Basic " + btoa(`${twilioAccountSid}:${twilioAuthToken}`) },
  //       body: new URLSearchParams({ From: `whatsapp:${twilioWhatsApp}`, To: `whatsapp:${recipient}`, Body: messageBody }) },
  //   );
  //
  // TODO Phase 2 — Email via Resend:
  //   const resendApiKey = Deno.env.get("RESEND_API_KEY");
  //   const fromAddress  = Deno.env.get("RESEND_FROM_ADDRESS") ?? "noreply@sunrcircle.in";
  //   const response = await fetch("https://api.resend.com/emails", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
  //     body: JSON.stringify({ from: fromAddress, to: [recipient], subject: `Complaint Update - ${template_key}`, text: messageBody }),
  //   });
  //
  // TODO Phase 2 — Push via Firebase Admin / FCM v1:
  //   Use Firebase Admin SDK or direct HTTP v1 API call.

  // ── 5. Log to notification_logs with status = 'skipped' ──────────────────
  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: logRow, error: logError } = await serviceClient
    .from("notification_logs")
    .insert({
      complaint_id: complaint_id ?? null,
      channel,
      recipient: recipient.trim(),
      message_body: messageBody,
      status: "skipped",
      provider_message_id: null,
      error_message: "Phase 1 stub — provider not integrated",
      triggered_by: user.id,
      sent_at: null,
    })
    .select("id")
    .single();

  if (logError || !logRow) {
    console.error("Failed to insert notification_logs row:", logError);
    return jsonResponse(
      { error: "INTERNAL_ERROR", message: "Failed to record notification log." },
      500,
    );
  }

  return jsonResponse(
    {
      dispatched: false,
      skipped: true,
      reason: "Phase 1 stub — provider not integrated",
      log_id: logRow.id,
    },
    200,
  );
});
