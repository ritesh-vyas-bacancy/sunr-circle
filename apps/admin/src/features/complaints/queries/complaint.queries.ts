'use server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/session'
import type {
  Complaint,
  ComplaintLog,
  ComplaintStatus,
  UserRole,
  Office,
  AppUser,
  PaginatedResult,
} from '@/types'

// â”€â”€â”€ Exported Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type ComplaintListItem = Complaint & {
  sub_division: { id: string; name: string; code: string } | null
  created_by_user: { id: string; full_name: string } | null
  assigned_to_user: { id: string; full_name: string } | null
}

export type ComplaintDetail = Complaint & {
  sub_division: {
    id: string
    name: string
    code: string
    parent: {
      id: string
      name: string
      code: string
      parent: { id: string; name: string; code: string } | null
    } | null
  } | null
  created_by_user: { id: string; full_name: string; role: UserRole } | null
  assigned_to_user: { id: string; full_name: string; mobile_number: string | null } | null
  logs: Array<ComplaintLog & { changed_by_user: { full_name: string; role: UserRole } | null }>
}

export type GetComplaintsParams = {
  search?: string
  circleId?: string
  divisionId?: string
  subDivisionId?: string
  status?: ComplaintStatus
  assignedTo?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

// â”€â”€â”€ Query Functions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getComplaints(
  orgId: string,
  params: GetComplaintsParams = {},
): Promise<PaginatedResult<ComplaintListItem>> {
  const {
    search,
    circleId,
    divisionId,
    subDivisionId,
    status,
    assignedTo,
    dateFrom,
    dateTo,
    page = 1,
    pageSize = 20,
    sortBy = 'created_at',
    sortDir = 'desc',
  } = params

  const supabase = createAdminClient()

  // â”€â”€ Resolve office hierarchy filters into sub_division IDs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  let resolvedSubDivisionIds: string[] | null = null

  if (divisionId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subDivOffices } = await (supabase.from('offices') as any)
      .select('id')
      .eq('parent_id', divisionId)
      .eq('office_type', 'sub_division')

    resolvedSubDivisionIds = ((subDivOffices ?? []) as Array<{ id: string }>).map((o) => o.id)

    if (resolvedSubDivisionIds.length === 0) {
      return { data: [], count: 0, page, pageSize, totalPages: 0 }
    }
  } else if (circleId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: divisions } = await (supabase.from('offices') as any)
      .select('id')
      .eq('parent_id', circleId)
      .eq('office_type', 'division')

    const divisionIds = ((divisions ?? []) as Array<{ id: string }>).map((d) => d.id)

    if (divisionIds.length === 0) {
      return { data: [], count: 0, page, pageSize, totalPages: 0 }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subDivOffices } = await (supabase.from('offices') as any)
      .select('id')
      .in('parent_id', divisionIds)
      .eq('office_type', 'sub_division')

    resolvedSubDivisionIds = ((subDivOffices ?? []) as Array<{ id: string }>).map((o) => o.id)

    if (resolvedSubDivisionIds.length === 0) {
      return { data: [], count: 0, page, pageSize, totalPages: 0 }
    }
  }

  // â”€â”€ Build main query â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  let query = supabase
    .from('complaints')
    .select(
      'id, organization_id, sub_division_id, raw_complaint_number, complaint_number, consumer_name, consumer_mobile, nature_of_complaint, complaint_remarks, status, created_by, assigned_to, attend_remarks, created_at, assigned_at, in_progress_at, closed_at, updated_at, sub_division:sub_division_id(id,name,code), created_by_user:created_by(id,full_name), assigned_to_user:assigned_to(id,full_name)',
      { count: 'exact' },
    )
    .eq('organization_id', orgId)

  // Office hierarchy filters
  if (resolvedSubDivisionIds !== null) {
    query = query.in('sub_division_id', resolvedSubDivisionIds)
  } else if (subDivisionId) {
    query = query.eq('sub_division_id', subDivisionId)
  }

  // Status filter
  if (status) {
    query = query.eq('status', status)
  }

  // Assigned-to filter
  if (assignedTo) {
    query = query.eq('assigned_to', assignedTo)
  }

  // Date range filters
  if (dateFrom) {
    query = query.gte('created_at', dateFrom)
  }
  if (dateTo) {
    query = query.lte('created_at', dateTo + 'T23:59:59.999Z')
  }

  // Text search
  if (search) {
    query = query.or(
      'raw_complaint_number.ilike.%' +
        search +
        '%,consumer_name.ilike.%' +
        search +
        '%,consumer_mobile.ilike.%' +
        search +
        '%',
    )
  }

  // Sorting and pagination
  query = query
    .order(sortBy, { ascending: sortDir === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as unknown as ComplaintListItem[],
    count: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getComplaintById(id: string): Promise<ComplaintDetail | null> {
  const supabase = createAdminClient()

  const { data: complaint, error } = await supabase
    .from('complaints')
    .select(
      'id, organization_id, sub_division_id, raw_complaint_number, complaint_number, consumer_name, consumer_mobile, nature_of_complaint, complaint_remarks, status, created_by, assigned_to, attend_remarks, created_at, assigned_at, in_progress_at, closed_at, updated_at, sub_division:sub_division_id(id,name,code,parent:parent_id(id,name,code,parent:parent_id(id,name,code))), created_by_user:created_by(id,full_name,role), assigned_to_user:assigned_to(id,full_name,mobile_number)',
    )
    .eq('id', id)
    .single()

  if (error || !complaint) return null

  const { data: logs, error: logsError } = await supabase
    .from('complaint_logs')
    .select('*, changed_by_user:changed_by(full_name,role)')
    .eq('complaint_id', id)
    .order('logged_at', { ascending: true })

  if (logsError) throw new Error(logsError.message)

  return {
    ...(complaint as unknown as Complaint),
    sub_division: (complaint as unknown as ComplaintDetail).sub_division,
    created_by_user: (complaint as unknown as ComplaintDetail).created_by_user,
    assigned_to_user: (complaint as unknown as ComplaintDetail).assigned_to_user,
    logs: (logs ?? []) as unknown as ComplaintDetail['logs'],
  }
}

export async function getLineManForSubDivision(
  subDivisionId: string,
): Promise<Array<{ id: string; full_name: string; mobile_number: string | null; employee_id: string | null }>> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, mobile_number, employee_id')
    .eq('sub_division_id', subDivisionId)
    .eq('role', 'line_man')
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  if (error) throw new Error(error.message)

  return (data ?? []) as Array<{
    id: string
    full_name: string
    mobile_number: string | null
    employee_id: string | null
  }>
}

export async function getOfficesForComplaintForm(orgId: string): Promise<
  Array<{ id: string; name: string; code: string; office_type: string; parent_id: string | null }>
> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('offices')
    .select('id, name, code, office_type, parent_id')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('code', { ascending: true })
  return (data ?? []) as Array<{ id: string; name: string; code: string; office_type: string; parent_id: string | null }>
}

export async function getComplaintFiltersData(orgId: string): Promise<{
  circles: Office[]; divisions: Office[]; subDivisions: Office[]; lineMen: AppUser[]
}> {
  const supabase = createAdminClient()
  const [officesResult, lineMenResult] = await Promise.all([
    supabase.from('offices').select('*').eq('organization_id', orgId).eq('is_active', true).order('code'),
    supabase.from('users').select('*').eq('organization_id', orgId).eq('role', 'line_man').eq('is_active', true).order('full_name'),
  ])
  const allOffices = (officesResult.data ?? []) as Office[]
  return {
    circles: allOffices.filter((o) => o.office_type === 'circle'),
    divisions: allOffices.filter((o) => o.office_type === 'division'),
    subDivisions: allOffices.filter((o) => o.office_type === 'sub_division'),
    lineMen: (lineMenResult.data ?? []) as AppUser[],
  }
}
