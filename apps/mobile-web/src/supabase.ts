import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://oaftuyikaxgzlyyzgenk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZnR1eWlrYXhnemx5eXpnZW5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMjI5NDYsImV4cCI6MjA5NTc5ODk0Nn0.lMF1h_MEyW78aVpmA7lnXoiXT-AmpsFX1QAzgAyWr-0'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export type UserRole = 'back_office' | 'call_centre' | 'line_man' | 'top_management'

export interface UserSession {
  id: string
  email: string
  role: UserRole
  fullName: string
  organizationId: string
  subDivisionId: string | null
}

export interface Complaint {
  id: string
  complaint_number: string | null
  raw_complaint_number: string
  consumer_name: string
  consumer_mobile: string
  nature_of_complaint: string
  complaint_remarks: string | null
  status: string
  created_by: string
  assigned_to: string | null
  attend_remarks: string | null
  created_at: string
  assigned_at: string | null
  in_progress_at: string | null
  closed_at: string | null
  sub_division?: { name: string; code: string } | null
  created_by_user?: { full_name: string } | null
  assigned_to_user?: { full_name: string } | null
}

export async function signIn(email: string, password: string): Promise<UserSession> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  if (!data.user) throw new Error('Login failed')

  const { data: profile } = await supabase
    .from('users')
    .select('role, organization_id, sub_division_id, full_name, is_active')
    .eq('id', data.user.id)
    .single()

  if (!profile) throw new Error('User profile not found')
  if (!profile.is_active) {
    await supabase.auth.signOut()
    throw new Error('Account deactivated. Contact your administrator.')
  }

  return {
    id: data.user.id,
    email: data.user.email!,
    role: profile.role,
    fullName: profile.full_name,
    organizationId: profile.organization_id,
    subDivisionId: profile.sub_division_id,
  }
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getComplaints(params?: {
  status?: string
  assignedTo?: string
  search?: string
}) {
  let query = supabase
    .from('complaints')
    .select('*, sub_division:sub_division_id(name,code), created_by_user:created_by(full_name), assigned_to_user:assigned_to(full_name)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (params?.status) query = query.eq('status', params.status) as typeof query
  if (params?.assignedTo) query = query.eq('assigned_to', params.assignedTo) as typeof query
  if (params?.search) {
    query = query.or(
      `consumer_name.ilike.%${params.search}%,raw_complaint_number.ilike.%${params.search}%,consumer_mobile.ilike.%${params.search}%`
    ) as typeof query
  }

  const { data } = await query
  return (data ?? []) as Complaint[]
}

export async function getDashboardStats(orgId: string) {
  const [total, open, assigned, inProgress, closed] = await Promise.all([
    supabase.from('complaints').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('complaints').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'open'),
    supabase.from('complaints').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'assigned'),
    supabase.from('complaints').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'in_progress'),
    supabase.from('complaints').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'closed'),
  ])
  return {
    total: total.count ?? 0,
    open: open.count ?? 0,
    assigned: assigned.count ?? 0,
    inProgress: inProgress.count ?? 0,
    closed: closed.count ?? 0,
  }
}
