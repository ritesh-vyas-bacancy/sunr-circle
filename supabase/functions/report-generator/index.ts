/**
 * Edge Function: report-generator (Phase 5 — Full Implementation)
 *
 * Generates structured complaint report data for PDF/Excel rendering.
 * Uses service role client to query across all RLS boundaries.
 * Only back_office and top_management roles may call this function.
 *
 * POST body:
 *   { report_type, filters: { date_from, date_to, office_id?, status?, assigned_to? }, page? }
 *
 * Response 200:
 *   { report_type, generated_at, summary: {...}, rows: [...], meta: { total_rows, page, page_size } }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const PAGE_SIZE = 500
const SLA_HOURS = 24

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })
  if (req.method !== 'POST') return json({ error: 'METHOD_NOT_ALLOWED' }, 405)

  // Auth
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'UNAUTHORIZED' }, 401)

  const callerToken = authHeader.replace('Bearer ', '')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const userClient = createClient(supabaseUrl, callerToken, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: { user }, error: authErr } = await userClient.auth.getUser()
  if (authErr || !user) return json({ error: 'UNAUTHORIZED', message: 'Invalid JWT' }, 401)

  const service = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: profile } = await service
    .from('users')
    .select('role, organization_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) return json({ error: 'UNAUTHORIZED', message: 'User profile not found' }, 401)
  if (!['back_office', 'top_management'].includes(profile.role as string)) {
    return json({ error: 'FORBIDDEN', message: 'back_office or top_management role required' }, 403)
  }

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return json({ error: 'BAD_REQUEST', message: 'Invalid JSON body' }, 400) }

  const reportType = (body['report_type'] as string) || 'custom'
  const filters = (body['filters'] as Record<string, string>) || {}
  const dateFrom = filters['date_from']
  const dateTo   = filters['date_to']
  const page     = typeof body['page'] === 'number' ? (body['page'] as number) : 1

  if (!dateFrom || !dateTo) {
    return json({ error: 'BAD_REQUEST', message: 'filters.date_from and filters.date_to are required' }, 400)
  }

  const orgId = profile.organization_id as string

  let query = service
    .from('complaints')
    .select(
      `id, raw_complaint_number, complaint_number,
       consumer_name, consumer_mobile, nature_of_complaint,
       status, attend_remarks,
       created_at, assigned_at, in_progress_at, closed_at,
       sub_division:sub_division_id(name,code,parent:parent_id(name,code,parent:parent_id(name,code))),
       created_by_user:created_by(full_name),
       assigned_to_user:assigned_to(full_name)`,
      { count: 'exact' }
    )
    .eq('organization_id', orgId)
    .gte('created_at', dateFrom + 'T00:00:00.000Z')
    .lte('created_at', dateTo + 'T23:59:59.999Z')
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (filters['office_id']) query = (query as any).eq('sub_division_id', filters['office_id'])
  if (filters['status'])    query = (query as any).eq('status', filters['status'])
  if (filters['assigned_to']) query = (query as any).eq('assigned_to', filters['assigned_to'])

  const { data, error: qErr, count } = await query
  if (qErr) return json({ error: 'INTERNAL_ERROR', message: qErr.message }, 500)

  const complaints = (data ?? []) as any[]

  const summary = {
    total:        count ?? 0,
    open:         complaints.filter((c: any) => c.status === 'open').length,
    assigned:     complaints.filter((c: any) => c.status === 'assigned').length,
    in_progress:  complaints.filter((c: any) => c.status === 'in_progress').length,
    closed:       complaints.filter((c: any) => c.status === 'closed').length,
    rejected:     complaints.filter((c: any) => c.status === 'rejected').length,
    sla_breached: complaints.filter((c: any) => {
      if (c.status !== 'closed' || !c.closed_at) return false
      const hrs = (new Date(c.closed_at).getTime() - new Date(c.created_at).getTime()) / 3_600_000
      return hrs > SLA_HOURS
    }).length,
  }

  const rows = complaints.map((c: any) => ({
    id:                  c.id,
    complaint_number:    c.complaint_number ?? c.raw_complaint_number,
    consumer_name:       c.consumer_name,
    consumer_mobile:     c.consumer_mobile,
    nature_of_complaint: c.nature_of_complaint,
    status:              c.status,
    sub_division_name:   c.sub_division?.name ?? '—',
    division_name:       c.sub_division?.parent?.name ?? '—',
    circle_name:         c.sub_division?.parent?.parent?.name ?? '—',
    created_by_name:     c.created_by_user?.full_name ?? '—',
    assigned_to_name:    c.assigned_to_user?.full_name ?? null,
    attend_remarks:      c.attend_remarks,
    created_at:          c.created_at,
    assigned_at:         c.assigned_at,
    in_progress_at:      c.in_progress_at,
    closed_at:           c.closed_at,
  }))

  return json({
    report_type:  reportType,
    generated_at: new Date().toISOString(),
    summary,
    rows,
    meta: { total_rows: count ?? 0, page, page_size: PAGE_SIZE },
  })
})
