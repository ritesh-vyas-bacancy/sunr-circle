'use server'
import { createAdminClient } from '@/lib/supabase/server'
import type { ComplaintStatus } from '@/types'
// NOTE: requireSession removed — orgId is passed as parameter to avoid
// nested auth() calls from Server Actions in Next.js 16.

export interface ReportFilters {
  reportType: 'daily' | 'weekly' | 'monthly' | 'six_monthly' | 'yearly' | 'custom'
  dateFrom: string       // ISO date string YYYY-MM-DD
  dateTo: string
  circleId?: string
  divisionId?: string
  subDivisionId?: string
  status?: ComplaintStatus
  assignedTo?: string
}

export interface ReportRow {
  id: string
  complaint_number: string | null
  raw_complaint_number: string
  consumer_name: string
  consumer_mobile: string
  nature_of_complaint: string
  status: ComplaintStatus
  sub_division_name: string
  division_name: string
  circle_name: string
  created_by_name: string
  assigned_to_name: string | null
  attend_remarks: string | null
  created_at: string
  assigned_at: string | null
  in_progress_at: string | null
  closed_at: string | null
}

export interface ReportSummary {
  total: number
  open: number
  assigned: number
  in_progress: number
  closed: number
  rejected: number
  sla_breached: number  // closed_at - created_at > 24h
}

export interface ReportData {
  summary: ReportSummary
  rows: ReportRow[]
  filters: ReportFilters
  generatedAt: string
  organizationName: string
}

// Resolve circle/division filters to sub_division IDs
async function resolveSubDivisionIds(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  orgId: string,
  circleId?: string,
  divisionId?: string,
): Promise<string[] | null> {
  if (!circleId && !divisionId) return null

  if (divisionId) {
    const { data } = await supabase
      .from('offices')
      .select('id')
      .eq('parent_id', divisionId)
      .eq('office_type', 'sub_division')
      .eq('is_active', true)
    return (data ?? []).map((o: { id: string }) => o.id)
  }

  const { data: divisions } = await supabase
    .from('offices')
    .select('id')
    .eq('parent_id', circleId!)
    .eq('office_type', 'division')
    .eq('is_active', true)

  const divisionIds = (divisions ?? []).map((d: { id: string }) => d.id)
  if (divisionIds.length === 0) return []

  const { data: subDivisions } = await supabase
    .from('offices')
    .select('id')
    .in('parent_id', divisionIds)
    .eq('office_type', 'sub_division')
    .eq('is_active', true)

  return (subDivisions ?? []).map((s: { id: string }) => s.id)
}

export async function generateReport(orgId: string, filters: ReportFilters): Promise<ReportData> {
  const supabase = createAdminClient()

  // Fetch org name
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single()

  const resolvedSubDivisionIds = await resolveSubDivisionIds(
    supabase,
    orgId,
    filters.circleId,
    filters.divisionId,
  )

  if (resolvedSubDivisionIds !== null && resolvedSubDivisionIds.length === 0) {
    return {
      summary: { total: 0, open: 0, assigned: 0, in_progress: 0, closed: 0, rejected: 0, sla_breached: 0 },
      rows: [],
      filters,
      generatedAt: new Date().toISOString(),
      organizationName: org?.name ?? 'SUNR Circle',
    }
  }

  // Build complaints query (service role bypasses RLS)
  let query = supabase
    .from('complaints')
    .select(`
      id, raw_complaint_number, complaint_number,
      consumer_name, consumer_mobile, nature_of_complaint,
      complaint_remarks, status, attend_remarks,
      created_at, assigned_at, in_progress_at, closed_at,
      sub_division:sub_division_id(
        name, code,
        parent:parent_id(
          name, code,
          parent:parent_id(name, code)
        )
      ),
      created_by_user:created_by(full_name),
      assigned_to_user:assigned_to(full_name)
    `)
    .eq('organization_id', orgId)
    .gte('created_at', filters.dateFrom + 'T00:00:00.000Z')
    .lte('created_at', filters.dateTo + 'T23:59:59.999Z')
    .order('created_at', { ascending: false })

  if (filters.status) query = query.eq('status', filters.status) as typeof query
  if (filters.assignedTo) query = query.eq('assigned_to', filters.assignedTo) as typeof query

  if (filters.subDivisionId) {
    query = query.eq('sub_division_id', filters.subDivisionId) as typeof query
  } else if (resolvedSubDivisionIds !== null) {
    query = query.in('sub_division_id', resolvedSubDivisionIds) as typeof query
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const complaints = (data ?? []) as any[]

  // Build rows
  const SLA_HOURS = 24
  const rows: ReportRow[] = complaints.map((c) => {
    const sub = c.sub_division as any
    const division = sub?.parent as any
    const circle = division?.parent as any

    return {
      id: c.id,
      complaint_number: c.complaint_number,
      raw_complaint_number: c.raw_complaint_number,
      consumer_name: c.consumer_name,
      consumer_mobile: c.consumer_mobile,
      nature_of_complaint: c.nature_of_complaint,
      status: c.status,
      sub_division_name: sub?.name ?? '—',
      division_name: division?.name ?? '—',
      circle_name: circle?.name ?? '—',
      created_by_name: c.created_by_user?.full_name ?? '—',
      assigned_to_name: c.assigned_to_user?.full_name ?? null,
      attend_remarks: c.attend_remarks,
      created_at: c.created_at,
      assigned_at: c.assigned_at,
      in_progress_at: c.in_progress_at,
      closed_at: c.closed_at,
    }
  })

  // Calculate summary
  const summary: ReportSummary = {
    total: rows.length,
    open: rows.filter((r) => r.status === 'open').length,
    assigned: rows.filter((r) => r.status === 'assigned').length,
    in_progress: rows.filter((r) => r.status === 'in_progress').length,
    closed: rows.filter((r) => r.status === 'closed').length,
    rejected: rows.filter((r) => r.status === 'rejected').length,
    sla_breached: rows.filter((r) => {
      if (r.status !== 'closed' || !r.closed_at) return false
      const hours =
        (new Date(r.closed_at).getTime() - new Date(r.created_at).getTime()) /
        3600000
      return hours > SLA_HOURS
    }).length,
  }

  return {
    summary,
    rows,
    filters,
    generatedAt: new Date().toISOString(),
    organizationName: org?.name ?? 'SUNR Circle',
  }
}
