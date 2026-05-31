/**
 * Edge Function: complaint-number-validator
 *
 * Validates that a (organization_id, sub_division_id, raw_complaint_number)
 * triple is not already registered before the client attempts an INSERT.
 * Prevents a wasted network round-trip from a unique-constraint violation.
 *
 * Method:   POST
 * Auth:     Supabase JWT in Authorization header.
 *           The calling user's role MUST be 'call_centre'.
 *           Returns 401 if no/invalid JWT.
 *           Returns 403 if role is not call_centre.
 *
 * Request body (JSON):
 *   {
 *     organization_id:      string  (UUID)
 *     sub_division_id:      string  (UUID)
 *     raw_complaint_number: string
 *   }
 *
 * Response 200 — available:
 *   { available: true }
 *
 * Response 200 — conflict:
 *   { available: false, existing_complaint_number: "SUNR-010101-FC12345" }
 *
 * Response 400 — missing fields:
 *   { error: "BAD_REQUEST", message: "..." }
 *
 * Response 401 — missing / invalid JWT:
 *   { error: "UNAUTHORIZED", message: "..." }
 *
 * Response 403 — wrong role:
 *   { error: "FORBIDDEN", message: "Role call_centre required." }
 *
 * Response 405 — wrong HTTP method:
 *   { error: "METHOD_NOT_ALLOWED", message: "POST required." }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "METHOD_NOT_ALLOWED", message: "POST required." }, 405);
  }

  // ── 1. Validate JWT and extract calling user ──────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return jsonResponse(
      { error: "UNAUTHORIZED", message: "Missing or malformed Authorization header." },
      401,
    );
  }

  const callerToken = authHeader.replace("Bearer ", "");

  // Create a client that operates as the calling user (respects RLS)
  // We use this only to verify the JWT and get the user's profile.
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
    return jsonResponse({ error: "INTERNAL_ERROR", message: "Server configuration error." }, 500);
  }

  // User-context client: verifies the JWT
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

  // ── 2. Resolve calling user's role ───────────────────────────────────────
  // Use service-role client to bypass RLS on public.users lookup
  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userProfile, error: profileError } = await serviceClient
    .from("users")
    .select("role, sub_division_id, organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !userProfile) {
    return jsonResponse(
      { error: "UNAUTHORIZED", message: "User profile not found." },
      401,
    );
  }

  if (userProfile.role !== "call_centre") {
    return jsonResponse(
      { error: "FORBIDDEN", message: "Role call_centre required to validate complaint numbers." },
      403,
    );
  }

  // ── 3. Parse and validate request body ───────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(
      { error: "BAD_REQUEST", message: "Request body must be valid JSON." },
      400,
    );
  }

  const { organization_id, sub_division_id, raw_complaint_number } = body as {
    organization_id?: string;
    sub_division_id?: string;
    raw_complaint_number?: string;
  };

  if (!organization_id || typeof organization_id !== "string" || !organization_id.trim()) {
    return jsonResponse(
      { error: "BAD_REQUEST", message: "organization_id is required." },
      400,
    );
  }
  if (!sub_division_id || typeof sub_division_id !== "string" || !sub_division_id.trim()) {
    return jsonResponse(
      { error: "BAD_REQUEST", message: "sub_division_id is required." },
      400,
    );
  }
  if (
    !raw_complaint_number ||
    typeof raw_complaint_number !== "string" ||
    !raw_complaint_number.trim()
  ) {
    return jsonResponse(
      { error: "BAD_REQUEST", message: "raw_complaint_number is required." },
      400,
    );
  }

  // Ensure the calling user belongs to the same organization they are querying
  if (userProfile.organization_id !== organization_id) {
    return jsonResponse(
      { error: "FORBIDDEN", message: "Cannot validate complaint numbers for a different organization." },
      403,
    );
  }

  // ── 4. Check uniqueness using service-role client (bypasses RLS) ─────────
  const { data: existing, error: queryError } = await serviceClient
    .from("complaints")
    .select("complaint_number")
    .eq("organization_id", organization_id)
    .eq("sub_division_id", sub_division_id)
    .eq("raw_complaint_number", raw_complaint_number.trim())
    .maybeSingle();

  if (queryError) {
    console.error("Query error in complaint-number-validator:", queryError);
    return jsonResponse(
      { error: "INTERNAL_ERROR", message: "Database query failed. Please try again." },
      500,
    );
  }

  if (existing) {
    return jsonResponse(
      {
        available: false,
        existing_complaint_number: existing.complaint_number,
      },
      200,
    );
  }

  return jsonResponse({ available: true }, 200);
});
